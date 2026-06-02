"use client";

/**
 * Receipt_Capture_Sheet — bottom sheet (mobile) / centred dialog (≥ sm)
 * that hosts Photo_Capture and Media_Upload entry points.
 *
 * On viewports < 640 px, renders as a bottom sheet animating
 * `transform: translateY(...)` only. On ≥ 640 px, renders as a centred
 * `<Dialog>`-style modal.
 *
 * Requirements: 4.1, 4.2, 4.11, 4.12, 4.13, 4.15, 7.5, 7.6, 7.12
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, FileSearch, ScanLine, Upload, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loaders";
import { submitCapturedAsset } from "@/lib/capture/capture-client";
import type { CapturedAsset } from "@/lib/capture/types";
import { cn } from "@/lib/utils/cn";
import type { AIExtractionResult } from "@/types/receipt";

import { MediaUpload } from "./media-upload";
import { PhotoCapture } from "./photo-capture";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReceiptCaptureSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called when extraction completes. The dashboard opens the existing editor. */
  onExtractionResult: (
    result: AIExtractionResult,
    source: "camera" | "upload",
    previewDataUrl?: string | null,
  ) => void;
  /** Which entry point to default to when opened. */
  defaultEntry?: "camera" | "upload" | "none";
}

type ActivePathway = "none" | "camera" | "upload";

// ---------------------------------------------------------------------------
// Viewport hook — subscribe to the `sm` breakpoint (640 px)
// ---------------------------------------------------------------------------

const SM_QUERY = "(min-width: 640px)";

function subscribeToSmBreakpoint(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mql = window.matchMedia(SM_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSmSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(SM_QUERY).matches;
}

function getSmServerSnapshot(): boolean {
  // SSR: assume mobile-first
  return false;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const standardEase = [0.2, 0, 0, 1] as const;
const defaultDuration = 0.22;

function imageBlobToPreviewDataUrl(blob: Blob): Promise<string | null> {
  if (!blob.type.startsWith("image/")) return Promise.resolve(null);

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const maxWidth = 900;
      const maxHeight = 700;
      const scale = Math.min(
        1,
        maxWidth / image.naturalWidth,
        maxHeight / image.naturalHeight,
      );
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    image.src = objectUrl;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReceiptCaptureSheet({
  open,
  onClose,
  onExtractionResult,
  defaultEntry,
}: ReceiptCaptureSheetProps) {
  const titleId = useId();
  const isDesktop = useSyncExternalStore(
    subscribeToSmBreakpoint,
    getSmSnapshot,
    getSmServerSnapshot,
  );
  const reduce = useReducedMotion();

  const [activePathway, setActivePathway] = useState<ActivePathway>("none");
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // When the sheet opens, jump directly to the requested pathway
  // (e.g. scanner button → camera). When no defaultEntry is given,
  // we land on the chooser ("none") so the user can pick.
  useEffect(() => {
    if (open) {
      setActivePathway(defaultEntry ?? "none");
    }
  }, [open, defaultEntry]);

  // -------------------------------------------------------------------------
  // Focus management: capture previous focus on open, restore on close
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (open) {
      // Store the element that had focus before opening
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the first focusable element inside the sheet
      requestAnimationFrame(() => {
        const focusableSelector =
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const first =
          sheetRef.current?.querySelector<HTMLElement>(focusableSelector);
        first?.focus();
      });
    }
  }, [open]);

  // -------------------------------------------------------------------------
  // Keyboard: Escape closes the sheet
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // -------------------------------------------------------------------------
  // Focus trap
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;

      const focusableSelector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(
        sheetRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );

      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // -------------------------------------------------------------------------
  // Close handler: abort in-flight requests, restore focus
  // -------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    // Abort any in-flight submission
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset pathway
    setActivePathway("none");

    // Close the sheet
    onClose();

    // Restore focus to the invoking element
    requestAnimationFrame(() => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    });
  }, [onClose]);

  // -------------------------------------------------------------------------
  // Unmount cleanup: abort controller when sheet closes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!open) {
      // When sheet closes, abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setActivePathway("none");
    }
  }, [open]);

  // -------------------------------------------------------------------------
  // Entry point handlers
  // -------------------------------------------------------------------------
  const handleTakePhoto = useCallback(() => {
    setActivePathway("camera");
  }, []);

  const handleUpload = useCallback(() => {
    setActivePathway("upload");
  }, []);

  // -------------------------------------------------------------------------
  // PhotoCapture result handler
  // -------------------------------------------------------------------------
  const handlePhotoCaptured = useCallback(
    async (asset: CapturedAsset) => {
      setIsProcessing(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const previewDataUrl = await imageBlobToPreviewDataUrl(asset.blob);
        const result = await submitCapturedAsset(asset, {
          signal: controller.signal,
        });

        abortControllerRef.current = null;
        onExtractionResult(result, "camera", previewDataUrl);
        handleClose();
      } catch (error) {
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onExtractionResult, handleClose],
  );

  // -------------------------------------------------------------------------
  // MediaUpload result handler
  // -------------------------------------------------------------------------
  const handleUploadResults = useCallback(
    (results: AIExtractionResult[]) => {
      // Report the first success, or the last result
      const successResult = results.find((r) => r.status === "success");
      const result = successResult ?? results[results.length - 1];
      if (result) {
        onExtractionResult(result, "upload");
      }
      handleClose();
    },
    [onExtractionResult, handleClose],
  );

  const handlePathwayCancel = useCallback(() => {
    setActivePathway("none");
  }, []);

  // -------------------------------------------------------------------------
  // Create a fresh AbortController signal for the upload pathway
  // -------------------------------------------------------------------------
  const getUploadSignal = useCallback(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    return controller.signal;
  }, []);

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const entryPointRow = (
    <div className="flex w-full gap-3 px-4 pb-3 pt-4">
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={handleTakePhoto}
        className="min-h-11 min-w-11 flex-1"
      >
        <Camera data-icon aria-hidden="true" />
        Take photo
      </Button>
      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={handleUpload}
        className="min-h-11 min-w-11 flex-1"
      >
        <Upload data-icon aria-hidden="true" />
        Upload
      </Button>
    </div>
  );

  const sheetContent = (
    <>
      {/* Header with title and close button */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <h2
          id={titleId}
          className="text-sm font-semibold tracking-tight text-text-primary"
        >
          Add receipt
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          aria-label="Close"
          className="min-h-11 min-w-11"
        >
          <X data-icon aria-hidden="true" />
        </Button>
      </div>

      {/* Entry points or active pathway */}
      {isProcessing ? (
        <ProcessingReceiptScan />
      ) : (
        <>
          {activePathway === "none" && entryPointRow}

          {activePathway === "camera" && (
            <div className="px-4 pb-4">
              <PhotoCapture
                onCaptured={handlePhotoCaptured}
                onCancel={handlePathwayCancel}
              />
            </div>
          )}

          {activePathway === "upload" && (
            <div className="px-4 pb-4">
              <MediaUpload
                onResults={handleUploadResults}
                onCancel={handlePathwayCancel}
                signal={getUploadSignal()}
              />
            </div>
          )}
        </>
      )}
    </>
  );

  // Desktop (≥ sm): centred dialog
  if (isDesktop) {
    return (
      <AnimatePresence>
        {open ? (
          <motion.div
            key="capture-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: defaultDuration, ease: standardEase }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 p-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={handleClose}
          >
            <motion.section
              key="capture-sheet-panel"
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-reduced-motion="static"
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: 8 }}
              transition={{ duration: defaultDuration, ease: standardEase }}
              className={cn(
                "w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface-overlay text-text-primary shadow-overlay",
              )}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {sheetContent}
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    );
  }

  // Mobile (< sm): bottom sheet with translateY animation
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="capture-sheet-scrim-mobile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: defaultDuration, ease: standardEase }}
          className="fixed inset-0 z-50 flex items-end bg-canvas/70 backdrop-blur-sm"
          role="presentation"
          onMouseDown={handleClose}
        >
          <motion.section
            key="capture-sheet-panel-mobile"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            data-reduced-motion="static"
            initial={reduce ? undefined : { transform: "translateY(100%)" }}
            animate={reduce ? undefined : { transform: "translateY(0%)" }}
            exit={reduce ? undefined : { transform: "translateY(100%)" }}
            transition={{ duration: defaultDuration, ease: standardEase }}
            className={cn(
              "w-full overflow-hidden rounded-t-lg border border-border bg-surface-overlay text-text-primary shadow-overlay",
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {sheetContent}
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProcessingReceiptScan() {
  return (
    <div className="grid gap-5 p-6 text-text-primary">
      <div className="relative overflow-hidden rounded-md border border-border bg-canvas p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Reading receipt
            </p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">
              Pulling out the details
            </h3>
          </div>
          <span className="flex size-10 items-center justify-center rounded-md border border-border bg-surface text-accent">
            <ScanLine className="size-5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-sm border border-border bg-surface">
          <motion.div
            aria-hidden="true"
            className="h-1 w-1/3 rounded-pill bg-accent"
            animate={{ x: ["-100%", "320%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: standardEase,
            }}
          />
          <div className="grid gap-3 p-4">
            {[
              "Finding store and item",
              "Reading purchase date",
              "Checking refund and warranty clues",
            ].map((label) => (
              <div key={label} className="flex items-center gap-3">
                <FileSearch className="size-4 text-accent" aria-hidden="true" />
                <span className="text-sm text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Loader size="sm" label="Preparing the review panel" />
    </div>
  );
}
