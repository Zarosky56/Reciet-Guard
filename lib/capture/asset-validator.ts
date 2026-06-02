/**
 * Asset_Validator — pure client-side validation for captured/uploaded files.
 *
 * Decision table:
 * 1. files.length > MAX_FILES → reject whole selection with TOO_MANY, assets: []
 * 2. Per file (in order):
 *    - size === 0 → EMPTY
 *    - type not in ALLOWED_MIME_TYPES → UNSUPPORTED_TYPE
 *    - size > MAX_BYTES → TOO_LARGE
 *    - otherwise → valid CapturedAsset
 * 3. Any errors → { ok: false, errors, assets: [valid ones in order] }
 * 4. No errors → { ok: true, assets: [all in order] }
 *
 * Pure: no DOM access, no side effects.
 */

import {
  ALLOWED_MIME_TYPES,
  MAX_BYTES,
  MAX_FILES,
  type AllowedMimeType,
  type AssetValidationError,
  type AssetValidationOutcome,
  type CapturedAsset,
} from "./types";

/**
 * Validates an array of files and returns either all valid CapturedAssets
 * or a partial list of valid assets plus typed errors for each rejection.
 *
 * Order is preserved: the returned `assets` array contains only the files
 * that passed validation, in their original input order.
 */
export function validateAssets(
  files: ReadonlyArray<File>,
  source: "camera" | "upload",
): AssetValidationOutcome {
  // Rule 1: reject entire selection if too many files
  if (files.length > MAX_FILES) {
    return {
      ok: false,
      errors: [{ code: "TOO_MANY", count: files.length }],
      assets: [],
    };
  }

  const errors: AssetValidationError[] = [];
  const assets: CapturedAsset[] = [];

  // Rule 2: validate each file in order
  for (const file of files) {
    if (file.size === 0) {
      errors.push({ code: "EMPTY", fileName: file.name });
      continue;
    }

    if (!isAllowedMimeType(file.type)) {
      errors.push({
        code: "UNSUPPORTED_TYPE",
        fileName: file.name,
        mimeType: file.type,
      });
      continue;
    }

    if (file.size > MAX_BYTES) {
      errors.push({
        code: "TOO_LARGE",
        fileName: file.name,
        sizeBytes: file.size,
      });
      continue;
    }

    // File passed all checks — construct CapturedAsset
    assets.push({
      blob: file,
      mimeType: file.type as AllowedMimeType,
      sizeBytes: file.size,
      sourcePath: source,
    });
  }

  // Rule 3 & 4: discriminate outcome based on presence of errors
  if (errors.length > 0) {
    return { ok: false, errors, assets };
  }

  return { ok: true, assets };
}

/** Type guard: checks if a MIME type string is in the allow-list. */
function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}
