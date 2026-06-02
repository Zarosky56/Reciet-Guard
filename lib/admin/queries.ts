import "server-only";

import type { User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AdminUserStatusFilter,
  AdminOverviewStats,
  AdminUserRow,
  AuditLogEntry,
  UserRole,
} from "@/types/admin";

/**
 * Admin data-access layer. Every function here uses the
 * service-role client (bypasses RLS) and is only ever called from
 * code already gated by `requireAdmin()`. Never import this into a
 * client component.
 */

const PAGE_SIZE = 25;

interface ListUsersParams {
  page?: number;
  search?: string;
  status?: AdminUserStatusFilter;
}

interface ListUsersResult {
  users: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface UserStatusCounts {
  all: number;
  active: number;
  admin: number;
  banned: number;
  unconfirmed: number;
}

function isBannedUntilActive(bannedUntil: string | null): boolean {
  return bannedUntil !== null && new Date(bannedUntil).getTime() > Date.now();
}

function matchesStatus(
  user: AdminUserRow,
  status: AdminUserStatusFilter,
): boolean {
  switch (status) {
    case "active":
      return (
        user.role !== "admin" &&
        user.email_confirmed &&
        !isBannedUntilActive(user.banned_until)
      );
    case "admin":
      return user.role === "admin";
    case "banned":
      return isBannedUntilActive(user.banned_until);
    case "unconfirmed":
      return !user.email_confirmed;
    case "all":
    default:
      return true;
  }
}

function countStatuses(users: AdminUserRow[]): UserStatusCounts {
  return {
    all: users.length,
    active: users.filter((user) => matchesStatus(user, "active")).length,
    admin: users.filter((user) => matchesStatus(user, "admin")).length,
    banned: users.filter((user) => matchesStatus(user, "banned")).length,
    unconfirmed: users.filter((user) => matchesStatus(user, "unconfirmed"))
      .length,
  };
}

function authTotal(data: { users: User[] } & Partial<{ total: number }>) {
  return typeof data.total === "number" ? data.total : data.users.length;
}

async function mergeAuthUsers(authUsers: User[]): Promise<AdminUserRow[]> {
  const supabase = createAdminClient();
  const ids = authUsers.map((u) => u.id);
  const roleMap = new Map<string, UserRole>();
  const receiptCountMap = new Map<string, number>();

  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, role")
      .in("id", ids);
    profiles?.forEach((p) => {
      roleMap.set(p.id, (p.role as UserRole) ?? "user");
    });

    const { data: receipts } = await supabase
      .from("receipts")
      .select("user_id")
      .in("user_id", ids);
    receipts?.forEach((r) => {
      receiptCountMap.set(
        r.user_id,
        (receiptCountMap.get(r.user_id) ?? 0) + 1,
      );
    });
  }

  const merged: AdminUserRow[] = authUsers.map((u) => {
    const meta = u as typeof u & { banned_until?: string | null };
    return {
      id: u.id,
      email: u.email ?? null,
      role: roleMap.get(u.id) ?? "user",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned_until: meta.banned_until ?? null,
      email_confirmed: Boolean(u.email_confirmed_at),
      receipt_count: receiptCountMap.get(u.id) ?? 0,
    };
  });

  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return merged;
}

/**
 * List users by joining Supabase Auth (`auth.admin.listUsers`) with
 * the `profiles` role column and a per-user receipt count. Auth's
 * admin API owns email / last-sign-in / ban state; profiles owns
 * role. We merge them in memory (fine for the MVP user volume).
 */
export async function listUsers({
  page = 1,
  search = "",
  status = "all",
}: ListUsersParams = {}): Promise<ListUsersResult> {
  const supabase = createAdminClient();

  // Auth admin listUsers is 1-indexed and paginates server-side, but
  // it doesn't support search. For the MVP volume we pull a page at a
  // time; when searching/filtering we scan a few pages and filter in
  // memory.
  const term = search.trim().toLowerCase();
  const shouldScan = term.length > 0 || status !== "all";

  // Pull auth users (filtered views scan up to 1000; plain listing uses
  // the requested page).
  const authPage = shouldScan ? 1 : page;
  const perPage = shouldScan ? 200 : PAGE_SIZE;

  const { data: authData, error: authError } =
    await supabase.auth.admin.listUsers({ page: authPage, perPage });

  if (authError) {
    throw new Error(`listUsers (auth) failed: ${authError.message}`);
  }

  let authUsers = authData.users;

  if (shouldScan) {
    let extraPage = 2;
    while (authData.users.length === perPage && extraPage <= 5) {
      const { data: more } = await supabase.auth.admin.listUsers({
        page: extraPage,
        perPage,
      });
      if (!more || more.users.length === 0) break;
      authUsers = authUsers.concat(more.users);
      if (more.users.length < perPage) break;
      extraPage += 1;
    }
  }

  let merged = await mergeAuthUsers(authUsers);
  merged = merged.filter((user) => {
    const emailMatches =
      term.length === 0 || (user.email ?? "").toLowerCase().includes(term);
    return emailMatches && matchesStatus(user, status);
  });

  if (shouldScan) {
    // Manual pagination over the filtered set.
    const start = (page - 1) * PAGE_SIZE;
    const slice = merged.slice(start, start + PAGE_SIZE);
    return {
      users: slice,
      total: merged.length,
      page,
      pageSize: PAGE_SIZE,
      hasMore: start + PAGE_SIZE < merged.length,
    };
  }

  return {
    users: merged,
    total: authTotal(authData),
    page,
    pageSize: PAGE_SIZE,
    hasMore: authUsers.length === PAGE_SIZE,
  };
}

export async function getUserStatusCounts(): Promise<UserStatusCounts> {
  const supabase = createAdminClient();
  const perPage = 200;
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage,
  });

  if (error) {
    throw new Error(`getUserStatusCounts failed: ${error.message}`);
  }

  let authUsers = data.users;
  let extraPage = 2;
  while (data.users.length === perPage && extraPage <= 5) {
    const { data: more } = await supabase.auth.admin.listUsers({
      page: extraPage,
      perPage,
    });
    if (!more || more.users.length === 0) break;
    authUsers = authUsers.concat(more.users);
    if (more.users.length < perPage) break;
    extraPage += 1;
  }

  return countStatuses(await mergeAuthUsers(authUsers));
}

/** Fetch a single user with their profile role + receipt count. */
export async function getUserDetail(
  userId: string,
): Promise<AdminUserRow | null> {
  const supabase = createAdminClient();

  const { data: authData, error } =
    await supabase.auth.admin.getUserById(userId);
  if (error || !authData.user) return null;

  const u = authData.user;
  const meta = u as typeof u & { banned_until?: string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const { count } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    id: u.id,
    email: u.email ?? null,
    role: (profile?.role as UserRole) ?? "user",
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
    banned_until: meta.banned_until ?? null,
    email_confirmed: Boolean(u.email_confirmed_at),
    receipt_count: count ?? 0,
  };
}

/** Recent receipts for a single user (admin view). */
export async function getUserReceipts(userId: string, limit = 20) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("receipts")
    .select(
      "id, store_name, item_name, price, currency, status, purchase_date, return_deadline, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Overview KPIs for the /admin landing page. */
export async function getOverviewStats(): Promise<AdminOverviewStats> {
  const supabase = createAdminClient();

  const { data: authData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  const totalUsers = authData ? authTotal(authData) : 0;

  const { count: admins } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const { count: totalReceipts } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true });

  const { count: activeReceipts } = await supabase
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // New users in the last 7 days + banned count require scanning the
  // auth list; pull one wide page (MVP volume).
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  let newUsers7d = 0;
  let bannedUsers = 0;
  let unconfirmedUsers = 0;
  const { data: wide } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  wide?.users.forEach((u) => {
    if (new Date(u.created_at).getTime() >= sevenDaysAgo) newUsers7d += 1;
    const meta = u as typeof u & { banned_until?: string | null };
    if (meta.banned_until && new Date(meta.banned_until).getTime() > Date.now()) {
      bannedUsers += 1;
    }
    if (!u.email_confirmed_at) unconfirmedUsers += 1;
  });

  const { count: auditEvents7d } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(sevenDaysAgo).toISOString());

  return {
    totalUsers,
    admins: admins ?? 0,
    bannedUsers,
    unconfirmedUsers,
    newUsers7d,
    totalReceipts: totalReceipts ?? 0,
    activeReceipts: activeReceipts ?? 0,
    auditEvents7d: auditEvents7d ?? 0,
  };
}

interface ListAuditParams {
  page?: number;
  action?: string;
  actorId?: string;
  targetId?: string;
}

interface ListAuditResult {
  entries: AuditLogEntry[];
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Read the audit log, newest first, with optional filters. */
export async function listAuditLog({
  page = 1,
  action,
  actorId,
  targetId,
}: ListAuditParams = {}): Promise<ListAuditResult> {
  const supabase = createAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE; // fetch one extra to detect hasMore

  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at",
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (action) query = query.eq("action", action);
  if (actorId) query = query.eq("actor_id", actorId);
  if (targetId) query = query.eq("target_id", targetId);

  const { data, error } = await query;
  if (error) {
    throw new Error(`listAuditLog failed: ${error.message}`);
  }

  const rows = data ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

  // Resolve actor emails in one batch.
  const actorIds = Array.from(
    new Set(pageRows.map((r) => r.actor_id).filter(Boolean) as string[]),
  );
  const emailMap = new Map<string, string | null>();
  await Promise.all(
    actorIds.map(async (id) => {
      const { data: au } = await supabase.auth.admin.getUserById(id);
      emailMap.set(id, au?.user?.email ?? null);
    }),
  );

  const entries: AuditLogEntry[] = pageRows.map((r) => ({
    id: r.id,
    actor_id: r.actor_id,
    actor_email: r.actor_id ? (emailMap.get(r.actor_id) ?? null) : null,
    action: r.action,
    target_type: r.target_type,
    target_id: r.target_id,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    ip_address: r.ip_address,
    user_agent: r.user_agent,
    created_at: r.created_at,
  }));

  return { entries, page, pageSize: PAGE_SIZE, hasMore };
}
