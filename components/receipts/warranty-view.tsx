"use client";

import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";

import { ReceiptCard } from "@/components/receipts/receipt-card";
import { ReceiptListRow } from "@/components/receipts/receipt-list-row";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, type ReceiptCategory } from "@/lib/receipts/category";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";

type WarrantyDensity = "grid" | "list";

interface WarrantyViewProps {
  receipts: ReceiptWithUrgency[];
  isLoading: boolean;
  search: string;
  selectedCategory: ReceiptCategory | "all";
  density: WarrantyDensity;
  isBusy?: boolean;
  pendingAction?: "status" | "delete" | null;
  onEdit: (receipt: ReceiptWithUrgency) => void;
  onReviewEdit?: (receipt: ReceiptWithUrgency) => void;
  onDelete: (receipt: ReceiptWithUrgency) => void;
  onStatusChange: (receipt: ReceiptWithUrgency, status: ReceiptStatus) => void;
}

function receiptCategory(receipt: ReceiptWithUrgency) {
  if (receipt.category) return receipt.category;
  const categories = Object.keys(CATEGORIES) as ReceiptCategory[];
  return categories[receipt.id.charCodeAt(0) % categories.length];
}

function warrantyDaysRemaining(deadline: string | null) {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

function asWarrantyReceipt(receipt: ReceiptWithUrgency): ReceiptWithUrgency {
  const days = warrantyDaysRemaining(receipt.warranty_deadline);
  return {
    ...receipt,
    days_remaining: days,
    urgency:
      days === null || days > 30 ? "green" : days <= 7 ? "red" : "yellow",
  };
}

function matchesWarrantySearch(receipt: ReceiptWithUrgency, term: string) {
  if (!term) return true;
  return `${receipt.store_name ?? ""} ${receipt.item_name ?? ""} ${receipt.category ?? ""}`
    .toLowerCase()
    .includes(term);
}

function WarrantyGroup({
  title,
  receipts,
  density,
  isBusy,
  pendingAction,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  title: string;
  receipts: ReceiptWithUrgency[];
  density: WarrantyDensity;
  isBusy: boolean;
  pendingAction: "status" | "delete" | null;
  onEdit: (receipt: ReceiptWithUrgency) => void;
  onDelete: (receipt: ReceiptWithUrgency) => void;
  onStatusChange: (receipt: ReceiptWithUrgency, status: ReceiptStatus) => void;
}) {
  if (receipts.length === 0) return null;

  return (
    <section className="grid min-w-0 gap-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {title}
          </h2>
        </div>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {receipts.length}
        </span>
      </div>

      {density === "list" ? (
        <ul className="overflow-hidden rounded-lg border border-border bg-surface">
          {receipts.map((receipt) => (
            <ReceiptListRow
              key={receipt.id}
              receipt={receipt}
              isPending={isBusy}
              pendingAction={pendingAction}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {receipts.map((receipt) => (
            <ReceiptCard
              key={receipt.id}
              receipt={receipt}
              deadlineLabel="Warranty"
              deadlineDate={receipt.warranty_deadline}
              isPending={isBusy}
              pendingAction={pendingAction}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function WarrantyView({
  receipts,
  isLoading,
  search,
  selectedCategory,
  density,
  isBusy = false,
  pendingAction = null,
  onEdit,
  onReviewEdit,
  onDelete,
  onStatusChange,
}: WarrantyViewProps) {
  const editReviewReceipt = onReviewEdit ?? onEdit;
  const { tracked, review } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matching = receipts.filter((receipt) => {
      if (
        selectedCategory !== "all" &&
        receiptCategory(receipt) !== selectedCategory
      ) {
        return false;
      }
      return matchesWarrantySearch(receipt, term);
    });

    const trackedItems = matching
      .filter((receipt) => Boolean(receipt.warranty_deadline))
      .map(asWarrantyReceipt)
      .sort(
        (a, b) =>
          (a.days_remaining ?? Infinity) - (b.days_remaining ?? Infinity),
      );

    const reviewItems = matching
      .filter((receipt) => !receipt.warranty_deadline)
      .sort((a, b) => {
        const left = a.purchase_date ?? a.created_at;
        const right = b.purchase_date ?? b.created_at;
        return right.localeCompare(left);
      });

    return { tracked: trackedItems, review: reviewItems };
  }, [receipts, search, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (tracked.length === 0 && review.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center text-center">
          <ShieldCheck
            className="size-10 text-text-muted"
            aria-hidden="true"
          />
          <h2 className="mt-4 text-base font-medium text-text-primary">
            No warranty matches
          </h2>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            Try changing the search or category filter. Products without a
            warranty deadline appear in review when they match.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <WarrantyGroup
        title="Warranty tracked"
        receipts={tracked}
        density={density}
        isBusy={isBusy}
        pendingAction={pendingAction}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />

      {review.length > 0 ? (
      <section className="grid gap-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              In review
            </h2>
          </div>
          <span className="font-mono text-xs tabular-nums text-text-muted">
            {review.length}
          </span>
        </div>

        {density === "list" ? (
            <ul className="overflow-hidden rounded-lg border border-border bg-surface">
              {review.map((receipt) => (
                <ReceiptListRow
                  key={receipt.id}
                  receipt={receipt}
                  isPending={isBusy}
                  pendingAction={pendingAction}
                  onEdit={editReviewReceipt}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              ))}
            </ul>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {review.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  deadlineLabel="Warranty"
                  deadlineDate={receipt.warranty_deadline}
                  isPending={isBusy}
                  pendingAction={pendingAction}
                  onToggleExpand={() => editReviewReceipt(receipt)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          )}
      </section>
      ) : null}
    </div>
  );
}
