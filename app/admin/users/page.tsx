import Link from "next/link";

import { AdminUserSearch } from "@/components/admin/admin-user-search";
import {
  AdminEmptyState,
  AdminFilterLink,
  AdminPageHeader,
  formatRelative,
  UserStatusBadge,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserStatusCounts, listUsers } from "@/lib/admin/queries";
import type { AdminUserStatusFilter } from "@/types/admin";

export const dynamic = "force-dynamic";

interface SearchParams {
  searchParams: Promise<{
    q?: string;
    page?: string;
    status?: string;
  }>;
}

const statusFilters: Array<{
  value: AdminUserStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "admin", label: "Admins" },
  { value: "banned", label: "Banned" },
  { value: "unconfirmed", label: "Unconfirmed" },
];

function normalizeStatus(status: string | undefined): AdminUserStatusFilter {
  return statusFilters.some((item) => item.value === status)
    ? (status as AdminUserStatusFilter)
    : "all";
}

function buildUsersHref({
  q,
  page,
  status,
}: {
  q?: string;
  page?: number;
  status?: AdminUserStatusFilter;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/admin/users?${qs}` : "/admin/users";
}

/**
 * /admin/users — searchable, paginated users index with status filters.
 * Each row links to the detail page where mutations live.
 */
export default async function AdminUsersPage({ searchParams }: SearchParams) {
  const { q = "", page = "1", status: statusParam } = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const status = normalizeStatus(statusParam);
  const [result, counts] = await Promise.all([
    listUsers({ page: pageNum, search: q, status }),
    getUserStatusCounts(),
  ]);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Admin users"
        title="User management"
        description={`${result.total} matching account${
          result.total === 1 ? "" : "s"
        } on page ${result.page}. Search and filter first, then open a row for account actions.`}
        actions={<AdminUserSearch initialQuery={q} status={status} />}
      />

      <div
        role="group"
        aria-label="Filter users"
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {statusFilters.map((filter) => (
          <AdminFilterLink
            key={filter.value}
            href={buildUsersHref({ q, status: filter.value })}
            active={status === filter.value}
            label={filter.label}
            count={counts[filter.value]}
          />
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {result.users.length === 0 ? (
            <AdminEmptyState
              title="No matching users"
              description={
                q
                  ? `No users match "${q}" with the selected filter.`
                  : "No users match the selected filter."
              }
              action={
                q || status !== "all" ? (
                  <Button asChild type="button" variant="secondary" size="sm">
                    <Link href="/admin/users">Reset filters</Link>
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {result.users.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors duration-default ease-standard hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-border-focus sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text-primary">
                        {user.email ?? "No email"}
                      </span>
                      <span className="block text-xs text-text-muted">
                        joined {formatRelative(user.created_at)} - last seen{" "}
                        {formatRelative(user.last_sign_in_at)}
                      </span>
                    </div>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-text-muted">
                        {user.receipt_count} receipt
                        {user.receipt_count === 1 ? "" : "s"}
                      </span>
                      <UserStatusBadge user={user} />
                    </span>
                  </Link>
                </li>
              ))}
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
            <Link href={buildUsersHref({ q, status, page: pageNum - 1 })}>
              Previous
            </Link>
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
            <Link href={buildUsersHref({ q, status, page: pageNum + 1 })}>
              Next
            </Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  );
}
