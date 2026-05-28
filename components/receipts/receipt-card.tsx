"use client";

import {
  CalendarClock,
  ChevronDown,
  Edit3,
  Store,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { UrgencyBadge } from "@/components/receipts/urgency-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";

/**
 * Premium UI Redesign — `<ReceiptCard>` (task 8.4).
 *
 * Implements the documented data-card pattern (`COMPONENT_PATTERNS.md`
 * §3 → "Pattern: Data Card (Receipt)"):
 *
 *   - `<Card data-interactive={true}>` — opts into the redesigned hover
 *     lift (-translate-y-0.5 + border-border-strong, transform-only,
 *     `--motion-default`). No glow shadow, no `bg-card-elevated`
 *     overlay (Requirement 6.5, 8.1, 8.4).
 *   - The urgency badge is absolute-positioned in the top-right corner
 *     so the title group flows independently. The title group is
 *     padded-right (`pr-24`) to clear the badge.
 *   - Status chip uses the redesigned `<Badge>` primitive — no
 *     `bg-action/10`-style inline opacity (Requirement 2.6).
 *   - Pending state renders the redesigned `<Loader size="sm">` (the
 *     single coherent loading vocabulary, Requirement 6.8, 8.6).
 *   - Action row uses `<Button variant="secondary">` and
 *     `<Button variant="danger">`; no glow on either.
 *
 * Implements: Requirements 6.4, 6.5, 8.1, 8.2, 8.4, 11.7, 13.5.
 */

interface ReceiptCardProps {
  receipt: ReceiptWithUrgency;
  isPending?: boolean;
  pendingAction?: "status" | "delete" | null;
  onEdit: (receipt: ReceiptWithUrgency) => void;
  onDelete: (receipt: ReceiptWithUrgency) => void;
  onStatusChange: (receipt: ReceiptWithUrgency, status: ReceiptStatus) => void;
}

function safeCurrency(currency: string | null) {
  const candidate = currency ?? "USD";

  try {
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: candidate,
    }).format(1);
    return candidate;
  } catch {
    return "USD";
  }
}

function formatMoney(price: number | null, currency: string | null) {
  if (price === null) {
    return "Price unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: safeCurrency(currency),
  }).format(price);
}

function formatDate(date: string | null) {
  if (!date) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

const STATUSES = ["active", "returned", "kept", "expired"] as const;

export function ReceiptCard({
  receipt,
  isPending = false,
  pendingAction = null,
  onEdit,
  onDelete,
  onStatusChange,
}: ReceiptCardProps) {
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <Card data-interactive={true} className="h-full">
      <CardContent className="relative flex h-full flex-col">
        {/* Absolute-positioned urgency badge (data-card pattern). The
            title group reserves right padding to clear the badge. */}
        <div className="pointer-events-none absolute right-5 top-5">
          <UrgencyBadge
            urgency={receipt.urgency}
            daysRemaining={receipt.days_remaining}
            status={receipt.status}
          />
        </div>

        {/* Store row */}
        <div className="flex min-w-0 items-center gap-2 pr-24 text-xs text-text-muted">
          <Store className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {receipt.store_name ?? "Unknown store"}
          </span>
        </div>

        {/* Item title */}
        <h3 className="mt-2 line-clamp-1 pr-24 text-base font-medium leading-snug text-text-primary">
          {receipt.item_name ?? "Unnamed item"}
        </h3>

        {/* Price */}
        <p className="mt-2 font-mono text-base font-semibold tabular-nums text-text-primary">
          {formatMoney(receipt.price, receipt.currency)}
        </p>

        {/* Dates */}
        <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
          <span className="tabular-nums">
            {formatDate(receipt.purchase_date)}
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <CalendarClock className="size-3" aria-hidden="true" />
            {formatDate(receipt.return_deadline)}
          </span>
        </div>

        {/* Current status chip + change toggle */}
        <div className="mt-4 flex items-center gap-2">
          <Badge>
            <span className="capitalize">{receipt.status}</span>
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatusOpen((open) => !open)}
            aria-label="Change status"
            aria-expanded={statusOpen}
            className="px-2"
          >
            <ChevronDown
              data-icon
              aria-hidden="true"
              className={cn(
                "transition-transform duration-default ease-standard",
                statusOpen && "rotate-180",
              )}
            />
          </Button>
        </div>

        {/* Status options */}
        {statusOpen ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {STATUSES.filter((s) => s !== receipt.status).map((status) => (
              <Button
                key={status}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  onStatusChange(receipt, status);
                  setStatusOpen(false);
                }}
                disabled={isPending}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        ) : null}

        {pendingAction ? (
          <Loader
            size="sm"
            label={
              pendingAction === "delete"
                ? "Removing receipt"
                : "Updating status"
            }
            className="mt-3"
          />
        ) : null}

        {/* Action row */}
        <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(receipt)}
            disabled={isPending}
            className="flex-1"
          >
            <Edit3 data-icon aria-hidden="true" />
            Edit
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete(receipt)}
            disabled={isPending}
            aria-label="Delete receipt"
          >
            <Trash2 data-icon aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
