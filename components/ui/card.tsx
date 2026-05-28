import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Card — single solid surface fill, single border, no shadow at rest, no
 * gradient overlay. Cards opt into interactivity via `data-interactive="true"`,
 * which enables a hover state that brightens the border and lifts the card
 * by 2px. The transition is transform-only at `--motion-default`; resting
 * (non-interactive) cards do not animate.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        "data-[interactive=true]:transition-transform data-[interactive=true]:duration-default data-[interactive=true]:ease-standard",
        "data-[interactive=true]:hover:-translate-y-0.5 data-[interactive=true]:hover:border-border-strong",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
