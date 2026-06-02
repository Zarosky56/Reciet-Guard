import "server-only";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction } from "@/types/admin";

interface LogAuditEventInput {
  /** Who performed the action (defaults to null for system events). */
  actorId?: string | null;
  action: AuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to `audit_logs`. Uses the service-role client so
 * the write succeeds regardless of the caller's RLS context (the
 * table has no public INSERT policy by design — only admins can
 * read, and only server code can write).
 *
 * Best-effort: a failure to write an audit entry must never break
 * the primary action, so errors are swallowed and logged to the
 * server console only.
 *
 * Captures the request IP + user-agent from the incoming request
 * headers when available.
 */
export async function logAuditEvent({
  actorId = null,
  action,
  targetType = null,
  targetId = null,
  metadata = {},
}: LogAuditEventInput): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const h = await headers();
      // x-forwarded-for may be a comma-separated list; take the first.
      ipAddress =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null;
      userAgent = h.get("user-agent");
    } catch {
      // headers() throws outside a request scope (e.g. cron). Fine.
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error("[audit] failed to write audit log:", error.message);
    }
  } catch (err) {
    console.error("[audit] unexpected error writing audit log:", err);
  }
}
