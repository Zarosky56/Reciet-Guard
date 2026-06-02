import { Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type ReminderPreset = "smart" | "minimal" | "urgent";

const PRESETS: Array<{
  id: ReminderPreset;
  title: string;
  description: string;
  thresholds: number[];
}> = [
  {
    id: "smart",
    title: "Smart default",
    description: "20d, 7d, 3d, 1d, due today",
    thresholds: [20, 7, 3, 1, 0],
  },
  {
    id: "minimal",
    title: "Minimal",
    description: "7d and 1d only",
    thresholds: [7, 1],
  },
  {
    id: "urgent",
    title: "Urgent only",
    description: "1d and due today",
    thresholds: [1, 0],
  },
];

export function thresholdsForReminderPreset(preset: ReminderPreset) {
  return PRESETS.find((item) => item.id === preset)?.thresholds ?? PRESETS[0].thresholds;
}

export function StepReminders({
  value,
  onChange,
}: {
  value: ReminderPreset;
  onChange: (preset: ReminderPreset) => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <Clock className="mx-auto size-10 text-accent" aria-hidden="true" />
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-text-primary">
            Choose reminder rhythm
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Keep alerts useful. You can tune this later from settings.
          </p>
        </div>

        <div className="grid gap-2">
          {PRESETS.map((preset) => {
            const selected = value === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.id)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-16 items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-[background-color,border-color,transform] duration-default ease-standard active:scale-[0.985]",
                  selected
                    ? "border-accent bg-accent-tint"
                    : "border-border bg-surface hover:bg-surface-hover",
                )}
              >
                <span>
                  <span className="block text-sm font-semibold text-text-primary">
                    {preset.title}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">
                    {preset.description}
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
