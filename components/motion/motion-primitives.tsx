"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

/**
 * Premium motion primitives.
 *
 * Tasteful, not flashy. Every animation respects prefers-reduced-motion.
 * Durations, easings, and distances are tuned to feel Linear/Framer-grade.
 */

export const premiumEase = [0.22, 1, 0.36, 1] as const;
export const smoothEase = [0.65, 0, 0.35, 1] as const;

/** Fade-in with a small upward drift. Ideal for page sections. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: premiumEase,
      delay: 0.04 * i,
    },
  }),
};

/** Quick scale-fade for small chrome elements. */
export const softFade: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: premiumEase },
  },
};

/** Container used to stagger children without orchestrating explicit delays. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

export interface FadeInProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  as?: "div" | "section" | "article" | "header" | "main" | "span";
}

/**
 * Single-element fade-in-up that respects reduced motion.
 * Use to lift individual sections or cards into view.
 */
export function FadeIn({
  children,
  delay = 0,
  y = 10,
  duration = 0.5,
  as = "div",
  ...props
}: FadeInProps) {
  const reduce = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  if (reduce) {
    return <Component {...props}>{children}</Component>;
  }

  return (
    <Component
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: premiumEase, delay }}
      {...props}
    >
      {children}
    </Component>
  );
}

export interface StaggerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  stagger?: number;
  delay?: number;
}

/** Stagger wrapper — use inside a layout where children are StaggerItem. */
export function Stagger({
  children,
  stagger = 0.06,
  delay = 0.04,
  ...props
}: StaggerProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <motion.div {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  y?: number;
}

export function StaggerItem({ children, y = 12, ...props }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: premiumEase },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Premium hover card — lifts on hover, scales down on press.
 * Respects reduced motion. Perfect for interactive list cards.
 */
export interface HoverLiftProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  lift?: number;
}

export function HoverLift({ children, lift = 2, ...props }: HoverLiftProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <motion.div {...props}>{children}</motion.div>;
  }

  return (
    <motion.div
      whileHover={{ y: -lift }}
      whileTap={{ y: 0, scale: 0.995 }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
