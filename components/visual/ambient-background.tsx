import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

interface AmbientBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "hero" | "auth" | "app";
}

/**
 * Subtle atmospheric background. Fixed, GPU-light, never animates.
 * Used once per page. Never stacks.
 */
export function AmbientBackground({
  variant = "app",
  className,
  ...props
}: AmbientBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
      {...props}
    >
      {variant === "hero" ? (
        <>
          <div className="absolute inset-0 bg-scene-hero" />
          <div className="absolute inset-x-0 top-0 h-[520px] bg-grid-faint mask-fade-radial opacity-60" />
        </>
      ) : null}
      {variant === "auth" ? (
        <>
          <div className="absolute inset-0 bg-scene-auth" />
          <div className="absolute inset-x-0 top-0 h-[360px] bg-grid-faint mask-fade-radial opacity-40" />
        </>
      ) : null}
      {variant === "app" ? (
        <>
          <div className="absolute inset-0 bg-bg" />
          <div className="absolute inset-x-0 -top-40 h-[380px] bg-aurora-soft opacity-70" />
        </>
      ) : null}
    </div>
  );
}
