import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminUserControls } from "@/components/admin/admin-user-controls";
import {
  AdminEmptyState,
  AdminPageHeader,
  auditActionMeta,
  auditMetadataSummary,
  formatDateTime,
  formatRelative,
  StatCard,
  UserStatusBadge,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getUserDetail,
  getUserReceipts,
  listAuditLog,
} from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ id: string }>;
}

function formatMoney(price: number | null, currency: string | null) {
  if (price === null) return "-";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

/**
 * /admin/users/[id] — single user detail. Shows account metadata,
 * their receipts, a slice of audit entries targeting them, and the
 * mutation controls (ban/unban, role, password reset, delete).
 */
export default async function AdminUserDetailPage({ params }: Params) {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await getUserDetail(id);
  if (!user) notFound();

  const [receipts, audit] = await Promise.all([
    getUserReceipts(id),
    listAuditLog({ page: 1, targetId: id }),
  ]);

  const isSelf = id === admin.id;

  return (
    <div className="grid gap-8">
      {/* Back link */}
      <div>
        <Button asChild type="button" variant="ghost" size="sm">
          <Link href="/admin/users">
            <ArrowLeft data-icon aria-hidden="true" />
            Back to users
          </Link>
        </Button>
      </div>

      {/* Header */}
      <AdminPageHeader
        eyebrow="User detail"
        title={user.email ?? "Unknown user"}
        description="Inspect account state, receipts, and targeted audit events before taking access actions."
        actions={
          <div className="flex flex-wrap gap-2">
            <UserStatusBadge user={user} />
            {isSelf ? (
              <Badge>
                <span>You</span>
              </Badge>
            ) : null}
          </div>
        }
      />

      {/* Account stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Role" value={user.role} />
        <StatCard label="Receipts" value={user.receipt_count} />
        <StatCard
          label="Email"
          value={user.email_confirmed ? "Confirmed" : "Unconfirmed"}
        />
        <StatCard
          label="Last seen"
          value={formatRelative(user.last_sign_in_at)}
        />
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">
              User ID
            </p>
            <p className="mt-2 truncate font-mono text-xs text-text-primary">
              {user.id}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Created
            </p>
            <p className="mt-2 text-sm text-text-primary">
              {formatDateTime(user.created_at)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Last sign-in
            </p>
            <p className="mt-2 text-sm text-text-primary">
              {formatDateTime(user.last_sign_in_at)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">
              Ban expires
            </p>
            <p className="mt-2 text-sm text-text-primary">
              {formatDateTime(user.banned_until)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <section className="grid gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Manage access
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            High-risk changes are confirmed and written to the audit log.
          </p>
        </div>
        <Card>
          <CardContent className="p-5">
            <AdminUserControls
              userId={user.id}
              email={user.email}
              role={user.role}
              bannedUntil={user.banned_until}
              isSelf={isSelf}
            />
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Receipts */}
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Receipts ({user.receipt_count})
          </h2>
          <Card>
            <CardContent className="p-0">
              {receipts.length === 0 ? (
                <AdminEmptyState
                  title="No receipts"
                  description="Receipts created by this user will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {receipts.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-text-primary">
                          {r.item_name ?? "Unnamed item"}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {r.store_name ?? "Unknown store"} - {r.status}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-sm tabular-nums text-text-primary">
                        {formatMoney(r.price, r.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Audit slice */}
        <section className="grid gap-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Activity targeting this user
          </h2>
          <Card>
            <CardContent className="p-0">
              {audit.entries.length === 0 ? (
                <AdminEmptyState
                  title="No targeted activity"
                  description="Admin actions targeting this user will appear here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {audit.entries.map((entry) => {
                    const meta = auditActionMeta(entry.action);
                    const summary = auditMetadataSummary(entry.metadata);
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <span className="min-w-0">
                          <Badge variant={meta.variant}>
                            <span>{meta.label}</span>
                          </Badge>
                          <span className="mt-1 block truncate text-xs text-text-muted">
                            by {entry.actor_email ?? "system"}
                            {summary ? ` - ${summary}` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-text-muted">
                          {formatDateTime(entry.created_at)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
