import { VertexAI } from "@google-cloud/vertexai";

import { buildReceiptExtractionPrompt } from "@/lib/ai/prompt";
import { getGoogleAuth } from "@/lib/google-cloud/auth";

/**
 * Vertex AI Gemini provider — uses Google Cloud trial credits with effectively
 * unlimited daily quota (vs AI Studio's 50/day free tier hard cap).
 *
 * Supports both text-only extraction (from email body) and multimodal
 * extraction (PDF/image + prompt) — Gemini 2.0 Flash reads documents natively
 * and is often more accurate than Document AI on unusual invoice layouts.
 */

/**
 * Vertex AI model fallback chain. Tries the smartest first; falls through
 * if your project doesn't have access to a given model. All are multimodal
 * (PDF/image) capable. Trial credits comfortably cover all of them.
 *
 *  - 2.5-flash: best accuracy/cost ratio. ~$0.005 per invoice.
 *  - 2.0-flash: smart, cheap, requires opt-in on some projects.
 *  - 1.5-pro: extremely smart, GA everywhere.
 *  - 1.5-flash-002: bulletproof fallback, GA everywhere.
 */
const VERTEX_MODEL_CHAIN = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro-002",
  "gemini-1.5-flash-002",
];

function isModelNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("publisher model") ||
    msg.includes("does not have access")
  );
}

export class VertexAiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VertexAiUnavailableError";
  }
}

export function isVertexAiEnabled(): boolean {
  if (process.env.ENABLE_VERTEX_AI !== "true") return false;
  return Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID);
}

const BILLING_KEYWORDS = [
  "billing",
  "quota",
  "exceeded",
  "exhausted",
  "permission_denied",
  "permissiondenied",
  "not authorized",
  "not enabled",
  "disabled",
  "unauthenticated",
  "could not load the default credentials",
  "resource_exhausted",
];

function looksLikeBillingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return BILLING_KEYWORDS.some((keyword) => message.includes(keyword));
}

async function getClient(): Promise<VertexAI> {
  // Don't cache: WIF auth is per-request (each Vercel function invocation
  // has its own OIDC token in the request header).
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION ?? "us-central1";
  if (!projectId) {
    throw new VertexAiUnavailableError("GOOGLE_CLOUD_PROJECT_ID not set");
  }

  const auth = await getGoogleAuth();
  return new VertexAI({
    project: projectId,
    location,
    googleAuthOptions: {
      authClient: (await auth.getClient()) as never,
    },
  });
}

async function callVertex(
  textPrompt: string,
  document?: { content: Buffer; mimeType: string },
): Promise<string> {
  if (!isVertexAiEnabled()) {
    throw new VertexAiUnavailableError("Vertex AI is disabled");
  }

  let client: VertexAI;
  try {
    client = await getClient();
  } catch (error) {
    if (error instanceof VertexAiUnavailableError) throw error;
    throw new VertexAiUnavailableError(
      error instanceof Error ? error.message : "Vertex client init failed",
    );
  }

  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [{ text: textPrompt }];

  if (document) {
    parts.push({
      inlineData: {
        data: document.content.toString("base64"),
        mimeType: document.mimeType,
      },
    });
  }

  let lastError: unknown = null;

  for (const modelId of VERTEX_MODEL_CHAIN) {
    try {
      const model = client.getGenerativeModel({
        model: modelId,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
      });

      const text =
        result.response.candidates?.[0]?.content?.parts
          ?.map((part) => ("text" in part ? part.text : ""))
          .join("") ?? "";

      if (!text) {
        throw new Error(`Empty Vertex AI response from ${modelId}`);
      }
      return text;
    } catch (error) {
      lastError = error;
      // If it's "model not found / no access", try the next model in the chain.
      if (isModelNotFoundError(error)) continue;
      // Billing/quota: bail out so caller falls through to other providers.
      if (looksLikeBillingError(error)) {
        throw new VertexAiUnavailableError(
          `Vertex AI unavailable (billing/quota): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      // Other errors: try next model anyway.
      continue;
    }
  }

  throw new VertexAiUnavailableError(
    `Vertex AI: no accessible model. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`,
  );
}

export async function extractWithVertexAi(emailText: string): Promise<string> {
  return callVertex(buildReceiptExtractionPrompt(emailText));
}

const MULTIMODAL_PROMPT = `You are a receipt extraction engine. The user has attached a receipt or invoice document (PDF or image).

Rules:
1. Return ONLY valid compact JSON. No markdown, no explanations.
2. Extract these fields from the document:
   - store_name: string or null (the merchant/seller/supplier name)
   - item_name: string or null (the product purchased — concise, max 10 words)
   - price: number or null (the GRAND TOTAL the customer paid, including taxes)
   - currency: 3-letter ISO code (e.g. "INR", "USD", "EUR"). Detect from currency symbols.
   - purchase_date: string or null (YYYY-MM-DD)
   - return_deadline: string or null (YYYY-MM-DD; only set if explicitly stated)
   - warranty_deadline: string or null (YYYY-MM-DD; only set if explicitly stated)
   - confidence: number from 0.0 to 1.0
3. For Indian tax invoices, the GRAND TOTAL is the final "Amount" or "Total" value AFTER tax (e.g. IGST/CGST/SGST), not the pre-tax "Taxable value" or "Rate".
4. Currency: ₹ or "Rs." → "INR", $ → "USD", € → "EUR", £ → "GBP".
5. If you cannot determine a field, use null.
6. Set confidence below 0.7 if the document is unclear or not a receipt.

Output only the JSON object.`;

export async function extractWithVertexAiMultimodal(
  document: { content: Buffer; mimeType: string },
): Promise<string> {
  return callVertex(MULTIMODAL_PROMPT, document);
}
