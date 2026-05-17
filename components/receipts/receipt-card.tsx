"use client";

import { CalendarClock, DollarSign, Edit3, Store, Trash2 } from "lucide-react";

import { HoverLift } from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardActionLoader } from "@/components/ui/loaders";
import { UrgencyBadge } from "@/components/receipts/urgency-badge";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";

interface ReceiptCardProps {
  receipt: ReceiptWithUrgency;
  isPending?: boolean;
  pendingAction?: "status" | "delete" | null;
  pulseUrgency?: boolean;
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
  pulseUrgency = false,
  onEdit,
  onDelete,
  onStatusChange,
}: ReceiptCardProps) {
  return (
    <HoverLift lift={2} className="h-full">
      <Card data-interactive="true" className="group/card h-full">
        <CardContent className="relative flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-text-muted">
              <Store className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {receipt.store_name ?? "Unknown store"}
              </span>
            </div>
            <UrgencyBadge
              urgency={receipt.urgency}
              daysRemaining={receipt.days_remaining}
              status={receipt.status}
              pulse={pulseUrgency}
            />
          </div>

          <h3 className="mt-3 line-clamp-2 text-[15px] font-medium leading-snug text-text-primary">
            {receipt.item_name ?? "Unnamed item"}
          </h3>

          <div className="mt-4 flex items-baseline gap-2">
            <DollarSign
              className="size-4 text-text-muted"
              aria-hidden="true"
            />
            <span className="font-mono text-lg font-semibold text-text-primary tabular-nums">
              {formatMoney(receipt.price, receipt.currency)}
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-bg-elevated/50 p-3 text-xs">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-text-muted">
                Purchased
              </dt>
              <dd className="mt-1 font-mono text-[12px] text-text-primary tabular-nums">
                {formatDate(receipt.purchase_date)}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-muted">
                <CalendarClock
                  className="size-3 shrink-0"
                  aria-hidden="true"
                />
                Return by
              </dt>
              <dd className="mt-1 font-mono text-[12px] text-text-primary tabular-nums">
                {formatDate(receipt.return_deadline)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-1.5">
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(receipt, status)}
                disabled={isPending}
                aria-pressed={receipt.status === status}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-medium capitalize tracking-wide transition-all duration-150",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                  "disabled:pointer-events-none disabled:opacity-50",
                  receipt.status === status
                    ? "border-action/40 bg-action/10 text-action shadow-inner-hair"
                    : "border-border bg-bg-elevated text-text-secondary hover:border-border-strong hover:text-text-primary",
                )}
              >
                {status}
              </button>
            ))}
          </div>

          {pendingAction ? (
            <CardActionLoader
              variant={pendingAction === "delete" ? "delete" : "update"}
              label={
                pendingAction === "delete"
                  ? "Removing receipt"
                  : "Updating status"
              }
            />
          ) : null}

          <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-4">
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
    </HoverLift>
  );
}
