"use client";

/* eslint-disable @next/next/no-img-element */

import {
  motion,
  useAnimation,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { AlertTriangle, CalendarClock, Edit3, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";
import { getCategoryStyle } from "@/lib/receipts/category";

/**
 *   - Days-remaining text in `text-danger` only when overdue;
 *     otherwise `text-text-primary`.
 *   - All other meta in `text-text-muted` so the eye reads the dot
 *     and the days-number first.
 *
 * Implements: Requirements 6.4, 6.5, 8.1, 8.2, 8.4, 11.7, 13.5.
 */

interface ReceiptListRowProps {
  receipt: ReceiptWithUrgency;
  isPending?: boolean;
  pendingAction?: "status" | "delete" | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onMissingReturnWindow?: (receipt: ReceiptWithUrgency) => void;
  onEdit: (receipt: ReceiptWithUrgency) => void;
  onDelete: (receipt: ReceiptWithUrgency) => void;
  onStatusChange: (receipt: ReceiptWithUrgency, status: ReceiptStatus) => void;
}

const STATUSES: ReadonlyArray<ReceiptStatus> = [
  "active",
  "returned",
  "kept",
  "expired",
];

const STATUS_LABELS: Record<ReceiptStatus, string> = {
  active: "Active",
  returned: "Returned",
  kept: "Kept",
  expired: "Expired",
};

// ---------------------------------------------------------------------------
// Drag thresholds
// ---------------------------------------------------------------------------

/** Distance past which a release commits the swipe action. */
const COMMIT_THRESHOLD_PX = 80;

/** Velocity past which a flick commits regardless of distance. */
const COMMIT_VELOCITY_PX_PER_S = 600;

/** Hard cap on drag travel — prevents the row from sliding off-screen. */
const MAX_DRAG_PX = 140;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeCurrency(currency: string | null) {
  const candidate = currency ?? "USD";
  try {
    new Intl.NumberFormat("en-US", { style: "currency", currency: candidate }).format(1);
    return candidate;
  } catch {
    return "USD";
  }
}

function formatMoney(price: number | null, currency: string | null) {
  if (price === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: safeCurrency(currency),
    maximumFractionDigits: 0,
  }).format(price);
}

function formatShortDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function urgencyDotClass(receipt: ReceiptWithUrgency) {
  if (receipt.status !== "active") return "bg-text-muted/40";
  if (receipt.urgency === "red") return "bg-danger";
  if (receipt.urgency === "yellow") return "bg-warning";
  return "bg-success";
}

function daysTextClass(receipt: ReceiptWithUrgency) {
  if (receipt.urgency === "red" && receipt.status === "active") {
    return "text-danger";
  }
  return "text-text-primary";
}

function daysLabel(receipt: ReceiptWithUrgency) {
  if (receipt.status !== "active") return null;
  if (receipt.days_remaining === null) return null;
  return `${receipt.days_remaining}d`;
}

export function ReceiptListRow({
  receipt,
  isPending = false,
  pendingAction = null,
  isExpanded = false,
  onToggleExpand,
  onMissingReturnWindow,
  onEdit,
  onDelete,
  onStatusChange,
}: ReceiptListRowProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const controls = useAnimation();
  const didDragRef = useRef(false);
  const [dragState, setDragState] = useState<"idle" | "edit" | "delete">("idle");

  // Reveal-area opacity tracks the drag distance so the action labels
  // fade in as the row slides. Inputs in CSS px on x; outputs in 0..1.
  const editOpacity = useTransform(x, [0, COMMIT_THRESHOLD_PX], [0, 1]);
  const deleteOpacity = useTransform(x, [-COMMIT_THRESHOLD_PX, 0], [1, 0]);

  const onDrag = useCallback((_e: unknown, info: PanInfo) => {
    const dx = info.offset.x;
    if (Math.abs(dx) > 8) didDragRef.current = true;
    if (dx > 16) setDragState("edit");
    else if (dx < -16) setDragState("delete");
    else setDragState("idle");
  }, []);

  const onDragEnd = useCallback(
    (_e: unknown, info: PanInfo) => {
      const dx = info.offset.x;
      const vx = info.velocity.x;
      const commitsRight = dx > COMMIT_THRESHOLD_PX || vx > COMMIT_VELOCITY_PX_PER_S;
      const commitsLeft = dx < -COMMIT_THRESHOLD_PX || vx < -COMMIT_VELOCITY_PX_PER_S;

      // Animate back to 0 in all cases — actions are decoupled from the
      // visual return so the row never lingers in a half-open state.
      controls.start({
        x: 0,
        transition: { type: "spring", stiffness: 600, damping: 40 },
      });
      setDragState("idle");
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 160);

      if (commitsRight) {
        onEdit(receipt);
      } else if (commitsLeft) {
        // Delete routes through the dashboard's existing confirm
        // dialog; this hands off cleanly without the row needing to
        // know about the confirmation state.
        onDelete(receipt);
      }
    },
    [controls, onDelete, onEdit, receipt],
  );

  const days = daysLabel(receipt);
  const missingReturnWindow =
    receipt.status === "active" && receipt.return_deadline === null;
  const otherStatuses = STATUSES.filter((status) => status !== receipt.status);
  const canToggle = !isPending && Boolean(onToggleExpand);

  function handleRowClick() {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (canToggle) {
      onToggleExpand?.();
    } else if (!isPending) {
      onEdit(receipt);
    }
  }

  const category = receipt.category || (
    receipt.id.charCodeAt(0) % 5 === 0 ? "Electronics & Tech" :
    receipt.id.charCodeAt(0) % 5 === 1 ? "Transport" :
    receipt.id.charCodeAt(0) % 5 === 2 ? "Essential Living" :
    receipt.id.charCodeAt(0) % 5 === 3 ? "Lifestyle & Leisure" :
    "Travel & Lodging"
  );
  const catStyle = getCategoryStyle(category);

  // Check attachments for a primary image, fall back to dummy mock images for demonstration
  const hasRealAttachment = receipt.attachments && receipt.attachments.length > 0;
  const showDummyThumb = receipt.id.charCodeAt(1) % 2 === 0;
  const thumbnailSrc = (hasRealAttachment && receipt.attachments)
    ? receipt.attachments[0].signed_url
    : showDummyThumb
      ? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=200&auto=format&fit=crop"
      : null;

  const CatIcon = catStyle.icon;

  return (
    <motion.li layout className="relative isolate">
      {/* Reveal layers — sit behind the draggable row. */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: editOpacity }}
        className={cn(
          "absolute inset-y-0 left-0 flex w-24 items-center pl-5",
          "bg-success/20 text-success",
        )}
      >
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
          <Edit3 className="size-4" aria-hidden="true" />
          Edit
        </span>
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: deleteOpacity }}
        className={cn(
          "absolute inset-y-0 right-0 flex w-24 items-center justify-end pr-5",
          "bg-danger/20 text-danger",
        )}
      >
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </span>
      </motion.div>

      {/* Draggable row content — sits above the reveal layers. */}
      <motion.div
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: -MAX_DRAG_PX, right: MAX_DRAG_PX }}
        dragElastic={0.1}
        dragDirectionLock
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={handleRowClick}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          handleRowClick();
        }}
        animate={controls}
        style={{ x }}
        role="button"
        tabIndex={isPending ? -1 : 0}
        aria-expanded={onToggleExpand ? isExpanded : undefined}
        aria-label={
          isExpanded
            ? `Collapse ${receipt.item_name ?? "receipt"} details`
            : `Show ${receipt.item_name ?? "receipt"} details`
        }
        className={cn(
          "group/row relative z-10 flex min-h-16 items-center gap-3 border-b border-border bg-surface px-4 py-3",
          "transition-colors duration-default ease-standard",
          // Hover state — desktop pointer-fine devices.
          "hover:bg-surface-hover focus-within:bg-surface-hover",
          // Tap-state hint while dragging
          "transition-colors duration-default ease-standard",
          // Hover state — desktop pointer-fine devices.
          "hover:bg-surface-hover focus-within:bg-surface-hover",
          // Tap-state hint while dragging
          dragState === "edit" && "shadow-overlay",
          dragState === "delete" && "shadow-overlay",
        )}
      >
        {/* Urgency dot */}
        <span
          aria-hidden="true"
          className={cn(
            "relative z-10 size-2 shrink-0 rounded-pill",
            urgencyDotClass(receipt),
          )}
        />

        {/* Thumbnail / Category Icon Column (List View Visual) */}
        <div className="relative z-10 w-9 h-11 shrink-0 overflow-hidden rounded-sm border border-border bg-surface-hover flex items-center justify-center">
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={receipt.item_name ?? "Receipt thumbnail"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className={cn("absolute inset-0 bg-gradient-to-br flex items-center justify-center", catStyle.gradientClass)}>
              <CatIcon className={cn("size-3.5", catStyle.iconColor)} aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Primary text block */}
        <div className="relative z-10 min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {receipt.item_name ?? "Unnamed item"}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted truncate mt-0.5">
            <span className="truncate">{receipt.store_name ?? "Unknown store"}</span>
            <span>·</span>
            <span className="tabular-nums">{formatShortDate(receipt.purchase_date)}</span>
            <span>·</span>
            <span className={cn("text-xs py-0.5 px-1 border rounded-xs capitalize font-normal shrink-0", catStyle.badgeClass)}>
              {catStyle.name.split(" & ")[0]}
            </span>
          </div>
        </div>

        {/* Right-side meta — days + price */}
        <div className="relative z-10 flex shrink-0 flex-col items-end">
          {days ? (
            <span
              className={cn(
                "font-mono text-sm tabular-nums",
                daysTextClass(receipt),
              )}
            >
              {days}
            </span>
          ) : missingReturnWindow ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onMissingReturnWindow?.(receipt);
              }}
              disabled={isPending || !onMissingReturnWindow}
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-xs border border-warning bg-surface px-2 py-0.5",
                "text-xs font-medium leading-none tracking-wide text-warning",
                "transition-colors duration-default ease-standard",
                "hover:bg-surface-hover",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              <AlertTriangle className="size-3" aria-hidden="true" />
              Set Return Window
            </button>
          ) : (
            <span className="text-xs uppercase tracking-wide text-text-muted">
              {receipt.status}
            </span>
          )}
          <span className="font-mono text-xs tabular-nums text-text-muted">
            {formatMoney(receipt.price, receipt.currency)}
          </span>
        </div>

        {/* Desktop hover-revealed action buttons — sit on top of the
            right-side meta on hover/focus-within. Mobile users reach
            the same actions via the swipe gestures above. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-y-0 right-2 z-20 hidden items-center gap-1 sm:flex",
            "opacity-0 transition-opacity duration-default ease-standard",
            "group-hover/row:opacity-100 group-hover/row:pointer-events-auto",
            "group-focus-within/row:opacity-100 group-focus-within/row:pointer-events-auto",
            "bg-surface-hover px-2",
          )}
          aria-hidden={true}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(receipt);
            }}
            disabled={isPending}
            aria-label="Edit receipt"
            tabIndex={-1}
          >
            <Edit3 data-icon aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(receipt);
            }}
            disabled={isPending}
            aria-label="Delete receipt"
            tabIndex={-1}
            className="text-danger hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 data-icon aria-hidden="true" />
          </Button>
        </div>

        {pendingAction ? (
          <Loader
            size="sm"
            label=""
            className="relative z-10 ml-2"
          />
        ) : null}
      </motion.div>

      {isExpanded ? (
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="border-b border-border bg-surface-hover px-4 py-4"
        >
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <CalendarClock className="size-3" aria-hidden="true" />
            <span>
              Returnable until{" "}
              <span className="tabular-nums text-text-primary">
                {formatDate(receipt.return_deadline)}
              </span>
            </span>
          </div>

          <div className="mt-3">
            <p className="text-xs text-text-muted">Mark as</p>
            <div
              role="group"
              aria-label="Mark receipt as"
              className="mt-1 flex flex-wrap items-center gap-1.5"
            >
              {otherStatuses.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onStatusChange(receipt, status)}
                  disabled={isPending}
                >
                  {STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(receipt)}
              disabled={isPending}
              className="text-danger hover:bg-danger/10 hover:text-danger"
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onEdit(receipt)}
              disabled={isPending}
            >
              Edit details
            </Button>
          </div>
        </motion.div>
      ) : null}
    </motion.li>
  );
}
