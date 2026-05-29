import { repairJson } from "@/lib/ai/json-repair";
import {
  type DocumentAiInput,
  DocumentAiUnavailableError,
  extractWithDocumentAi,
  isDocumentAiEnabled,
} from "@/lib/ai/providers/document-ai";
import { extractWithGemini } from "@/lib/ai/providers/gemini";
import { extractWithGroq } from "@/lib/ai/providers/groq";
import {
  extractWithVertexAi,
  isVertexAiEnabled,
  VertexAiUnavailableError,
} from "@/lib/ai/providers/vertex-ai";
import {
  applyReturnDeadlineDefault,
  normalizeExtractionData,
} from "@/lib/ai/schema";
import type {
  AIExtractionData,
  AIExtractionResult,
  AIProvider,
} from "@/types/receipt";

/**
 * Provider chain (see .kiro/steering/cost-rules.md):
 *
 *   document path (PDF/image supplied):
 *     Document AI (trial credits, premium accuracy for invoices)
 *       → Vertex AI Gemini (trial credits, large quota)
 *         → AI Studio Gemini (free tier daily quota)
 *           → Groq (free tier)
 *             → needs_review
 *
 *   text-only path:
 *     Vertex AI Gemini (if enabled, uses trial credits)
 *       → AI Studio Gemini (free tier)
 *         → Groq (free tier)
 *           → needs_review
 *
 * Trial-aware errors (billing/quota/auth) are caught and the chain falls
 * through silently so users never see paid-feature failures.
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
  enabled?: () => boolean;
  extract: (emailText: string) => Promise<string>;
  /** Return true if the error means "skip silently". */
  isUnavailable?: (error: unknown) => boolean;
}

const MIN_CONFIDENCE = 0.7;
/**
 * Document AI's confidence is an AVERAGE across all extracted entities,
 * so 0.6 is actually a decent invoice parse. Use a lower threshold here
 * since its structured output is far more accurate than text-LLM guesses.
 */
const MIN_DOCUMENT_AI_CONFIDENCE = 0.5;

const textProviderChain: TextProvider[] = [
  {
    name: "vertex_ai",
    enabled: isVertexAiEnabled,
    extract: extractWithVertexAi,
    isUnavailable: (error) => error instanceof VertexAiUnavailableError,
  },
  {
    name: "gemini",
    extract: extractWithGemini,
  },
  {
    name: "groq",
    extract: extractWithGroq,
  },
];

export interface ExtractInput {
  /** Plain email/receipt text used for LLM-based providers. */
  emailText: string;
  /** Optional document (PDF/image) — when present, Document AI is tried first. */
  document?: DocumentAiInput;
  /** Optional email subject — used to detect product purchases for smart defaults. */
  subject?: string | null;
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
    if (data.confidence >= MIN_DOCUMENT_AI_CONFIDENCE) {
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
  for (const provider of textProviderChain) {
    if (provider.enabled && !provider.enabled()) continue;

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
      if (provider.isUnavailable?.(error)) {
        failures.push(`${provider.name}: ${message}`);
        continue;
      }
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
      return {
        status: "success",
        provider: "document_ai",
        data: applyReturnDeadlineDefault(docResult, {
          emailText: input.emailText,
          subject: input.subject,
        }),
      };
    }
  }

  const textResult = await tryTextProviders(input.emailText, failures);
  if (textResult) {
    return {
      status: "success",
      provider: textResult.provider,
      data: applyReturnDeadlineDefault(textResult.data, {
        emailText: input.emailText,
        subject: input.subject,
      }),
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
