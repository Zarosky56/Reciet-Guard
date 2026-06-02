import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { startGmailWatch } from "@/lib/email/gmail-watch";
import { checkDeadlineNotifications } from "@/lib/notifications/check-deadlines";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function maybeRenewGmailWatch() {
  if (!process.env.GMAIL_PUBSUB_TOPIC) {
    return { renewed: false, reason: "pubsub not configured" };
  }
  try {
    const watch = await startGmailWatch();
    return { renewed: true, ...watch };
  } catch (error) {
    return {
      renewed: false,
      error: error instanceof Error ? error.message : "watch renew failed",
    };
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Invalid cron secret.", 401);
  }

  try {
    const [deadlines, watch] = await Promise.all([
      checkDeadlineNotifications(),
      maybeRenewGmailWatch(),
    ]);
    return NextResponse.json({ ...deadlines, watch });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Deadline check failed.";

    return NextResponse.json(
      {
        error: {
          code: "DEADLINE_CHECK_FAILED",
          message,
          status: 500,
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
