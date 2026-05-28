import { cn } from "@/lib/utils/cn";

/**
 * Premium UI Redesign — `<Loader>` primitive (task 5.3 / 11.3).
 *
 * The single coherent loading vocabulary (Requirements 6.8, 8.6, 14.4):
 * a 6px static accent dot followed by a label. The dot is intentionally
 * static — the "in progress" signal lives in the label state change
 * ("Save" → "Saving…"), not in an indeterminate loop.
 *
 * The only permitted indeterminate loop in the redesigned Motion_Language
 * is `<RouteProgress>` (task 5.11), per Requirement 6.8. Every other
 * pending/in-flight UI uses this static `<Loader>`.
 *
 * Reduced-motion users see no change because nothing is animated here.
 *
 * Sizes:
 *   - `sm` — for inline use inside buttons or tight chrome (`text-xs`).
 *   - `md` — for standalone loaders inside cards / overlays (`text-sm`).
 *
 * Phase 4 cleanup (task 11.3) removed the `<ButtonLoader>` compatibility
 * shim. The legacy `<ButtonLoader variant="…" />` call sites in
 * `auth-form.tsx`, `receipt-dashboard.tsx`, `receipt-card.tsx`,
 * `dashboard-header.tsx`, `logout-section.tsx`, `test-extraction-form.tsx`,
 * and the route-level `loading.tsx` files were migrated to
 * `<Loader size="sm" />` (or `<Loader size="md" />` for standalone
 * placements) during Phase 2/3.
 */
export interface LoaderProps {
  /**
   * Status label rendered next to the accent dot. Pass an empty string
   * to render only the dot when the consumer renders the label as a
   * sibling text node (e.g. inside a button alongside its text).
   */
  label: string;
  /** `sm` for inline-in-button use, `md` for standalone use. */
  size?: "sm" | "md";
  className?: string;
}

export function Loader({ label, size = "md", className }: LoaderProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2",
        size === "sm" ? "text-xs" : "text-sm",
        "text-text-secondary",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="size-1.5 shrink-0 rounded-pill bg-accent"
      />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Compatibility shims — phased migration.                            */
/*                                                                    */
/* Task 11.3 deleted the `<ButtonLoader>` shim. The shims below are   */
/* the remaining holdovers from task 5.3's pre-redesign loader        */
/* vocabulary and are kept until their final consumers migrate to the */
/* canonical `<Loader>` API.                                          */
/* ------------------------------------------------------------------ */

/**
 * Legacy variant union. Kept for shim type compatibility only.
 */
type LegacyLoaderVariant =
  | "auth"
  | "inbox"
  | "extract"
  | "save"
  | "update"
  | "delete"
  | "logout";

const legacyVariantLabel: Record<LegacyLoaderVariant, string> = {
  auth: "Verifying your account",
  inbox: "Scanning your inbox",
  extract: "Reading receipt text",
  save: "Adding receipt",
  update: "Updating receipt",
  delete: "Removing receipt",
  logout: "Signing out",
};

/**
 * @deprecated Use `<Loader size="sm" />` directly. The legacy
 * `<ProcessRail />` API is preserved as a shim during the phased
 * migration.
 */
export function ProcessRail({ className }: { className?: string }) {
  return <Loader size="sm" label="" className={className} />;
}

/**
 * @deprecated Use `<Loader size="sm" />` directly. The legacy
 * `<ProcessSteps />` API is preserved as a shim during the phased
 * migration.
 */
export function ProcessSteps({ className }: { className?: string }) {
  return <Loader size="sm" label="" className={className} />;
}

/**
 * @deprecated Use `<Loader />` directly. The legacy
 * `<ActionLoader variant="…" title="…" description="…" compact />` API
 * is preserved as a shim during the phased migration. The `description`
 * prop is dropped — the redesigned vocabulary carries one label per
 * loader (Requirement 8.6).
 */
export function ActionLoader({
  variant,
  title,
  description: _description,
  compact = false,
  className,
}: {
  variant: LegacyLoaderVariant;
  title?: string;
  description?: string;
  compact?: boolean;
  className?: string;
}) {
  void _description;
  const label = title ?? legacyVariantLabel[variant];
  return (
    <Loader
      size={compact ? "sm" : "md"}
      label={label}
      className={className}
    />
  );
}

/**
 * @deprecated Use `<Loader size="sm" />` directly. The legacy
 * `<CardActionLoader variant="update|delete" label="…" />` API is
 * preserved as a shim during the phased migration.
 */
export function CardActionLoader({
  variant: _variant,
  label,
  className,
}: {
  variant: "update" | "delete";
  label: string;
  className?: string;
}) {
  void _variant;
  return <Loader size="sm" label={label} className={className} />;
}
