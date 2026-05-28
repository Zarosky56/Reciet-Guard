import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Premium UI Redesign — `<Badge>` primitive (task 5.4).
 *
 * Single solid fill, single border, no glow, no animation by default.
 * The four variants are keyed to semantic tokens:
 *
 *   - `default` — neutral chip on `bg-accent-tint` with the accent text
 *     color. Used for selected/active state, generic counts, and the
 *     non-active receipt-status fallback in `<UrgencyBadge>`.
 *   - `success` / `warning` / `danger` — semantic chips that lean on
 *     the semantic text color and a tinted border. Background stays on
 *     `bg-surface` so semantic tokens are not multiplied through inline
 *     opacity (Requirement 2.6 forbids `bg-action/10`-style opacity-on-
 *     token expressions for tinted backgrounds; the bordered semantic
 *     chip is the design system's pre-tokenized substitute).
 *
 * The `attention` keyframe is gated to `variant="danger"` AND the
 * internal `pulse` flag set by `<UrgencyBadge>` for expired urgency.
 * No other call site is permitted to opt into the pulse — this is the
 * one documented attention signal per Requirement 6.4.
 *
 * Reduced-motion users skip the pulse via the global
 * `prefers-reduced-motion: reduce` clamp in `app/globals.css`. The pulse
 * also honours the `data-reduced-motion="static"` static-swap selector
 * registered in `globals.css`, so a node forced into static mode renders
 * without the animation.
 *
 * Implements: Requirements 6.4, 8.2, 11.7. Spec: design.md "Badge".
 */
const badgeVariants = cva(
  cn(
    "inline-flex items-center gap-1 rounded-xs border px-2 py-0.5",
    // Caption step — `text-xs` (0.75rem / 1rem) matches `--text-caption`
    // until the typography primitive ships in a later task.
    "text-xs font-medium leading-none tracking-wide",
    "h-6",
  ),
  {
    variants: {
      variant: {
        default: "border-border bg-accent-tint text-accent",
        success: "border-success bg-surface text-success",
        warning: "border-warning bg-surface text-warning",
        danger: "border-danger bg-surface text-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Internal opt-in to the `attention` keyframe. Only applies when
   * `variant="danger"`. Set by `<UrgencyBadge>` for the expired-red
   * state (Requirement 11.7); not intended as a public hook.
   */
  pulse?: boolean;
}

export function Badge({
  className,
  variant,
  pulse = false,
  ...props
}: BadgeProps) {
  const shouldPulse = pulse && variant === "danger";
  return (
    <span
      data-reduced-motion={shouldPulse ? "static" : undefined}
      className={cn(
        badgeVariants({ variant }),
        shouldPulse && "animate-attention",
        className,
      )}
      {...props}
    />
  );
}
