/**
 * Admin domain types — shared by the admin server helpers, API
 * routes, and UI components.
 */

export type UserRole = "user" | "admin";

export type AdminUserStatusFilter =
  | "all"
  | "active"
  | "admin"
  | "banned"
  | "unconfirmed";

/** A row in the admin users table — joins auth.users + profiles. */
export interface AdminUserRow {
  id: string;
  email: string | null;
  role: UserRole;
  /** ISO timestamp the auth user was created. */
  created_at: string;
  /** ISO timestamp of last sign-in, or null if never. */
  last_sign_in_at: string | null;
  /** ISO timestamp the ban expires, or null if not banned. */
  banned_until: string | null;
  /** Whether the email has been confirmed. */
  email_confirmed: boolean;
  /** Count of receipts owned by the user. */
  receipt_count: number;
}

/** A single audit-log entry as rendered in the admin UI. */
export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Canonical audit action names. Keep in sync with lib/audit/log.ts. */
export const AUDIT_ACTIONS = {
  authLogin: "auth.login",
  authLogout: "auth.logout",
  userBanned: "user.banned",
  userUnbanned: "user.unbanned",
  userRoleChanged: "user.role_changed",
  userPasswordResetSent: "user.password_reset_sent",
  userDeleted: "user.deleted",
} as const;

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/** Overview KPIs for the /admin landing page. */
export interface AdminOverviewStats {
  totalUsers: number;
  admins: number;
  bannedUsers: number;
  unconfirmedUsers: number;
  newUsers7d: number;
  totalReceipts: number;
  activeReceipts: number;
  auditEvents7d: number;
}
