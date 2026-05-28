import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Urgency } from "@/types/receipt";

/**
 * Premium UI Redesign — `<UrgencyBadge>` (task 8.4 / 11.3).
 *
 * Renders a status badge that always combines color WITH a text label
 * AND an `<svg>` icon (Requirement 11.7). The redesigned `<Badge>`
 * primitive owns the visual tokens; this wrapper only chooses the
 * variant and icon, and gates the `attention` pulse to expired-red
 * urgencies.
 *
 * Variant mapping:
 *   - non-active receipt status (`returned`, `kept`, `expired`) → `default`
 *     chip with the status label and a `CheckCircle2` icon.
 *   - active + green urgency  → `success` chip + `Clock` icon.
 *   - active + yellow urgency → `warning` chip + `Clock` icon.
 *   - active + red urgency    → `danger` chip + `AlertTriangle` icon.
 *
 * The `attention` keyframe (defined in `tailwind.config.ts`, gated by
 * the `[data-reduced-motion="static"]` selector in `globals.css`) is
 * the one documented attention signal per Requirement 6.4. It fires
 * automatically when the receipt is active, the urgency is red, AND
 * the receipt has expired (`daysRemaining !== null && daysRemaining < 0`).
 *
 * Phase 4 cleanup (task 11.3) removed the parent-controlled `pulse`
 * override prop. The dashboard previously passed `pulse={true}` to scope
 * the attention signal to a single expired-red receipt; that override
 * was unused in practice (every expired-red receipt is by definition the
 * critical attention target on the screen) and Requirement 6.4 is now
 * satisfied by the internal expired-red gate alone. The `pulseUrgency`
 * prop on `<ReceiptCard>` and the `firstPulsedReceiptId` selection in
 * `<ReceiptDashboard>` are removed in the same change. Migration note
 * filed in the COMPONENT_PATTERNS.md migration log (task 12.3).
 *
 * Implements: Requirements 6.4, 8.2, 8.9, 11.7, 14.7. Spec: design.md
 * → "Badge".
 */

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
      <Badge>
        <CheckCircle2 className="size-3" aria-hidden="true" />
        <span className="capitalize">{status}</span>
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

  const variant =
    urgency === "red"
      ? "danger"
      : urgency === "yellow"
        ? "warning"
        : "success";

  const Icon = urgency === "red" ? AlertTriangle : Clock;

  // Attention pulse fires only on expired-red — never on a future-dated
  // red urgency, never on yellow/green. The `<Badge>` primitive itself
  // enforces `variant === "danger"` before applying the keyframe.
  const isExpired = daysRemaining !== null && daysRemaining < 0;
  const shouldPulse = variant === "danger" && isExpired;

  return (
    <Badge variant={variant} pulse={shouldPulse}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="font-mono tabular-nums">{label}</span>
    </Badge>
  );
}
