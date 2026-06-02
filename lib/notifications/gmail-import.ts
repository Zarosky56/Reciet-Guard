import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createNotificationEvent,
  updateNotificationEvent,
} from "@/lib/notifications/events";
import { mapNotificationPreferences } from "@/lib/notifications/preferences";
import { sendImportEmail } from "@/lib/notifications/send-import-email";
import { sendPushToUser } from "@/lib/notifications/push";
import type { Database } from "@/types/supabase";

type AdminClient = SupabaseClient<Database>;

interface NotifyGmailImportInput {
  userId: string;
  userEmail: string | null;
  receiptId?: string | null;
  messageId: string;
  itemName?: string | null;
  storeName?: string | null;
  status: "success" | "needs_review";
  error?: string | null;
}

export async function notifyGmailImport(
  supabase: AdminClient,
  input: NotifyGmailImportInput,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "email_notifications_enabled, push_notifications_enabled, reminder_thresholds, default_currency, onboarding_completed, intro_to_app_enabled",
    )
    .eq("id", input.userId)
    .maybeSingle();

  const preferences = mapNotificationPreferences(profile);
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
  const safeItem = input.itemName ?? "a receipt";
  const safeStore = input.storeName ?? "Gmail";
  const needsReview = input.status === "needs_review";
  const title = needsReview ? "Receipt needs review" : "New receipt imported";
  const body = needsReview
    ? input.error ?? "A Gmail receipt was found, but the extraction needs review."
    : `${safeItem} from ${safeStore} was added to your dashboard.`;
  const type = needsReview ? "extraction_review" : "gmail_import";
  const dedupeBase = `${type}:${input.messageId}`;

  const inApp = await createNotificationEvent(supabase, {
    userId: input.userId,
    receiptId: input.receiptId ?? null,
    channel: "in_app",
    type,
    dedupeKey: `${dedupeBase}:in_app`,
    title,
    body,
    metadata: { messageId: input.messageId, review: needsReview },
  });
  if (inApp.id) {
    await updateNotificationEvent(supabase, inApp.id, "sent");
  }

  if (preferences.pushNotificationsEnabled) {
    const push = await createNotificationEvent(supabase, {
      userId: input.userId,
      receiptId: input.receiptId ?? null,
      channel: "push",
      type,
      dedupeKey: `${dedupeBase}:push`,
      title,
      body,
      metadata: { messageId: input.messageId, review: needsReview },
    });

    if (push.id) {
      const result = await sendPushToUser(supabase, input.userId, {
        title,
        body,
        url: needsReview ? "/receipts/review" : "/dashboard",
        tag: dedupeBase,
      });
      await updateNotificationEvent(
        supabase,
        push.id,
        result.sent > 0 ? "sent" : result.skipped ? "skipped" : "failed",
        result.error,
      );
    }
  }

  if (preferences.emailNotificationsEnabled && input.userEmail) {
    const email = await createNotificationEvent(supabase, {
      userId: input.userId,
      receiptId: input.receiptId ?? null,
      channel: "email",
      type,
      dedupeKey: `${dedupeBase}:email`,
      title,
      body,
      metadata: { messageId: input.messageId, review: needsReview },
    });

    if (email.id) {
      const result = await sendImportEmail({
        to: input.userEmail,
        title,
        body,
        appUrl,
        review: needsReview,
      });
      await updateNotificationEvent(
        supabase,
        email.id,
        result.sent ? "sent" : "failed",
        result.error,
      );
    }
  }
}
