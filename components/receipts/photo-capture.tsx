"use client";

import { Camera, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { CapturedAsset } from "@/lib/capture/types";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PhotoCaptureProps {
  onCaptured: (asset: CapturedAsset) => void;
  onCancel: () => void;
}

/**
 * Five-state machine:
 *   Idle → RequestingPermission → { NoSupport | Streaming | PermissionDenied }
 *   Streaming → { StreamFailed | Captured }
 *   Captured → { Streaming | Submitted }
 */
type CaptureState =
  | "Idle"
  | "RequestingPermission"
  | "NoSupport"
  | "Streaming"
  | "PermissionDenied"
  | "StreamFailed"
  | "Captured"
  | "Submitted";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum long-edge resolution for the captured JPEG. */
const MAX_DIMENSION = 2048;

/** Maximum blob size in bytes (4 MB). */
const MAX_BLOB_SIZE = 4 * 1024 * 1024;

/** JPEG quality levels to try in order. */
const QUALITY_LEVELS = [0.92, 0.85, 0.8, 0.75] as const;

/** Timeout for the first `loadedmetadata` event (ms). */
const STREAM_TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Stop every track on a MediaStream. Safe to call with null/undefined.
 */
function stopAllTracks(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

/**
 * Check whether getUserMedia is available in this browser.
 */
function isGetUserMediaSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

/**
 * Encode a video frame to JPEG, scaling so max(width, height) ≤ MAX_DIMENSION.
 * Re-encodes at lower quality levels if the blob exceeds MAX_BLOB_SIZE.
 */
async function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  // Scale so the long edge ≤ 2048
  const scale = Math.min(1, MAX_DIMENSION / Math.max(vw, vh));
  const cw = Math.round(vw * scale);
  const ch = Math.round(vh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable");
  }
  ctx.drawImage(video, 0, 0, cw, ch);

  for (const quality of QUALITY_LEVELS) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });

    if (!blob) continue;
    if (blob.size <= MAX_BLOB_SIZE) return blob;
  }

  // Last resort: return whatever the lowest quality produced
  const lastBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      "image/jpeg",
      QUALITY_LEVELS[QUALITY_LEVELS.length - 1],
    );
  });

  if (!lastBlob) throw new Error("Failed to encode JPEG");
  return lastBlob;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Photo_Capture component — in-app camera capture with fallback to
 * `<input type="file" capture="environment">`.
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.13, 4.14, 4.15, 7.5, 7.12
 */
export function PhotoCapture({ onCaptured, onCancel }: PhotoCaptureProps) {
  const [state, setState] = useState<CaptureState>("Idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const capturedBlobRef = useRef<Blob | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -------------------------------------------------------------------
  // Cleanup: stop tracks and clear timeout on unmount or state exit
  // -------------------------------------------------------------------
  const cleanupStream = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    stopAllTracks(streamRef.current);
    streamRef.current = null;
  }, []);

  // On unmount, always stop the camera
  useEffect(() => {
    return () => {
      cleanupStream();
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------
  // Request camera permission (only after user activates "Take photo")
  // -------------------------------------------------------------------
  const requestCamera = useCallback(async () => {
    // Check support first
    if (!isGetUserMediaSupported()) {
      setState("NoSupport");
      // Trigger the fallback file input
      fileInputRef.current?.click();
      return;
    }

    setState("RequestingPermission");
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      setState("Streaming");
    } catch (err: unknown) {
      const error = err as DOMException;
      const name = error?.name ?? "";

      // Stop any partially-opened tracks
      cleanupStream();

      if (
        name === "NotAllowedError" ||
        name === "NotReadableError" ||
        name === "OverconstrainedError"
      ) {
        setState("PermissionDenied");

        if (name === "NotAllowedError") {
          setErrorMessage(
            "Camera access is blocked. Please enable camera access in your browser settings, or use Upload instead.",
          );
        } else if (name === "NotReadableError") {
          setErrorMessage(
            "Camera is not readable. Another app may be using it. Please close other camera apps and try again, or use Upload instead.",
          );
        } else {
          setErrorMessage(
            "Camera constraints could not be satisfied. Please try again or use Upload instead.",
          );
        }
      } else {
        setState("StreamFailed");
        setErrorMessage(
          "Failed to access camera. Please try again or use Upload instead.",
        );
      }
    }
  }, [cleanupStream]);

  // Auto-start camera on mount
  useEffect(() => {
    requestCamera();
  }, [requestCamera]);

  // -------------------------------------------------------------------
  // Wire up the video element when entering Streaming state
  // -------------------------------------------------------------------
  useEffect(() => {
    if (state !== "Streaming") return;

    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    video.srcObject = stream;

    let metadataReceived = false;

    const onMetadata = () => {
      metadataReceived = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      video.play().catch(() => {
        // Autoplay blocked — user will see a frozen frame but can still capture
      });
    };

    video.addEventListener("loadedmetadata", onMetadata, { once: true });

    // 3000 ms timeout: if loadedmetadata hasn't fired, transition to StreamFailed
    timeoutRef.current = setTimeout(() => {
      if (!metadataReceived) {
        video.removeEventListener("loadedmetadata", onMetadata);
        cleanupStream();
        setState("StreamFailed");
        setErrorMessage(
          "Camera stream timed out. Please try again or use Upload instead.",
        );
      }
    }, STREAM_TIMEOUT_MS);

    // Listen for track ended events
    const tracks = stream.getTracks();
    const onTrackEnded = () => {
      cleanupStream();
      setState("StreamFailed");
      setErrorMessage(
        "Camera stream ended unexpectedly. Please try again or use Upload instead.",
      );
    };
    for (const track of tracks) {
      track.addEventListener("ended", onTrackEnded, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      for (const track of tracks) {
        track.removeEventListener("ended", onTrackEnded);
      }
    };
  }, [state, cleanupStream]);

  // -------------------------------------------------------------------
  // Shutter: capture a frame from the video
  // -------------------------------------------------------------------
  const handleShutter = useCallback(async () => {
    const video = videoRef.current;
    if (!video || state !== "Streaming") return;

    try {
      const blob = await captureFrame(video);
      capturedBlobRef.current = blob;

      // Create a preview URL
      const url = URL.createObjectURL(blob);
      setCapturedUrl(url);

      // Stop the stream while in review (camera light off)
      cleanupStream();
      setState("Captured");
    } catch {
      setErrorMessage("Failed to capture photo. Please try again.");
    }
  }, [state, cleanupStream]);

  // -------------------------------------------------------------------
  // Retake: return to Streaming without re-requesting permission
  // -------------------------------------------------------------------
  const handleRetake = useCallback(async () => {
    // Revoke the old preview URL
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      setCapturedUrl(null);
    }
    capturedBlobRef.current = null;

    // Re-open the stream using the same permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setState("Streaming");
    } catch {
      cleanupStream();
      setState("StreamFailed");
      setErrorMessage(
        "Failed to restart camera. Please try again or use Upload instead.",
      );
    }
  }, [capturedUrl, cleanupStream]);

  // -------------------------------------------------------------------
  // Use photo: emit the CapturedAsset
  // -------------------------------------------------------------------
  const handleUsePhoto = useCallback(() => {
    const blob = capturedBlobRef.current;
    if (!blob) return;

    setState("Submitted");

    const asset: CapturedAsset = {
      blob,
      mimeType: "image/jpeg",
      sizeBytes: blob.size,
      sourcePath: "camera",
    };

    onCaptured(asset);
  }, [onCaptured]);

  // -------------------------------------------------------------------
  // Fallback file input handler (NoSupport path)
  // -------------------------------------------------------------------
  const handleFallbackFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        onCancel();
        return;
      }

      // Feed the file directly into the review state
      capturedBlobRef.current = file;
      const url = URL.createObjectURL(file);
      setCapturedUrl(url);
      setState("Captured");
    },
    [onCancel],
  );

  // -------------------------------------------------------------------
  // Cancel handler
  // -------------------------------------------------------------------
  const handleCancel = useCallback(() => {
    cleanupStream();
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    onCancel();
  }, [cleanupStream, capturedUrl, onCancel]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  // Idle state: show "Take photo" button
  if (state === "Idle" || state === "NoSupport") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={requestCamera}
          className="min-h-11 min-w-11"
        >
          <Camera data-icon aria-hidden="true" />
          Take photo
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleCancel}
          className="min-h-11 min-w-11"
        >
          Cancel
        </Button>

        {/* Hidden fallback input for browsers without getUserMedia */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFallbackFile}
          aria-label="Capture photo from camera"
        />
      </div>
    );
  }

  // RequestingPermission state: show loading indicator
  if (state === "RequestingPermission") {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <p className="text-sm text-text-secondary">
          Requesting camera access…
        </p>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleCancel}
          className="min-h-11 min-w-11"
        >
          Cancel
        </Button>
      </div>
    );
  }

  // PermissionDenied or StreamFailed: show error
  if (state === "PermissionDenied" || state === "StreamFailed") {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <div
          className="flex size-12 items-center justify-center rounded-full border border-danger/40 bg-danger/10"
          aria-hidden="true"
        >
          <X className="size-5 text-danger" />
        </div>
        <p className="max-w-xs text-sm text-text-primary" role="alert">
          {errorMessage}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={handleCancel}
          className="min-h-11 min-w-11"
        >
          Close
        </Button>
      </div>
    );
  }

  // Streaming state: live preview + shutter + cancel
  if (state === "Streaming") {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Live video preview */}
        <div className="relative w-full overflow-hidden rounded-md bg-canvas">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-auto w-full object-cover"
            aria-label="Camera preview"
          />
        </div>

        {/* Controls */}
        <div className="flex w-full items-center justify-center gap-4 px-4 pb-4">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleCancel}
            className="min-h-11 min-w-11"
            aria-label="Cancel capture"
          >
            Cancel
          </Button>

          <button
            type="button"
            onClick={handleShutter}
            className={cn(
              "flex size-16 items-center justify-center rounded-full",
              "border-4 border-accent bg-canvas",
              "transition-[transform,opacity] duration-150 ease-standard",
              "active:scale-90",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
            )}
            aria-label="Capture photo"
          >
            <div className="size-12 rounded-full bg-accent" />
          </button>

          {/* Spacer to balance the layout */}
          <div className="min-h-11 min-w-11" aria-hidden="true" />
        </div>
      </div>
    );
  }

  // Captured state: review with Retake / Use photo
  if (state === "Captured") {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* Captured image preview */}
        <div className="relative w-full overflow-hidden rounded-md bg-canvas">
          {capturedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedUrl}
              alt="Captured receipt photo"
              className="h-auto w-full object-contain"
            />
          )}
        </div>

        {/* Review controls */}
        <div className="flex w-full items-center justify-center gap-4 px-4 pb-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleRetake}
            className="min-h-11 min-w-11"
          >
            <RefreshCw data-icon aria-hidden="true" />
            Retake
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleUsePhoto}
            className="min-h-11 min-w-11"
          >
            Use photo
          </Button>
        </div>
      </div>
    );
  }

  // Submitted state: nothing to render (parent handles next step)
  return null;
}
