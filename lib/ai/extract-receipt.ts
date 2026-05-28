import { repairJson } from "@/lib/ai/json-repair";
import {
  type DocumentAiInput,
  DocumentAiUnavailableError,
  extractWithDocumentAi,
  isDocumentAiEnabled,
} from "@/lib/ai/providers/document-ai";
import { extractWithGemini } from "@/lib/ai/providers/gemini";
import { extractWithGroq } from "@/lib/ai/providers/groq";
import { normalizeExtractionData } from "@/lib/ai/schema";
import type {
  AIExtractionData,
  AIExtractionResult,
  AIProvider,
} from "@/types/receipt";

/**
 * Provider chain (see .kiro/steering/cost-rules.md):
 *   Document AI (only if a document is supplied AND ENABLE_DOCUMENT_AI=true)
 *     → Gemini API (free tier)
 *       → Groq (free tier)
 *         → needs_review
 *
 * Document AI runs on the user's Google Cloud trial credits. When credits
 * run out, billing/quota errors are caught and we silently fall through to
 * the free providers.
 */

const fallbackData: AIExtractionData = {
  store_name: null,
  item_name: null,
  price: null,
  currency: "USD",
  purchase_date: null,
  return_deadline: null,
  warranty_deadline: null,
  confidence: 0,
};

interface TextProvider {
  name: AIProvider;
  extract: (emailText: string) => Promise<string>;
}

const textProviders: TextProvider[] = [
  { name: "gemini", extract: extractWithGemini },
  { name: "groq", extract: extractWithGroq },
];

const MIN_CONFIDENCE = 0.7;

export interface ExtractInput {
  /** Plain email/receipt text used for LLM-based providers. */
  emailText: string;
  /** Optional document (PDF/image) — when present, Document AI is tried first. */
  document?: DocumentAiInput;
}

async function tryDocumentAi(
  input: DocumentAiInput,
  failures: string[],
): Promise<AIExtractionData | null> {
  if (!isDocumentAiEnabled()) {
    return null;
  }

  try {
    const raw = await extractWithDocumentAi(input);
    const data = normalizeExtractionData(raw);
    if (data.confidence >= MIN_CONFIDENCE) {
      return data;
    }
    failures.push(`document_ai: low confidence ${data.confidence}`);
    return null;
  } catch (error) {
    if (error instanceof DocumentAiUnavailableError) {
      failures.push(`document_ai: ${error.message}`);
      return null;
    }
    const message = error instanceof Error ? error.message : "unknown error";
    failures.push(`document_ai: ${message}`);
    return null;
  }
}

async function tryTextProviders(
  emailText: string,
  failures: string[],
): Promise<{ provider: AIProvider; data: AIExtractionData } | null> {
  for (const provider of textProviders) {
    try {
      const raw = await provider.extract(emailText);
      const repaired = repairJson(raw);
      if (!repaired) {
        failures.push(`${provider.name}: invalid JSON`);
        continue;
      }

      const data = normalizeExtractionData(repaired);
      if (data.confidence >= MIN_CONFIDENCE) {
        return { provider: provider.name, data };
      }

      failures.push(`${provider.name}: low confidence ${data.confidence}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      failures.push(`${provider.name}: ${message}`);
    }
  }
  return null;
}

export async function extractReceipt(
  input: ExtractInput,
): Promise<AIExtractionResult> {
  const failures: string[] = [];

  if (input.document) {
    const docResult = await tryDocumentAi(input.document, failures);
    if (docResult) {
      return { status: "success", provider: "document_ai", data: docResult };
    }
  }

  const textResult = await tryTextProviders(input.emailText, failures);
  if (textResult) {
    return {
      status: "success",
      provider: textResult.provider,
      data: textResult.data,
    };
  }

  return {
    status: "needs_review",
    provider: null,
    data: fallbackData,
    error: failures.join("; ") || "Extraction failed",
  };
}

/** Backward-compatible wrapper used by existing call sites. */
export async function extractReceiptFromEmail(
  emailText: string,
): Promise<AIExtractionResult> {
  return extractReceipt({ emailText });
}
