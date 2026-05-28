"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion";
import type { ReactNode } from "react";

/**
 * Motion primitives — Phase 4 cleanup (task 11.3).
 *
 * The single canonical export is `<Reveal>`. The legacy `<FadeIn>`,
 * `<Stagger>`, `<StaggerItem>`, `<HoverLift>` re-exports — kept as
 * deprecated shims through Phase 2/3 so consumers continued to type-
 * check while screens migrated — were deleted in this phase. The
 * `premiumEase` re-export was deleted in the same change; consumers
 * inline the ease tuple locally where they still drive a one-off
 * framer-motion transition.
 *
 * `<Reveal>` animates `opacity` 0→1 and a small upward y-translate on
 * mount using transform/opacity only, durations and easings pulled
 * from the design tokens (`--motion-default`, `--ease-standard`)
 * defined in `app/globals.css`. Reduced-motion users render the
 * children with no animation.
 *
 * Implements: Requirements 6.7, 13.8 (deprecated motion primitives
 * removed). Spec: design.md → "Motion tokens".
 */

/**
 * Standard easing curve = `--ease-standard` (`cubic-bezier(0.2, 0, 0, 1)`).
 * Exposed as a tuple so framer-motion `transition.ease` can consume it.
 */
const standardEase = [0.2, 0, 0, 1] as const;

/**
 * Default duration in seconds matching `--motion-default` (220ms).
 * framer-motion's `transition.duration` is expressed in seconds.
 */
const defaultDurationSeconds = 0.22;

/** Y-translate offset (px) used for the canonical `<Reveal>` slide-in. */
const defaultYOffsetPx = 8;

export interface RevealProps extends HTMLMotionProps<"div"> {
  /** Content to reveal. */
  children: ReactNode;
  /** Delay before the reveal animation starts, in seconds. */
  delay?: number;
  /** Optional className forwarded to the underlying motion element. */
  className?: string;
  /**
   * HTML element to render via framer-motion. Defaults to `"div"`.
   * Accepts any framer-motion-supported intrinsic element key.
   */
  as?: keyof typeof motion;
}

/**
 * `<Reveal>` — the single motion primitive of the redesign.
 *
 * Animates `opacity` 0→1 and a small upward y-translate on mount.
 * Uses transform/opacity only (no layout properties), the
 * `--motion-default` duration, and the `--ease-standard` easing curve.
 * Honours `prefers-reduced-motion`: reduced-motion users render the
 * children with no entrance animation.
 *
 * @example
 *   <Reveal delay={0.08}>
 *     <Card>...</Card>
 *   </Reveal>
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  if (reduce) {
    return (
      <Component className={className} {...props}>
        {children}
      </Component>
    );
  }

  return (
    <Component
      initial={{ opacity: 0, y: defaultYOffsetPx }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: defaultDurationSeconds,
        ease: standardEase,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
