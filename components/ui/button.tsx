import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Premium UI Redesign — `<Button>` primitive (task 5.7).
 *
 * Four variants × four sizes. No multi-stop gradients, no glow
 * shadows, no `before:` overlay pseudo-elements. Each variant uses a
 * single solid fill (or none) and conveys hover/focus/press/disabled
 * via tokenized color plus a non-color focus-ring outline.
 *
 * Variants:
 *   - `primary`   — solid accent on canvas text. The single primary
 *                   CTA per surface.
 *   - `secondary` — bordered surface chip. Default for non-primary
 *                   actions in cards and toolbars.
 *   - `ghost`     — text-only action. Settles into a translucent
 *                   surface-hover background on hover.
 *   - `danger`    — destructive action. Bordered surface at rest with
 *                   a tinted danger fill on hover.
 *
 * Phase 4 cleanup (task 11.3) removed the `default` CVA alias of
 * `primary`. Every consumer was migrated to `variant="primary"` (or
 * relies on the new `primary` default) before the alias was deleted.
 *
 * Focus-visible is a 2px outline at 2px offset — a non-color attribute
 * change so the focus signal is detectable independent of hue
 * (Requirement 11.3).
 *
 * Sizes:
 *   - `sm`      — 32px, inline use next to body text.
 *   - `default` — 40px, toolbar and card actions.
 *   - `lg`      — 48px, hero CTAs and form submits (≥44×44 directly).
 *   - `icon`    — 40×40 square, icon-only chrome buttons.
 *
 * Touch target (Requirement 11.6) — `lg` meets the 44×44 CSS-pixel
 * minimum directly. `default` and `icon` meet it when the parent adds
 * vertical padding (the dashboard toolbars and card footers do). `sm`
 * is intentionally below 44px for inline use; consumers that place
 * `sm` near a single touch target should pad the parent.
 *
 * Removed in this rebuild (vs. the pre-redesign primitive):
 *   - the `before:` gradient-overlay pseudo-element on `primary`,
 *   - the `shadow-glow-action` hover glow,
 *   - any `bg-[linear-gradient(...)]` multi-stop fill,
 *   - the `shadow-[inset_0_1px_0_...]` inner-hair surface highlight,
 *   - the hover `brightness-[1.06]` filter.
 *
 * Implements: Requirements 6.5, 8.1, 8.2, 8.3, 11.3, 11.6.
 * Spec: design.md → "Components and Interfaces" → "Button".
 */
const buttonVariants = cva(
  cn(
    "inline-flex select-none cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,border-color,color,transform] duration-default ease-standard",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
    "active:scale-[0.985]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    "data-[loading=true]:disabled:opacity-100",
    "[&_svg[data-icon]]:h-4 [&_svg[data-icon]]:w-4 [&_svg[data-icon]]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "border border-transparent bg-accent text-canvas",
          "hover:bg-accent-hover",
        ),
        secondary: cn(
          "border border-border bg-surface text-text-primary",
          "hover:border-border-strong hover:bg-surface-hover",
        ),
        ghost: cn(
          "border border-transparent bg-transparent text-text-secondary",
          "hover:bg-surface-hover hover:text-text-primary",
        ),
        danger: cn(
          "border border-danger/40 bg-surface text-danger",
          "hover:border-danger hover:bg-danger/10",
        ),
      },
      size: {
        sm: "h-8 rounded-sm px-3 text-xs",
        default: "h-10 rounded-md px-4 text-sm",
        lg: "h-12 rounded-md px-5 text-sm",
        icon: "size-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
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
