import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Urgency } from "@/types/receipt";

interface UrgencyBadgeProps {
  urgency: Urgency;
  daysRemaining: number | null;
  status?: string;
  pulse?: boolean;
}

export function UrgencyBadge({
  urgency,
  daysRemaining,
  status = "active",
  pulse = false,
}: UrgencyBadgeProps) {
  if (status !== "active") {
    return (
      <Badge className="border-border bg-bg-elevated text-text-secondary">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        {status}
      </Badge>
    );
  }

  const label =
    daysRemaining === null
      ? "review"
      : daysRemaining < 0
        ? "expired"
        : daysRemaining === 0
          ? "today"
          : `${daysRemaining}d`;

  const Icon = urgency === "red" ? AlertTriangle : Clock;

  return (
    <Badge
      className={cn(
        "relative",
        urgency === "green" &&
          "border-emerald-500/25 bg-emerald-500/10 text-success",
        urgency === "yellow" &&
          "border-amber-500/30 bg-amber-500/10 text-warning",
        urgency === "red" &&
          cn(
            "border-red-500/35 bg-red-500/10 text-danger",
            pulse && "animate-pulse-red",
          ),
      )}
    >
      {urgency === "red" && pulse ? (
        <span
          aria-hidden="true"
          className="absolute -inset-0.5 -z-10 rounded-md bg-red-500/30 blur-md"
        />
      ) : null}
      <Icon className="size-3" aria-hidden="true" />
      <span className="font-mono tabular-nums">{label}</span>
    </Badge>
  );
}
