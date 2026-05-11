import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none transition placeholder:text-text-muted focus:border-border-focus",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-32 rounded-lg border border-border bg-bg p-3 text-sm leading-6 text-text-primary outline-none transition placeholder:text-text-muted focus:border-border-focus",
        className,
      )}
      {...props}
    />
  );
}
