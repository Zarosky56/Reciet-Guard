/**
 * Capture client — POSTs a CapturedAsset to /api/extract as multipart/form-data
 * and returns an AIExtractionResult. Never throws. Billing/network errors are
 * translated into a synthesized "needs_review" result so callers never see them.
 *
 * Requirements: 6.3, 6.7, 6.8
 */

import type { AIExtractionResult } from "@/types/receipt";
import type { CapturedAsset } from "./types";

export interface SubmitOptions {
  signal?: AbortSignal;
  /** Defaults to 30000 ms per Requirement 6.8. */
  timeoutMs?: number;
}

/** Fallback data returned when extraction is unavailable. */
const fallbackData = {
  store_name: null,
  item_name: null,
  price: null,
  currency: "USD",
  purchase_date: null,
  return_deadline: null,
  warranty_deadline: null,
  confidence: 0,
} as const;

/**
 * Forbidden substrings that must never appear in synthesized error messages.
 * Per Requirement 6.7 and cost-rules.md, no billing/upgrade language is surfaced.
 */
const FORBIDDEN_STRINGS = [
  "upgrade",
  "billing",
  "enable",
  "Document AI",
  "Vertex",
  "console.cloud.google.com",
] as const;

/**
 * Sanitize an error message by stripping any forbidden billing/upgrade strings.
 * Returns a safe generic message if any forbidden content is detected.
 */
function sanitizeErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  for (const forbidden of FORBIDDEN_STRINGS) {
    if (lower.includes(forbidden.toLowerCase())) {
      return "Extraction unavailable";
    }
  }
  return message;
}

/**
 * Create a synthesized needs_review result for non-2xx / network errors.
 * The error message is always safe (no billing/upgrade language).
 */
function synthesizeNeedsReview(rawError?: string): AIExtractionResult {
  const error = rawError
    ? sanitizeErrorMessage(rawError)
    : "Extraction unavailable";
  return {
    status: "needs_review",
    provider: null,
    data: { ...fallbackData },
    error,
  };
}

/**
 * Submit a captured asset to the extraction endpoint.
 *
 * - POSTs multipart/form-data to `/api/extract` with fields `document` (blob)
 *   and `mimeType` (string).
 * - Applies a per-call AbortController with 30000 ms timeout.
 * - If `options.signal` is provided, links both signals (abort if either fires).
 * - On 2xx: parses JSON and returns as AIExtractionResult.
 * - On 422: parses JSON and returns as-is (server-side needs_review).
 * - On any other non-2xx or network error: returns synthesized needs_review.
 * - Never throws.
 * - Never includes billing/upgrade strings in error messages.
 */
export async function submitCapturedAsset(
  asset: CapturedAsset,
  options?: SubmitOptions,
): Promise<AIExtractionResult> {
  const timeoutMs = options?.timeoutMs ?? 30000;

  // Per-call timeout controller
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  // Link the caller's signal if provided
  let linkedAbort: (() => void) | undefined;
  if (options?.signal) {
    if (options.signal.aborted) {
      clearTimeout(timeoutId);
      return synthesizeNeedsReview("Extraction unavailable");
    }
    linkedAbort = () => timeoutController.abort();
    options.signal.addEventListener("abort", linkedAbort, { once: true });
  }

  try {
    const formData = new FormData();
    formData.append("document", asset.blob);
    formData.append("mimeType", asset.mimeType);

    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
      signal: timeoutController.signal,
    });

    if (response.ok) {
      // 2xx — parse and return the extraction result
      const result: AIExtractionResult = await response.json();
      return result;
    }

    if (response.status === 422) {
      // 422 — server-side needs_review, return as-is
      const result: AIExtractionResult = await response.json();
      return result;
    }

    // Any other non-2xx — synthesize a safe needs_review
    // Attempt to read the response body for logging context, but never
    // expose raw server error text that might contain billing language
    return synthesizeNeedsReview();
  } catch {
    // Network error, timeout, or abort — synthesize a safe needs_review
    return synthesizeNeedsReview();
  } finally {
    clearTimeout(timeoutId);
    if (linkedAbort && options?.signal) {
      options.signal.removeEventListener("abort", linkedAbort);
    }
  }
}
