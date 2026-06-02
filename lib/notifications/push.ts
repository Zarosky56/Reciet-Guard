import "server-only";

import webpush, { type PushSubscription } from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

type AdminClient = SupabaseClient<Database>;

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export function normalizeVapidSubject(value: string | undefined | null) {
  const subject = value?.trim();
  if (!subject) return "mailto:admin@receiptguardian.app";
  if (/^https?:\/\//i.test(subject) || /^mailto:/i.test(subject)) {
    return subject;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subject)) {
    return `mailto:${subject}`;
  }
  return "mailto:admin@receiptguardian.app";
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return false;
  }

  const subject = normalizeVapidSubject(
    process.env.VAPID_SUBJECT || process.env.FROM_EMAIL,
  );

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  } catch {
    return false;
  }
}

function toPushSubscription(row: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): PushSubscription {
  return {
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

export async function sendPushToUser(
  supabase: AdminClient,
  userId: string,
  payload: PushPayload,
) {
  if (!configureWebPush()) {
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      error: "VAPID keys are not configured",
    };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (error) {
    return { sent: 0, failed: 0, skipped: false, error: error.message };
  }

  let sent = 0;
  let failed = 0;

  await Promise.all(
    (data ?? []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          toPushSubscription(subscription),
          JSON.stringify(payload),
        );
        sent += 1;
        await supabase
          .from("push_subscriptions")
          .update({ last_error: null })
          .eq("id", subscription.id);
      } catch (error) {
        failed += 1;
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "statusCode" in error &&
          typeof error.statusCode === "number"
            ? error.statusCode
            : null;
        const message = error instanceof Error ? error.message : "Push failed";

        await supabase
          .from("push_subscriptions")
          .update({
            enabled: statusCode === 404 || statusCode === 410 ? false : true,
            last_error: message,
          })
          .eq("id", subscription.id);
      }
    }),
  );

  return { sent, failed, skipped: false, error: null };
}
