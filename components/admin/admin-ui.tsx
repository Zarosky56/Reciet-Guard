import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { AdminUserRow } from "@/types/admin";

/**
 * Shared presentational atoms for the admin area. Server-safe (no
 * "use client") so they can render inside server components.
 */

/** Compact KPI tile — follows the COMPONENT_PATTERNS Stat Card. */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="grid gap-2 p-4">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          {label}
        </p>
        <p className="font-mono text-xl font-semibold tabular-nums text-text-primary">
          {value}
        </p>
        {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

export function AdminFilterLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-2 rounded-sm border px-3 text-xs font-medium",
        "transition-colors duration-default ease-standard",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
        active
          ? "border-border-strong bg-accent-tint text-text-primary"
          : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-hover hover:text-text-primary",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="font-mono tabular-nums text-text-muted">{count}</span>
      ) : null}
    </Link>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="mt-1 max-w-sm text-sm leading-6 text-text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

export function auditActionMeta(action: string): {
  label: string;
  variant: "default" | "success" | "warning" | "danger";
} {
  switch (action) {
    case "user.banned":
      return { label: "Access revoked", variant: "danger" };
    case "user.unbanned":
      return { label: "Access restored", variant: "success" };
    case "user.role_changed":
      return { label: "Role changed", variant: "warning" };
    case "user.password_reset_sent":
      return { label: "Reset sent", variant: "default" };
    case "user.deleted":
      return { label: "User deleted", variant: "danger" };
    case "auth.login":
      return { label: "Signed in", variant: "default" };
    case "auth.logout":
      return { label: "Signed out", variant: "default" };
    default:
      return { label: action, variant: "default" };
  }
}

export function auditMetadataSummary(
  metadata: Record<string, unknown>,
): string | null {
  if (metadata.from && metadata.to) {
    return `${metadata.from} to ${metadata.to}`;
  }
  if (typeof metadata.email === "string") {
    return metadata.email;
  }
  return null;
}

/** True when the ban timestamp is in the future. */
export function isBanned(user: Pick<AdminUserRow, "banned_until">): boolean {
  return (
    user.banned_until !== null &&
    new Date(user.banned_until).getTime() > Date.now()
  );
}

/** Status chip for a user row — banned / admin / active. */
export function UserStatusBadge({ user }: { user: AdminUserRow }) {
  if (isBanned(user)) {
    return (
      <Badge variant="danger">
        <span>Banned</span>
      </Badge>
    );
  }
  if (user.role === "admin") {
    return (
      <Badge variant="warning">
        <span>Admin</span>
      </Badge>
    );
  }
  if (!user.email_confirmed) {
    return (
      <Badge>
        <span>Unconfirmed</span>
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <span>Active</span>
    </Badge>
  );
}

/** Format an ISO timestamp as a short, human date-time. */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Format an ISO timestamp as a relative "time ago" string. */
export function formatRelative(iso: string | null): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "-";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

/** Cell wrapper that truncates long values. */
export function Truncate({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("block truncate", className)}>{children}</span>;
}
