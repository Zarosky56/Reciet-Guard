import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Skeleton primitive (redesigned).
 * Static single-color fill — no shimmer animation, no indeterminate loop.
 * Per design system: bg-surface-hover at rest, rounded-sm.
 */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-sm bg-surface-hover", className)}
      {...props}
    />
  );
}
