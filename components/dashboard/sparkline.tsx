"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils/cn";

/**
 * `<Sparkline>` — minimal inline SVG sparkline with optional
 * "draw" entrance animation.
 *
 * Single 1.75px stroke, single fill, no gradient, no glow. Color is
 * inherited from `currentColor` so consumers control hue with a
 * standard text utility (`text-text-muted`, `text-accent`).
 *
 * When `animate` is true, the line uses framer-motion's `pathLength`
 * to draw itself in from the start point, and the endpoint dot fades
 * in after the line completes — the canonical premium line-chart
 * entrance. Reduced-motion users see the path at final state with
 * no transition (framer-motion respects `prefers-reduced-motion`).
 */

interface SparklineProps {
  /** Series values. Must contain at least 2 entries. */
  values: number[];
  /** Optional className for sizing / color (e.g. `text-text-muted h-8 w-32`). */
  className?: string;
  /** Optional accessible label. Defaults to `aria-hidden`. */
  label?: string;
  /** Whether to highlight the last data point with a small accent dot. */
  highlightLast?: boolean;
  /**
   * When true, the path draws itself in over `--motion-emphasized`
   * timing. When false (default), the path renders at final state
   * with no animation. Consumers gate this on a "visible" flag tied
   * to a flip / mount / scroll-in event.
   */
  animate?: boolean;
}

const emphasizedEase = [0.3, 0, 0.1, 1] as const;
const standardEase = [0.2, 0, 0, 1] as const;

export function Sparkline({
  values,
  className,
  label,
  highlightLast = true,
  animate = false,
}: SparklineProps) {
  if (values.length < 2) {
    return null;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = 100 / (values.length - 1);

  // Project values into 0..100 space, inverted (SVG y grows down).
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = 100 - ((v - min) / range) * 100;
    return { x, y };
  });

  // Smooth path with simple Catmull-Rom-ish midpoint smoothing.
  const path = points.reduce((acc, { x, y }, i) => {
    if (i === 0) {
      return `M ${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    const prev = points[i - 1];
    const midX = (prev.x + x) / 2;
    return `${acc} Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${midX.toFixed(2)} ${(
      (prev.y + y) /
      2
    ).toFixed(2)} T ${x.toFixed(2)} ${y.toFixed(2)}`;
  }, "");

  const last = points[points.length - 1];

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block", className)}
    >
      <motion.path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={animate ? { pathLength: 0 } : undefined}
        animate={animate ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.7, ease: emphasizedEase }}
      />
      {highlightLast ? (
        <motion.circle
          cx={last.x}
          cy={last.y}
          r="2.25"
          fill="currentColor"
          vectorEffect="non-scaling-stroke"
          initial={animate ? { opacity: 0, scale: 0 } : undefined}
          animate={animate ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.24, ease: standardEase, delay: 0.6 }}
        />
      ) : null}
    </svg>
  );
}
