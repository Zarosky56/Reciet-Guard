import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { checkDeadlineNotifications } from "@/lib/notifications/check-deadlines";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("UNAUTHORIZED", "Invalid cron secret.", 401);
  }

  try {
    const result = await checkDeadlineNotifications();
    return NextResponse.json(result);
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
