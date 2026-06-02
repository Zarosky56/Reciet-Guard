import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import { createNotificationEvent, updateNotificationEvent } from "@/lib/notifications/events";
import { sendPushToUser } from "@/lib/notifications/push";
import { sendImportEmail } from "@/lib/notifications/send-import-email";
import { createAdminClient } from "@/lib/supabase/admin";

type PushTestResult = {
  sent: number;
  failed: number;
  skipped: boolean;
  error: string | null;
};

type EmailTestResult = {
  sent: boolean;
  error: string | null;
};

function appUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://reciet-guard.vercel.app"
  );
}

export async function POST() {
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;
  const admin = createAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email_notifications_enabled, push_notifications_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return apiError("DATABASE_ERROR", "Could not load notification settings.", 500);
  }

  const title = "Receipt Guardian test alert";
  const body = "Notifications are connected for this device.";
  const dedupeKey = `test:${user.id}:${Date.now()}`;

  const inApp = await createNotificationEvent(admin, {
    userId: user.id,
    channel: "in_app",
    type: "gmail_import",
    dedupeKey: `${dedupeKey}:in_app`,
    title,
    body,
    metadata: { source: "manual_test" },
  });
  if (inApp.id) {
    await updateNotificationEvent(admin, inApp.id, "sent");
  }

  let push: PushTestResult = {
    sent: 0,
    failed: 0,
    skipped: true,
    error: "Push notifications are disabled in preferences.",
  };
  if (profile?.push_notifications_enabled) {
    push = await sendPushToUser(admin, user.id, {
      title,
      body,
      tag: "receipt-guardian-test",
      url: "/settings",
    });
  }

  let email: EmailTestResult = {
    sent: false,
    error: "Email notifications are disabled.",
  };
  if (profile?.email_notifications_enabled && user.email) {
    email = await sendImportEmail({
      to: user.email,
      title,
      body,
      appUrl: appUrl(),
    });
  }

  return NextResponse.json({
    ok: push.sent > 0 || email.sent || Boolean(inApp.id),
    inApp: { sent: Boolean(inApp.id) },
    push,
    email,
  });
}
