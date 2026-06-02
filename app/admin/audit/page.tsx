import Link from "next/link";

import {
  AdminEmptyState,
  AdminFilterLink,
  AdminPageHeader,
  auditActionMeta,
  auditMetadataSummary,
  formatDateTime,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listAuditLog } from "@/lib/admin/queries";
import { AUDIT_ACTIONS } from "@/types/admin";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: Promise<{ page?: string; action?: string }>;
}

const auditFilters: Array<{ label: string; action?: string }> = [
  { label: "All" },
  { label: "Access revoked", action: AUDIT_ACTIONS.userBanned },
  { label: "Access restored", action: AUDIT_ACTIONS.userUnbanned },
  { label: "Role changes", action: AUDIT_ACTIONS.userRoleChanged },
  { label: "Password resets", action: AUDIT_ACTIONS.userPasswordResetSent },
  { label: "Sign-ins", action: AUDIT_ACTIONS.authLogin },
];

function buildAuditHref(nextPage: number, action?: string) {
  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (nextPage > 1) params.set("page", String(nextPage));
  const qs = params.toString();
  return qs ? `/admin/audit?${qs}` : "/admin/audit";
}

/**
 * /admin/audit — full audit feed, newest first, with action filters.
 */
export default async function AdminAuditPage({ searchParams }: SearchParams) {
  const { page = "1", action } = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const result = await listAuditLog({ page: pageNum, action });

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Admin audit"
        title="Audit log"
        description="Trace high-risk admin actions, account events, targets, and request context from newest to oldest."
      />

      <div
        role="group"
        aria-label="Filter audit log"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {auditFilters.map((filter) => (
          <AdminFilterLink
            key={filter.action ?? "all"}
            href={buildAuditHref(1, filter.action)}
            active={action === filter.action || (!action && !filter.action)}
            label={filter.label}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {result.entries.length === 0 ? (
            <AdminEmptyState
              title="No audit entries"
              description={
                action
                  ? "No entries match the selected action filter."
                  : "Admin actions and key account events will appear here."
              }
              action={
                action ? (
                  <Button asChild type="button" variant="secondary" size="sm">
                    <Link href="/admin/audit">Reset filter</Link>
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {result.entries.map((entry) => {
                const meta = auditActionMeta(entry.action);
                const summary = auditMetadataSummary(entry.metadata);
                return (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={meta.variant}>
                          <span>{meta.label}</span>
                        </Badge>
                        <span className="truncate text-sm text-text-primary">
                          {entry.actor_email ?? "system"}
                        </span>
                      </div>
                      <p className="mt-2 truncate text-xs text-text-muted">
                        {entry.target_type ? `${entry.target_type} ` : ""}
                        {entry.target_id ? (
                          entry.target_type === "user" ? (
                            <Link
                              href={`/admin/users/${entry.target_id}`}
                              className="font-mono underline-offset-2 hover:underline"
                            >
                              {entry.target_id.slice(0, 8)}
                            </Link>
                          ) : (
                            <span className="font-mono">
                              {entry.target_id.slice(0, 8)}
                            </span>
                          )
                        ) : null}
                        {summary ? ` - ${summary}` : ""}
                      </p>
                      {entry.ip_address || entry.user_agent ? (
                        <p className="mt-1 truncate text-xs text-text-muted">
                          {entry.ip_address ?? "unknown IP"}
                          {entry.user_agent ? ` - ${entry.user_agent}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-text-muted lg:text-right">
                      {formatDateTime(entry.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          asChild={pageNum > 1}
          type="button"
          variant="secondary"
          size="sm"
          disabled={pageNum <= 1}
        >
          {pageNum > 1 ? (
            <Link href={buildAuditHref(pageNum - 1, action)}>Previous</Link>
          ) : (
            <span>Previous</span>
          )}
        </Button>
        <span className="text-xs text-text-muted">Page {pageNum}</span>
        <Button
          asChild={result.hasMore}
          type="button"
          variant="secondary"
          size="sm"
          disabled={!result.hasMore}
        >
          {result.hasMore ? (
            <Link href={buildAuditHref(pageNum + 1, action)}>Next</Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  );
}
