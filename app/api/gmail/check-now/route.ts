import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import { syncUserGmailReceipts } from "@/lib/email/user-gmail-sync";

export async function POST(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response || !user) {
    return response || apiError("UNAUTHORIZED", "Please log in first.", 401);
  }

  // 1. Cooldown rate limit check (5 minutes)
  const { data: connection, error: connError } = await supabase
    .from("user_gmail_connections")
    .select("last_sync_at, status, needs_reconnect")
    .eq("user_id", user.id)
    .maybeSingle();

  if (connError || !connection || connection.status !== "connected" || connection.needs_reconnect) {
    return apiError(
      "GMAIL_NOT_CONNECTED",
      "Connect your Gmail account before running a check.",
      428,
    );
  }

  // Bypass 5-minute cooldown time limit for testing as requested by user
  /*
  if (connection.last_sync_at) {
    const lastSync = new Date(connection.last_sync_at).getTime();
    const cooldown = 5 * 60 * 1000; // 5 minutes
    if (Date.now() - lastSync < cooldown) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        "Please wait at least 5 minutes between manual inbox checks.",
        429,
      );
    }
  }
  */

  // 2. Perform sync
  try {
    const requestUrl = new URL(request.url);
    const syncResult = await syncUserGmailReceipts(user.id, {
      origin: requestUrl.origin,
    });

    return NextResponse.json({
      checked: syncResult.checked,
      imported: syncResult.imported,
      needs_review: syncResult.needs_review,
      skipped_duplicate: syncResult.skipped_duplicate,
      skipped_expired: syncResult.skipped_expired,
      failed: syncResult.failed,
      summary: {
        success: syncResult.imported,
        imported: syncResult.imported,
        needs_review: syncResult.needs_review,
        duplicate: syncResult.skipped_duplicate,
        skipped_duplicate: syncResult.skipped_duplicate,
        skipped_expired: syncResult.skipped_expired,
        failed: syncResult.failed,
      },
    });
  } catch (error) {
    console.error("[gmail check-now api failed]", error);
    const message = error instanceof Error ? error.message : "Gmail sync failed.";
    return NextResponse.json(
      {
        checked: 0,
        imported: 0,
        needs_review: 0,
        skipped_duplicate: 0,
        skipped_expired: 0,
        failed: 0,
        error: {
          code: "GMAIL_SYNC_FAILED",
          message,
          status: 502,
        },
      },
      { status: 502 },
    );
  }
}
