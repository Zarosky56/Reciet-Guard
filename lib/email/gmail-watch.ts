import "server-only";

import { createGmailClient } from "@/lib/email/gmail-client";
import { parseGmailMessage } from "@/lib/email/parse-gmail-message";
import { processParsedEmail, type GmailProcessingResult } from "@/lib/email/process-email";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gmail watch lasts up to 7 days, so the cron renews it daily.
 * Stored in `gmail_watch_state` (singleton row, id=1).
 */

interface WatchState {
  email_address: string;
  history_id: string;
  watch_expires_at: string | null;
  last_renewed_at: string;
}

export async function startGmailWatch(): Promise<{
  historyId: string;
  expiration: string | null;
}> {
  const topic = process.env.GMAIL_PUBSUB_TOPIC;
  const userEmail = process.env.GMAIL_USER_EMAIL;
  if (!topic) throw new Error("GMAIL_PUBSUB_TOPIC is not configured");
  if (!userEmail) throw new Error("GMAIL_USER_EMAIL is not configured");

  const gmail = createGmailClient();
  const watchResponse = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: topic,
      labelIds: ["INBOX"],
      labelFilterBehavior: "INCLUDE",
    },
  });

  const historyId = String(watchResponse.data.historyId ?? "");
  const expirationMs = watchResponse.data.expiration
    ? Number(watchResponse.data.expiration)
    : null;
  const expiresAt = expirationMs ? new Date(expirationMs).toISOString() : null;

  const admin = createAdminClient();
  await admin
    .from("gmail_watch_state")
    .upsert(
      {
        id: 1,
        email_address: userEmail,
        history_id: Number(historyId),
        watch_expires_at: expiresAt,
        last_renewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  return { historyId, expiration: expiresAt };
}

export async function stopGmailWatch(): Promise<void> {
  const gmail = createGmailClient();
  await gmail.users.stop({ userId: "me" });
}

async function getWatchState(): Promise<WatchState | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("gmail_watch_state")
    .select("email_address, history_id, watch_expires_at, last_renewed_at")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return null;
  return {
    email_address: String(data.email_address),
    history_id: String(data.history_id),
    watch_expires_at:
      typeof data.watch_expires_at === "string" ? data.watch_expires_at : null,
    last_renewed_at: String(data.last_renewed_at),
  };
}

async function setLastHistoryId(historyId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("gmail_watch_state")
    .update({
      history_id: Number(historyId),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
}

/**
 * Fetch new messages since the last stored historyId, process each through
 * the standard receipt pipeline, then advance the cursor.
 */
export async function processGmailHistorySince(
  fallbackHistoryId?: string,
): Promise<{
  processed: number;
  results: GmailProcessingResult[];
  newHistoryId: string | null;
}> {
  const state = await getWatchState();
  const startHistoryId = state?.history_id ?? fallbackHistoryId;

  if (!startHistoryId) {
    return { processed: 0, results: [], newHistoryId: null };
  }

  const gmail = createGmailClient();
  const historyResponse = await gmail.users.history.list({
    userId: "me",
    startHistoryId,
    historyTypes: ["messageAdded"],
  });

  const history = historyResponse.data.history ?? [];
  const newHistoryId = historyResponse.data.historyId
    ? String(historyResponse.data.historyId)
    : null;

  const messageIds = new Set<string>();
  for (const entry of history) {
    for (const added of entry.messagesAdded ?? []) {
      const id = added.message?.id;
      if (id) messageIds.add(id);
    }
  }

  const results: GmailProcessingResult[] = [];
  for (const messageId of messageIds) {
    try {
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });
      const parsed = parseGmailMessage(fullMessage.data);
      const result = await processParsedEmail(parsed);
      results.push(result);

      await gmail.users.messages
        .modify({
          userId: "me",
          id: messageId,
          requestBody: { removeLabelIds: ["UNREAD"] },
        })
        .catch(() => undefined);
    } catch (error) {
      results.push({
        messageId,
        status: "failed",
        error: error instanceof Error ? error.message : "history fetch failed",
      });
    }
  }

  if (newHistoryId) {
    await setLastHistoryId(newHistoryId);
  }

  return { processed: results.length, results, newHistoryId };
}
