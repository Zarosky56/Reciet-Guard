import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Premium button system.
 *
 * - Primary: layered gradient background with a soft inner highlight + hover glow.
 * - Secondary: elevated surface with a subtle inner hairline and a hover brightness lift.
 * - Ghost: pure text action that settles into a translucent hover state.
 * - Danger: calm-red accent with consistent interaction weight.
 *
 * All variants share the same focus ring, press spring, and duration tokens.
 */
const buttonVariants = cva(
  cn(
    "group/btn relative inline-flex select-none cursor-pointer items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "data-[loading=true]:disabled:opacity-100",
    "[&_svg[data-icon]]:h-4 [&_svg[data-icon]]:w-4 [&_svg[data-icon]]:shrink-0",
  ),
  {
    variants: {
      variant: {
        default: cn(
          "bg-action-strong text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_1px_0_rgba(0,0,0,0.2)]",
          "bg-[linear-gradient(180deg,#6a96ff_0%,#3b82f6_100%)]",
          "hover:shadow-glow-action hover:brightness-[1.06]",
          "before:pointer-events-none before:absolute before:inset-0 before:-z-0 before:bg-gradient-to-b before:from-white/15 before:to-transparent before:opacity-0 before:transition-opacity hover:before:opacity-100",
        ),
        secondary: cn(
          "border border-border bg-surface text-text-primary shadow-inner-hair",
          "hover:border-border-strong hover:bg-surface-hover",
        ),
        ghost: cn(
          "text-text-secondary",
          "hover:bg-white/[0.04] hover:text-text-primary",
        ),
        danger: cn(
          "border border-red-500/30 bg-red-500/10 text-danger",
          "hover:border-red-500/45 hover:bg-red-500/15",
        ),
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
