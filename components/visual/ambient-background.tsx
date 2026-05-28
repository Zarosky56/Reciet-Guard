import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Public prop API for `<AmbientBackground>`.
 *
 * The redesign reduces the surface to two semantic variants:
 *
 *   - `"hero"` — a single tonal band at the top of the viewport. Used
 *     once on the landing hero.
 *   - `"off"`  — no DOM. Default for app pages and auth pages.
 *
 * The pre-redesign `"auth"` and `"app"` variants are intentionally kept
 * in the type so existing call sites continue to type-check during the
 * Phase 3 screen migrations. Both are treated as `"off"` internally and
 * render no DOM (Requirement 5.6, 13.9, 13.10).
 *
 * @see design-system/premium-ui-redesign/design.md — `AmbientBackground`
 */
interface AmbientBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "hero" | "off" | "auth" | "app";
}

// The mask declaration is the entire visual treatment: a single-color
// `bg-canvas-raised` fill faded out toward the bottom with a one-stop
// linear gradient mask. There is no perceptible gradient stop in the
// painted color itself — the gradient only drives opacity via
// `mask-image`. (Requirement 13.5: gradient ban exception.)
const HERO_BAND_MASK_STYLE: CSSProperties = {
  maskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 100%)",
};

/**
 * Subtle atmospheric background. Fixed, GPU-light, never animates.
 * Used once per page. Never stacks.
 *
 * The `"hero"` variant renders one tonal band — `bg-canvas-raised` with
 * a top-to-bottom alpha mask, capped at 320px tall — and nothing else:
 * no grid, no aurora, no overlay, no animation.
 *
 * Any other variant returns `null`.
 */
export function AmbientBackground({
  variant = "off",
  className,
  ...props
}: AmbientBackgroundProps) {
  if (variant !== "hero") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
      {...props}
    >
      <div
        data-decorative="true"
        className="absolute inset-x-0 top-0 h-80 bg-canvas-raised"
        style={HERO_BAND_MASK_STYLE}
      />
    </div>
  );
}
