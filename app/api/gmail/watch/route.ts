import { NextResponse } from "next/server";

import { startGmailWatch, stopGmailWatch } from "@/lib/email/gmail-watch";

/**
 * Admin endpoint to (re)start or stop the Gmail watch subscription.
 * Authenticated via the same WEBHOOK_SECRET used by other admin/cron routes.
 *
 *  POST /api/gmail/watch?action=start|stop
 *  Authorization: Bearer <WEBHOOK_SECRET>
 *
 * Call this once after deploying to register the Pub/Sub subscription.
 * The daily cron at /api/cron/check-deadlines also renews it (watch lasts 7d).
 */

function authorized(request: Request): boolean {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return false;
  const provided = request.headers.get("authorization");
  return provided === `Bearer ${expected}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const action = url.searchParams.get("action") ?? "start";

  try {
    if (action === "stop") {
      await stopGmailWatch();
      return NextResponse.json({ ok: true, action: "stop" });
    }

    const result = await startGmailWatch();
    return NextResponse.json({ ok: true, action: "start", ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "watch failed",
      },
      { status: 500 },
    );
  }
}
