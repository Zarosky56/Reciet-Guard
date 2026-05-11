"use client";

import { Clock, DollarSign, Edit3, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UrgencyBadge } from "@/components/receipts/urgency-badge";
import type { ReceiptWithUrgency } from "@/types/receipt";

interface ReceiptCardProps {
  receipt: ReceiptWithUrgency;
  onEdit: (receipt: ReceiptWithUrgency) => void;
  onDelete: (receipt: ReceiptWithUrgency) => void;
  onStatusChange: (receipt: ReceiptWithUrgency, status: string) => void;
}

function formatMoney(price: number | null, currency: string | null) {
  if (price === null) {
    return "Price unknown";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
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

export function ReceiptCard({
  receipt,
  onEdit,
  onDelete,
  onStatusChange,
}: ReceiptCardProps) {
  return (
    <Card>
      <CardContent className="relative p-4">
        <div className="absolute right-4 top-4">
          <UrgencyBadge
            urgency={receipt.urgency}
            daysRemaining={receipt.days_remaining}
            status={receipt.status}
          />
        </div>
        <div className="pr-24">
          <h3 className="line-clamp-2 text-base font-medium text-text-primary">
            {receipt.item_name ?? "Unnamed item"}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {receipt.store_name ?? "Unknown store"}
          </p>
        </div>

        <div className="mt-5 grid gap-2 text-sm">
          <div className="flex items-center gap-2 font-mono text-text-primary">
            <DollarSign className="h-4 w-4 text-action" aria-hidden="true" />
            {formatMoney(receipt.price, receipt.currency)}
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="h-4 w-4 text-text-muted" aria-hidden="true" />
            Purchased {formatDate(receipt.purchase_date)}
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="h-4 w-4 text-text-muted" aria-hidden="true" />
            Return by {formatDate(receipt.return_deadline)}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(receipt)}>
            <Edit3 className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          {(["active", "returned", "kept", "expired"] as const).map((status) => (
            <Button
              key={status}
              type="button"
              variant={receipt.status === status ? "default" : "ghost"}
              size="sm"
              onClick={() => onStatusChange(receipt, status)}
            >
              {status}
            </Button>
          ))}
          <Button type="button" variant="danger" size="sm" onClick={() => onDelete(receipt)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
