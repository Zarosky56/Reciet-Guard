import { Inbox, MailCheck, Sparkles } from "lucide-react";

import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { Card, CardContent } from "@/components/ui/card";
import { Grid } from "@/components/ui/grid";

/**
 * Premium UI Redesign — `<ReceiptEmptyState>` (task 8.4).
 *
 * Implements the redesigned empty-state pattern from
 * `design-system/COMPONENT_PATTERNS.md` (§3 → "Pattern: Empty State
 * Card") and design.md §"Composition patterns":
 *
 *   - `<Card>` with `border-dashed` (visually distinct from populated
 *     cards),
 *   - centered icon at `icon-lg` (`text-text-muted`, no decorative
 *     tile per Requirement 7.4),
 *   - title at `title-sm`, description at `body` width-constrained,
 *   - no `bg-aurora-soft` overlay, no `border-conic-soft` halo, no
 *     `shadow-inner-hair`, no `bg-bg-elevated`, no glow.
 *
 * The educational 3-step strip uses the redesigned `<Grid cols={3}
 * gap="card">` primitive (Requirement 4.5) — no one-off
 * `grid-cols-[…]` declarations, no nested decorative tiles.
 *
 * Implements: Requirements 6.4, 8.8, 11.7, 13.5.
 */

interface ReceiptEmptyStateProps {
  forwardingAddress: string;
}

const steps = [
  {
    icon: MailCheck,
    title: "Forward an order email",
    text: "Send it to the intake address below.",
  },
  {
    icon: Sparkles,
    title: "AI prefills the fields",
    text: "You review and save the receipt.",
  },
  {
    icon: Inbox,
    title: "Get one quiet nudge",
    text: "Three days before a return window closes.",
  },
];

export function ReceiptEmptyState({
  forwardingAddress,
}: ReceiptEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center text-center">
        <Inbox
          className="size-10 text-text-muted"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-base font-medium text-text-primary">
          No receipts yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-text-secondary">
          Forward an order email from the address you signed up with, or paste
          one into the extraction box above.
        </p>

        <div className="mt-5 w-full max-w-xl">
          <CopyForwardingAddress address={forwardingAddress} />
        </div>

        <Grid cols={3} gap="card" className="mt-8 w-full max-w-3xl text-left">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-md border border-border bg-canvas p-4"
              >
                <div className="flex items-center gap-2 text-text-muted">
                  <StepIcon
                    className="size-4 text-accent"
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs tabular-nums">
                    0{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-text-primary">
                  {step.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {step.text}
                </p>
              </div>
            );
          })}
        </Grid>
      </CardContent>
    </Card>
  );
}
