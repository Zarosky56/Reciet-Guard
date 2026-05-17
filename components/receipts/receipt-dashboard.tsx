"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Inbox,
  MailSearch,
  Plus,
  ReceiptText,
  Search,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

import {
  FadeIn,
  Stagger,
  StaggerItem,
  premiumEase,
} from "@/components/motion/motion-primitives";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { ReceiptCard } from "@/components/receipts/receipt-card";
import { ReceiptEmptyState } from "@/components/receipts/receipt-empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { ActionLoader, ButtonLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";

type ReceiptFormState = {
  store_name: string;
  item_name: string;
  price: string;
  currency: string;
  purchase_date: string;
  return_deadline: string;
  warranty_deadline: string;
  status: ReceiptStatus;
};

const emptyForm: ReceiptFormState = {
  store_name: "",
  item_name: "",
  price: "",
  currency: "USD",
  purchase_date: "",
  return_deadline: "",
  warranty_deadline: "",
  status: "active",
};

interface ReceiptDashboardProps {
  initialReceipts: ReceiptWithUrgency[];
  forwardingAddress: string;
}

function toForm(receipt: ReceiptWithUrgency): ReceiptFormState {
  return {
    store_name: receipt.store_name ?? "",
    item_name: receipt.item_name ?? "",
    price: receipt.price === null ? "" : String(receipt.price),
    currency: receipt.currency ?? "USD",
    purchase_date: receipt.purchase_date ?? "",
    return_deadline: receipt.return_deadline ?? "",
    warranty_deadline: receipt.warranty_deadline ?? "",
    status: receipt.status,
  };
}

function toPayload(form: ReceiptFormState) {
  return {
    store_name: form.store_name,
    item_name: form.item_name,
    price: form.price,
    currency: form.currency || "USD",
    purchase_date: form.purchase_date || null,
    return_deadline: form.return_deadline || null,
    warranty_deadline: form.warranty_deadline || null,
    status: form.status,
  };
}

type FilterKey = "all" | "active" | "soon" | "expired" | "closed";
type PendingAction =
  | { type: "inbox" }
  | { type: "extract" }
  | { type: "create" }
  | { type: "update" }
  | { type: "status"; receiptId: string }
  | { type: "delete"; receiptId: string }
  | null;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "soon", label: "Due soon" },
  { key: "expired", label: "Expired" },
  { key: "closed", label: "Closed" },
];

export function ReceiptDashboard({
  initialReceipts,
  forwardingAddress,
}: ReceiptDashboardProps) {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [form, setForm] = useState<ReceiptFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailText, setEmailText] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const isBusy = isPending || pendingAction !== null;
  const isInboxPending = pendingAction?.type === "inbox";
  const isExtractPending = pendingAction?.type === "extract";
  const editorPendingVariant =
    pendingAction?.type === "create"
      ? "save"
      : pendingAction?.type === "update"
        ? "update"
        : null;

  function runPending(
    action: NonNullable<PendingAction>,
    task: () => Promise<void>,
  ) {
    setPendingAction(action);
    startTransition(async () => {
      try {
        await task();
      } finally {
        setPendingAction(null);
      }
    });
  }

  // Global "/" to focus search — familiar Linear/Vercel shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || editorOpen) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      const isEditing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable;
      if (isEditing) return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorOpen]);

  const filteredReceipts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const byFilter = receipts.filter((receipt) => {
      if (filter === "all") return true;
      if (filter === "active") return receipt.status === "active";
      if (filter === "soon")
        return (
          receipt.status === "active" &&
          receipt.days_remaining !== null &&
          receipt.days_remaining >= 0 &&
          receipt.days_remaining <= 3
        );
      if (filter === "expired")
        return (
          receipt.status === "active" &&
          receipt.days_remaining !== null &&
          receipt.days_remaining < 0
        );
      if (filter === "closed") return receipt.status !== "active";
      return true;
    });

    if (!term) return byFilter;

    return byFilter.filter((receipt) =>
      `${receipt.store_name ?? ""} ${receipt.item_name ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [filter, receipts, search]);

  const stats = useMemo(() => {
    const active = receipts.filter((receipt) => receipt.status === "active");
    const expiringSoon = active.filter(
      (receipt) =>
        receipt.days_remaining !== null &&
        receipt.days_remaining >= 0 &&
        receipt.days_remaining <= 3,
    );
    const moneyAtRisk = active.reduce(
      (total, receipt) => total + (receipt.price ?? 0),
      0,
    );

    return {
      total: receipts.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      moneyAtRisk,
    };
  }, [receipts]);

  const firstPulsedReceiptId = useMemo(() => {
    return (
      filteredReceipts.find(
        (receipt) =>
          receipt.status === "active" &&
          receipt.urgency === "red" &&
          receipt.days_remaining !== null &&
          receipt.days_remaining >= 0,
      )?.id ?? null
    );
  }, [filteredReceipts]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(false);
  }

  function openEditor(initial?: ReceiptFormState, id?: string | null) {
    setForm(initial ?? emptyForm);
    setEditingId(id ?? null);
    setEditorOpen(true);
  }

  function submitReceipt() {
    runPending({ type: editingId ? "update" : "create" }, async () => {
      const response = await fetch(
        editingId ? `/api/receipts/${editingId}` : "/api/receipts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(form)),
        },
      );
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(json?.error?.message ?? "Receipt could not be saved.");
        return;
      }

      const updated = json.receipt as ReceiptWithUrgency;
      setReceipts((current) => {
        const withoutUpdated = current.filter(
          (receipt) => receipt.id !== updated.id,
        );
        return [...withoutUpdated, updated].sort((a, b) => {
          const left = a.days_remaining ?? 9999;
          const right = b.days_remaining ?? 9999;
          return left - right;
        });
      });
      toast.success(editingId ? "Receipt updated" : "Receipt created");
      resetForm();
    });
  }

  function extractEmail() {
    if (emailText.trim().length < 20) {
      toast.error("Paste more of the order email first.");
      return;
    }

    runPending({ type: "extract" }, async () => {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || json.status !== "success") {
        toast.warning("Extraction needs review. You can enter it manually.");
        return;
      }

      openEditor({
        store_name: json.data.store_name ?? "",
        item_name: json.data.item_name ?? "",
        price: json.data.price === null ? "" : String(json.data.price),
        currency: json.data.currency ?? "USD",
        purchase_date: json.data.purchase_date ?? "",
        return_deadline: json.data.return_deadline ?? "",
        warranty_deadline: json.data.warranty_deadline ?? "",
        status: "active",
      });
      toast.success(`Extracted with ${json.provider}`);
    });
  }

  function checkGmailNow() {
    runPending({ type: "inbox" }, async () => {
      const response = await fetch("/api/gmail/check-now", {
        method: "POST",
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(json?.error?.message ?? "Gmail check failed.");
        return;
      }

      const successCount = json.summary?.success ?? 0;
      const needsReviewCount = json.summary?.needs_review ?? 0;
      const failedCount = json.summary?.failed ?? 0;
      const unknownSenderCount = json.summary?.unknown_sender ?? 0;
      const checkedCount = json.checked ?? 0;
      if (successCount > 0) {
        const refresh = await fetch("/api/receipts");
        const refreshed = await refresh.json().catch(() => null);
        if (refresh.ok && Array.isArray(refreshed?.receipts)) {
          setReceipts(refreshed.receipts);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Imported ${successCount} receipt${successCount === 1 ? "" : "s"}`,
        );
        return;
      }

      if (needsReviewCount > 0) {
        const firstReviewError = json.results?.find(
          (result: { status?: string }) => result.status === "needs_review",
        )?.error;
        toast.warning(
          firstReviewError ??
            `${needsReviewCount} email${needsReviewCount === 1 ? "" : "s"} need review.`,
        );
        return;
      }

      if (failedCount > 0 || unknownSenderCount > 0) {
        toast.warning("Inbox checked, but no receipt could be imported.");
        return;
      }

      toast.success(
        checkedCount > 0
          ? "Inbox checked. No new receipts imported."
          : `No recent emails found from ${json.userEmail ?? "your account"}.`,
      );
    });
  }

  function updateReceiptStatus(
    receipt: ReceiptWithUrgency,
    status: ReceiptStatus,
  ) {
    runPending({ type: "status", receiptId: receipt.id }, async () => {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(json?.error?.message ?? "Status could not be updated.");
        return;
      }

      setReceipts((current) =>
        current.map((item) => (item.id === receipt.id ? json.receipt : item)),
      );
    });
  }

  function deleteReceipt(receipt: ReceiptWithUrgency) {
    runPending({ type: "delete", receiptId: receipt.id }, async () => {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error("Receipt could not be deleted.");
        return;
      }

      setReceipts((current) =>
        current.filter((item) => item.id !== receipt.id),
      );
      toast.success("Receipt deleted");
    });
  }

  const moneyAtRiskDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(stats.moneyAtRisk);

  return (
    <div className="grid gap-8 py-8 md:py-10">
      {/* Hero block: money at risk + intake */}
      <FadeIn duration={0.5}>
        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-aurora-action opacity-80"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-grid-faint mask-fade-bottom opacity-40"
          />
          <CardContent className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1.25fr_1fr]">
            <div className="flex flex-col">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-text-secondary shadow-inner-hair">
                <Wallet className="size-3" aria-hidden="true" />
                Money at risk
              </span>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <span className="font-mono text-[40px] font-semibold leading-none tracking-[-0.025em] text-text-primary tabular-nums sm:text-5xl md:text-6xl">
                  {moneyAtRiskDisplay}
                </span>
                {stats.expiringSoon > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-warning">
                    <AlertTriangle
                      className="size-3"
                      aria-hidden="true"
                    />
                    {stats.expiringSoon} due soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-success">
                    <CheckCircle2
                      className="size-3"
                      aria-hidden="true"
                    />
                    All calm
                  </span>
                )}
              </div>
              <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
                Active receipts across {stats.total} tracked items. Forward or
                paste any order email to add more.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={checkGmailNow}
                  disabled={isBusy}
                  data-loading={isInboxPending ? "true" : undefined}
                >
                  {isInboxPending ? (
                    <ButtonLoader variant="inbox" />
                  ) : (
                    <Inbox data-icon aria-hidden="true" />
                  )}
                  {isInboxPending ? "Scanning inbox" : "Check inbox now"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => openEditor()}
                  disabled={isBusy}
                >
                  <Plus data-icon aria-hidden="true" />
                  Add receipt
                </Button>
              </div>
              {isInboxPending ? (
                <ActionLoader
                  variant="inbox"
                  compact
                  className="mt-4 max-w-md"
                />
              ) : null}
            </div>

            <div className="flex flex-col justify-center">
              <CopyForwardingAddress address={forwardingAddress} />

              <div className="mt-4 grid grid-cols-3 gap-2">
                <StatMini label="Total" value={String(stats.total)} />
                <StatMini label="Active" value={String(stats.active)} />
                <StatMini label="Due soon" value={String(stats.expiringSoon)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* AI Extraction block */}
      <FadeIn delay={0.08} duration={0.5}>
        <Card>
          <CardContent className="grid gap-5 p-6 md:p-7">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-action shadow-inner-hair">
                <Sparkles className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
                  Paste an order email
                </h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  AI extracts fields into the editor for your review before
                  saving.
                </p>
              </div>
            </div>

            <label className="grid gap-2 text-sm font-medium text-text-primary">
              <span className="sr-only">Order email body</span>
              <Textarea
                value={emailText}
                onChange={(event) => setEmailText(event.target.value)}
                placeholder="Paste an anonymized order email..."
                className="min-h-36"
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-text-muted">
                Your email is processed only for this extraction.
              </p>
              <Button
                type="button"
                onClick={extractEmail}
                disabled={isBusy}
                data-loading={isExtractPending ? "true" : undefined}
              >
                {isExtractPending ? (
                  <ButtonLoader variant="extract" />
                ) : (
                  <MailSearch data-icon aria-hidden="true" />
                )}
                {isExtractPending ? "Extracting fields" : "Extract fields"}
              </Button>
            </div>
            {isExtractPending ? <ActionLoader variant="extract" compact /> : null}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Receipts list */}
      <FadeIn delay={0.14} duration={0.5}>
        <section className="grid gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-action shadow-inner-hair">
                <ReceiptText className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                  Receipts
                </h2>
                <p className="text-xs text-text-muted">
                  {filteredReceipts.length} shown · {stats.total} total
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative w-full sm:w-72">
                <span className="sr-only">Search receipts</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search store or item..."
                  className="pl-9 pr-14"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex"
                >
                  <kbd className="rounded-md border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] leading-none text-text-muted">
                    /
                  </kbd>
                </span>
              </label>
            </div>
          </div>

          {/* Segmented filters */}
          <div className="-mx-1 overflow-x-auto">
            <div className="flex min-w-max items-center gap-1 rounded-xl border border-border bg-surface/60 p-1 shadow-inner-hair">
              {FILTERS.map((f) => {
                const isActive = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={isActive}
                    className={cn(
                      "relative inline-flex h-8 items-center rounded-lg px-3 text-[12.5px] font-medium transition-colors duration-200",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      isActive
                        ? "text-text-primary"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="filter-active"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 34,
                          mass: 0.6,
                        }}
                        className="absolute inset-0 -z-10 rounded-lg bg-bg-elevated shadow-inner-hair"
                      />
                    ) : null}
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredReceipts.length > 0 ? (
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredReceipts.map((receipt) => (
                <StaggerItem key={receipt.id}>
                  <ReceiptCard
                    receipt={receipt}
                    isPending={isBusy}
                    pendingAction={
                      pendingAction?.type === "status" &&
                      pendingAction.receiptId === receipt.id
                        ? "status"
                        : pendingAction?.type === "delete" &&
                            pendingAction.receiptId === receipt.id
                          ? "delete"
                          : null
                    }
                    pulseUrgency={receipt.id === firstPulsedReceiptId}
                    onEdit={(item) =>
                      openEditor(toForm(item), item.id)
                    }
                    onDelete={deleteReceipt}
                    onStatusChange={updateReceiptStatus}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          ) : receipts.length === 0 ? (
            <ReceiptEmptyState forwardingAddress={forwardingAddress} />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Search
                  className="size-6 text-text-muted"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm font-medium text-text-primary">
                  No matching receipts
                </p>
                <p className="mt-1 max-w-sm text-xs text-text-secondary">
                  Try clearing the search or changing the filter.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </FadeIn>

      {/* Editor drawer / sheet */}
      <ReceiptEditorSheet
        open={editorOpen}
        editing={Boolean(editingId)}
        isBusy={isBusy}
        pendingVariant={editorPendingVariant}
        form={form}
        onChange={setForm}
        onSubmit={submitReceipt}
        onClose={resetForm}
      />
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated/60 p-3 shadow-inner-hair">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className="mt-1.5 font-mono text-lg font-semibold text-text-primary tabular-nums">
        {value}
      </p>
    </div>
  );
}

function ReceiptEditorSheet({
  open,
  editing,
  isBusy,
  pendingVariant,
  form,
  onChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  editing: boolean;
  isBusy: boolean;
  pendingVariant: "save" | "update" | null;
  form: ReceiptFormState;
  onChange: (form: ReceiptFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  function setField<K extends keyof ReceiptFormState>(
    key: K,
    value: ReceiptFormState[K],
  ) {
    onChange({ ...form, [key]: value });
  }

  // Close with Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="editor-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={onClose}
          role="presentation"
        >
          <motion.aside
            key="editor-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.28, ease: premiumEase }}
            className="relative w-full max-w-2xl overflow-hidden rounded-t-card-lg border border-border bg-surface shadow-card-lift sm:rounded-card-lg"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-editor-title"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-action shadow-inner-hair">
                  <Plus className="size-[16px]" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="receipt-editor-title"
                    className="text-[15px] font-semibold tracking-tight text-text-primary"
                  >
                    {editing ? "Edit receipt" : "Add receipt"}
                  </h2>
                  <p className="text-xs text-text-muted">
                    Review AI fields or enter a receipt manually.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close editor"
              >
                <X data-icon aria-hidden="true" />
              </Button>
            </div>

            <form
              className="max-h-[75vh] overflow-y-auto px-5 py-5 sm:px-6"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              {pendingVariant ? (
                <ActionLoader
                  variant={pendingVariant}
                  compact
                  className="mb-4"
                />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Store">
                  <Input
                    value={form.store_name}
                    onChange={(event) =>
                      setField("store_name", event.target.value)
                    }
                    placeholder="Nike"
                  />
                </Field>
                <Field label="Item">
                  <Input
                    value={form.item_name}
                    onChange={(event) =>
                      setField("item_name", event.target.value)
                    }
                    placeholder="Air Max Shoes"
                  />
                </Field>
                <Field label="Price">
                  <Input
                    value={form.price}
                    onChange={(event) =>
                      setField("price", event.target.value)
                    }
                    inputMode="decimal"
                    placeholder="89.99"
                  />
                </Field>
                <Field label="Currency">
                  <Input
                    value={form.currency}
                    onChange={(event) =>
                      setField("currency", event.target.value.toUpperCase())
                    }
                    maxLength={3}
                    placeholder="USD"
                  />
                </Field>
                <Field label="Purchase date">
                  <Input
                    value={form.purchase_date}
                    onChange={(event) =>
                      setField("purchase_date", event.target.value)
                    }
                    type="date"
                  />
                </Field>
                <Field label="Return deadline">
                  <Input
                    value={form.return_deadline}
                    onChange={(event) =>
                      setField("return_deadline", event.target.value)
                    }
                    type="date"
                  />
                </Field>
                <Field label="Warranty deadline">
                  <Input
                    value={form.warranty_deadline}
                    onChange={(event) =>
                      setField("warranty_deadline", event.target.value)
                    }
                    type="date"
                  />
                </Field>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setField("status", event.target.value as ReceiptStatus)
                    }
                    className="h-10 rounded-lg border border-border bg-bg-elevated px-3 text-sm text-text-primary shadow-inner-hair outline-none transition focus:border-action/70 focus:shadow-[0_0_0_4px_rgba(91,140,255,0.12)] focus-visible:outline-none"
                  >
                    <option value="active">active</option>
                    <option value="returned">returned</option>
                    <option value="kept">kept</option>
                    <option value="expired">expired</option>
                  </select>
                </Field>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-border/70 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isBusy}
                  data-loading={pendingVariant ? "true" : undefined}
                >
                  {pendingVariant ? (
                    <ButtonLoader variant={pendingVariant} />
                  ) : null}
                  {pendingVariant
                    ? editing
                      ? "Saving changes"
                      : "Creating receipt"
                    : editing
                      ? "Save changes"
                      : "Create receipt"}
                </Button>
              </div>
            </form>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-[13px] font-medium text-text-primary">
      {label}
      {children}
    </label>
  );
}
