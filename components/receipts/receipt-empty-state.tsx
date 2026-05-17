import { Inbox, MailCheck, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";

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

export function ReceiptEmptyState({ forwardingAddress }: ReceiptEmptyStateProps) {
  return (
    <Card className="relative overflow-hidden border-dashed">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-20 h-64 bg-aurora-soft opacity-70"
      />
      <CardContent className="relative flex flex-col items-center px-6 py-14 text-center md:py-16">
        <span className="border-conic-soft relative flex size-14 items-center justify-center rounded-xl border border-border bg-bg-elevated text-action shadow-inner-hair">
          <Inbox className="size-6" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-xl font-semibold tracking-[-0.01em] text-text-primary md:text-2xl">
          No receipts yet
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
          Forward an order email from the address you signed up with, or paste
          one into the extraction box above.
        </p>

        <div className="mt-8 w-full max-w-xl">
          <CopyForwardingAddress address={forwardingAddress} />
        </div>

        <ul className="mt-10 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-lg border border-border/70 bg-bg-elevated/60 p-4 shadow-inner-hair"
            >
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md border border-border bg-bg text-action">
                  <step.icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="font-mono text-[11px] text-text-muted">
                  0{i + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-text-primary">
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                {step.text}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
