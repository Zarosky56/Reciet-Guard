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
  extractWithVertexAiMultimodal,
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

// ---------------------------------------------------------------------------
// Billing / quota error classification (Requirements 6.3, 6.7)
// ---------------------------------------------------------------------------

/**
 * Returns true when the error indicates a billing or quota issue that should
 * cause the provider chain to silently fall through to the next provider.
 *
 * Matches:
 *  - HTTP 402 (Payment Required)
 *  - HTTP 403 with message matching /billing|quota/i
 *  - Error message containing "BILLING_DISABLED"
 *  - Error message containing "RESOURCE_EXHAUSTED"
 */
export function isBillingOrQuotaError(error: unknown): boolean {
  if (error == null) return false;

  // Extract status code and message from various error shapes
  const status =
    typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : typeof (error as { code?: unknown }).code === "number"
          ? (error as { code: number }).code
          : null;

  const message =
    error instanceof Error
      ? error.message
      : typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);

  // HTTP 402 — always a billing error
  if (status === 402) return true;

  // HTTP 403 with billing/quota keywords
  if (status === 403 && /billing|quota/i.test(message)) return true;

  // Explicit GCP error codes in the message
  if (/BILLING_DISABLED/i.test(message)) return true;
  if (/RESOURCE_EXHAUSTED/i.test(message)) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Error summary sanitization (Requirements 6.3, 6.7)
// ---------------------------------------------------------------------------

/** Substrings that must never appear in the public error summary. */
const FORBIDDEN_ERROR_SUBSTRINGS = [
  "upgrade",
  "billing",
  "Document AI",
  "Vertex",
  "console.cloud.google.com",
] as const;

/**
 * Sanitize the error summary string so it never leaks billing-related or
 * provider-specific language to the end user.
 */
function sanitizeErrorSummary(raw: string): string {
  let sanitized = raw;
  for (const forbidden of FORBIDDEN_ERROR_SUBSTRINGS) {
    // Case-insensitive replacement of each forbidden substring
    const regex = new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    sanitized = sanitized.replace(regex, "provider");
  }
  return sanitized || "Extraction failed";
}

// ---------------------------------------------------------------------------
// Per-provider timeout (Requirement 6.8)
// ---------------------------------------------------------------------------

/** Maximum time (ms) any single provider attempt is allowed before abort. */
export const PROVIDER_TIMEOUT_MS = 30_000;

/**
 * Wraps a provider call with a per-provider 30 000 ms abort ceiling.
 * If the provider exceeds the timeout, the returned promise rejects with an
 * `AbortError`-like error so the caller can record `${provider}: timeout` and
 * continue the chain.
 */
function withProviderTimeout<T>(
  providerName: string,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  return fn(controller.signal).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Returns true when the error is an abort/timeout error (from our per-provider
 * timeout or from the AbortController being aborted).
 */
function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === "AbortError") return true;
    if (error.message.includes("aborted") || error.message.includes("abort")) return true;
  }
  // DOMException with name "AbortError" (Node 18+ / browser)
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name: string }).name === "AbortError"
  ) {
    return true;
  }
  return false;
}

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

/**
 * Unified confidence threshold for all providers (Requirements 6.4 / 6.5 / 6.8).
 * Any result with confidence < 0.6 on a 0.0–1.0 scale falls through to the
 * next provider or returns needs_review.
 */
const MIN_CONFIDENCE = 0.6;
/**
 * Document AI uses the same 0.6 threshold. Its confidence is an AVERAGE across
 * all extracted entities, so 0.6 is still a decent invoice parse while aligning
 * with the spec's single threshold rule.
 */
const MIN_DOCUMENT_AI_CONFIDENCE = 0.6;

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
    const raw = await withProviderTimeout("document_ai", async () => {
      return extractWithDocumentAi(input);
    });
    const data = normalizeExtractionData(raw);
    // Treat zero-price as a failed parse (common with Indian tax invoices that
    // confuse Document AI's expense parser). Falls through to Vertex AI.
    if (data.price !== null && data.price > 0 && data.confidence >= MIN_DOCUMENT_AI_CONFIDENCE) {
      return data;
    }
    if (data.confidence < MIN_DOCUMENT_AI_CONFIDENCE) {
      failures.push(`document_ai: low confidence ${data.confidence}`);
    } else {
      failures.push(`document_ai: parsed price as ${data.price ?? "null"}`);
    }
    return null;
  } catch (error) {
    // Timeout: record and fall through to next provider
    if (isTimeoutError(error)) {
      console.warn("[extract-receipt] Document AI timed out after 30s, falling through");
      failures.push("document_ai: timeout");
      return null;
    }
    // Billing/quota errors: log server-side and fall through silently
    if (isBillingOrQuotaError(error)) {
      console.warn("[extract-receipt] billing/quota error from Document AI, falling through:", error instanceof Error ? error.message : error);
      failures.push("document_ai: unavailable");
      return null;
    }
    if (error instanceof DocumentAiUnavailableError) {
      // DocumentAiUnavailableError already wraps billing-like errors from the provider
      console.warn("[extract-receipt] Document AI unavailable, falling through:", error.message);
      failures.push("document_ai: unavailable");
      return null;
    }
    const message = error instanceof Error ? error.message : "unknown error";
    failures.push(`document_ai: ${message}`);
    return null;
  }
}

async function tryVertexMultimodal(
  document: DocumentAiInput,
  failures: string[],
): Promise<AIExtractionData | null> {
  if (!isVertexAiEnabled()) {
    return null;
  }

  try {
    const raw = await withProviderTimeout("vertex_ai_multimodal", async () => {
      return extractWithVertexAiMultimodal(document);
    });
    const repaired = repairJson(raw);
    if (!repaired) {
      failures.push("vertex_ai_multimodal: invalid JSON");
      return null;
    }
    const data = normalizeExtractionData(repaired);
    if (data.confidence >= MIN_CONFIDENCE) {
      return data;
    }
    failures.push(`vertex_ai_multimodal: low confidence ${data.confidence}`);
    return null;
  } catch (error) {
    // Timeout: record and fall through to next provider
    if (isTimeoutError(error)) {
      console.warn("[extract-receipt] Vertex AI multimodal timed out after 30s, falling through");
      failures.push("vertex_ai_multimodal: timeout");
      return null;
    }
    // Billing/quota errors: log server-side and fall through silently
    if (isBillingOrQuotaError(error)) {
      console.warn("[extract-receipt] billing/quota error from Vertex AI multimodal, falling through:", error instanceof Error ? error.message : error);
      failures.push("vertex_ai_multimodal: unavailable");
      return null;
    }
    if (error instanceof VertexAiUnavailableError) {
      // VertexAiUnavailableError already wraps billing-like errors from the provider
      console.warn("[extract-receipt] Vertex AI multimodal unavailable, falling through:", error.message);
      failures.push("vertex_ai_multimodal: unavailable");
      return null;
    }
    const message = error instanceof Error ? error.message : "unknown error";
    failures.push(`vertex_ai_multimodal: ${message}`);
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
      const raw = await withProviderTimeout(provider.name, async () => {
        return provider.extract(emailText);
      });
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
      // Timeout: record and fall through to next provider
      if (isTimeoutError(error)) {
        console.warn(`[extract-receipt] ${provider.name} timed out after 30s, falling through`);
        failures.push(`${provider.name}: timeout`);
        continue;
      }
      // Billing/quota errors: log server-side and fall through silently
      if (isBillingOrQuotaError(error)) {
        console.warn(`[extract-receipt] billing/quota error from ${provider.name}, falling through:`, error instanceof Error ? error.message : error);
        failures.push(`${provider.name}: unavailable`);
        continue;
      }
      if (provider.isUnavailable?.(error)) {
        console.warn(`[extract-receipt] ${provider.name} unavailable, falling through:`, error instanceof Error ? (error as Error).message : error);
        failures.push(`${provider.name}: unavailable`);
        continue;
      }
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
    // Vertex AI multimodal reads the PDF/image directly with Gemini —
    // far more reliable on non-US invoice layouts (Indian tax invoices,
    // hotel folios, etc.). Try it first when available.
    const multimodalResult = await tryVertexMultimodal(input.document, failures);
    if (multimodalResult) {
      return {
        status: "success",
        provider: "vertex_ai",
        data: applyReturnDeadlineDefault(multimodalResult, {
          emailText: input.emailText,
          subject: input.subject,
        }),
      };
    }

    // Fall back to Document AI's structured Expense Parser for clean US-style
    // receipts where it shines.
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
    error: sanitizeErrorSummary(failures.join("; ") || "Extraction failed"),
  };
}

/** Backward-compatible wrapper used by existing call sites. */
export async function extractReceiptFromEmail(
  emailText: string,
): Promise<AIExtractionResult> {
  return extractReceipt({ emailText });
}
