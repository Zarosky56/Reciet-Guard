"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  Edit3,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { addDays, addYears, format, isValid, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus } from "@/types/receipt";

export const CAPTURE_REVIEW_STORAGE_KEY = "rg.receipt.reviewDraft";

export type CaptureReviewForm = {
  store_name: string;
  item_name: string;
  price: string;
  currency: string;
  purchase_date: string;
  return_deadline: string;
  warranty_deadline: string;
  status: ReceiptStatus;
};

export type CaptureReviewDraft = {
  form: CaptureReviewForm;
  source: "camera" | "upload";
  status: "success" | "needs_review";
  error: string | null;
  previewDataUrl: string | null;
  createdAt: number;
};

type FieldTab = "details" | "refund" | "warranty";
type ReturnWindowPreset = "none" | "14" | "30" | "90" | "custom" | null;
type WarrantyPreset = "unsure" | "none" | "1" | "2" | "custom";

const standardEase = [0.2, 0, 0, 1] as const;

const emptyForm: CaptureReviewForm = {
  store_name: "",
  item_name: "",
  price: "",
  currency: "USD",
  purchase_date: "",
  return_deadline: "",
  warranty_deadline: "",
  status: "active",
};

const RETURN_PRESETS: Array<{
  key: Exclude<ReturnWindowPreset, null>;
  label: string;
  days?: number;
}> = [
  { key: "none", label: "None" },
  { key: "14", label: "14 Days", days: 14 },
  { key: "30", label: "30 Days", days: 30 },
  { key: "90", label: "90 Days", days: 90 },
  { key: "custom", label: "Custom" },
];

const WARRANTY_PRESETS: Array<{
  key: WarrantyPreset;
  label: string;
  years?: number;
}> = [
  { key: "unsure", label: "Unsure" },
  { key: "none", label: "None" },
  { key: "1", label: "1 Year", years: 1 },
  { key: "2", label: "2 Years", years: 2 },
  { key: "custom", label: "Custom" },
];

const FIELD_TABS: Array<{
  key: FieldTab;
  label: string;
  icon: typeof ReceiptText;
}> = [
  { key: "details", label: "Details", icon: ReceiptText },
  { key: "refund", label: "Refund", icon: CalendarClock },
  { key: "warranty", label: "Warranty", icon: ShieldCheck },
];

function toPayload(form: CaptureReviewForm) {
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

function todayDate() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function toInputDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function parseInputDate(value: string) {
  if (!value) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function purchaseBaseDate(value: string) {
  return parseInputDate(value) ?? todayDate();
}

function formatLongDate(value: string) {
  const parsed = parseInputDate(value);
  if (!parsed) return "Date needs review";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatShortDate(value: string) {
  const parsed = parseInputDate(value);
  if (!parsed) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function inferReturnPreset(form: CaptureReviewForm): ReturnWindowPreset {
  if (!form.return_deadline) return null;
  const purchaseDate = parseInputDate(form.purchase_date);
  if (!purchaseDate) return "custom";

  for (const preset of RETURN_PRESETS) {
    if (!preset.days) continue;
    if (toInputDate(addDays(purchaseDate, preset.days)) === form.return_deadline) {
      return preset.key;
    }
  }

  return "custom";
}

function inferWarrantyPreset(form: CaptureReviewForm): WarrantyPreset {
  if (!form.warranty_deadline) return "unsure";
  const purchaseDate = parseInputDate(form.purchase_date);
  if (!purchaseDate) return "custom";

  for (const preset of WARRANTY_PRESETS) {
    if (!preset.years) continue;
    if (toInputDate(addYears(purchaseDate, preset.years)) === form.warranty_deadline) {
      return preset.key;
    }
  }

  return "custom";
}

function safeMoney(form: CaptureReviewForm) {
  const value = Number(form.price);
  if (!Number.isFinite(value)) return "Price pending";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: form.currency || "USD",
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
}

function readDraft(): CaptureReviewDraft | null {
  try {
    const raw = window.sessionStorage.getItem(CAPTURE_REVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CaptureReviewDraft>;
    if (!parsed.form || !parsed.source) return null;

    return {
      form: { ...emptyForm, ...parsed.form },
      source: parsed.source === "upload" ? "upload" : "camera",
      status: parsed.status === "needs_review" ? "needs_review" : "success",
      error: typeof parsed.error === "string" ? parsed.error : null,
      previewDataUrl:
        typeof parsed.previewDataUrl === "string"
          ? parsed.previewDataUrl
          : null,
      createdAt:
        typeof parsed.createdAt === "number" ? parsed.createdAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function CapturedReceiptReview() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<CaptureReviewDraft | null>(null);
  const [form, setForm] = useState<CaptureReviewForm>(emptyForm);
  const [activeTab, setActiveTab] = useState<FieldTab>("details");
  const [returnPreset, setReturnPreset] =
    useState<ReturnWindowPreset>(null);
  const [warrantyPreset, setWarrantyPreset] =
    useState<WarrantyPreset>("unsure");
  const [isSaving, setIsSaving] = useState(false);
  const [showInteractiveReceipt, setShowInteractiveReceipt] = useState(true);
  const [modalView, setModalView] = useState<"image" | "receipt">("receipt");

  useEffect(() => {
    if (!showInteractiveReceipt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/dashboard");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showInteractiveReceipt, router]);

  useEffect(() => {
    const nextDraft = readDraft();
    setDraft(nextDraft);
    setForm(nextDraft?.form ?? emptyForm);
    setReturnPreset(nextDraft ? inferReturnPreset(nextDraft.form) : null);
    setWarrantyPreset(nextDraft ? inferWarrantyPreset(nextDraft.form) : "unsure");
    setLoaded(true);
  }, []);

  const sourceLabel = draft?.source === "upload" ? "upload" : "camera";
  const statusLabel =
    draft?.status === "needs_review" ? "Needs review" : "Scan ready";

  const timeline = useMemo(
    () => [
      { label: "Captured", done: Boolean(draft) },
      { label: "Fields read", done: Boolean(form.store_name || form.item_name) },
      { label: "Confirm tabs", done: true },
    ],
    [draft, form.item_name, form.store_name],
  );

  function updateForm(patch: Partial<CaptureReviewForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function setField<K extends keyof CaptureReviewForm>(
    key: K,
    value: CaptureReviewForm[K],
  ) {
    updateForm({ [key]: value });
  }

  function handlePurchaseDateChange(value: string) {
    const patch: Partial<CaptureReviewForm> = { purchase_date: value };
    const baseDate = purchaseBaseDate(value);
    const returnConfig = RETURN_PRESETS.find(
      (preset) => preset.key === returnPreset,
    );
    const warrantyConfig = WARRANTY_PRESETS.find(
      (preset) => preset.key === warrantyPreset,
    );

    if (returnConfig?.days) {
      patch.return_deadline = toInputDate(addDays(baseDate, returnConfig.days));
    }

    if (warrantyConfig?.years) {
      patch.warranty_deadline = toInputDate(
        addYears(baseDate, warrantyConfig.years),
      );
    }

    updateForm(patch);
  }

  function chooseReturnPreset(nextPreset: Exclude<ReturnWindowPreset, null>) {
    setReturnPreset(nextPreset);

    if (nextPreset === "custom") return;
    if (nextPreset === "none") {
      updateForm({ return_deadline: "" });
      return;
    }

    const preset = RETURN_PRESETS.find((item) => item.key === nextPreset);
    if (!preset?.days) return;

    const baseDate = purchaseBaseDate(form.purchase_date);
    updateForm({
      purchase_date: form.purchase_date || toInputDate(baseDate),
      return_deadline: toInputDate(addDays(baseDate, preset.days)),
    });
  }

  function chooseWarrantyPreset(nextPreset: WarrantyPreset) {
    setWarrantyPreset(nextPreset);

    if (nextPreset === "custom") return;
    if (nextPreset === "unsure" || nextPreset === "none") {
      updateForm({ warranty_deadline: "" });
      return;
    }

    const preset = WARRANTY_PRESETS.find((item) => item.key === nextPreset);
    if (!preset?.years) return;

    const baseDate = purchaseBaseDate(form.purchase_date);
    updateForm({
      purchase_date: form.purchase_date || toInputDate(baseDate),
      warranty_deadline: toInputDate(addYears(baseDate, preset.years)),
    });
  }

  function discardDraft() {
    window.sessionStorage.removeItem(CAPTURE_REVIEW_STORAGE_KEY);
    router.push("/dashboard");
  }

  function retakeCapture() {
    const nextSource = draft?.source ?? "camera";
    window.sessionStorage.removeItem(CAPTURE_REVIEW_STORAGE_KEY);
    router.push(`/dashboard?capture=${nextSource}`);
  }

  async function saveReceipt() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(json?.error?.message ?? "Receipt could not be saved.");
        return;
      }

      window.sessionStorage.removeItem(CAPTURE_REVIEW_STORAGE_KEY);
      toast.success("Receipt saved");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  if (!loaded) {
    return (
      <div className="grid min-h-96 place-items-center">
        <Loader size="md" label="Opening receipt review" />
      </div>
    );
  }

  if (!draft) {
    return (
      <section className="mx-auto grid min-h-96 max-w-2xl place-items-center px-4">
        <div className="grid gap-4 rounded-lg border border-border bg-surface p-6 text-center">
          <ReceiptText className="mx-auto size-8 text-accent" aria-hidden="true" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              No receipt draft found
            </h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Capture or upload a receipt first, then this page will show the
              scanned receipt layout for review.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="grid gap-6 pb-20 pt-6 md:gap-8 md:pt-8"
      onSubmit={(event) => {
        event.preventDefault();
        saveReceipt();
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost">
          <Link href="/dashboard">
            <ArrowLeft data-icon aria-hidden="true" />
            Dashboard
          </Link>
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={retakeCapture}
            disabled={isSaving}
          >
            <RotateCcw data-icon aria-hidden="true" />
            {sourceLabel === "camera" ? "Retake" : "Choose file"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={discardDraft}
            disabled={isSaving}
          >
            Discard
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader size="sm" label="" /> : null}
            {isSaving ? "Saving receipt" : "Save receipt"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: standardEase }}
          className="grid gap-4"
        >
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-muted">
                  Receipt page
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
                  Review captured receipt
                </h1>
              </div>
              <span className="inline-flex h-7 items-center rounded-xs border border-success bg-surface px-2 text-xs font-medium text-success">
                {statusLabel}
              </span>
            </div>
            {draft.error ? (
              <p className="mt-3 rounded-sm border border-warning bg-canvas px-3 py-2 text-xs text-warning">
                {draft.error}
              </p>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            {draft.previewDataUrl ? (
              <div className="relative group bg-canvas p-3">
                <Image
                  src={draft.previewDataUrl}
                  alt="Captured receipt"
                  width={900}
                  height={700}
                  unoptimized
                  className="max-h-96 w-full rounded-sm object-contain transition-opacity duration-200 group-hover:opacity-75"
                />
                <button
                  type="button"
                  onClick={() => {
                    setModalView("receipt");
                    setShowInteractiveReceipt(true);
                  }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus-visible:opacity-100"
                  aria-label="View and edit receipt interactively"
                >
                  <span className="rounded-md bg-surface px-4 py-2 text-sm font-semibold text-text-primary shadow-overlay flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                    <Edit3 className="size-4 text-accent" />
                    Edit Interactively
                  </span>
                </button>
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center bg-canvas p-6">
                <div className="grid gap-3 text-center">
                  <Camera className="mx-auto size-8 text-accent" aria-hidden="true" />
                  <p className="text-sm text-text-secondary">
                    Receipt image preview is unavailable, but the extracted
                    fields are ready.
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xl font-semibold text-text-primary">
                    {form.store_name || "Unknown store"}
                  </p>
                  <p className="mt-1 truncate text-sm text-text-secondary">
                    {form.item_name || "Unnamed item"}
                  </p>
                </div>
                <p className="font-mono text-xl font-semibold tabular-nums text-text-primary">
                  {safeMoney(form)}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <ReceiptFact label="Purchased" value={formatShortDate(form.purchase_date)} />
                <ReceiptFact label="Return" value={formatShortDate(form.return_deadline)} />
                <ReceiptFact label="Warranty" value={formatShortDate(form.warranty_deadline)} />
              </div>

              <div className="grid gap-2">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.05,
                      duration: 0.18,
                      ease: standardEase,
                    }}
                    className="flex items-center gap-3 rounded-sm border border-border bg-canvas px-3 py-2"
                  >
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-xs font-mono text-xs",
                        item.done
                          ? "bg-accent-tint text-accent"
                          : "bg-surface text-text-muted",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: standardEase, delay: 0.04 }}
          className="overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div className="border-b border-border p-4">
            <div
              role="tablist"
              aria-label="Receipt fields"
              className="grid grid-cols-3 gap-1 rounded-md border border-border bg-canvas p-1"
            >
              {FIELD_TABS.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "inline-flex h-9 items-center justify-center gap-2 rounded-sm px-2 text-sm font-medium transition-colors duration-default ease-standard",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      selected
                        ? "bg-accent-tint text-text-primary"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5">
            <AnimatePresence mode="wait">
              {activeTab === "details" ? (
                <TabPanel key="details">
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
                          setField(
                            "currency",
                            event.target.value.toUpperCase(),
                          )
                        }
                        maxLength={3}
                        placeholder="USD"
                      />
                    </Field>
                    <Field label="Purchase date">
                      <Input
                        value={form.purchase_date}
                        onChange={(event) =>
                          handlePurchaseDateChange(event.target.value)
                        }
                        type="date"
                      />
                    </Field>
                    <Field label="Status">
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setField(
                            "status",
                            event.target.value as ReceiptStatus,
                          )
                        }
                        className="h-10 rounded-sm border border-border bg-canvas px-3 text-sm text-text-primary outline-none transition-colors duration-default ease-standard hover:border-border-strong focus:border-border-focus focus:outline focus:outline-1 focus:outline-offset-1 focus:outline-border-focus"
                      >
                        <option value="active">active</option>
                        <option value="returned">returned</option>
                        <option value="kept">kept</option>
                        <option value="expired">expired</option>
                      </select>
                    </Field>
                  </div>
                </TabPanel>
              ) : null}

              {activeTab === "refund" ? (
                <TabPanel key="refund">
                  <div className="grid gap-4">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                        Refund policy
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        Pick the store return window. Presets calculate from
                        the purchase date, using today when it is blank.
                      </p>
                    </div>
                    <PresetGroup
                      label="Return Window"
                      value={returnPreset}
                      options={RETURN_PRESETS}
                      onSelect={chooseReturnPreset}
                    />
                    <p className="rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-text-secondary">
                      {returnPreset === "none"
                        ? "No refund window recorded for this purchase."
                        : form.return_deadline
                          ? `Returnable until ${formatLongDate(form.return_deadline)}.`
                          : "Choose a return window to start refund reminders."}
                    </p>
                    {returnPreset === "custom" ? (
                      <Field label="Custom return deadline">
                        <Input
                          value={form.return_deadline}
                          onChange={(event) =>
                            setField("return_deadline", event.target.value)
                          }
                          type="date"
                        />
                      </Field>
                    ) : null}
                  </div>
                </TabPanel>
              ) : null}

              {activeTab === "warranty" ? (
                <TabPanel key="warranty">
                  <div className="grid gap-4">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight text-text-primary">
                        Manufacturer warranty
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-text-secondary">
                        Track product coverage separately from the retailer
                        refund period.
                      </p>
                    </div>
                    <PresetGroup
                      label="Warranty"
                      value={warrantyPreset}
                      options={WARRANTY_PRESETS}
                      onSelect={chooseWarrantyPreset}
                    />
                    <p className="rounded-sm border border-border bg-canvas px-3 py-2 text-sm text-text-secondary">
                      {warrantyPreset === "unsure"
                        ? "Warranty unknown. You can add it later."
                        : warrantyPreset === "none"
                          ? "No manufacturer warranty recorded."
                          : form.warranty_deadline
                            ? `Coverage until ${formatLongDate(form.warranty_deadline)}.`
                            : "Choose a warranty period or enter a custom date."}
                    </p>
                    {warrantyPreset === "custom" ? (
                      <Field label="Custom warranty deadline">
                        <Input
                          value={form.warranty_deadline}
                          onChange={(event) =>
                            setField("warranty_deadline", event.target.value)
                          }
                          type="date"
                        />
                      </Field>
                    ) : null}
                  </div>
                </TabPanel>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {showInteractiveReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/75 p-4 md:p-6 backdrop-blur-sm"
            onClick={() => router.push("/dashboard")}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              style={{ height: "90vh", maxHeight: "85vh" }}
              className="relative w-full max-w-md flex flex-col rounded-lg border border-border bg-surface-overlay text-text-primary shadow-overlay overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-4">
                <h2 className="text-sm font-semibold tracking-tight text-text-primary hidden sm:block">
                  Interactive Editor
                </h2>

                {/* Non-Scrollable Sliding Segmented Switch */}
                <div className="relative flex items-center bg-canvas p-1 rounded-pill w-64 h-9 border border-border mx-auto sm:mx-0">
                  <div
                    className="absolute top-1 bottom-1 bg-accent-tint rounded-pill transition-all duration-300 ease-out"
                    style={{
                      width: "calc(50% - 4px)",
                      left: modalView === "image" ? "4px" : "calc(50% + 2px)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setModalView("image")}
                    className={cn(
                      "relative z-10 flex-1 text-center text-xs font-semibold select-none transition-colors duration-200",
                      modalView === "image" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    Original Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalView("receipt")}
                    className={cn(
                      "relative z-10 flex-1 text-center text-xs font-semibold select-none transition-colors duration-200",
                      modalView === "receipt" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    Editable Receipt
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/dashboard")}
                  aria-label="Close interactive editor"
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 bg-canvas/30">
                {modalView === "image" ? (
                  /* Original Image View */
                  <div
                    style={{ minHeight: "350px" }}
                    className="flex h-full items-center justify-center p-4 bg-canvas rounded-md overflow-hidden border border-border"
                  >
                    {draft.previewDataUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={draft.previewDataUrl}
                          alt="Captured receipt reference"
                          style={{ maxHeight: "50vh" }}
                          className="w-auto max-w-full rounded-sm object-contain shadow-md"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-6 text-text-secondary">
                        <Camera className="mx-auto size-8 mb-2 text-text-muted" />
                        No preview image available
                      </div>
                    )}
                  </div>
                ) : (
                  /* Interactive Digital Paper Receipt Editor */
                  <div className="flex justify-center">
                    <div
                      style={{ backgroundColor: "#FDFDFB" }} // allow:color
                      className="w-full text-stone-800 p-6 md:p-8 shadow-overlay border border-stone-200 font-mono rounded-xs relative overflow-hidden text-xs"
                    >
                      {/* Top Jagged Edge */}
                      <div
                        style={{
                          height: "6px",
                          backgroundImage: "linear-gradient(135deg, #e7e5e4 25%, transparent 25%), linear-gradient(225deg, #e7e5e4 25%, transparent 25%)", // allow:color
                          backgroundSize: "6px 6px",
                        }}
                        className="absolute top-0 left-0 right-0 bg-repeat-x"
                        aria-hidden="true"
                      />

                      {/* Store Header */}
                      <div className="text-center pt-2">
                        <h3 style={{ fontSize: "9px" }} className="tracking-widest text-stone-500 uppercase font-semibold">
                          Transaction Record
                        </h3>
                        <input
                          type="text"
                          value={form.store_name}
                          onChange={(e) => setField("store_name", e.target.value)}
                          placeholder="MERCHANT NAME"
                          className="mt-2 w-full text-center font-bold tracking-wider text-base uppercase bg-transparent border-b border-dashed border-stone-300 focus:border-stone-600 focus:outline-none py-1 text-stone-900"
                        />
                        <p style={{ fontSize: "9px" }} className="text-stone-500 mt-1">
                          ID: RG-{Math.floor(draft.createdAt / 1000)}
                        </p>
                      </div>

                      <div className="border-t border-dashed border-stone-300 my-4" />

                      {/* Meta Block */}
                      <div style={{ fontSize: "11px" }} className="grid gap-2 text-stone-600">
                        <div className="flex justify-between items-center">
                          <span>DATE:</span>
                          <input
                            type="date"
                            value={form.purchase_date}
                            onChange={(e) => handlePurchaseDateChange(e.target.value)}
                            className="bg-transparent text-right font-mono text-stone-900 focus:outline-none border-b border-transparent focus:border-stone-500 cursor-pointer"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span>STATUS:</span>
                          <select
                            value={form.status}
                            onChange={(e) => setField("status", e.target.value as ReceiptStatus)}
                            className="bg-transparent text-right font-mono text-stone-900 focus:outline-none border-b border-transparent focus:border-stone-500 cursor-pointer uppercase py-0.5"
                          >
                            <option value="active">Active</option>
                            <option value="returned">Returned</option>
                            <option value="kept">Kept</option>
                            <option value="expired">Expired</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-stone-300 my-4" />

                      {/* Items Header */}
                      <div className="flex justify-between font-bold text-stone-600 mb-2">
                        <span>ITEM DESCRIPTION</span>
                        <span>PRICE</span>
                      </div>

                      {/* Item Details Row */}
                      <div style={{ fontSize: "11px" }} className="flex items-start gap-2">
                        <span className="text-stone-400 font-semibold mt-1">1x</span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={form.item_name}
                            onChange={(e) => setField("item_name", e.target.value)}
                            placeholder="Unnamed Item"
                            className="w-full font-mono bg-transparent border-b border-transparent focus:border-stone-500 focus:outline-none text-stone-900 py-0.5"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={form.currency}
                            onChange={(e) => setField("currency", e.target.value.toUpperCase())}
                            maxLength={3}
                            className="w-8 text-center bg-transparent border-b border-transparent focus:border-stone-500 focus:outline-none uppercase font-mono text-stone-900"
                          />
                          <input
                            type="text"
                            value={form.price}
                            onChange={(e) => setField("price", e.target.value)}
                            placeholder="0.00"
                            className="w-16 text-right bg-transparent border-b border-transparent focus:border-stone-500 focus:outline-none font-mono text-stone-900"
                          />
                        </div>
                      </div>

                      <div className="border-t border-dashed border-stone-300 my-4" />

                      {/* Totals Section */}
                      <div className="grid gap-1.5 text-stone-700">
                        <div style={{ fontSize: "10px" }} className="flex justify-between items-center">
                          <span>SUBTOTAL:</span>
                          <span>{safeMoney(form)}</span>
                        </div>
                        <div style={{ fontSize: "10px" }} className="flex justify-between items-center">
                          <span>TAX (0.0%):</span>
                          <span>{form.currency} 0.00</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-stone-900 text-sm mt-1 pt-1.5 border-t border-dotted border-stone-300">
                          <span>TOTAL:</span>
                          <span>{safeMoney(form)}</span>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-stone-300 my-4" />

                      {/* Policy / Dates Section */}
                      <div style={{ fontSize: "10px" }} className="grid gap-2.5 text-stone-600">
                        {/* Return window preset group styled for receipt */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-stone-500">RETURN POLICY:</span>
                            <select
                              value={returnPreset || "none"}
                              onChange={(e) => chooseReturnPreset(e.target.value as Exclude<ReturnWindowPreset, null>)}
                              className="bg-transparent font-mono text-stone-900 focus:outline-none border-b border-transparent focus:border-stone-500 cursor-pointer py-0.5"
                            >
                              <option value="none">None</option>
                              <option value="14">14 Days</option>
                              <option value="30">30 Days</option>
                              <option value="90">90 Days</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                          {form.return_deadline ? (
                            <div className="flex justify-between items-center">
                              <span>RETURN DEADLINE:</span>
                              {returnPreset === "custom" ? (
                                <input
                                  type="date"
                                  value={form.return_deadline}
                                  onChange={(e) => setField("return_deadline", e.target.value)}
                                  className="bg-transparent text-right font-mono text-stone-900 focus:outline-none border-b border-transparent focus:border-stone-500 cursor-pointer"
                                />
                              ) : (
                                <span className="font-mono text-stone-900">{form.return_deadline}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-stone-400 italic">No refund coverage</div>
                          )}
                        </div>

                        {/* Warranty window preset group */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-stone-500">WARRANTY:</span>
                            <select
                              value={warrantyPreset}
                              onChange={(e) => chooseWarrantyPreset(e.target.value as WarrantyPreset)}
                              className="bg-transparent font-mono text-stone-900 focus:outline-none border-b border-transparent focus:border-stone-500 cursor-pointer py-0.5"
                            >
                              <option value="unsure">Unsure</option>
                              <option value="none">None</option>
                              <option value="1">1 Year</option>
                              <option value="2">2 Years</option>
                              <option value="custom">Custom</option>
                            </select>
                          </div>
                          {form.warranty_deadline ? (
                            <div className="flex justify-between items-center">
                              <span>WARRANTY DEADLINE:</span>
                              {warrantyPreset === "custom" ? (
                                <input
                                  type="date"
                                  value={form.warranty_deadline}
                                  onChange={(e) => setField("warranty_deadline", e.target.value)}
                                  className="bg-transparent text-right font-mono text-stone-900 focus:outline-none border-b border-transparent focus:border-stone-500 cursor-pointer"
                                />
                              ) : (
                                <span className="font-mono text-stone-900">{form.warranty_deadline}</span>
                              )}
                            </div>
                          ) : (
                            <div className="text-stone-400 italic">No warranty coverage</div>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-dashed border-stone-300 my-4" />

                      {/* Barcode Mockup */}
                      <div className="flex justify-center my-4 h-12 bg-transparent opacity-80" aria-hidden="true">
                        <div className="flex h-full items-stretch">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: i % 3 === 0 ? "1px" : i % 5 === 0 ? "3px" : i % 2 === 0 ? "2px" : "4px",
                                marginRight: i % 4 === 0 ? "1px" : i % 3 === 0 ? "2px" : "3px",
                              }}
                              className="bg-stone-800"
                            />
                          ))}
                        </div>
                      </div>

                      <div style={{ fontSize: "9px" }} className="text-center text-stone-500 tracking-wider pt-2">
                        <p>THANK YOU FOR YOUR PURCHASE</p>
                        <p className="mt-0.5">RECORDED AT RECEIPT-GUARD</p>
                      </div>

                      {/* Bottom Jagged Edge */}
                      <div
                        style={{
                          height: "6px",
                          backgroundImage: "linear-gradient(45deg, #e7e5e4 25%, transparent 25%), linear-gradient(-45deg, #e7e5e4 25%, transparent 25%)", // allow:color
                          backgroundSize: "6px 6px",
                        }}
                        className="absolute bottom-0 left-0 right-0 bg-repeat-x"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-border bg-surface px-5 py-4 w-full">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={retakeCapture}
                  disabled={isSaving}
                  className="sm:w-auto"
                >
                  <RotateCcw className="size-4 mr-1.5" />
                  {sourceLabel === "camera" ? "Retake Scan" : "Choose Different File"}
                </Button>
                
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={saveReceipt}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader size="sm" label="" /> : null}
                    {isSaving ? "Saving..." : "Done & Save"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: standardEase }}
    >
      {children}
    </motion.div>
  );
}

function ReceiptFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-canvas px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-text-primary">
        {value}
      </p>
    </div>
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

function PresetGroup<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T | null;
  options: ReadonlyArray<{ key: T; label: string }>;
  onSelect: (value: T) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const selected = value === option.key;
          return (
            <Button
              key={option.key}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={selected}
              onClick={() => onSelect(option.key)}
              className={cn(selected && "bg-accent-tint text-text-primary")}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
