import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Field primitives — Input and Textarea share a single base ruleset derived
 * from the redesigned token system (Phase 2, task 5.9).
 *
 * Resting  → bg-canvas, 1px border-border, radius-sm
 * Hover    → border-border-strong
 * Focus    → border-border-focus + 1px outline at 1px offset (no shadow halo)
 * Disabled → opacity-50, no pointer events
 * Invalid  → border-danger via `aria-invalid="true"` or `data-invalid="true"`
 *
 * No 4px shadow halo, no inner-hair shadow, no glow, no gradient fill.
 * Validates Requirements 8.1, 8.2, 8.5, 11.3.
 */
const fieldBase = cn(
  "rounded-sm border border-border bg-canvas text-sm text-text-primary outline-none",
  "transition-colors duration-default ease-standard",
  "placeholder:text-text-muted",
  "hover:border-border-strong",
  "focus:border-border-focus focus:outline focus:outline-1 focus:outline-offset-1 focus:outline-border-focus",
  "focus-visible:border-border-focus focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-border-focus",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-danger data-[invalid=true]:border-danger",
);

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(fieldBase, "h-10 px-3", className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(fieldBase, "min-h-32 p-3 leading-6", className)}
      {...props}
    />
  );
});
