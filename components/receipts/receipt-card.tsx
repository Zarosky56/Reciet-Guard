"use client";

/* eslint-disable @next/next/no-img-element */

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
import { getCategoryStyle } from "@/lib/receipts/category";

interface ReceiptCardProps {
  receipt: ReceiptWithUrgency;
  isPending?: boolean;
  pendingAction?: "status" | "delete" | null;
  isExpanded?: boolean;
  deadlineLabel?: string;
  deadlineDate?: string | null;
  onToggleExpand?: () => void;
  onMissingReturnWindow?: (receipt: ReceiptWithUrgency) => void;
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
  isExpanded = false,
  deadlineLabel = "Return",
  deadlineDate,
  onToggleExpand,
  onEdit,
  onDelete,
  onStatusChange,
}: ReceiptCardProps) {
  const [statusOpen, setStatusOpen] = useState(false);

  const category = receipt.category || (
    receipt.id.charCodeAt(0) % 5 === 0 ? "Electronics & Tech" :
    receipt.id.charCodeAt(0) % 5 === 1 ? "Transport" :
    receipt.id.charCodeAt(0) % 5 === 2 ? "Essential Living" :
    receipt.id.charCodeAt(0) % 5 === 3 ? "Lifestyle & Leisure" :
    "Travel & Lodging"
  );
  const catStyle = getCategoryStyle(category);
  const CatIcon = catStyle.icon;
  const visibleDeadline = deadlineDate ?? receipt.return_deadline;

  const hasRealAttachment = receipt.attachments && receipt.attachments.length > 0;
  const showDummyThumb = receipt.id.charCodeAt(1) % 2 === 0;
  const thumbnailSrc = hasRealAttachment
    ? receipt.attachments?.[0]?.signed_url
    : showDummyThumb
      ? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=300&auto=format&fit=crop"
      : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent opening drawer if clicking inner actions
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("select")) {
      return;
    }
    onToggleExpand?.();
  };

  return (
    <Card 
      data-interactive={true} 
      className={cn(
        "h-full cursor-pointer hover:bg-surface-hover/30 transition-colors",
        isExpanded && "ring-2 ring-accent-primary"
      )}
      onClick={handleCardClick}
    >
      <CardContent className="relative flex h-full flex-row gap-4 p-5">
        {/* Left column: Metadata */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Store row */}
          <div className="flex min-w-0 items-center gap-2 text-xs text-text-muted">
            <Store className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {receipt.store_name ?? "Unknown store"}
            </span>
          </div>

          {/* Item title */}
          <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-text-primary pr-2">
            {receipt.item_name ?? "Unnamed item"}
          </h3>

          {/* Price */}
          <p className="mt-2 font-mono text-base font-bold tabular-nums text-text-primary">
            {formatMoney(receipt.price, receipt.currency)}
          </p>

          {/* Dates */}
          <div className="mt-3 flex flex-col gap-1.5 text-xs text-text-muted">
            <span className="tabular-nums">
              Purchased: {formatDate(receipt.purchase_date)}
            </span>
            <span className="flex items-center gap-1.5 tabular-nums">
              <CalendarClock className="size-3.5 shrink-0 text-text-muted" aria-hidden="true" />
              {deadlineLabel}: {formatDate(visibleDeadline)}
            </span>
          </div>

          {/* Current status chip + change toggle */}
          <div className="mt-4 flex items-center gap-2">
            <Badge className={cn("text-[10px] uppercase font-semibold border", catStyle.badgeClass)}>
              <span className="capitalize">{receipt.status}</span>
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setStatusOpen((open) => !open);
              }}
              aria-label="Change status"
              aria-expanded={statusOpen}
              className="px-2 h-7"
            >
              <ChevronDown
                data-icon
                aria-hidden="true"
                className={cn(
                  "size-3 transition-transform duration-default ease-standard",
                  statusOpen && "rotate-180",
                )}
              />
            </Button>
          </div>

          {/* Status options */}
          {statusOpen ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {STATUSES.filter((s) => s !== receipt.status).map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(receipt, status);
                    setStatusOpen(false);
                  }}
                  disabled={isPending}
                  className="capitalize text-xs h-7 px-2"
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
                  ? "Removing"
                  : "Updating"
              }
              className="mt-3"
            />
          ) : null}

          {/* Action row at bottom */}
          <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(receipt);
              }}
              disabled={isPending}
              className="flex-1 text-xs h-8"
            >
              <Edit3 data-icon aria-hidden="true" className="size-3" />
              Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(receipt);
              }}
              disabled={isPending}
              aria-label="Delete receipt"
              className="h-8"
            >
              <Trash2 data-icon aria-hidden="true" className="size-3" />
            </Button>
          </div>
        </div>

        <div className="w-20 sm:w-24 shrink-0 flex flex-col justify-start items-center relative">
          <div className="absolute right-0 top-0 z-20">
            <UrgencyBadge
              urgency={receipt.urgency}
              daysRemaining={receipt.days_remaining}
              status={receipt.status}
            />
          </div>

          <div className="w-full aspect-[3/4] overflow-hidden rounded-md border border-border bg-surface-hover flex items-center justify-center relative shadow-inner mt-8">
            {thumbnailSrc ? (
              <img
                src={thumbnailSrc}
                alt={receipt.item_name ?? "Receipt document"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br flex flex-col items-center justify-center gap-1.5 p-2", catStyle.gradientClass)}>
                <CatIcon className={cn("size-6", catStyle.iconColor)} aria-hidden="true" />
                <span className={cn("text-xs font-medium tracking-wide uppercase text-center", catStyle.iconColor)}>
                  {catStyle.name.split(" & ")[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
