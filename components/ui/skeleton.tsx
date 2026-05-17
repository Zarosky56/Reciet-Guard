import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Premium skeleton loader with a subtle shimmer.
 * Uses overflow-hidden + absolute shimmer bar so it doesn't pulse harshly.
 */
export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-hover/60",
        className,
      )}
      {...props}
    >
      <span
        className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
      />
    </div>
  );
}
