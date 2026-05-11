import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import { createGmailClient } from "@/lib/email/gmail-client";
import { parseGmailMessage } from "@/lib/email/parse-gmail-message";
import { processParsedEmail } from "@/lib/email/process-email";

export async function POST() {
  const { response } = await requireApiUser();
  if (response) {
    return response;
  }

  let gmail: ReturnType<typeof createGmailClient>;

  try {
    gmail = createGmailClient();
  } catch {
    return apiError(
      "GMAIL_NOT_CONFIGURED",
      "Gmail API credentials are missing.",
      503,
    );
  }

  try {
    const list = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread newer_than:7d",
      maxResults: 25,
    });

    const messages = list.data.messages ?? [];
    const results = [];

    for (const message of messages) {
      if (!message.id) {
        continue;
      }

      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const parsed = parseGmailMessage(fullMessage.data);
      const result = await processParsedEmail(parsed);
      results.push(result);

      await gmail.users.messages.modify({
        userId: "me",
        id: message.id,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    }

    return NextResponse.json({
      checked: messages.length,
      results,
      summary: {
        success: results.filter((result) => result.status === "success").length,
        duplicate: results.filter((result) => result.status === "duplicate")
          .length,
        unknown_sender: results.filter(
          (result) => result.status === "unknown_sender",
        ).length,
        needs_review: results.filter(
          (result) => result.status === "needs_review",
        ).length,
        failed: results.filter((result) => result.status === "failed").length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gmail check failed.";

    return NextResponse.json(
      {
        checked: 0,
        results: [],
        error: {
          code: "GMAIL_CHECK_FAILED",
          message,
          status: 502,
        },
      },
      { status: 502 },
    );
  }
}
