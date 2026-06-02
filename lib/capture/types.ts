/**
 * Capture types and constants for the Receipt_Capture_Sheet feature.
 *
 * These types define the shape of captured assets (images/PDFs) and
 * the validation outcomes produced by the Asset_Validator.
 */

// --- Constants ---

/** Maximum file size in bytes (10 MiB). */
export const MAX_BYTES = 10 * 1024 * 1024;

/** Maximum number of files per upload selection. */
export const MAX_FILES = 5;

/** Allowed MIME types for capture and upload. */
export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

// --- Types ---

/** Union of accepted MIME types derived from the ALLOWED_MIME_TYPES constant. */
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/** A validated asset produced by Photo_Capture or Media_Upload. */
export interface CapturedAsset {
  blob: Blob;
  mimeType: AllowedMimeType;
  /** Must equal blob.size; asserted at construction. */
  sizeBytes: number;
  sourcePath: "camera" | "upload";
}

/** Typed validation errors returned by the Asset_Validator. */
export type AssetValidationError =
  | { code: "UNSUPPORTED_TYPE"; fileName: string; mimeType: string }
  | { code: "TOO_LARGE"; fileName: string; sizeBytes: number }
  | { code: "EMPTY"; fileName: string }
  | { code: "TOO_MANY"; count: number };

/** Discriminated outcome of asset validation. */
export type AssetValidationOutcome =
  | { ok: true; assets: CapturedAsset[] }
  | { ok: false; errors: AssetValidationError[]; assets: CapturedAsset[] };
