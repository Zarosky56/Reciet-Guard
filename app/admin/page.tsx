import Link from "next/link";
import { Activity, ShieldAlert, UserRoundSearch } from "lucide-react";

import {
  AdminEmptyState,
  AdminPageHeader,
  auditActionMeta,
  formatRelative,
  StatCard,
  UserStatusBadge,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOverviewStats, listAuditLog, listUsers } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

/**
 * /admin — operational overview. The page gives admins a quick read on
 * access posture, recent users, and the audit trail before sending
 * mutation work to user detail pages.
 */
export default async function AdminOverviewPage() {
  const [stats, recentUsers, recentAudit] = await Promise.all([
    getOverviewStats(),
    listUsers({ page: 1 }),
    listAuditLog({ page: 1 }),
  ]);

  const posture =
    stats.bannedUsers > 0 || stats.unconfirmedUsers > 0
      ? "Review needed"
      : "Calm";

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        eyebrow="Admin"
        title="Operations console"
        description="Review account health, privilege changes, and recent admin activity without leaving the product surface."
        actions={
          <Button asChild type="button" variant="secondary" size="sm">
            <Link href="/admin/audit">
              <Activity data-icon aria-hidden="true" />
              Audit log
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-5 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    posture === "Review needed" ? "warning" : "success"
                  }
                >
                  <span>{posture}</span>
                </Badge>
                <span className="text-xs text-text-muted">
                  {stats.auditEvents7d} audit event
                  {stats.auditEvents7d === 1 ? "" : "s"} in 7 days
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                Start with access exceptions, then review recent signups and
                privilege-sensitive audit entries. Changes stay on the user
                detail page so every action has context.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" variant="primary" size="sm">
                <Link href="/admin/users">
                  <UserRoundSearch data-icon aria-hidden="true" />
                  Review users
                </Link>
              </Button>
              <Button asChild type="button" variant="secondary" size="sm">
                <Link href="/admin/users?status=banned">
                  <ShieldAlert data-icon aria-hidden="true" />
                  Access exceptions
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Users
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text-primary">
                {stats.totalUsers}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                {stats.newUsers7d} new in 7 days
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Access review
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text-primary">
                {stats.bannedUsers + stats.unconfirmedUsers}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                banned or unconfirmed
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Admins
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text-primary">
                {stats.admins}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                privileged accounts
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Active receipts
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text-primary">
                {stats.activeReceipts}
              </p>
              <p className="mt-2 text-xs text-text-muted">
                of {stats.totalReceipts} total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Banned" value={stats.bannedUsers} hint="Blocked" />
        <StatCard
          label="Unconfirmed"
          value={stats.unconfirmedUsers}
          hint="Email pending"
        />
        <StatCard
          label="New users"
          value={stats.newUsers7d}
          hint="Last 7 days"
        />
        <StatCard
          label="Audit events"
          value={stats.auditEvents7d}
          hint="Last 7 days"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Recent signups
            </h2>
            <Button asChild type="button" variant="ghost" size="sm">
              <Link href="/admin/users">View all</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentUsers.users.length === 0 ? (
                <AdminEmptyState
                  title="No users yet"
                  description="New accounts will appear here as soon as people sign up."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recentUsers.users.slice(0, 6).map((user) => (
                    <li key={user.id}>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center justify-between gap-3 px-5 py-3 transition-colors duration-default ease-standard hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-text-primary">
                            {user.email ?? "No email"}
                          </span>
                          <span className="block text-xs text-text-muted">
                            joined {formatRelative(user.created_at)}
                          </span>
                        </span>
                        <UserStatusBadge user={user} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-text-primary">
              Recent activity
            </h2>
            <Button asChild type="button" variant="ghost" size="sm">
              <Link href="/admin/audit">View log</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {recentAudit.entries.length === 0 ? (
                <AdminEmptyState
                  title="No activity recorded"
                  description="Admin actions and key account events will be listed here."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {recentAudit.entries.slice(0, 6).map((entry) => {
                    const meta = auditActionMeta(entry.action);
                    return (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <Badge variant={meta.variant}>
                              <span>{meta.label}</span>
                            </Badge>
                          </span>
                          <span className="mt-1 block truncate text-xs text-text-muted">
                            {entry.actor_email ?? "system"}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-text-muted">
                          {formatRelative(entry.created_at)}
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
