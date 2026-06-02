"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FoldingCardFace = "front" | "back";

interface FoldingCardProps {
  /** Front content (existing hero summary, actions, intake address). */
  front: ReactNode;
  /** Back content (Warranty_View). */
  back: ReactNode;
  /** Initial face. Read from URL hash by the consumer. */
  initialFace?: FoldingCardFace;
  /** Accessible label when front is showing (button reveals back). */
  frontLabel?: string;
  /** Accessible label when back is showing (button reveals front). */
  backLabel?: string;
  /** Called when the face changes after a flip completes. */
  onFaceChange?: (face: FoldingCardFace) => void;
}

// ---------------------------------------------------------------------------
// FlipGlyph — clean inline SVG icon for the trigger pill. Replaces the
// older curved-arrow + peeled-paper pattern with a flat, premium feel.
// ---------------------------------------------------------------------------

function FlipGlyph({
  className,
  flipped,
}: {
  className?: string;
  flipped?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "size-3.5 transition-transform duration-default ease-standard",
        flipped && "rotate-180",
        className,
      )}
      aria-hidden="true"
    >
      <path
        d="M3 12a9 9 0 0 1 14.5-7.1M21 5v4h-4M21 12a9 9 0 0 1-14.5 7.1M3 19v-4h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Flip duration — must match the CSS transition below. Bumped to 600ms
// to feel like a deliberate "card flipping in space" motion rather than
// a quick swap. This is longer than `--motion-slow` (360ms), so the
// transition uses an inline duration; the easing stays on the canonical
// `--ease-emphasized` token.
// ---------------------------------------------------------------------------

const FLIP_DURATION_MS = 600;
const FLIP_FALLBACK_MS = FLIP_DURATION_MS + 60;

// ---------------------------------------------------------------------------
// FoldingCard
// ---------------------------------------------------------------------------

export function FoldingCard({
  front,
  back,
  initialFace = "front",
  frontLabel = "Show charts",
  backLabel = "Show summary",
  onFaceChange,
}: FoldingCardProps) {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [face, setFace] = useState<FoldingCardFace>(() => {
    // URL hash binding: if #warranty, start on back
    if (typeof window !== "undefined" && window.location.hash === "#warranty") {
      return "back";
    }
    return initialFace;
  });

  const [isFlipping, setIsFlipping] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs
  const flipLayerRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Mount: suppress first-paint transition via data-mounted="false"
  // -------------------------------------------------------------------------

  useEffect(() => {
    // After first rAF, allow transitions
    const raf = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // -------------------------------------------------------------------------
  // Toggle handler
  // -------------------------------------------------------------------------

  const toggleFace = useCallback(() => {
    // Ignore activations while a flip is in progress
    if (isFlipping) return;

    const next: FoldingCardFace = face === "front" ? "back" : "front";
    setIsFlipping(true);
    setFace(next);
    // Side effects (history.replaceState, Router updates) must run *outside*
    // the state updater. React treats updaters as pure, and Next's App Router
    // patches history APIs into router state updates — calling them inside
    // the updater triggers "setState during render" warnings.
    onFaceChange?.(next);

    // Restore focus to the fold cue after flip
    buttonRef.current?.focus();
  }, [face, isFlipping, onFaceChange]);

  // -------------------------------------------------------------------------
  // Transition end / fallback cleanup
  // -------------------------------------------------------------------------

  const clearFlipState = useCallback(() => {
    setIsFlipping(false);
    if (fallbackTimerRef.current !== null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isFlipping) return;

    const layer = flipLayerRef.current;
    if (!layer) return;

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === layer && e.propertyName === "transform") {
        clearFlipState();
      }
    };

    layer.addEventListener("transitionend", onTransitionEnd);

    // Fallback timeout in case transitionend doesn't fire
    fallbackTimerRef.current = setTimeout(() => {
      clearFlipState();
    }, FLIP_FALLBACK_MS);

    return () => {
      layer.removeEventListener("transitionend", onTransitionEnd);
      if (fallbackTimerRef.current !== null) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [isFlipping, clearFlipState]);

  // -------------------------------------------------------------------------
  // Dev-only: assert bounding-rect stability across face changes
  // -------------------------------------------------------------------------

  useLayoutEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const frontEl = frontRef.current;
    const backEl = backRef.current;
    if (!frontEl || !backEl) return;

    const frontRect = frontEl.getBoundingClientRect();
    const backRect = backEl.getBoundingClientRect();

    const widthDelta = Math.abs(frontRect.width - backRect.width);
    const heightDelta = Math.abs(frontRect.height - backRect.height);

    if (widthDelta > 1 || heightDelta > 1) {
      console.warn(
        `[FoldingCard] Bounding-rect instability detected: ` +
          `width Δ=${widthDelta.toFixed(2)}px, height Δ=${heightDelta.toFixed(2)}px. ` +
          `Both faces should be within ±1 CSS px.`,
      );
    }
  }, [face]);

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const isFront = face === "front";
  const ariaLabel = isFront ? frontLabel : backLabel;

  return (
    <section
      className="group/fold relative [perspective:1600px]"
    >
      {/* Flip layer — animates rotateY only */}
      <div
        ref={flipLayerRef}
        className={cn(
          "relative [transform-style:preserve-3d]",
          // Only apply transition when mounted (suppresses first-paint animation).
          // 600ms with --ease-emphasized gives a deliberate "card flipping in
          // space" motion that feels intentional, not jumpy.
          mounted &&
            "[transition:transform_600ms_var(--ease-emphasized)]",
        )}
        style={{
          transform: isFront ? "rotateY(0deg)" : "rotateY(180deg)",
          willChange: isFlipping ? "transform" : undefined,
        }}
        data-mounted={mounted ? "true" : "false"}
        data-flipping={isFlipping ? "true" : undefined}
      >
        {/* Front face */}
        <div
          ref={frontRef}
          aria-hidden={!isFront}
          inert={!isFront || undefined}
          className={cn(
            "relative [backface-visibility:hidden] [transform-style:preserve-3d]",
            !isFront && "pointer-events-none",
          )}
        >
          <Card
            className={cn(
              "relative overflow-hidden",
              "border-border bg-surface",
            )}
          >
            {front}
          </Card>
        </div>

        {/* Back face — pre-rotated 180deg */}
        <div
          ref={backRef}
          className={cn(
            "absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden] [transform-style:preserve-3d]",
            isFront && "pointer-events-none",
          )}
          aria-hidden={isFront}
          inert={isFront || undefined}
        >
          <Card
            className={cn(
              "relative h-full overflow-hidden",
              "border-border bg-surface",
            )}
          >
            {back}
          </Card>
        </div>
      </div>

      {/* Trigger pill — clean, premium "Stats" / "Summary" toggle in the
          top-right. Shifted inside the card so it sits above the content
          without occupying its own row. The label switches to mirror what
          a tap will do next. */}
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        onClick={toggleFace}
        className={cn(
          "absolute right-4 top-4 z-20",
          "inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface px-3 py-1.5",
          "text-xs font-medium text-text-secondary",
          "transition-[background-color,border-color,color,transform] duration-default ease-standard",
          "hover:border-border-strong hover:bg-surface-hover hover:text-text-primary",
          "active:scale-[0.97]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        )}
      >
        <FlipGlyph flipped={!isFront} className="text-accent" />
        <span>{isFront ? "Stats" : "Summary"}</span>
      </button>
    </section>
  );
}

export type { FoldingCardFace, FoldingCardProps };
