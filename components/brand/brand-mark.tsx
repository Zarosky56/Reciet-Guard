import type { SVGProps } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * BrandMark — Receipt Guardian's typographic brand mark.
 *
 * Renders the slab-serif "R" mark from `public/brand/mark.svg` as inline SVG
 * so it inherits `currentColor` from its parent. There is no tile, halo,
 * gradient, or shadow around the mark — it is intended to sit flush next to
 * the wordmark per the redesigned brand identity.
 *
 * Size tokens map to the documented brand-mark sizes (24 / 28 / 32 px).
 *
 * Pass `aria-label` when the mark is the only thing communicating the brand
 * (e.g. a logo-only header link). Omit it when the mark sits next to a visible
 * wordmark — the SVG will be marked decorative (`aria-hidden`) automatically.
 */
const sizeMap = {
  sm: 24,
  md: 28,
  lg: 32,
} as const;

export type BrandMarkSize = keyof typeof sizeMap;

export interface BrandMarkProps
  extends Omit<
    SVGProps<SVGSVGElement>,
    "width" | "height" | "viewBox" | "fill" | "fillRule" | "aria-label"
  > {
  size?: BrandMarkSize;
  "aria-label"?: string;
  className?: string;
}

export function BrandMark({
  size = "md",
  "aria-label": ariaLabel,
  className,
  ...props
}: BrandMarkProps) {
  const px = sizeMap[size];
  const isDecorative = !ariaLabel;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      role={isDecorative ? undefined : "img"}
      aria-hidden={isDecorative ? true : undefined}
      aria-label={isDecorative ? undefined : ariaLabel}
      className={cn("inline-block shrink-0", className)}
      {...props}
    >
      <path d="M4 3 H17 V10 H15 V11 H8 V21 H4 Z M8 6 H14 V9 H8 Z" />
      <path d="M8 11 H12 L19 21 H15 Z" />
    </svg>
  );
}
