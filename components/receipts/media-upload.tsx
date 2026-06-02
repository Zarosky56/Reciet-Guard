"use client";

/**
 * Media_Upload — file picker pathway for the Receipt_Capture_Sheet.
 *
 * Programmatically opens the device file picker on mount, validates
 * selected files via the Asset_Validator, surfaces rejections as a
 * single toast, and submits valid Captured_Assets sequentially to the
 * extraction endpoint.
 *
 * Requirements: 5.1, 5.2, 5.6, 5.7, 5.8, 5.10, 5.11
 */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Loader } from "@/components/ui/loaders";
import { validateAssets } from "@/lib/capture/asset-validator";
import { submitCapturedAsset } from "@/lib/capture/capture-client";
import type { AssetValidationError } from "@/lib/capture/types";
import type { AIExtractionResult } from "@/types/receipt";

export interface MediaUploadProps {
  onResults: (results: AIExtractionResult[]) => void;
  onCancel: () => void;
  signal?: AbortSignal;
}

/** Per-file submission state for rendering progress. */
interface FileProgress {
  fileName: string;
  status: "pending" | "submitting" | "done" | "error";
}

/** Format a single validation error into a human-readable string. */
function formatValidationError(error: AssetValidationError): string {
  switch (error.code) {
    case "UNSUPPORTED_TYPE":
      return `${error.fileName}: unsupported type (${error.mimeType})`;
    case "TOO_LARGE":
      return `${error.fileName}: too large (${Math.round(error.sizeBytes / 1024 / 1024)}MB)`;
    case "EMPTY":
      return `${error.fileName}: empty file`;
    case "TOO_MANY":
      return `Too many files selected (${error.count}). Maximum is 5.`;
  }
}

export function MediaUpload({ onResults, onCancel, signal }: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const mountedRef = useRef(true);
  const pickerOpenedRef = useRef(false);

  // Open the file picker programmatically on mount
  useEffect(() => {
    mountedRef.current = true;

    if (pickerOpenedRef.current) return;
    pickerOpenedRef.current = true;

    // Create and click the hidden input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp,application/pdf";
    input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    inputRef.current = input;

    const handleChange = () => {
      const files = input.files;
      if (!files || files.length === 0) {
        // User dismissed the picker without selecting
        cleanup();
        onCancel();
        return;
      }
      processFiles(Array.from(files));
    };

    // Handle cancel — the picker was dismissed without selection.
    // Browsers fire a 'cancel' event on the input when the picker is dismissed.
    const handleCancel = () => {
      cleanup();
      onCancel();
    };

    input.addEventListener("change", handleChange);
    input.addEventListener("cancel", handleCancel);

    // Use requestAnimationFrame to ensure the click happens after mount
    requestAnimationFrame(() => {
      input.click();
    });

    function cleanup() {
      input.removeEventListener("change", handleChange);
      input.removeEventListener("cancel", handleCancel);
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
      inputRef.current = null;
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function processFiles(files: File[]) {
    const outcome = validateAssets(files, "upload");

    // Surface rejections via a single toast
    if (!outcome.ok) {
      const errorMessages = outcome.errors.map(formatValidationError);
      toast.error(errorMessages.join("\n"), { duration: 5000 });

      // When TOO_MANY is present, reject the whole selection
      const hasTooMany = outcome.errors.some((e) => e.code === "TOO_MANY");
      if (hasTooMany) {
        onCancel();
        return;
      }
    }

    const validAssets = outcome.assets;

    // If no valid assets remain after validation, cancel
    if (validAssets.length === 0) {
      onCancel();
      return;
    }

    // Set up per-file progress tracking
    const initialProgress: FileProgress[] = validAssets.map((asset) => ({
      fileName: (asset.blob as File).name ?? "file",
      status: "pending" as const,
    }));
    setFileProgress(initialProgress);
    setIsProcessing(true);

    // Submit sequentially, awaiting each response before the next
    const results: AIExtractionResult[] = [];

    for (let i = 0; i < validAssets.length; i++) {
      if (!mountedRef.current) break;
      if (signal?.aborted) break;

      // Mark current file as submitting
      setFileProgress((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, status: "submitting" } : p,
        ),
      );

      const result = await submitCapturedAsset(validAssets[i], { signal });

      // Mark file as done or error based on result
      const fileStatus =
        result.status === "needs_review" ? "error" : "done";
      setFileProgress((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, status: fileStatus } : p,
        ),
      );

      results.push(result);
      // On error or needs_review, continue with remaining queue (Req 5.10)
    }

    if (mountedRef.current) {
      setIsProcessing(false);
      onResults(results);
    }
  }

  // Render per-file progress using the redesigned Loader (static dot + label)
  if (!isProcessing && fileProgress.length === 0) {
    // Waiting for file picker — render nothing visible
    return null;
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      {fileProgress.map((file, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Loader
            size="sm"
            label={
              file.status === "pending"
                ? file.fileName
                : file.status === "submitting"
                  ? `Processing ${file.fileName}…`
                  : file.status === "done"
                    ? `${file.fileName} ✓`
                    : `${file.fileName} — review needed`
            }
          />
        </div>
      ))}
    </div>
  );
}
