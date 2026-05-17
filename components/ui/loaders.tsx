import {
  Inbox,
  LogOut,
  MailSearch,
  Plus,
  ReceiptText,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils/cn";

type LoaderVariant = "auth" | "inbox" | "extract" | "save" | "update" | "delete" | "logout";

const loaderCopy: Record<
  LoaderVariant,
  { title: string; description: string; icon: typeof ReceiptText }
> = {
  auth: {
    title: "Verifying your account",
    description: "Account, session, dashboard",
    icon: ReceiptText,
  },
  inbox: {
    title: "Scanning your inbox",
    description: "Finding invoices, receipts, and return windows",
    icon: Inbox,
  },
  extract: {
    title: "Reading receipt text",
    description: "Store, price, dates, and deadlines",
    icon: MailSearch,
  },
  save: {
    title: "Adding receipt",
    description: "Saving fields and sorting deadlines",
    icon: Plus,
  },
  update: {
    title: "Updating receipt",
    description: "Syncing changes across the dashboard",
    icon: RefreshCw,
  },
  delete: {
    title: "Removing receipt",
    description: "Clearing it from your dashboard",
    icon: Trash2,
  },
  logout: {
    title: "Signing out",
    description: "Ending session securely",
    icon: LogOut,
  },
};

function ScanGlyph({
  variant,
  size = "default",
}: {
  variant: LoaderVariant;
  size?: "default" | "compact";
}) {
  const Icon = loaderCopy[variant].icon;
  const isCompact = size === "compact";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-bg-elevated text-action shadow-inner-hair",
        isCompact ? "size-4 rounded-md" : "size-11 rounded-xl",
      )}
      aria-hidden="true"
    >
      <Icon className={cn(isCompact ? "size-3" : "size-5")} />
      <span
        className={cn(
          "absolute left-1.5 right-1.5 h-px bg-action shadow-[0_0_10px_rgba(91,140,255,0.7)]",
          "animate-ledger-scan",
          variant === "delete" ? "bg-danger" : "bg-action",
        )}
      />
    </span>
  );
}

export function ButtonLoader({
  variant,
  className,
}: {
  variant: LoaderVariant;
  className?: string;
}) {
  const Icon = loaderCopy[variant].icon;

  return (
    <span
      data-icon
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center overflow-hidden text-current",
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="size-4" />
      <span className="absolute left-0.5 right-0.5 h-px bg-current/85 animate-ledger-scan" />
    </span>
  );
}

export function ProcessRail({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative block h-1 w-full overflow-hidden rounded-full bg-bg",
        className,
      )}
      aria-hidden="true"
    >
      <span className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-action/80 shadow-[0_0_12px_rgba(91,140,255,0.55)] animate-loader-rail" />
    </span>
  );
}

export function ProcessSteps({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-hidden="true"
    >
      <span className="size-1.5 rounded-full bg-action animate-loader-step" />
      <span className="h-px w-8 bg-border" />
      <span className="size-1.5 rounded-full bg-action animate-loader-step [animation-delay:160ms]" />
      <span className="h-px w-8 bg-border" />
      <span className="size-1.5 rounded-full bg-action animate-loader-step [animation-delay:320ms]" />
    </span>
  );
}

export function ActionLoader({
  variant,
  title,
  description,
  compact = false,
  className,
}: {
  variant: LoaderVariant;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}) {
  const copy = loaderCopy[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-bg-elevated/70 shadow-inner-hair",
        compact ? "p-3" : "p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <ScanGlyph variant={variant} size={compact ? "compact" : "default"} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">
            {title ?? copy.title}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {description ?? copy.description}
          </p>
        </div>
      </div>
      <ProcessRail className="mt-3" />
    </div>
  );
}

export function CardActionLoader({
  variant,
  label,
  className,
}: {
  variant: Extract<LoaderVariant, "update" | "delete">;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "mt-4 rounded-lg border border-border bg-bg-elevated/70 p-3 shadow-inner-hair",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium text-text-secondary">
          <ButtonLoader variant={variant} />
          {label}
        </span>
        <ProcessSteps />
      </div>
    </div>
  );
}
