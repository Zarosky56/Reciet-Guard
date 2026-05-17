import Image, { type ImageProps } from "next/image";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Avatar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex size-20 shrink-0 overflow-hidden rounded-full border border-border bg-surface text-text-primary",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  alt,
  sizes = "96px",
  ...props
}: Omit<ImageProps, "fill">) {
  return (
    <Image
      alt={alt}
      fill
      sizes={sizes}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center font-mono text-xl font-semibold",
        className,
      )}
      {...props}
    />
  );
}
