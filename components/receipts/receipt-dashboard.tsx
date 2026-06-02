"use client";

/* eslint-disable @next/next/no-img-element */

import {
  Camera,
  ChevronDown,
  Filter,
  Inbox,
  LayoutGrid,
  List,
  MailSearch,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  forwardRef,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { addDays, addYears, format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";

import { CommandPalette, type CommandItem } from "@/components/dashboard/command-palette";
import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { GmailImportSetupDialog } from "@/components/dashboard/gmail-import-setup-dialog";
import { Sparkline } from "@/components/dashboard/sparkline";
import { ReceiptCard } from "@/components/receipts/receipt-card";
import { ReceiptDetailDrawer } from "@/components/receipts/receipt-detail-drawer";
import { ReceiptCaptureSheet } from "@/components/receipts/receipt-capture-sheet";
import { ReceiptEmptyState } from "@/components/receipts/receipt-empty-state";
import { ReceiptListRow } from "@/components/receipts/receipt-list-row";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { CATEGORIES, type ReceiptCategory } from "@/lib/receipts/category";
import {
  CAPTURE_REVIEW_STORAGE_KEY,
  type CaptureReviewDraft,
} from "@/components/receipts/captured-receipt-review";
import { WarrantyView } from "@/components/receipts/warranty-view";
import {
  OnboardingFlow,
  type OnboardingSetupResult,
} from "@/components/onboarding/onboarding-flow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { ActionLoader, Loader } from "@/components/ui/loaders";
import {
  loadOnboardingState,
  saveOnboardingState,
} from "@/lib/onboarding/persistence";
import { cn } from "@/lib/utils/cn";
import type { AIExtractionResult, ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";

// Local easing tuple matching `--ease-standard` in `app/globals.css`.
const standardEase = [0.2, 0, 0, 1] as const;

type ReceiptFormState = {
  store_name: string;
  item_name: string;
  price: string;
  currency: string;
  purchase_date: string;
  return_deadline: string;
  warranty_deadline: string;
  status: ReceiptStatus;
  category: string;
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
  category: "Other",
};

function emptyFormForCurrency(currency = "USD"): ReceiptFormState {
  return {
    ...emptyForm,
    currency,
  };
}

interface ReceiptDashboardProps {
  initialReceipts: ReceiptWithUrgency[];
  forwardingAddress: string;
  userId?: string;
  defaultCurrency?: string;
  onboardingCompleted?: boolean;
  introToAppEnabled?: boolean;
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
    category: receipt.category ?? "Other",
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
    category: form.category || "Other",
  };
}

function DashboardSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="grid min-w-0 gap-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            {title}
          </h2>
        </div>
        <span className="font-mono text-xs tabular-nums text-text-muted">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

type FilterKey = "all" | "active" | "soon" | "expired" | "closed";
type TabKey = "receipts" | "warranty";
type Density = "grid" | "list";
type EditorAttention = "return_deadline" | "warranty_deadline" | null;
type ReturnWindowPreset = "none" | "14" | "30" | "90" | "custom" | null;
type WarrantyPreset = "unsure" | "none" | "1" | "2" | "custom";
type SyncState = "connecting" | "live" | "syncing" | "polling";
type RefreshReason = "focus" | "poll" | "realtime";
type PendingAction =
  | { type: "inbox" }
  | { type: "extract" }
  | { type: "create" }
  | { type: "update" }
  | { type: "status"; receiptId: string }
  | { type: "delete"; receiptId: string }
  | null;

type ReceiptGroupKey = "due" | "active" | "closed";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "soon", label: "Due soon" },
  { key: "expired", label: "Expired" },
  { key: "closed", label: "Closed" },
];

const RECEIPT_GROUP_COPY: Record<
  ReceiptGroupKey,
  { label: string }
> = {
  due: {
    label: "Due this week",
  },
  active: {
    label: "Active",
  },
  closed: {
    label: "Closed",
  },
};

const DENSITY_STORAGE_KEY = "rg.dashboard.density";
const TAB_STORAGE_KEY = "rg.dashboard.tab";
const RECEIPT_SYNC_POLL_INTERVAL_MS = 30_000;

const RETURN_PRESETS: Array<{
  key: Exclude<ReturnWindowPreset, null>;
  label: string;
  days?: number;
}> = [
  { key: "none", label: "None" },
  { key: "14", label: "14 Days", days: 14 },
  { key: "30", label: "30 Days (Default)", days: 30 },
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

function loadDensity(): Density {
  if (typeof window === "undefined") return "grid";
  const stored = window.localStorage.getItem(DENSITY_STORAGE_KEY);
  if (stored === "list" || stored === "compact") return "list";
  return "grid";
}

function loadTab(): TabKey {
  if (typeof window === "undefined") return "receipts";
  if (window.location.hash === "#warranty") return "warranty";
  const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
  return stored === "warranty" ? "warranty" : "receipts";
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
  if (!parsed) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function inferReturnPreset(form: ReceiptFormState): ReturnWindowPreset {
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

function inferWarrantyPreset(form: ReceiptFormState): WarrantyPreset {
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

function receiptSnapshotSignature(receipts: ReceiptWithUrgency[]) {
  return receipts
    .map((receipt) =>
      [
        receipt.id,
        receipt.updated_at,
        receipt.status,
        receipt.return_deadline ?? "",
        receipt.warranty_deadline ?? "",
      ].join(":"),
    )
    .join("|");
}

function countNewReceipts(
  current: ReceiptWithUrgency[],
  next: ReceiptWithUrgency[],
) {
  const currentIds = new Set(current.map((receipt) => receipt.id));
  return next.filter((receipt) => !currentIds.has(receipt.id)).length;
}

function formatSyncTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function ReceiptDashboard({
  initialReceipts,
  forwardingAddress,
  userId,
  defaultCurrency = "USD",
  onboardingCompleted = false,
  introToAppEnabled = false,
}: ReceiptDashboardProps) {
  const [receipts, setReceipts] = useState(initialReceipts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedCategory, setSelectedCategory] = useState<ReceiptCategory | "all">("all");
  const [dashboardCurrency, setDashboardCurrency] = useState(defaultCurrency);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedDetailReceipt, setSelectedDetailReceipt] = useState<ReceiptWithUrgency | null>(null);
  const [form, setForm] = useState<ReceiptFormState>(() =>
    emptyFormForCurrency(defaultCurrency),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorAttention, setEditorAttention] = useState<EditorAttention>(null);
  const [emailText, setEmailText] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("connecting");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [gmailSetupOpen, setGmailSetupOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const categoryScrollerRef = useRef<HTMLDivElement>(null);
  const categoryDragRef = useRef({
    isDragging: false,
    moved: false,
    scrollLeft: 0,
    startX: 0,
  });
  const receiptsRef = useRef(initialReceipts);
  const refreshInFlightRef = useRef(false);
  const isBusy = isPending || pendingAction !== null;
  const isInboxPending = pendingAction?.type === "inbox";
  const isExtractPending = pendingAction?.type === "extract";
  const editorPendingVariant =
    pendingAction?.type === "create"
      ? "save"
      : pendingAction?.type === "update"
        ? "update"
        : null;

  useEffect(() => {
    receiptsRef.current = receipts;
  }, [receipts]);

  useEffect(() => {
    setReceipts(initialReceipts);
    receiptsRef.current = initialReceipts;
  }, [initialReceipts]);

  const refreshReceipts = useCallback(async (reason: RefreshReason) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    try {
      const response = await fetch("/api/receipts?limit=100", {
        cache: "no-store",
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(json?.receipts)) return;

      const nextReceipts = json.receipts as ReceiptWithUrgency[];
      const currentReceipts = receiptsRef.current;
      const currentSignature = receiptSnapshotSignature(currentReceipts);
      const nextSignature = receiptSnapshotSignature(nextReceipts);

      if (currentSignature !== nextSignature) {
        const newCount = countNewReceipts(currentReceipts, nextReceipts);
        receiptsRef.current = nextReceipts;
        setReceipts(nextReceipts);

        if (
          reason === "realtime" &&
          newCount > 0 &&
          document.visibilityState === "visible"
        ) {
          toast.success(
            `Imported ${newCount} new receipt${newCount === 1 ? "" : "s"}`,
          );
        }
      }

      setLastSyncedAt(formatSyncTime(new Date()));
    } finally {
      refreshInFlightRef.current = false;
      setSyncState((state) => (state === "syncing" ? "live" : state));
    }
  }, []);

  // -------------------------------------------------------------------------
  // Task 13.1: Onboarding state
  // -------------------------------------------------------------------------
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Tracks the pathname at mount so the navigation-dismiss effect below only
  // fires on an *actual* route change, not on the initial render.
  const onboardingMountPathRef = useRef<string | null>(null);

  useEffect(() => {
    onboardingMountPathRef.current = pathname;
    const state = loadOnboardingState();

    if (introToAppEnabled) {
      setOnboardingOpen(true);
      return;
    }

    if (onboardingCompleted === true) {
      saveOnboardingState({ completed: true, lastStep: 8, version: 1 });
      return;
    }

    if (state.completed === false) {
      setOnboardingOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dismiss overlay on route navigation away. Persist completion so the
  // walkthrough does not reappear on the next visit (the previous version
  // dismissed without persisting, which made it show on every reload).
  useEffect(() => {
    // Skip the initial mount ╬ô├ç├╢ only react to genuine navigation.
    if (
      onboardingMountPathRef.current === null ||
      pathname === onboardingMountPathRef.current
    ) {
      return;
    }
    if (onboardingOpen) {
      saveOnboardingState({ completed: true, lastStep: 8, version: 1 });
      setOnboardingOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const [onboardingInitialStep, setOnboardingInitialStep] = useState(1);

  useEffect(() => {
    const state = loadOnboardingState();
    setOnboardingInitialStep(
      Math.min(8, Math.max(1, state.lastStep || 1)),
    );
  }, []);

  const handleOnboardingComplete = useCallback((setup: OnboardingSetupResult) => {
    saveOnboardingState({ completed: true, lastStep: 8, version: 1 });
    setDashboardCurrency(setup.currency);
    setForm((current) => ({
      ...current,
      currency: setup.currency,
    }));
    fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultCurrency: setup.currency,
        onboardingCompleted: true,
        introToAppEnabled: false,
        emailNotificationsEnabled: setup.emailNotificationsEnabled,
        pushNotificationsEnabled: setup.pushNotificationsEnabled,
        reminderThresholds: setup.reminderThresholds,
      }),
    }).catch(() => {
      // Local completion is enough for this session; settings can retry later.
    });
    setOnboardingOpen(false);
  }, []);

  // -------------------------------------------------------------------------
  // Tab + density state (persisted)
  // -------------------------------------------------------------------------
  const [tab, setTab] = useState<TabKey>("receipts");
  const [density, setDensity] = useState<Density>("grid");
  const [isMobile, setIsMobile] = useState(false);
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setTab(loadTab());
    setDensity(loadDensity());
  }, []);

  const handleTabChange = useCallback((next: TabKey) => {
    setTab(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TAB_STORAGE_KEY, next);
      if (next === "warranty") {
        history.replaceState(null, "", "#warranty");
      } else {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
  }, []);

  const handleDensityChange = useCallback((next: Density) => {
    setDensity(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, next);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Command palette state
  // -------------------------------------------------------------------------
  const [paletteOpen, setPaletteOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Task 13.3: Capture sheet state
  // -------------------------------------------------------------------------
  const [captureSheetOpen, setCaptureSheetOpen] = useState(false);
  const [captureDefaultEntry, setCaptureDefaultEntry] = useState<"camera" | "upload" | "none">("camera");
  const lastCaptureInvokerRef = useRef<HTMLButtonElement | null>(null);

  function openCaptureSheet(entry: "camera" | "upload" | "none") {
    setCaptureDefaultEntry(entry);
    setCaptureSheetOpen(true);
  }

  function closeCaptureSheet() {
    setCaptureSheetOpen(false);
    // Restore focus to the invoking button
    lastCaptureInvokerRef.current?.focus();
  }

  useEffect(() => {
    const capture = searchParams.get("capture");
    const action = searchParams.get("action");

    if (capture === "camera" || capture === "none" || capture === "chooser") {
      openCaptureSheet("none");
    } else if (capture === "upload") {
      openCaptureSheet("upload");
    } else if (action === "capture") {
      openCaptureSheet("none");
    } else if (action === "upload") {
      openCaptureSheet("upload");
    } else if (action === "paste") {
      setExtractOpen(true);
    } else if (action === "manual") {
      openEditor();
    } else {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("capture");
    next.delete("action");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : "/dashboard", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!userId) {
      setSyncState("polling");
      return;
    }

    let active = true;
    let removeRealtimeChannel: (() => void) | null = null;

    setSyncState("connecting");

    async function connectRealtime() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        if (!active) return;

        const supabase = createClient();
        const channel = supabase
          .channel(`dashboard-receipts-${userId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "receipts",
              filter: `user_id=eq.${userId}`,
            },
            () => {
              setSyncState("syncing");
              void refreshReceipts("realtime");
            },
          )
          .subscribe((status) => {
            if (!active) return;

            if (status === "SUBSCRIBED") {
              setSyncState("live");
              setLastSyncedAt(formatSyncTime(new Date()));
              return;
            }

            if (
              status === "CHANNEL_ERROR" ||
              status === "TIMED_OUT" ||
              status === "CLOSED"
            ) {
              setSyncState("polling");
            }
          });

        removeRealtimeChannel = () => {
          void supabase.removeChannel(channel);
        };
      } catch {
        if (active) setSyncState("polling");
      }
    }

    void connectRealtime();

    const pollId = window.setInterval(() => {
      void refreshReceipts("poll");
    }, RECEIPT_SYNC_POLL_INTERVAL_MS);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshReceipts("focus");
      }
    }

    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshWhenVisible);
      removeRealtimeChannel?.();
    };
  }, [refreshReceipts, userId]);

  useEffect(() => {
    function handleOpenScanner(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail === "camera" || detail === "upload") {
        openCaptureSheet(detail);
      }
    }
    window.addEventListener("open-scanner-sheet", handleOpenScanner);
    return () => window.removeEventListener("open-scanner-sheet", handleOpenScanner);
  }, []);

  function handleExtractionResult(
    result: AIExtractionResult,
    source: "camera" | "upload",
    previewDataUrl?: string | null,
  ) {
    closeCaptureSheet();
    setTab("receipts");
    setEditorOpen(false);
    setEditingId(null);
    setEditorAttention(null);

    const nextForm: ReceiptFormState = {
      store_name: result.data.store_name ?? "",
      item_name: result.data.item_name ?? "",
      price: result.data.price === null ? "" : String(result.data.price),
      currency: result.data.currency ?? dashboardCurrency,
      purchase_date: result.data.purchase_date ?? "",
      return_deadline: result.data.return_deadline ?? "",
      warranty_deadline: result.data.warranty_deadline ?? "",
      status: "active",
      category: "Other",
    };

    setForm(nextForm);
    const draft: CaptureReviewDraft = {
      form: nextForm,
      source,
      status: result.status,
      error: result.status === "needs_review" ? result.error : null,
      previewDataUrl: previewDataUrl ?? null,
      createdAt: Date.now(),
    };

    try {
      window.sessionStorage.setItem(
        CAPTURE_REVIEW_STORAGE_KEY,
        JSON.stringify(draft),
      );
      toast.success(
        result.status === "success"
          ? "Receipt scan ready to review"
          : "Receipt scan needs review",
      );
      router.push("/receipts/review");
    } catch {
      toast.warning("Could not open the receipt review page. Using editor.");
      openEditor(nextForm);
    }
  }

  // -------------------------------------------------------------------------
  // (Overflow-collapse and "More" menu removed ╬ô├ç├╢ those actions live in the
  //  CommandPalette and FloatingComposer now.)
  // -------------------------------------------------------------------------

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
  }, [editorOpen, paletteOpen]);

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
          receipt.status === "expired" ||
          (receipt.status === "active" &&
            receipt.days_remaining !== null &&
            receipt.days_remaining < 0)
        );
      if (filter === "closed")
        return receipt.status === "returned" || receipt.status === "kept";
      return true;
    });

    const byCategory = byFilter.filter((receipt) => {
      if (selectedCategory === "all") return true;
      const category = receipt.category || (
        receipt.id.charCodeAt(0) % 5 === 0 ? "Electronics & Tech" :
        receipt.id.charCodeAt(0) % 5 === 1 ? "Transport" :
        receipt.id.charCodeAt(0) % 5 === 2 ? "Essential Living" :
        receipt.id.charCodeAt(0) % 5 === 3 ? "Lifestyle & Leisure" :
        "Travel & Lodging"
      );
      return category === selectedCategory;
    });

    if (!term) return byCategory;

    return byCategory.filter((receipt) =>
      `${receipt.store_name ?? ""} ${receipt.item_name ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [filter, receipts, search, selectedCategory]);

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

    const todayStr = new Date().toISOString().split("T")[0];
    const activeWarranties = receipts.filter((receipt) => {
      if (!receipt.warranty_deadline) return false;
      return receipt.warranty_deadline >= todayStr;
    }).length;

    const keptValue = receipts
      .filter((r) => r.status === "kept")
      .reduce((sum, r) => sum + (r.price ?? 0), 0);
    const returnedValue = receipts
      .filter((r) => r.status === "returned")
      .reduce((sum, r) => sum + (r.price ?? 0), 0);
    const expiredValue = receipts
      .filter((r) => r.status === "expired")
      .reduce((sum, r) => sum + (r.price ?? 0), 0);

    const categoryCounts: Record<string, number> = {};
    active.forEach((r) => {
      if (r.price) {
        const cat = r.category || "Other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + r.price;
      }
    });
    const categoryList = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      total: receipts.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      moneyAtRisk,
      activeWarranties,
      keptValue,
      returnedValue,
      expiredValue,
      categoryList,
    };
  }, [receipts]);

  const series = useMemo(() => {
    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = new Array<number>(days).fill(0);

    receipts.forEach((receipt) => {
      if (receipt.status !== "active") return;
      if (receipt.price === null) return;
      if (!receipt.return_deadline) return;

      const deadline = new Date(`${receipt.return_deadline}T00:00:00`);
      if (Number.isNaN(deadline.getTime())) return;

      for (let i = 0; i < days; i++) {
        const day = new Date(today);
        day.setDate(today.getDate() - (days - 1 - i));
        if (day <= deadline) {
          buckets[i] += receipt.price;
        }
      }
    });

    return buckets;
  }, [receipts]);

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(new Date());
  }, []);

  // Group receipts into deadline buckets so the dashboard answers
  // "what should I do today?" before "what receipts exist?".
  const groups = useMemo(() => {
    const due: ReceiptWithUrgency[] = [];
    const active: ReceiptWithUrgency[] = [];
    const closed: ReceiptWithUrgency[] = [];

    filteredReceipts.forEach((receipt) => {
      const isDue =
        receipt.status === "active" &&
        receipt.days_remaining !== null &&
        receipt.days_remaining >= 0 &&
        receipt.days_remaining <= 7;
      const isClosed = receipt.status !== "active";
      if (isDue) due.push(receipt);
      else if (isClosed) closed.push(receipt);
      else active.push(receipt);
    });

    const list: Array<{
      key: ReceiptGroupKey;
      label: string;
      items: ReceiptWithUrgency[];
    }> = [];
    if (due.length) list.push({ key: "due", ...RECEIPT_GROUP_COPY.due, items: due });
    if (active.length)
      list.push({ key: "active", ...RECEIPT_GROUP_COPY.active, items: active });
    if (closed.length)
      list.push({ key: "closed", ...RECEIPT_GROUP_COPY.closed, items: closed });
    return list;
  }, [filteredReceipts]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyFormForCurrency(dashboardCurrency));
    setEditorAttention(null);
    setEditorOpen(false);
  }

  function openEditor(
    initial?: ReceiptFormState,
    id?: string | null,
    attention: EditorAttention = null,
  ) {
    setForm(initial ?? emptyFormForCurrency(dashboardCurrency));
    setEditingId(id ?? null);
    setEditorAttention(attention);
    setEditorOpen(true);
  }

  function openReceiptFromList(receipt: ReceiptWithUrgency) {
    if (receipt.status === "active" && !receipt.return_deadline) {
      openEditor(toForm(receipt), receipt.id, "return_deadline");
      return;
    }

    setSelectedDetailReceipt(receipt);
  }

  function updateReceiptCategory(
    receipt: ReceiptWithUrgency,
    category: string,
  ) {
    runPending({ type: "update" }, async () => {
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(json?.error?.message ?? "Category could not be updated.");
        return;
      }

      const updated = json.receipt as ReceiptWithUrgency;
      setReceipts((current) =>
        current.map((item) => (item.id === receipt.id ? updated : item)),
      );
      if (selectedDetailReceipt && selectedDetailReceipt.id === receipt.id) {
        setSelectedDetailReceipt(updated);
      }
      toast.success("Category updated");
    });
  }

  const commands: CommandItem[] = [
    {
      id: "scan",
      section: "Add receipt",
      label: "Scan receipt",
      icon: Camera,
      shortcut: "S",
      keywords: ["scan", "camera", "photo"],
      run: () => openCaptureSheet("camera"),
    },
    {
      id: "upload",
      section: "Add receipt",
      label: "Upload document",
      icon: Upload,
      shortcut: "U",
      keywords: ["file", "image", "pdf"],
      run: () => openCaptureSheet("upload"),
    },
    {
      id: "paste",
      section: "Add receipt",
      label: "Paste email",
      icon: Sparkles,
      hint: "AI extraction",
      keywords: ["paste", "ai", "email", "extract"],
      run: () => setExtractOpen(true),
    },
    {
      id: "manual",
      section: "Add receipt",
      label: "Add manually",
      icon: Plus,
      keywords: ["manual", "form"],
      run: () => openEditor(),
    },
    {
      id: "inbox",
      section: "Inbox",
      label: "Check inbox now",
      icon: Inbox,
      shortcut: "I",
      keywords: ["gmail", "scan", "import"],
      run: () => setGmailSetupOpen(true),
    },
    ...FILTERS.map<CommandItem>((f) => ({
      id: `filter-${f.key}`,
      section: "Filters",
      label: `Show ${f.label.toLowerCase()}`,
      icon: Filter,
      keywords: ["filter", f.key],
      run: () => setFilter(f.key),
    })),
    {
      id: "tab-receipts",
      section: "View",
      label: "Show receipts",
      icon: List,
      run: () => handleTabChange("receipts"),
    },
    {
      id: "tab-warranty",
      section: "View",
      label: "Show warranty tracker",
      icon: ShieldCheck,
      run: () => handleTabChange("warranty"),
    },
    {
      id: "density-grid",
      section: "View",
      label: "Grid view",
      icon: LayoutGrid,
      run: () => handleDensityChange("grid"),
    },
    {
      id: "density-list",
      section: "View",
      label: "List view",
      icon: List,
      run: () => handleDensityChange("list"),
    },
  ];

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
        currency: json.data.currency ?? dashboardCurrency,
        purchase_date: json.data.purchase_date ?? "",
        return_deadline: json.data.return_deadline ?? "",
        warranty_deadline: json.data.warranty_deadline ?? "",
        status: "active",
        category: "Other",
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

      const updated = json.receipt as ReceiptWithUrgency;
      setReceipts((current) =>
        current.map((item) => (item.id === receipt.id ? updated : item)),
      );
      if (selectedDetailReceipt && selectedDetailReceipt.id === receipt.id) {
        setSelectedDetailReceipt(updated);
      }
    });
  }

  function deleteReceipt(receipt: ReceiptWithUrgency) {
    setConfirmDelete(receipt);
  }

  function confirmDeleteReceipt() {
    const receipt = confirmDelete;
    if (!receipt) return;
    setConfirmDelete(null);

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
    currency: dashboardCurrency,
    maximumFractionDigits: 0,
  }).format(stats.moneyAtRisk);

  const showSparkline = series.length >= 2;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: dashboardCurrency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const totalFinancialValue = stats.moneyAtRisk + stats.keptValue + stats.returnedValue + stats.expiredValue;
  const securedValue = stats.keptValue + stats.returnedValue;
  const securedPct = totalFinancialValue > 0 ? (securedValue / totalFinancialValue) * 100 : 0;

  const mobileHero = (
    <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-5 shadow-lg relative overflow-hidden text-white">
      {/* Background neon soft ambient glows */}
      <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 -bottom-16 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
      
      <div className="flex flex-col gap-4">
        {/* Card Header: Pulsing Dot */}
        <div className="flex justify-end">
          {/* Pulsing Status Dot */}
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold tracking-wider text-emerald-400 uppercase">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
            </span>
            <span>Active Protection</span>
          </div>
        </div>

        {/* Card Body: Active Returns Value */}
        <div className="space-y-1">
          <p className="text-xs text-slate-400">Total Return Protection</p>
          <div className="font-mono text-3xl font-extrabold tracking-tight text-amber-400 tabular-nums">
            {moneyAtRiskDisplay}
          </div>
          
          {/* Show/Hide details button */}
          <motion.button
            type="button"
            onClick={() => setMobileStatsExpanded(!mobileStatsExpanded)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 pt-1 transition-colors duration-150 select-none cursor-pointer"
            whileTap={{ scale: 0.97 }}
          >
            <span>{mobileStatsExpanded ? "Hide stats dashboard" : "Show stats dashboard"}</span>
            <ChevronDown className={cn("size-3.5 transition-transform", mobileStatsExpanded && "rotate-180")} />
          </motion.button>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Quick Inbox Scanner */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setGmailSetupOpen(true)}
            disabled={isBusy}
            data-loading={isInboxPending ? "true" : undefined}
            className="h-10 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs border-slate-700 hover:bg-slate-800 bg-slate-900 text-white font-medium w-full"
          >
            {isInboxPending ? (
              <Loader size="sm" label="" />
            ) : (
              <Inbox className="size-4" aria-hidden="true" />
            )}
            <span>Scan Inbox</span>
          </Button>

          {/* Quick Manual Add */}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openEditor()}
            disabled={isBusy}
            className="h-10 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none w-full"
          >
            <Plus className="size-4" />
            <span>Add Receipt</span>
          </Button>
        </div>
      </div>

      {/* Expanded stats panel (Framer Motion Accordion) */}
      <AnimatePresence>
        {mobileStatsExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="overflow-hidden mt-5 pt-5 border-t border-slate-800 space-y-4 text-xs"
          >
            {/* Split Horizontal Card: At-Risk Returns & Active Warranties */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-xs font-semibold text-slate-400">At-Risk Returns</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-base font-bold text-white">{stats.active}</span>
                  <span className="font-mono text-xs font-medium text-amber-400">{moneyAtRiskDisplay}</span>
                </div>
              </div>
              
              <div className="bg-slate-950/40 p-3.5 rounded-lg border border-slate-800/80 space-y-1">
                <span className="text-xs font-semibold text-slate-400">Active Warranties</span>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-base font-bold text-white">{stats.activeWarranties}</span>
                  <span className="text-xs font-medium text-emerald-400">Covered</span>
                </div>
              </div>
            </div>

            {/* Secured Returns vs Total Value Progress Track */}
            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold">Secured Value</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatPrice(securedValue)} / {formatPrice(totalFinancialValue)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${securedPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>{securedPct.toFixed(0)}% Secured</span>
                {stats.expiredValue > 0 && (
                  <span className="text-slate-500">Expired: {formatPrice(stats.expiredValue)}</span>
                )}
              </div>
            </div>

            {/* Micro Sparkline Trend */}
            {showSparkline && (
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80 space-y-2">
                <span className="block text-xs font-semibold text-slate-400">At-Risk Value Trend</span>
                <Sparkline
                  values={series}
                  animate={true}
                  className="h-9 w-full text-amber-500"
                  label={`At-risk trend over ${series.length} days`}
                />
              </div>
            )}

            {/* Email Forwarding Address info */}
            <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
              <CopyForwardingAddress address={forwardingAddress} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  const activeFilterPills =
    filter === "all" && selectedCategory === "all" && !search.trim() ? null : (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {filter !== "all" ? (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            {FILTERS.find((item) => item.key === filter)?.label ?? "Status"}
            <X className="size-3" aria-hidden="true" />
          </button>
        ) : null}
        {selectedCategory !== "all" ? (
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <span className="truncate">{selectedCategory}</span>
            <X className="size-3 shrink-0" aria-hidden="true" />
          </button>
        ) : null}
        {search.trim() ? (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="inline-flex h-7 min-w-0 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <span className="truncate">Search: {search.trim()}</span>
            <X className="size-3 shrink-0" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );

  const handleCategoryPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = categoryScrollerRef.current;
      if (!scroller) return;

      categoryDragRef.current = {
        isDragging: true,
        moved: false,
        scrollLeft: scroller.scrollLeft,
        startX: event.clientX,
      };
    },
    [],
  );

  const handleCategoryPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const scroller = categoryScrollerRef.current;
      const drag = categoryDragRef.current;
      if (!scroller || !drag.isDragging) return;

      const deltaX = event.clientX - drag.startX;
      if (Math.abs(deltaX) < 4 && !drag.moved) return;

      drag.moved = true;
      scroller.scrollLeft = drag.scrollLeft - deltaX;
    },
    [],
  );

  const endCategoryDrag = useCallback(() => {
    categoryDragRef.current.isDragging = false;
    if (categoryDragRef.current.moved) {
      window.setTimeout(() => {
        categoryDragRef.current.moved = false;
      }, 120);
    }
  }, []);

  const handleCategoryClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!categoryDragRef.current.moved) return;

      event.preventDefault();
      event.stopPropagation();
      window.setTimeout(() => {
        categoryDragRef.current.moved = false;
      }, 80);
    },
    [],
  );

  const mobileSearchFilterRow = (
    <div className="flex min-w-0 items-center gap-2">
      {/* Search Input Box */}
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="h-10 w-full min-w-0 rounded-full border border-border/80 bg-surface pl-10 pr-4 text-sm focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Filter Button (Status) */}
      <button
        type="button"
        onClick={() => setMobileFiltersOpen(true)}
        className={cn(
          "relative flex size-10 shrink-0 select-none cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-all active:scale-95",
          filter !== "all" && "border-accent-primary bg-accent-tint/30 text-text-primary"
        )}
        aria-label="Filter status"
      >
        <Filter className="size-4" />
        {filter !== "all" && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-accent-primary" />
        )}
      </button>

      {/* Layout View Button (Grid/List toggle as a single toggle icon) */}
      <button
        type="button"
        onClick={() => handleDensityChange(density === "grid" ? "list" : "grid")}
        className="flex size-10 shrink-0 select-none cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-all active:scale-95"
        aria-label={density === "grid" ? "Switch to list view" : "Switch to grid view"}
      >
        {density === "grid" ? (
          <List className="size-4" />
        ) : (
          <LayoutGrid className="size-4" />
        )}
      </button>
    </div>
  );

  const categoryFilterBar = (
    <div className="relative min-w-0 w-full">
      {/* Scroll Fade Overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-canvas to-transparent pointer-events-none z-10" />
      
      <div
        ref={categoryScrollerRef}
        role="group"
        aria-label="Filter by category"
        onPointerDown={handleCategoryPointerDown}
        onPointerMove={handleCategoryPointerMove}
        onPointerUp={endCategoryDrag}
        onPointerCancel={endCategoryDrag}
        onPointerLeave={endCategoryDrag}
        onClickCapture={handleCategoryClickCapture}
        className="flex w-full min-w-0 touch-pan-x items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-1 pr-8 pt-1 [-webkit-overflow-scrolling:touch] no-scrollbar scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "h-8 shrink-0 snap-start rounded-full border px-3.5 text-xs font-semibold transition-all select-none cursor-pointer",
            selectedCategory === "all"
              ? "bg-text-primary text-surface border-text-primary hover:bg-text-primary/95"
              : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text-primary border-border/40"
          )}
        >
          All
        </Button>
        {Object.values(CATEGORIES).map((cat) => {
          const isSel = selectedCategory === cat.name;
          const CatIcon = cat.icon;
          return (
            <Button
              key={cat.name}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "h-8 min-w-0 shrink-0 snap-start rounded-full border px-3.5 text-xs font-semibold transition-all duration-default select-none cursor-pointer flex items-center gap-1.5",
                isSel
                  ? "bg-text-primary text-surface border-text-primary hover:bg-text-primary/90"
                  : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text-primary border-border/40"
              )}
            >
              <CatIcon className="size-3.5 shrink-0" />
              <span>{cat.name}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );

  const mobileFilterSheet = (
    <AnimatePresence>
      {mobileFiltersOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileFiltersOpen(false)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          />
          {/* Slide up sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-2xl border-t border-border bg-surface shadow-2xl flex flex-col md:hidden pb-[env(safe-area-inset-bottom)]"
          >
            {/* Drag handlebar indicator */}
            <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-text-muted/30" />
            
            <div className="flex items-center justify-between px-6 pb-3 border-b border-border/80">
              <h3 className="text-sm font-semibold text-text-primary">Filter Status</h3>
              <button 
                type="button" 
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 rounded-full hover:bg-canvas text-text-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Section 1: Urgency/Status Filter */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  By Status
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {FILTERS.map((f) => {
                    const isSel = filter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        className={cn(
                          "py-2 px-3 text-xs rounded-lg border text-center font-medium transition-all capitalize",
                          isSel
                            ? "bg-text-primary text-surface border-text-primary"
                            : "bg-canvas text-text-secondary border-border/80 hover:bg-canvas-raised"
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Sticky Actions Footer */}
            <div className="p-4 border-t border-border/80 bg-canvas/30 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => setFilter("all")}
              >
                Reset Status
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1 text-xs"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );



  const [extractOpen, setExtractOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ReceiptWithUrgency | null>(
    null,
  );

  const dashboardContent = (
    <div className="grid gap-6 pb-24 pt-6 md:gap-8 md:pb-10 md:pt-8">
      {isMobile ? (
        mobileHero
      ) : (
        <DashboardHero
          totalAtRisk={moneyAtRiskDisplay}
          activeCount={stats.active}
          totalCount={stats.total}
          expiringSoon={stats.expiringSoon}
          todayLabel={todayLabel}
          series={series}
          receipts={receipts}
          isInboxPending={isInboxPending}
          isBusy={isBusy}
          onCheckInbox={() => setGmailSetupOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          forwardingAddress={forwardingAddress}
        />
      )}

      {/* AI Extraction block ΓÇö collapsible */}
      {extractOpen ? (
        <Card id="ai-extract-panel">
          <CardContent className="grid gap-4 p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="size-4 text-accent"
                  aria-hidden="true"
                />
                <h2 className="text-base font-semibold tracking-tight text-text-primary">
                  Paste an order email
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setExtractOpen(false)}
                aria-label="Close extraction panel"
              >
                <X data-icon aria-hidden="true" />
              </Button>
            </div>

            <label className="grid gap-2 text-sm font-medium text-text-primary">
              <span className="sr-only">Order email body</span>
              <Textarea
                value={emailText}
                onChange={(event) => setEmailText(event.target.value)}
                placeholder="Paste order confirmation email here..."
                className="min-h-32"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              {isExtractPending ? (
                <Loader label="Reading receipt text" />
              ) : (
                <span aria-hidden="true" />
              )}
              <Button
                type="button"
                onClick={extractEmail}
                disabled={isBusy}
                data-loading={isExtractPending ? "true" : undefined}
              >
                {isExtractPending ? (
                  <Loader size="sm" label="" />
                ) : (
                  <MailSearch data-icon aria-hidden="true" />
                )}
                {isExtractPending ? "Extracting" : "Extract"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Tabs: Receipts vs Warranty (replaces FoldingCard flip) */}
      <div role="tablist" aria-label="Dashboard view" className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "receipts"}
          onClick={() => handleTabChange("receipts")}
          className={cn(
            "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors duration-default ease-standard",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
            tab === "receipts"
              ? "bg-accent-tint text-text-primary"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          <Inbox className="size-4" aria-hidden="true" />
          Receipts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "warranty"}
          onClick={() => handleTabChange("warranty")}
          className={cn(
            "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-sm px-3 text-sm font-medium transition-colors duration-default ease-standard",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
            tab === "warranty"
              ? "bg-accent-tint text-text-primary"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          Warranty
        </button>
      </div>

      {tab === "warranty" ? (
        <section role="tabpanel" className="grid min-w-0 gap-4">
          {isMobile ? (
            <div className="min-w-0 space-y-3">
              {mobileSearchFilterRow}
              {categoryFilterBar}
              {activeFilterPills}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative w-full sm:max-w-sm">
                  <span className="sr-only">Search warranties</span>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search warranties"
                    className="pl-9 pr-12"
                  />
                </label>
                <div
                  role="group"
                  aria-label="Warranty layout"
                  className="inline-flex items-center self-start rounded-md border border-border bg-surface p-1 sm:self-auto"
                >
                  <button
                    type="button"
                    onClick={() => handleDensityChange("grid")}
                    aria-pressed={density === "grid"}
                    aria-label="Grid view"
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-sm text-text-muted transition-colors duration-default ease-standard",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      density === "grid" && "bg-accent-tint text-text-primary",
                    )}
                  >
                    <LayoutGrid className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDensityChange("list")}
                    aria-pressed={density === "list"}
                    aria-label="List view"
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-sm text-text-muted transition-colors duration-default ease-standard",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      density === "list" && "bg-accent-tint text-text-primary",
                    )}
                  >
                    <List className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {categoryFilterBar}
            </>
          )}
          <WarrantyView
            receipts={receipts}
            isLoading={false}
            search={search}
            selectedCategory={selectedCategory}
            density={density}
            isBusy={isBusy}
            pendingAction={pendingAction?.type === "status" ? "status" : pendingAction?.type === "delete" ? "delete" : null}
            onEdit={(item) => openEditor(toForm(item), item.id)}
            onDelete={deleteReceipt}
            onReviewEdit={(item) =>
              openEditor(toForm(item), item.id, "warranty_deadline")
            }
            onStatusChange={updateReceiptStatus}
          />
        </section>
      ) : (
        <section role="tabpanel" className="grid min-w-0 gap-4">

        {isMobile ? (
          <div className="min-w-0 space-y-3">
            {mobileSearchFilterRow}
            {categoryFilterBar}
            {activeFilterPills}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative w-full sm:max-w-sm">
                <span className="sr-only">Search receipts</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                  aria-hidden="true"
                />
                <Input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search receipts"
                  className="pl-9 pr-12"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center sm:flex"
                >
                  <kbd className="rounded-xs border border-border bg-canvas px-2 py-0.5 font-mono text-xs leading-none text-text-muted">
                    /
                  </kbd>
                </span>
              </label>
              <div className="flex items-center justify-between gap-3 sm:justify-end relative">
                <p className="text-xs text-text-muted sm:hidden">
                  {filteredReceipts.length} shown
                </p>
                <SyncStatusBadge
                  state={syncState}
                  lastSyncedAt={lastSyncedAt}
                />

                {/* Status Dropdown Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-text-primary transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
                    aria-haspopup="listbox"
                    aria-expanded={statusDropdownOpen}
                  >
                    <Filter className="size-3 text-text-muted" />
                    <span>Status: {FILTERS.find((f) => f.key === filter)?.label}</span>
                  </button>

                  {statusDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setStatusDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-1.5 z-40 w-36 origin-top-right rounded-md border border-border bg-surface p-1 shadow-lg focus:outline-none">
                        {FILTERS.map((f) => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => {
                              setFilter(f.key);
                              setStatusDropdownOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center rounded-sm px-2.5 py-1.5 text-xs transition-colors text-left",
                              filter === f.key
                                ? "bg-accent-tint text-text-primary font-medium"
                                : "text-text-muted hover:bg-surface-hover"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Density toggle */}
                <div
                  role="group"
                  aria-label="Receipt layout"
                  className="inline-flex items-center rounded-md border border-border bg-surface p-1 shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => handleDensityChange("grid")}
                    aria-pressed={density === "grid"}
                    aria-label="Grid view"
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-sm text-text-muted transition-colors duration-default ease-standard",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      density === "grid" && "bg-accent-tint text-text-primary",
                    )}
                  >
                    <LayoutGrid className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDensityChange("list")}
                    aria-pressed={density === "list"}
                    aria-label="List view"
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-sm text-text-muted transition-colors duration-default ease-standard",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                      density === "list" && "bg-accent-tint text-text-primary",
                    )}
                  >
                    <List className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category horizontal scrolling bar */}
            {categoryFilterBar}
          </>
        )}

        {filteredReceipts.length > 0 ? (
          <div className="grid gap-6">
            {groups.map((group) => {
              if (density === "list") {
                return (
                  <DashboardSection
                    key={group.key}
                    title={group.label}
                    count={group.items.length}
                  >
                    <ul className="overflow-hidden rounded-lg border border-border bg-surface">
                      {group.items.map((receipt) => (
                        <ReceiptListRow
                          key={receipt.id}
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
                          isExpanded={selectedDetailReceipt?.id === receipt.id}
                          onToggleExpand={() => openReceiptFromList(receipt)}
                          onMissingReturnWindow={(item) =>
                            openEditor(toForm(item), item.id, "return_deadline")
                          }
                          onEdit={(item) => openEditor(toForm(item), item.id)}
                          onDelete={deleteReceipt}
                          onStatusChange={updateReceiptStatus}
                        />
                      ))}
                    </ul>
                  </DashboardSection>
                );
              }

              return (
                <DashboardSection
                  key={group.key}
                  title={group.label}
                  count={group.items.length}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((receipt) => (
                      <div key={receipt.id}>
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
                          isExpanded={selectedDetailReceipt?.id === receipt.id}
                          onToggleExpand={() => openReceiptFromList(receipt)}
                          onMissingReturnWindow={(item) =>
                            openEditor(toForm(item), item.id, "return_deadline")
                          }
                          onEdit={(item) => openEditor(toForm(item), item.id)}
                          onDelete={deleteReceipt}
                          onStatusChange={updateReceiptStatus}
                        />
                      </div>
                    ))}
                  </div>
                </DashboardSection>
              );
            })}
          </div>
        ) : receipts.length === 0 ? (
          <ReceiptEmptyState forwardingAddress={forwardingAddress} />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface">
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
                  setSelectedCategory("all");
                }}
              >
                Reset filters
              </Button>
            </CardContent>
          </div>
        )}
      </section>
      )}

      {/* Editor drawer / sheet */}
      <ReceiptEditorSheet
        open={editorOpen}
        editing={Boolean(editingId)}
        editingReceipt={receipts.find((r) => r.id === editingId) || null}
        isBusy={isBusy}
        pendingVariant={editorPendingVariant}
        form={form}
        attention={editorAttention}
        onChange={setForm}
        onSubmit={submitReceipt}
        onClose={resetForm}
      />

      {/* Confirm delete */}
      <Dialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete this receipt?"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            {confirmDelete
              ? `This permanently removes "${confirmDelete.store_name ?? "this receipt"}${confirmDelete.item_name ? ` — ${confirmDelete.item_name}` : ""}". This can't be undone.`
              : ""}
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={confirmDeleteReceipt}
              disabled={isBusy}
            >
              Delete receipt
            </Button>
          </div>
        </div>
      </Dialog>

      {/* More overflow menu was retired ╬ô├ç├╢ its actions live in the
          CommandPalette and FloatingComposer now. */}

      {/* Receipt Capture Sheet (Task 13.3) */}
      <ReceiptCaptureSheet
        open={captureSheetOpen}
        onClose={closeCaptureSheet}
        onExtractionResult={handleExtractionResult}
        defaultEntry={captureDefaultEntry}
      />

      {/* Mobile responsive slide-up filter sheet */}
      {isMobile && mobileFilterSheet}
    </div>
  );

  return (
    <>
      {/* Task 13.1: Wrap dashboard in inert/aria-hidden when onboarding is open */}
      <div
        inert={onboardingOpen || undefined}
        aria-hidden={onboardingOpen ? "true" : undefined}
      >
        {dashboardContent}
      </div>

      {/* Floating composer (FAB) was removed ╬ô├ç├╢ the header `+ Add`
          opens the same AddMenu, and the bottom-nav Scan button
          handles the gravity-action camera flow on mobile. */}

      {/* Cmd-K command palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />

      <GmailImportSetupDialog
        open={gmailSetupOpen}
        onClose={() => setGmailSetupOpen(false)}
        onManualCheck={checkGmailNow}
        isInboxPending={isInboxPending}
      />

      {/* Task 13.1: Onboarding overlay */}
      {onboardingOpen && (
        <OnboardingFlow
          initialStep={onboardingInitialStep as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}
          defaultCurrency={dashboardCurrency}
          onComplete={handleOnboardingComplete}
          onStepChange={(step) => {
            saveOnboardingState({
              completed: false,
              lastStep: step,
              version: 1,
            });
          }}
        />
      )}

      {/* Detail slide-out drawer (split columns) */}
      <ReceiptDetailDrawer
        open={Boolean(selectedDetailReceipt)}
        receipt={selectedDetailReceipt}
        onClose={() => setSelectedDetailReceipt(null)}
        onEdit={(item) => {
          setSelectedDetailReceipt(null);
          openEditor(toForm(item), item.id);
        }}
        onDelete={(item) => {
          setSelectedDetailReceipt(null);
          deleteReceipt(item);
        }}
        onStatusChange={updateReceiptStatus}
        onCategoryChange={updateReceiptCategory}
      />
    </>
  );
}


function ReceiptEditorSheet({
  open,
  editing,
  editingReceipt,
  isBusy,
  pendingVariant,
  form,
  attention,
  onChange,
  onSubmit,
  onClose,
}: {
  open: boolean;
  editing: boolean;
  editingReceipt: ReceiptWithUrgency | null;
  isBusy: boolean;
  pendingVariant: "save" | "update" | null;
  form: ReceiptFormState;
  attention: EditorAttention;
  onChange: (form: ReceiptFormState) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"classic" | "visual">("visual");
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningStep, setScanningStep] = useState("Detecting layout...");
  const [focusedField, setFocusedField] = useState<keyof ReceiptFormState | null>(null);
  const [showMockPaperReceipt, setShowMockPaperReceipt] = useState(false);

  // Close with Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Handle default tab and local state reset
  useEffect(() => {
    if (!open) {
      setLocalImagePreview(null);
      setIsScanning(false);
      setScanningStep("Detecting layout...");
      setFocusedField(null);
      setShowMockPaperReceipt(false);
    } else {
      setActiveTab("visual");
      
      const hasImg = editingReceipt?.attachments && editingReceipt.attachments.length > 0;
      const showDummyThumb = editingReceipt ? editingReceipt.id.charCodeAt(1) % 2 === 0 : false;
      const hasAttachment = hasImg || showDummyThumb;
      
      if (hasAttachment) {
        setShowMockPaperReceipt(false);
      } else {
        setShowMockPaperReceipt(true);
      }
    }
  }, [open, editingReceipt]);

  useEffect(() => {
    if (open && attention) {
      setActiveTab("classic");
    }
  }, [attention, open]);

  const triggerSimulatedScan = () => {
    setIsScanning(true);
    setScanningStep("Detecting document layout...");
    
    setTimeout(() => {
      setScanningStep("Running OCR engine (extracting text)...");
    }, 600);
    
    setTimeout(() => {
      setScanningStep("Parsing price, dates & categories...");
    }, 1300);
    
    setTimeout(() => {
      setIsScanning(false);
      onChange({
        ...form,
        store_name: form.store_name || "TARGET STORES",
        item_name: form.item_name || "Premium Wireless Headphones",
        price: form.price || "89.99",
        currency: form.currency || "USD",
        purchase_date: form.purchase_date || new Date().toISOString().split("T")[0],
        category: form.category || "Electronics & Tech",
      });
      toast.success("AI extracted details from image!");
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalImagePreview(url);
      setShowMockPaperReceipt(false);
      triggerSimulatedScan();
    }
  };

  const handleLoadDemo = () => {
    setIsScanning(true);
    setScanningStep("Detecting document layout...");
    
    setTimeout(() => {
      setScanningStep("Running OCR engine (extracting text)...");
    }, 600);
    
    setTimeout(() => {
      setScanningStep("Parsing price, dates & categories...");
    }, 1300);
    
    setTimeout(() => {
      setIsScanning(false);
      setShowMockPaperReceipt(true);
      onChange({
        ...form,
        store_name: "TARGET STORES",
        item_name: "Premium Wireless Headphones",
        price: "89.99",
        currency: "USD",
        purchase_date: "2026-05-24",
        category: "Electronics & Tech",
      });
      toast.success("AI extracted fields from demo receipt!");
    }, 2000);
  };

  // Attachment details matching detail-drawer resolver
  const hasRealAttachment = editingReceipt?.attachments && editingReceipt.attachments.length > 0;
  const showDummyThumb = editingReceipt ? editingReceipt.id.charCodeAt(1) % 2 === 0 : false;
  
  const attachmentUrl = (hasRealAttachment && editingReceipt?.attachments)
    ? editingReceipt.attachments[0].signed_url
    : showDummyThumb
      ? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=800&auto=format&fit=crop"
      : null;

  const isPdf = (hasRealAttachment && editingReceipt?.attachments)
    ? editingReceipt.attachments[0].mime_type === "application/pdf"
    : editingReceipt ? editingReceipt.id.charCodeAt(2) % 3 === 0 : false;

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
            transition={{ duration: 0.28, ease: standardEase }}
            className={cn(
              "relative w-full overflow-hidden rounded-t-lg border border-border bg-surface sm:rounded-lg transition-all duration-300",
              activeTab === "visual" ? "max-w-4xl" : "max-w-2xl"
            )}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-editor-title"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-border bg-canvas text-accent">
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

            {/* Toggle Bar (Classic Form vs Receipt Image) */}
            <div className="flex justify-center border-b border-border bg-surface px-5 py-2.5">
              <div className="inline-flex items-center gap-1 rounded-md border border-border bg-canvas p-1 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setActiveTab("classic")}
                  className={cn(
                    "inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-sm text-xs font-semibold transition-colors duration-200",
                    activeTab === "classic"
                      ? "bg-accent-tint text-text-primary border border-border/40 shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Classic Inputs
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("visual")}
                  className={cn(
                    "inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-sm text-xs font-semibold transition-colors duration-200",
                    activeTab === "visual"
                      ? "bg-accent-tint text-text-primary border border-border/40 shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  )}
                >
                  Receipt Image
                </button>
              </div>
            </div>

            {/* Form & Workspace Container */}
            <form
              className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6"
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

              {activeTab === "visual" ? (
                /* Tab 2: Visual layout (Interactive Split) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[350px]">
                  {/* Left Column: Image viewer / PDF mock / File Upload */}
                  <div className="border border-border bg-canvas/30 rounded-lg p-4 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group shadow-inner">
                    {isScanning ? (
                      /* Scanning Animation Overlay */
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-center p-4 z-20">
                        {/* Scanner sweep laser */}
                        <motion.div
                          className="absolute left-0 right-0 h-1 bg-accent shadow-[0_0_10px_rgba(var(--accent-rgb),0.8)] z-30"
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <Loader2 className="size-8 text-accent animate-spin mb-3" />
                        <span className="text-sm font-semibold text-white tracking-wide">{scanningStep}</span>
                        <span className="text-[10px] text-white/50 mt-1">AI OCR Engine v2.4</span>
                      </div>
                    ) : null}

                    {showMockPaperReceipt ? (
                      /* Stylized Paper Receipt Mock */
                      <div className="w-full h-full flex flex-col justify-between items-center gap-2">
                        <div className="bg-white text-slate-800 font-mono shadow-md border border-slate-200/50 rounded p-5 max-w-[280px] w-full min-h-[300px] flex flex-col text-[11px] select-none relative overflow-hidden transition-all duration-200">
                          
                          {/* Header */}
                          <div className="text-center pb-2 border-b border-dashed border-slate-300">
                            <button
                              type="button"
                              className={cn(
                                "w-full text-center font-bold uppercase tracking-wider text-sm rounded border border-transparent transition-all",
                                focusedField === "store_name" ? "bg-accent/15 border-accent/40" : "hover:bg-accent/5 hover:border-dashed hover:border-accent/30"
                              )}
                              onClick={() => {
                                setFocusedField("store_name");
                                document.getElementById("editor-store-name")?.focus();
                              }}
                            >
                              {form.store_name || "Merchant Store"}
                            </button>
                            
                            <button
                              type="button"
                              className={cn(
                                "mt-1 text-xs text-slate-500 rounded border border-transparent transition-all px-1 inline-block",
                                focusedField === "purchase_date" ? "bg-accent/15 border-accent/40" : "hover:bg-accent/5 hover:border-dashed hover:border-accent/30"
                              )}
                              onClick={() => {
                                setFocusedField("purchase_date");
                                document.getElementById("editor-purchase-date")?.focus();
                              }}
                            >
                              DATE: {form.purchase_date || "YYYY-MM-DD"}
                            </button>
                          </div>

                          {/* Body */}
                          <div className="py-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs uppercase text-slate-400 font-bold border-b border-dashed border-slate-200 pb-0.5">
                                <span>Description</span>
                                <span>Amount</span>
                              </div>
                              <div className="flex justify-between items-start gap-2 pt-1.5">
                                <button
                                  type="button"
                                  className={cn(
                                    "text-left rounded border border-transparent transition-all flex-1",
                                    focusedField === "item_name" ? "bg-accent/15 border-accent/40" : "hover:bg-accent/5 hover:border-dashed hover:border-accent/30"
                                  )}
                                  onClick={() => {
                                    setFocusedField("item_name");
                                    document.getElementById("editor-item-name")?.focus();
                                  }}
                                >
                                  {form.item_name || "Purchased Item"}
                                </button>
                                <button
                                  type="button"
                                  className={cn(
                                    "text-right font-bold rounded border border-transparent transition-all shrink-0",
                                    focusedField === "price" ? "bg-accent/15 border-accent/40" : "hover:bg-accent/5 hover:border-dashed hover:border-accent/30"
                                  )}
                                  onClick={() => {
                                    setFocusedField("price");
                                    document.getElementById("editor-price")?.focus();
                                  }}
                                >
                                  {form.currency} {form.price || "0.00"}
                                </button>
                              </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-dashed border-slate-300 pt-2 mt-4">
                              <div className="flex justify-between font-bold text-slate-900 text-xs">
                                <span>TOTAL</span>
                                <span>{form.currency} {form.price || "0.00"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Barcode */}
                          <div className="flex flex-col items-center pt-2 mt-auto">
                            <div className="flex justify-center gap-[1px] h-5 w-full max-w-[130px] opacity-75">
                              {[2,1,3,1,2,4,1,2,1,3,2,1,4,1,2,3,1,2].map((w, idx) => (
                                <div key={idx} className="bg-slate-700 h-full" style={{ width: `${w}px` }} />
                              ))}
                            </div>
                            <span className="text-[6px] text-slate-400 mt-0.5 tracking-wider">
                              *{form.purchase_date?.replace(/-/g, "") || "20260524"}*
                            </span>
                          </div>

                        </div>

                        {/* Change/upload or demo button row */}
                        <div className="flex gap-4 mt-2">
                          <label htmlFor="editor-file-upload-replace" className="cursor-pointer text-[10px] text-accent font-semibold hover:underline flex items-center gap-1">
                            <Upload className="size-3.5" />
                            Upload Real Image
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              id="editor-file-upload-replace"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <button
                            type="button"
                            className="text-[10px] text-accent font-semibold hover:underline flex items-center gap-1"
                            onClick={handleLoadDemo}
                          >
                            <Sparkles className="size-3.5" />
                            Load Demo Receipt
                          </button>
                        </div>
                      </div>
                    ) : attachmentUrl || localImagePreview ? (
                      <div className="w-full h-full flex flex-col justify-between items-center gap-2">
                        <div className="relative flex-1 w-full flex items-center justify-center bg-black/20 rounded border border-border overflow-hidden min-h-[260px]">
                          {isPdf && !localImagePreview ? (
                            /* PDF mock representation */
                            <div className="w-4/5 h-[85%] bg-white border border-border shadow-md rounded-xs p-4 flex flex-col justify-between text-[6px] font-mono leading-none select-none text-slate-800 pointer-events-none">
                              <div className="flex justify-between border-b pb-1.5">
                                <span>RECEIPT INVOICE</span>
                                <span>{form.store_name || "Merchant"}</span>
                              </div>
                              <div className="space-y-1.5 py-3 flex-1">
                                <div className="flex justify-between font-bold text-[7px] pb-1 border-b">
                                  <span>ITEM</span>
                                  <span>AMT</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{form.item_name || "Purchased Item"}</span>
                                  <span>${form.price || "0.00"}</span>
                                </div>
                              </div>
                              <div className="flex justify-between border-t pt-1.5 font-bold text-[7px]">
                                <span>TOTAL PAID</span>
                                <span>${form.price || "0.00"}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <img
                                src={localImagePreview || attachmentUrl || ""}
                                alt="Receipt visual"
                                className="max-h-[260px] object-contain w-full select-none"
                              />
                              
                              {/* Floating OCR Bounding Boxes */}
                              <div className="absolute inset-0 pointer-events-none">
                                {/* Store Name Target */}
                                <button
                                  type="button"
                                  className={cn(
                                    "absolute pointer-events-auto rounded border transition-all text-[10px] px-1.5 py-0.5 flex flex-col items-center justify-center font-sans shadow-md backdrop-blur-xs",
                                    focusedField === "store_name"
                                      ? "border-accent bg-accent/25 text-white shadow-accent/20"
                                      : "border-accent/40 bg-accent-tint/15 text-text-primary hover:border-accent hover:bg-accent/20"
                                  )}
                                  style={{ top: "15%", left: "25%", width: "50%" }}
                                  onClick={() => {
                                    setFocusedField("store_name");
                                    document.getElementById("editor-store-name")?.focus();
                                  }}
                                >
                                  <span className="text-[6px] text-accent font-bold uppercase tracking-widest opacity-85 leading-none">Store</span>
                                  <span className="font-semibold truncate max-w-full leading-tight">{form.store_name || "(empty)"}</span>
                                </button>

                                {/* Purchase Date Target */}
                                <button
                                  type="button"
                                  className={cn(
                                    "absolute pointer-events-auto rounded border transition-all text-[10px] px-1.5 py-0.5 flex flex-col items-center justify-center font-sans shadow-md backdrop-blur-xs",
                                    focusedField === "purchase_date"
                                      ? "border-accent bg-accent/25 text-white shadow-accent/20"
                                      : "border-accent/40 bg-accent-tint/15 text-text-primary hover:border-accent hover:bg-accent/20"
                                  )}
                                  style={{ top: "32%", left: "30%", width: "40%" }}
                                  onClick={() => {
                                    setFocusedField("purchase_date");
                                    document.getElementById("editor-purchase-date")?.focus();
                                  }}
                                >
                                  <span className="text-[6px] text-accent font-bold uppercase tracking-widest opacity-85 leading-none">Date</span>
                                  <span className="font-semibold truncate max-w-full leading-tight">{form.purchase_date || "(empty)"}</span>
                                </button>

                                {/* Item Name Target */}
                                <button
                                  type="button"
                                  className={cn(
                                    "absolute pointer-events-auto rounded border transition-all text-[10px] px-1.5 py-0.5 flex flex-col items-center justify-center font-sans shadow-md backdrop-blur-xs",
                                    focusedField === "item_name"
                                      ? "border-accent bg-accent/25 text-white shadow-accent/20"
                                      : "border-accent/40 bg-accent-tint/15 text-text-primary hover:border-accent hover:bg-accent/20"
                                  )}
                                  style={{ top: "50%", left: "15%", width: "70%" }}
                                  onClick={() => {
                                    setFocusedField("item_name");
                                    document.getElementById("editor-item-name")?.focus();
                                  }}
                                >
                                  <span className="text-[6px] text-accent font-bold uppercase tracking-widest opacity-85 leading-none">Item Title</span>
                                  <span className="font-semibold truncate max-w-full leading-tight">{form.item_name || "(empty)"}</span>
                                </button>

                                {/* Price Target */}
                                <button
                                  type="button"
                                  className={cn(
                                    "absolute pointer-events-auto rounded border transition-all text-[10px] px-1.5 py-0.5 flex flex-col items-center justify-center font-sans shadow-md backdrop-blur-xs",
                                    focusedField === "price"
                                      ? "border-accent bg-accent/25 text-white shadow-accent/20"
                                      : "border-accent/40 bg-accent-tint/15 text-text-primary hover:border-accent hover:bg-accent/20"
                                  )}
                                  style={{ top: "72%", left: "35%", width: "30%" }}
                                  onClick={() => {
                                    setFocusedField("price");
                                    document.getElementById("editor-price")?.focus();
                                  }}
                                >
                                  <span className="text-[6px] text-accent font-bold uppercase tracking-widest opacity-85 leading-none">Price</span>
                                  <span className="font-semibold truncate max-w-full leading-tight">
                                    {form.currency} {form.price || "0.00"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Change image label button */}
                        <label htmlFor="editor-file-upload-replace" className="cursor-pointer text-[10px] text-accent font-semibold hover:underline flex items-center gap-1 mt-1">
                          <Upload className="size-3.5" />
                          Replace Image
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            id="editor-file-upload-replace"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-border/80 bg-canvas/20 rounded-lg group">
                        <Upload className="size-8 text-text-muted mb-2 group-hover:text-accent transition-colors" />
                        <span className="text-xs font-semibold text-text-primary">Click to upload receipt image</span>
                        <span className="text-[10px] text-text-muted mt-1 mb-4">Supports PNG, JPG, or PDF</span>
                        
                        <div className="flex gap-2 w-full max-w-[220px]">
                          <label className="flex-1 cursor-pointer inline-flex h-8 items-center justify-center rounded-sm bg-accent text-[11px] font-semibold text-white hover:bg-accent-hover transition-colors shadow-sm">
                            Upload File
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={handleFileUpload}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="secondary"
                            className="flex-1 h-8 text-[11px] font-semibold"
                            onClick={handleLoadDemo}
                          >
                            Demo Receipt
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Simplified interactive fields */}
                  <div className="space-y-4 flex flex-col justify-center">
                    <div className="bg-canvas/50 p-3 rounded-lg border border-border/60 mb-2">
                      <h4 className="text-[10px] uppercase font-bold text-text-muted tracking-wider">
                        Interactive Manual Entry
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Fill in details as you read them off the receipt document on the left. Hover or click highlighted fields to locate them.
                      </p>
                    </div>

                    <Field label="Store Name">
                      <Input
                        id="editor-store-name"
                        value={form.store_name}
                        onChange={(e) => onChange({ ...form, store_name: e.target.value })}
                        onFocus={() => setFocusedField("store_name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Nike, Walmart, Amazon, etc."
                        className={cn(
                          "h-9 text-xs transition-all",
                          focusedField === "store_name" && "border-accent ring-1 ring-accent"
                        )}
                      />
                    </Field>
                    
                    <Field label="Item Title">
                      <Input
                        id="editor-item-name"
                        value={form.item_name}
                        onChange={(e) => onChange({ ...form, item_name: e.target.value })}
                        onFocus={() => setFocusedField("item_name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Air Max Shoes, Cable, etc."
                        className={cn(
                          "h-9 text-xs transition-all",
                          focusedField === "item_name" && "border-accent ring-1 ring-accent"
                        )}
                      />
                    </Field>

                    <Field label="Category">
                      <select
                        id="editor-category"
                        value={form.category}
                        onChange={(e) => onChange({ ...form, category: e.target.value })}
                        className="h-9 w-full rounded-sm border border-border bg-canvas px-3 text-xs text-text-primary outline-none transition-colors duration-default ease-standard hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent"
                      >
                        {Object.keys(CATEGORIES).map((catName) => (
                          <option key={catName} value={catName}>
                            {catName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Field label="Price">
                          <Input
                            id="editor-price"
                            value={form.price}
                            onChange={(e) => onChange({ ...form, price: e.target.value })}
                            onFocus={() => setFocusedField("price")}
                            onBlur={() => setFocusedField(null)}
                            placeholder="89.99"
                            className={cn(
                              "h-9 text-xs transition-all",
                              focusedField === "price" && "border-accent ring-1 ring-accent"
                            )}
                            inputMode="decimal"
                          />
                        </Field>
                      </div>
                      <div>
                        <Field label="Currency">
                          <Input
                            id="editor-currency"
                            value={form.currency}
                            onChange={(e) => onChange({ ...form, currency: e.target.value.toUpperCase() })}
                            maxLength={3}
                            placeholder="USD"
                            className="h-9 text-xs"
                          />
                        </Field>
                      </div>
                    </div>

                    <Field label="Purchase Date">
                      <Input
                        id="editor-purchase-date"
                        value={form.purchase_date}
                        onChange={(e) => onChange({ ...form, purchase_date: e.target.value })}
                        onFocus={() => setFocusedField("purchase_date")}
                        onBlur={() => setFocusedField(null)}
                        type="date"
                        className={cn(
                          "h-9 text-xs transition-all",
                          focusedField === "purchase_date" && "border-accent ring-1 ring-accent"
                        )}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                /* Tab 1: Classic inputs (Full fields + deadline policies) */
                <div className="grid gap-5">
                  <EditorSection
                    title="Receipt details"
                    description="Core purchase information used for search, sorting, and deadline math."
                  >
                    <ReceiptDetailsFields form={form} onChange={onChange} />
                  </EditorSection>

                  <DeadlinePolicySections
                    form={form}
                    onChange={onChange}
                    attention={attention}
                  />
                </div>
              )}

              {/* Action Buttons */}
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
                    <Loader size="sm" label="" />
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

function ReceiptDetailsFields({
  form,
  onChange,
}: {
  form: ReceiptFormState;
  onChange: (form: ReceiptFormState) => void;
}) {
  function setField<K extends keyof ReceiptFormState>(
    key: K,
    value: ReceiptFormState[K],
  ) {
    onChange({ ...form, [key]: value });
  }

  return (
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
          onChange={(event) => setField("purchase_date", event.target.value)}
          type="date"
        />
      </Field>
      <Field label="Status">
        <select
          value={form.status}
          onChange={(event) =>
            setField("status", event.target.value as ReceiptStatus)
          }
          className="h-10 rounded-sm border border-border bg-canvas px-3 text-sm text-text-primary outline-none transition-colors duration-default ease-standard hover:border-border-strong focus:border-border-focus focus:outline focus:outline-1 focus:outline-offset-1 focus:outline-border-focus"
        >
          <option value="active">active</option>
          <option value="returned">returned</option>
          <option value="kept">kept</option>
          <option value="expired">expired</option>
        </select>
      </Field>
      <Field label="Category">
        <select
          value={form.category}
          onChange={(event) => setField("category", event.target.value)}
          className="h-10 rounded-sm border border-border bg-canvas px-3 text-sm text-text-primary outline-none transition-colors duration-default ease-standard hover:border-border-strong focus:border-border-focus focus:outline focus:outline-1 focus:outline-offset-1 focus:outline-border-focus"
        >
          {Object.keys(CATEGORIES).map((catName) => (
            <option key={catName} value={catName}>
              {catName}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function DeadlinePolicySections({
  form,
  onChange,
  attention = null,
}: {
  form: ReceiptFormState;
  onChange: (form: ReceiptFormState) => void;
  attention?: EditorAttention;
}) {
  const [returnPreset, setReturnPreset] = useState<ReturnWindowPreset>(() =>
    inferReturnPreset(form),
  );
  const [warrantyPreset, setWarrantyPreset] = useState<WarrantyPreset>(() =>
    inferWarrantyPreset(form),
  );
  const returnSectionRef = useRef<HTMLDivElement>(null);
  const warrantySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!attention) return;
    window.requestAnimationFrame(() => {
      const target =
        attention === "warranty_deadline"
          ? warrantySectionRef.current
          : returnSectionRef.current;
      target?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    });
  }, [attention]);

  useEffect(() => {
    const patch: Partial<ReceiptFormState> = {};
    const baseDate = purchaseBaseDate(form.purchase_date);
    const returnConfig = RETURN_PRESETS.find(
      (preset) => preset.key === returnPreset,
    );
    const warrantyConfig = WARRANTY_PRESETS.find(
      (preset) => preset.key === warrantyPreset,
    );

    if (returnConfig?.days) {
      const next = toInputDate(addDays(baseDate, returnConfig.days));
      if (form.return_deadline !== next) patch.return_deadline = next;
      if (!form.purchase_date) patch.purchase_date = toInputDate(baseDate);
    }

    if (warrantyConfig?.years) {
      const next = toInputDate(addYears(baseDate, warrantyConfig.years));
      if (form.warranty_deadline !== next) patch.warranty_deadline = next;
      if (!form.purchase_date) patch.purchase_date = toInputDate(baseDate);
    }

    if (Object.keys(patch).length > 0) {
      onChange({ ...form, ...patch });
    }
  }, [form, onChange, returnPreset, warrantyPreset]);

  function updateFields(patch: Partial<ReceiptFormState>) {
    onChange({ ...form, ...patch });
  }

  function chooseReturnPreset(nextPreset: Exclude<ReturnWindowPreset, null>) {
    setReturnPreset(nextPreset);

    if (nextPreset === "custom") return;
    if (nextPreset === "none") {
      updateFields({ return_deadline: "" });
      return;
    }

    const preset = RETURN_PRESETS.find((item) => item.key === nextPreset);
    if (!preset?.days) return;

    const baseDate = purchaseBaseDate(form.purchase_date);
    updateFields({
      purchase_date: form.purchase_date || toInputDate(baseDate),
      return_deadline: toInputDate(addDays(baseDate, preset.days)),
    });
  }

  function chooseWarrantyPreset(nextPreset: WarrantyPreset) {
    setWarrantyPreset(nextPreset);

    if (nextPreset === "custom") return;
    if (nextPreset === "unsure" || nextPreset === "none") {
      updateFields({ warranty_deadline: "" });
      return;
    }

    const preset = WARRANTY_PRESETS.find((item) => item.key === nextPreset);
    if (!preset?.years) return;

    const baseDate = purchaseBaseDate(form.purchase_date);
    updateFields({
      purchase_date: form.purchase_date || toInputDate(baseDate),
      warranty_deadline: toInputDate(addYears(baseDate, preset.years)),
    });
  }

  return (
    <>
      <EditorSection
        ref={returnSectionRef}
        title="Refund Policy"
        description="Choose the store return window. Presets calculate from the purchase date, using today when the purchase date is blank."
        highlighted={attention === "return_deadline"}
        helper={
          attention === "return_deadline"
            ? "This active receipt needs a return window before deadline alerts can work."
            : undefined
        }
      >
        <PresetGroup
          label="Return Window"
          value={returnPreset}
          options={RETURN_PRESETS}
          onSelect={chooseReturnPreset}
        />
        <p className="text-xs text-text-secondary">
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
                updateFields({ return_deadline: event.target.value })
              }
              type="date"
            />
          </Field>
        ) : null}
      </EditorSection>

      <EditorSection
        ref={warrantySectionRef}
        title="Manufacturer Warranty"
        description="Track product coverage separately from the retailer refund period."
        highlighted={attention === "warranty_deadline"}
        helper={
          attention === "warranty_deadline"
            ? "Add the warranty deadline to move this product out of review."
            : undefined
        }
      >
        <PresetGroup
          label="Warranty"
          value={warrantyPreset}
          options={WARRANTY_PRESETS}
          onSelect={chooseWarrantyPreset}
        />
        <p className="text-xs text-text-secondary">
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
                updateFields({ warranty_deadline: event.target.value })
              }
              type="date"
            />
          </Field>
        ) : null}
      </EditorSection>
    </>
  );
}

const EditorSection = forwardRef<
  HTMLDivElement,
  {
    title: string;
    description: string;
    children: ReactNode;
    highlighted?: boolean;
    helper?: string;
  }
>(function EditorSection(
  { title, description, children, highlighted = false, helper },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(
        "grid gap-3 rounded-md border border-border bg-canvas p-4",
        highlighted && "border-warning bg-surface",
      )}
    >
      <div className="grid gap-1">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="text-xs leading-5 text-text-secondary">{description}</p>
        {helper ? (
          <p className="rounded-sm border border-warning bg-surface px-3 py-2 text-xs text-warning">
            {helper}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
});

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
      <p className="text-xs font-medium text-text-primary">{label}</p>
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

function SyncStatusBadge({
  state,
  lastSyncedAt,
}: {
  state: SyncState;
  lastSyncedAt: string | null;
}) {
  const label =
    state === "live"
      ? "Live"
      : state === "syncing"
        ? "Syncing"
        : state === "connecting"
          ? "Connecting"
          : "Auto-refresh";

  return (
    <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs text-text-secondary sm:inline-flex">
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-pill",
          state === "live" && "bg-success",
          state === "syncing" && "bg-accent",
          state === "connecting" && "bg-warning",
          state === "polling" && "bg-text-muted",
        )}
      />
      <span className="font-medium text-text-primary">{label}</span>
      {lastSyncedAt ? (
        <span className="text-text-muted">Updated {lastSyncedAt}</span>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-text-primary">
      {label}
      {children}
    </label>
  );
}
