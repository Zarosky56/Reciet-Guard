import { Check, Inbox, Mail, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type GmailSetupChoice = "setup_now" | "manual_first" | "skip";

const OPTIONS: Array<{
  id: GmailSetupChoice;
  title: string;
  description: string;
  icon: typeof Mail;
}> = [
  {
    id: "setup_now",
    title: "Set up Gmail import",
    description: "Connect read-only access after this setup.",
    icon: Inbox,
  },
  {
    id: "manual_first",
    title: "Use AI paste first",
    description: "Paste an order email without connecting Gmail.",
    icon: Sparkles,
  },
  {
    id: "skip",
    title: "Skip for later",
    description: "Manual entry and upload still work.",
    icon: Mail,
  },
];

export function StepGmailImport({
  value,
  onChange,
}: {
  value: GmailSetupChoice;
  onChange: (choice: GmailSetupChoice) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <Mail className="mx-auto size-10 text-accent" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-text-primary">
            Decide how inbox import starts
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Gmail access is separate from Google sign-in and only requested when you choose import.
          </p>
        </div>

        <div className="grid gap-2">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onChange(option.id)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-16 items-center gap-3 rounded-md border px-4 py-3 text-left transition-[background-color,border-color,transform] duration-default ease-standard active:scale-[0.985]",
                  selected
                    ? "border-accent bg-accent-tint"
                    : "border-border bg-surface hover:bg-surface-hover",
                )}
              >
                <Icon className="size-5 shrink-0 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text-primary">
                    {option.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">
                    {option.description}
                  </span>
                </span>
                {selected && <Check className="size-4 shrink-0 text-success" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs leading-5 text-text-muted">
          The app scans only recent receipt-like emails from approved senders.
        </p>
      </div>
    </div>
  );
}
