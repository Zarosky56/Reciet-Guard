import { Bell, Check, Mail, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type NotificationPreference = "email_and_app" | "email_only" | "quiet";

const OPTIONS: Array<{
  id: NotificationPreference;
  title: string;
  description: string;
  icon: typeof Bell;
}> = [
  {
    id: "email_and_app",
    title: "Email and app alerts",
    description: "Best for return windows you do not want to miss.",
    icon: Smartphone,
  },
  {
    id: "email_only",
    title: "Email only",
    description: "Quiet default for most users.",
    icon: Mail,
  },
  {
    id: "quiet",
    title: "No app alerts now",
    description: "You can enable alerts later from settings.",
    icon: Bell,
  },
];

export function StepNotifications({
  value,
  onChange,
}: {
  value: NotificationPreference;
  onChange: (preference: NotificationPreference) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <Bell className="mx-auto size-10 text-accent" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-text-primary">
            Pick how alerts reach you
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            We explain app notifications before the browser asks for access.
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
      </div>
    </div>
  );
}
