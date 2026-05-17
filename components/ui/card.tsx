import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Premium card — subtle inner highlight and elevated gradient top so the card
 * reads as a physical surface, not a flat div. Interactive cards opt into
 * `data-interactive` and gain hover lift + border brighten.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative rounded-card border border-border bg-surface bg-card-elevated shadow-card-sm",
        "transition-[transform,border-color,box-shadow] duration-200 ease-out",
        "data-[interactive=true]:hover:-translate-y-0.5 data-[interactive=true]:hover:border-border-strong data-[interactive=true]:hover:shadow-card-lift",
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
  return <div className={cn("p-5 pb-0", className)} {...props} />;
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
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}
