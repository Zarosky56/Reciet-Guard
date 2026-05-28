import { VertexAI } from "@google-cloud/vertexai";

import { getGoogleAuth } from "@/lib/google-cloud/auth";
import { buildReceiptExtractionPrompt } from "@/lib/ai/prompt";

/**
 * Vertex AI Gemini provider — uses Google Cloud trial credits with effectively
 * unlimited daily quota (vs AI Studio's 50/day free tier hard cap).
 *
 * Same Gemini models, charged via Google Cloud billing. Trial credits cover
 * usage; once they expire, callers fall back to the AI Studio Gemini provider
 * via the standard chain in `extractReceipt`.
 */

const VERTEX_MODEL = "gemini-2.0-flash-001";

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

let cachedClient: VertexAI | null = null;

async function getClient(): Promise<VertexAI> {
  // Don't cache: WIF auth is per-request.
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION ?? "us-central1";
  if (!projectId) {
    throw new VertexAiUnavailableError("GOOGLE_CLOUD_PROJECT_ID not set");
  }

  const auth = await getGoogleAuth();
  cachedClient = new VertexAI({
    project: projectId,
    location,
    googleAuthOptions: {
      authClient: (await auth.getClient()) as never,
    },
  });
  return cachedClient;
}

export async function extractWithVertexAi(emailText: string): Promise<string> {
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

  try {
    const model = client.getGenerativeModel({
      model: VERTEX_MODEL,
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: buildReceiptExtractionPrompt(emailText) }],
        },
      ],
    });

    const text =
      result.response.candidates?.[0]?.content?.parts
        ?.map((part) => ("text" in part ? part.text : ""))
        .join("") ?? "";

    if (!text) {
      throw new Error("Empty Vertex AI response");
    }
    return text;
  } catch (error) {
    if (looksLikeBillingError(error)) {
      throw new VertexAiUnavailableError(
        `Vertex AI unavailable (billing/quota): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    throw error;
  }
}
