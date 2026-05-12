"use client";

import { Inbox, Loader2, MailSearch, Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { ReceiptCard } from "@/components/receipts/receipt-card";
import { ReceiptEmptyState } from "@/components/receipts/receipt-empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
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

export function ReceiptDashboard({
  initialReceipts,
  forwardingAddress,
}: ReceiptDashboardProps) {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ReceiptFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailText, setEmailText] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredReceipts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return receipts;
    }

    return receipts.filter((receipt) => {
      return `${receipt.store_name ?? ""} ${receipt.item_name ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [receipts, search]);

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

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function submitReceipt() {
    startTransition(async () => {
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
        const withoutUpdated = current.filter((receipt) => receipt.id !== updated.id);
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

    startTransition(async () => {
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

      setForm({
        store_name: json.data.store_name ?? "",
        item_name: json.data.item_name ?? "",
        price: json.data.price === null ? "" : String(json.data.price),
        currency: json.data.currency ?? "USD",
        purchase_date: json.data.purchase_date ?? "",
        return_deadline: json.data.return_deadline ?? "",
        warranty_deadline: json.data.warranty_deadline ?? "",
        status: "active",
      });
      setEditingId(null);
      toast.success(`Extracted with ${json.provider}`);
    });
  }

  function checkGmailNow() {
    startTransition(async () => {
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
        toast.success(`Imported ${successCount} receipt${successCount === 1 ? "" : "s"}`);
        return;
      }

      if (needsReviewCount > 0) {
        const firstReviewError = json.results?.find(
          (result: { status?: string }) => result.status === "needs_review",
        )?.error;
        toast.warning(firstReviewError ?? `${needsReviewCount} email${needsReviewCount === 1 ? "" : "s"} need review.`);
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

  function updateReceiptStatus(receipt: ReceiptWithUrgency, status: string) {
    startTransition(async () => {
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
    startTransition(async () => {
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

  return (
    <div className="grid gap-6 py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardContent className="p-5">
            <h1 className="text-2xl font-semibold text-text-primary">
              Your return dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Forward from the same email you signed up with, or paste an order
              email here and let AI prefill the receipt fields.
            </p>
            <div className="mt-5">
              <CopyForwardingAddress address={forwardingAddress} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={checkGmailNow}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Inbox className="h-4 w-4" aria-hidden="true" />
                )}
                Check Inbox Now
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total" value={String(stats.total)} />
          <StatCard label="Active" value={String(stats.active)} />
          <StatCard label="Soon" value={String(stats.expiringSoon)} />
          <StatCard
            label="At risk"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(stats.moneyAtRisk)}
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="grid gap-4 p-5">
            <div>
              <h2 className="text-base font-medium text-text-primary">
                Paste email extraction
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Extracted values fill the manual form for review before saving.
              </p>
            </div>
            <Textarea
              value={emailText}
              onChange={(event) => setEmailText(event.target.value)}
              placeholder="Paste an anonymized order email..."
              className="min-h-40"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={extractEmail} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MailSearch className="h-4 w-4" aria-hidden="true" />
                )}
                Extract fields
              </Button>
            </div>
          </CardContent>
        </Card>

        <ReceiptEditor
          form={form}
          editing={Boolean(editingId)}
          isPending={isPending}
          onChange={setForm}
          onSubmit={submitReceipt}
          onCancel={resetForm}
        />
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Receipts</h2>
          <label className="relative w-full md:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search receipts..."
              className="pl-9"
            />
          </label>
        </div>

        {filteredReceipts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredReceipts.map((receipt) => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onEdit={(item) => {
                  setEditingId(item.id);
                  setForm(toForm(item));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={deleteReceipt}
                onStatusChange={updateReceiptStatus}
              />
            ))}
          </div>
        ) : (
          <ReceiptEmptyState forwardingAddress={forwardingAddress} />
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase text-text-muted">
          {label}
        </p>
        <p className="mt-2 font-mono text-xl font-semibold text-text-primary">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ReceiptEditor({
  form,
  editing,
  isPending,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: ReceiptFormState;
  editing: boolean;
  isPending: boolean;
  onChange: (form: ReceiptFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  function setField<K extends keyof ReceiptFormState>(
    key: K,
    value: ReceiptFormState[K],
  ) {
    onChange({ ...form, [key]: value });
  }

  return (
    <Card>
      <CardContent className="grid gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-text-primary">
              {editing ? "Edit receipt" : "Add receipt"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Review AI fields or enter a receipt manually.
            </p>
          </div>
          <Plus className="h-5 w-5 text-action" aria-hidden="true" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Store">
            <Input
              value={form.store_name}
              onChange={(event) => setField("store_name", event.target.value)}
              placeholder="Nike"
            />
          </Field>
          <Field label="Item">
            <Input
              value={form.item_name}
              onChange={(event) => setField("item_name", event.target.value)}
              placeholder="Air Max Shoes"
            />
          </Field>
          <Field label="Price">
            <Input
              value={form.price}
              onChange={(event) => setField("price", event.target.value)}
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
              className="h-10 rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
            >
              <option value="active">active</option>
              <option value="returned">returned</option>
              <option value="kept">kept</option>
              <option value="expired">expired</option>
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          {editing ? (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
          <Button type="button" onClick={onSubmit} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {editing ? "Save changes" : "Create receipt"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
    <label className="grid gap-2 text-sm font-medium text-text-primary">
      {label}
      {children}
    </label>
  );
}
