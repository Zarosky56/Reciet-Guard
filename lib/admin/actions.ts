import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/audit/log";
import { AUDIT_ACTIONS, type UserRole } from "@/types/admin";

/**
 * Admin mutation layer. Every function is invoked only from API
 * routes already gated by `requireAdmin()`. Each mutation writes an
 * audit-log entry attributing the action to `actorId` (the admin).
 *
 * Bans are reversible: we set a far-future `ban_duration` rather
 * than deleting the user, so the row and its receipts survive and
 * the ban can be lifted. Hard delete is gated behind an env flag.
 */

// ~100 years in hours — effectively permanent until explicitly lifted.
const PERMANENT_BAN_DURATION = "876000h";

interface ActorContext {
  actorId: string;
}

export async function banUser(
  userId: string,
  { actorId }: ActorContext,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: PERMANENT_BAN_DURATION,
  });
  if (error) throw new Error(`Ban failed: ${error.message}`);

  await logAuditEvent({
    actorId,
    action: AUDIT_ACTIONS.userBanned,
    targetType: "user",
    targetId: userId,
    metadata: { ban_duration: PERMANENT_BAN_DURATION },
  });
}

export async function unbanUser(
  userId: string,
  { actorId }: ActorContext,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (error) throw new Error(`Unban failed: ${error.message}`);

  await logAuditEvent({
    actorId,
    action: AUDIT_ACTIONS.userUnbanned,
    targetType: "user",
    targetId: userId,
  });
}

export async function setUserRole(
  userId: string,
  role: UserRole,
  { actorId }: ActorContext,
): Promise<void> {
  if (role !== "user" && role !== "admin") {
    throw new Error(`Invalid role: ${role}`);
  }

  const supabase = createAdminClient();

  // Read the previous role for the audit metadata.
  const { data: prev } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) throw new Error(`Role change failed: ${error.message}`);

  await logAuditEvent({
    actorId,
    action: AUDIT_ACTIONS.userRoleChanged,
    targetType: "user",
    targetId: userId,
    metadata: { from: prev?.role ?? "user", to: role },
  });
}

export async function sendPasswordReset(
  userId: string,
  email: string,
  { actorId }: ActorContext,
): Promise<void> {
  const supabase = createAdminClient();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${appUrl}/auth/callback?next=/dashboard` },
  });
  if (error) throw new Error(`Password reset failed: ${error.message}`);

  await logAuditEvent({
    actorId,
    action: AUDIT_ACTIONS.userPasswordResetSent,
    targetType: "user",
    targetId: userId,
    metadata: { email },
  });
}

/**
 * Hard-delete a user. Gated behind DANGER_ALLOW_HARD_DELETE=true so
 * it can't be triggered by accident in production. Deletes the auth
 * user (cascade removes profile + receipts if FKs are ON DELETE
 * CASCADE; otherwise clean those separately).
 */
export async function hardDeleteUser(
  userId: string,
  { actorId }: ActorContext,
): Promise<void> {
  if (process.env.DANGER_ALLOW_HARD_DELETE !== "true") {
    throw new Error(
      "Hard delete is disabled. Set DANGER_ALLOW_HARD_DELETE=true to enable.",
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(`Delete failed: ${error.message}`);

  await logAuditEvent({
    actorId,
    action: AUDIT_ACTIONS.userDeleted,
    targetType: "user",
    targetId: userId,
  });
}
