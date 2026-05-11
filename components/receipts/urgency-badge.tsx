import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Urgency } from "@/types/receipt";

interface UrgencyBadgeProps {
  urgency: Urgency;
  daysRemaining: number | null;
  status?: string;
}

export function UrgencyBadge({
  urgency,
  daysRemaining,
  status = "active",
}: UrgencyBadgeProps) {
  if (status !== "active") {
    return (
      <Badge className="border-border bg-bg text-text-secondary">
        <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
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

  return (
    <Badge
      className={cn(
        urgency === "green" &&
          "border-emerald-500/30 bg-emerald-500/10 text-success",
        urgency === "yellow" &&
          "border-amber-500/30 bg-amber-500/10 text-warning",
        urgency === "red" &&
          "animate-pulse-red border-red-500/30 bg-red-500/10 text-danger",
      )}
    >
      <AlertTriangle className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}
