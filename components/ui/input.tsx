import {
  forwardRef,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils/cn";

const fieldBase = cn(
  "rounded-lg border border-border bg-bg-elevated text-sm text-text-primary outline-none",
  "shadow-inner-hair",
  "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
  "placeholder:text-text-muted",
  "hover:border-border-strong",
  "focus:border-action/70 focus:bg-bg-elevated focus:shadow-[0_0_0_4px_rgba(91,140,255,0.12)]",
  "focus-visible:outline-none",
  "disabled:pointer-events-none disabled:opacity-50",
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
