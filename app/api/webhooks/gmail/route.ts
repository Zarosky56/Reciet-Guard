import { NextResponse } from "next/server";

import { processGmailHistorySince } from "@/lib/email/gmail-watch";

/**
 * Gmail Pub/Sub push endpoint.
 *
 * Pub/Sub pushes a message that includes the user's email and a historyId.
 * We verify the request via the `?token=` query string, then fetch all new
 * messages since the last cursor and run them through the receipt pipeline.
 *
 * Request shape from Pub/Sub:
 *   POST /api/webhooks/gmail?token=<GOOGLE_PUBSUB_VERIFICATION_TOKEN>
 *   {
 *     "message": {
 *       "data": "<base64 of {emailAddress, historyId}>",
 *       "messageId": "...",
 *       "publishTime": "..."
 *     },
 *     "subscription": "..."
 *   }
 *
 * Pub/Sub treats any 2xx as ACK, anything else as a retry. We always return
 * 200 after logging so transient failures don't loop forever.
 */

interface PubSubEnvelope {
  message?: {
    data?: string;
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
}

interface GmailNotification {
  emailAddress?: string;
  historyId?: number | string;
}

function decodeMessage(envelope: PubSubEnvelope): GmailNotification | null {
  if (!envelope.message?.data) return null;
  try {
    const json = Buffer.from(envelope.message.data, "base64").toString("utf8");
    return JSON.parse(json) as GmailNotification;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const expectedToken = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const providedToken = url.searchParams.get("token");
  if (providedToken !== expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Invalid token" },
      { status: 401 },
    );
  }

  let envelope: PubSubEnvelope;
  try {
    envelope = (await request.json()) as PubSubEnvelope;
  } catch {
    // ACK so Pub/Sub doesn't retry malformed messages forever.
    return NextResponse.json({ ok: true, ignored: "invalid_json" });
  }

  const notification = decodeMessage(envelope);
  const expectedEmail = process.env.GMAIL_USER_EMAIL;

  if (
    notification?.emailAddress &&
    expectedEmail &&
    notification.emailAddress.toLowerCase() !== expectedEmail.toLowerCase()
  ) {
    return NextResponse.json({ ok: true, ignored: "wrong_inbox" });
  }

  try {
    const fallbackId = notification?.historyId
      ? String(notification.historyId)
      : undefined;
    const result = await processGmailHistorySince(fallbackId);
    return NextResponse.json({
      ok: true,
      processed: result.processed,
      newHistoryId: result.newHistoryId,
      summary: {
        success: result.results.filter((r) => r.status === "success").length,
        duplicate: result.results.filter((r) => r.status === "duplicate").length,
        unknown_sender: result.results.filter((r) => r.status === "unknown_sender")
          .length,
        needs_review: result.results.filter((r) => r.status === "needs_review")
          .length,
        failed: result.results.filter((r) => r.status === "failed").length,
      },
    });
  } catch (error) {
    // Still ACK so we don't infinite-retry. Log and move on.
    console.error("[gmail webhook]", error);
    return NextResponse.json({
      ok: true,
      error: error instanceof Error ? error.message : "processing failed",
    });
  }
}
