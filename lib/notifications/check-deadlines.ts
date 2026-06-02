import "server-only";

import { addDays, differenceInCalendarDays, format } from "date-fns";

import {
  createNotificationEvent,
  updateNotificationEvent,
} from "@/lib/notifications/events";
import {
  DEFAULT_REMINDER_THRESHOLDS,
  mapNotificationPreferences,
} from "@/lib/notifications/preferences";
import { selectReminderAttachment } from "@/lib/notifications/reminder-attachments";
import { sendDeadlineEmail } from "@/lib/notifications/send-deadline-email";
import { sendImportEmail } from "@/lib/notifications/send-import-email";
import { sendPushToUser } from "@/lib/notifications/push";
import { createAdminClient } from "@/lib/supabase/admin";

type DeadlineKind = "return" | "warranty";

interface ReceiptDeadlineRow {
  id: string;
  user_id: string;
  store_name: string | null;
  item_name: string | null;
  purchase_date: string | null;
  return_deadline: string | null;
  warranty_deadline: string | null;
  status: string;
}

interface ReviewLogRow {
  id: string;
  user_id: string | null;
  subject: string | null;
  error_message: string | null;
}

interface AttentionCounts {
  review: number;
  expiredReturns: number;
  dueReturns: number;
  upcomingReturns: number;
  expiredWarranties: number;
  dueWarranties: number;
  upcomingWarranties: number;
}

export interface DeadlineCheckResult {
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    receiptId: string;
    kind?: DeadlineKind;
    thresholdDays?: number;
    channel?: "email" | "push" | "in_app";
    status: "sent" | "skipped" | "failed";
    error?: string;
  }>;
}

function appUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3100"
  );
}

function dateFromInput(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function deadlineTitle(kind: DeadlineKind, threshold: number, item: string | null) {
  const label = kind === "return" ? "Return window" : "Warranty";
  const when =
    threshold === 0
      ? "due today"
      : threshold === 1
        ? "1 day left"
        : `${threshold} days left`;
  return `${label} ${when}: ${item ?? "receipt"}`;
}

function deadlineBody(
  kind: DeadlineKind,
  receipt: ReceiptDeadlineRow,
  threshold: number,
) {
  const label = kind === "return" ? "return window" : "warranty";
  const item = receipt.item_name ?? "Your tracked item";
  const store = receipt.store_name ?? "Unknown store";
  const when =
    threshold === 0
      ? "is due today"
      : threshold === 1
        ? "has 1 day left"
        : `has ${threshold} days left`;
  return `${item} from ${store} ${when} before the ${label} deadline.`;
}

function emptyAttentionCounts(): AttentionCounts {
  return {
    review: 0,
    expiredReturns: 0,
    dueReturns: 0,
    upcomingReturns: 0,
    expiredWarranties: 0,
    dueWarranties: 0,
    upcomingWarranties: 0,
  };
}

function addPlural(count: number, singular: string, plural: string) {
  if (count <= 0) return null;
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildAttentionSummary(counts: AttentionCounts) {
  const parts = [
    addPlural(counts.review, "item needs review", "items need review"),
    addPlural(
      counts.expiredReturns,
      "return window expired",
      "return windows expired",
    ),
    counts.dueReturns > 0
      ? `${counts.dueReturns} ${counts.dueReturns === 1 ? "return window is" : "return windows are"} due today`
      : null,
    addPlural(
      counts.upcomingReturns,
      "return window is coming up",
      "return windows are coming up",
    ),
    addPlural(
      counts.expiredWarranties,
      "warranty expired",
      "warranties expired",
    ),
    counts.dueWarranties > 0
      ? `${counts.dueWarranties} ${counts.dueWarranties === 1 ? "warranty is" : "warranties are"} due today`
      : null,
    addPlural(
      counts.upcomingWarranties,
      "warranty is coming up",
      "warranties are coming up",
    ),
  ].filter(Boolean);

  if (parts.length === 0) return null;

  const total =
    counts.review +
    counts.expiredReturns +
    counts.dueReturns +
    counts.upcomingReturns +
    counts.expiredWarranties +
    counts.dueWarranties +
    counts.upcomingWarranties;

  return {
    title:
      total === 1
        ? "Check your dashboard: 1 item needs attention"
        : `Check your dashboard: ${total} items need attention`,
    body: `${parts.join(", ")}. Open Receipt Guardian to review them.`,
  };
}

async function getUserEmail(
  admin: ReturnType<typeof createAdminClient>,
  cache: Map<string, string | null>,
  userId: string,
) {
  if (cache.has(userId)) return cache.get(userId) ?? null;

  const { data, error } = await admin.auth.admin.getUserById(userId);
  const email = error ? null : data.user?.email ?? null;
  cache.set(userId, email);
  return email;
}

export async function checkDeadlineNotifications(
  now = new Date(),
): Promise<DeadlineCheckResult> {
  const admin = createAdminClient();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const maxDate = format(addDays(today, Math.max(...DEFAULT_REMINDER_THRESHOLDS)), "yyyy-MM-dd");

  const { data: receipts, error } = await admin
    .from("receipts")
    .select(
      "id, user_id, store_name, item_name, purchase_date, return_deadline, warranty_deadline, status",
    )
    .eq("status", "active")
    .or(`return_deadline.lte.${maxDate},warranty_deadline.lte.${maxDate}`);

  if (error) {
    throw error;
  }

  const { data: reviewLogs } = await admin
    .from("email_logs")
    .select("id, user_id, subject, error_message")
    .eq("processing_status", "needs_review")
    .not("user_id", "is", null);

  const userIds = Array.from(
    new Set([
      ...(receipts ?? []).map((row) => row.user_id),
      ...((reviewLogs ?? []) as ReviewLogRow[])
        .map((row) => row.user_id)
        .filter((userId): userId is string => Boolean(userId)),
    ]),
  );
  const { data: profiles } = await admin
    .from("profiles")
    .select(
      "id, default_currency, onboarding_completed, intro_to_app_enabled, email_notifications_enabled, push_notifications_enabled, reminder_thresholds",
    )
    .in("id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);
  const profileByUser = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const emailCache = new Map<string, string | null>();
  const details: DeadlineCheckResult["details"] = [];
  const attentionByUser = new Map<string, AttentionCounts>();

  function countsForUser(userId: string) {
    const existing = attentionByUser.get(userId);
    if (existing) return existing;
    const counts = emptyAttentionCounts();
    attentionByUser.set(userId, counts);
    return counts;
  }

  for (const log of (reviewLogs ?? []) as ReviewLogRow[]) {
    if (!log.user_id) continue;
    countsForUser(log.user_id).review += 1;
  }

  for (const receipt of (receipts ?? []) as ReceiptDeadlineRow[]) {
    const preferences = mapNotificationPreferences(profileByUser.get(receipt.user_id));
    const thresholds = new Set<number>(preferences.reminderThresholds);
    const deadlines: Array<{ kind: DeadlineKind; date: string | null }> = [
      { kind: "return", date: receipt.return_deadline },
      { kind: "warranty", date: receipt.warranty_deadline },
    ];

    for (const deadline of deadlines) {
      if (!deadline.date) continue;

      const parsedDate = dateFromInput(deadline.date);
      if (!parsedDate) continue;

      const daysRemaining = differenceInCalendarDays(parsedDate, today);
      const attentionCounts = countsForUser(receipt.user_id);
      if (deadline.kind === "return") {
        if (daysRemaining < 0) attentionCounts.expiredReturns += 1;
        else if (daysRemaining === 0) attentionCounts.dueReturns += 1;
        else if (daysRemaining <= 20) attentionCounts.upcomingReturns += 1;
      } else {
        if (daysRemaining < 0) attentionCounts.expiredWarranties += 1;
        else if (daysRemaining === 0) attentionCounts.dueWarranties += 1;
        else if (daysRemaining <= 20) attentionCounts.upcomingWarranties += 1;
      }

      if (daysRemaining < 0 || !thresholds.has(daysRemaining)) continue;

      const title = deadlineTitle(deadline.kind, daysRemaining, receipt.item_name);
      const body = deadlineBody(deadline.kind, receipt, daysRemaining);
      const baseDedupe = `${deadline.kind}_deadline:${receipt.id}:${daysRemaining}`;

      const inApp = await createNotificationEvent(admin, {
        userId: receipt.user_id,
        receiptId: receipt.id,
        channel: "in_app",
        type: deadline.kind === "return" ? "return_deadline" : "warranty_deadline",
        thresholdDays: daysRemaining,
        dedupeKey: `${baseDedupe}:in_app`,
        title,
        body,
      });

      if (inApp.id) {
        await updateNotificationEvent(admin, inApp.id, "sent");
      } else {
        details.push({
          receiptId: receipt.id,
          kind: deadline.kind,
          thresholdDays: daysRemaining,
          channel: "in_app",
          status: "skipped",
          error: "Duplicate reminder",
        });
      }

      if (preferences.emailNotificationsEnabled) {
        const emailEvent = await createNotificationEvent(admin, {
          userId: receipt.user_id,
          receiptId: receipt.id,
          channel: "email",
          type: deadline.kind === "return" ? "return_deadline" : "warranty_deadline",
          thresholdDays: daysRemaining,
          dedupeKey: `${baseDedupe}:email`,
          title,
          body,
        });

        if (!emailEvent.id) {
          details.push({
            receiptId: receipt.id,
            kind: deadline.kind,
            thresholdDays: daysRemaining,
            channel: "email",
            status: "skipped",
            error: "Duplicate reminder",
          });
        } else {
          const email = await getUserEmail(admin, emailCache, receipt.user_id);
          if (!email) {
            await updateNotificationEvent(
              admin,
              emailEvent.id,
              "skipped",
              "Missing user email",
            );
            details.push({
              receiptId: receipt.id,
              kind: deadline.kind,
              thresholdDays: daysRemaining,
              channel: "email",
              status: "skipped",
              error: "Missing user email",
            });
          } else {
            const attachment = await selectReminderAttachment(admin, receipt.id);
            const result = await sendDeadlineEmail({
              to: email,
              itemName: receipt.item_name,
              storeName: receipt.store_name,
              purchaseDate: receipt.purchase_date,
              returnDeadline: receipt.return_deadline,
              warrantyDeadline: receipt.warranty_deadline,
              deadlineDate: deadline.date,
              deadlineKind: deadline.kind,
              thresholdDays: daysRemaining,
              appUrl: appUrl(),
              attachment,
            });

            await updateNotificationEvent(
              admin,
              emailEvent.id,
              result.sent ? "sent" : "failed",
              result.error,
            );
            details.push({
              receiptId: receipt.id,
              kind: deadline.kind,
              thresholdDays: daysRemaining,
              channel: "email",
              status: result.sent ? "sent" : "failed",
              error: result.error ?? undefined,
            });
          }
        }
      }

      if (preferences.pushNotificationsEnabled) {
        const pushEvent = await createNotificationEvent(admin, {
          userId: receipt.user_id,
          receiptId: receipt.id,
          channel: "push",
          type: deadline.kind === "return" ? "return_deadline" : "warranty_deadline",
          thresholdDays: daysRemaining,
          dedupeKey: `${baseDedupe}:push`,
          title,
          body,
        });

        if (!pushEvent.id) {
          details.push({
            receiptId: receipt.id,
            kind: deadline.kind,
            thresholdDays: daysRemaining,
            channel: "push",
            status: "skipped",
            error: "Duplicate reminder",
          });
        } else {
          const result = await sendPushToUser(admin, receipt.user_id, {
            title,
            body,
            tag: baseDedupe,
            url: deadline.kind === "warranty" ? "/dashboard#warranty" : "/dashboard",
          });
          const status = result.sent > 0 ? "sent" : result.skipped ? "skipped" : "failed";
          await updateNotificationEvent(admin, pushEvent.id, status, result.error);
          details.push({
            receiptId: receipt.id,
            kind: deadline.kind,
            thresholdDays: daysRemaining,
            channel: "push",
            status,
            error: result.error ?? undefined,
          });
        }
      }

      if (deadline.kind === "return") {
        const legacyUpdate =
          daysRemaining === 7
            ? { notification_sent_7d: true }
            : daysRemaining === 3
              ? { notification_sent_3d: true }
              : daysRemaining === 1
                ? { notification_sent_1d: true }
                : null;
        if (legacyUpdate) {
          await admin.from("receipts").update(legacyUpdate).eq("id", receipt.id);
        }
      }
    }
  }

  const todayKey = format(today, "yyyy-MM-dd");
  for (const [userId, counts] of attentionByUser) {
    const summary = buildAttentionSummary(counts);
    if (!summary) continue;

    const preferences = mapNotificationPreferences(profileByUser.get(userId));
    const metadata = {
      date: todayKey,
      review: counts.review,
      expiredReturns: counts.expiredReturns,
      dueReturns: counts.dueReturns,
      upcomingReturns: counts.upcomingReturns,
      expiredWarranties: counts.expiredWarranties,
      dueWarranties: counts.dueWarranties,
      upcomingWarranties: counts.upcomingWarranties,
    };
    const type = counts.review > 0 ? "extraction_review" : "return_deadline";
    const dedupeBase = `daily_attention:${todayKey}`;

    const inApp = await createNotificationEvent(admin, {
      userId,
      channel: "in_app",
      type,
      dedupeKey: `${dedupeBase}:in_app`,
      title: summary.title,
      body: summary.body,
      metadata,
    });
    if (inApp.id) {
      await updateNotificationEvent(admin, inApp.id, "sent");
      details.push({
        receiptId: "summary",
        channel: "in_app",
        status: "sent",
      });
    } else {
      details.push({
        receiptId: "summary",
        channel: "in_app",
        status: "skipped",
        error: "Duplicate daily summary",
      });
    }

    if (preferences.pushNotificationsEnabled) {
      const pushEvent = await createNotificationEvent(admin, {
        userId,
        channel: "push",
        type,
        dedupeKey: `${dedupeBase}:push`,
        title: summary.title,
        body: summary.body,
        metadata,
      });

      if (pushEvent.id) {
        const result = await sendPushToUser(admin, userId, {
          title: summary.title,
          body: summary.body,
          tag: dedupeBase,
          url: counts.review > 0 ? "/receipts/review" : "/dashboard",
        });
        const status = result.sent > 0 ? "sent" : result.skipped ? "skipped" : "failed";
        await updateNotificationEvent(admin, pushEvent.id, status, result.error);
        details.push({
          receiptId: "summary",
          channel: "push",
          status,
          error: result.error ?? undefined,
        });
      } else {
        details.push({
          receiptId: "summary",
          channel: "push",
          status: "skipped",
          error: "Duplicate daily summary",
        });
      }
    }

    if (preferences.emailNotificationsEnabled) {
      const emailEvent = await createNotificationEvent(admin, {
        userId,
        channel: "email",
        type,
        dedupeKey: `${dedupeBase}:email`,
        title: summary.title,
        body: summary.body,
        metadata,
      });

      if (emailEvent.id) {
        const email = await getUserEmail(admin, emailCache, userId);
        if (!email) {
          await updateNotificationEvent(
            admin,
            emailEvent.id,
            "skipped",
            "Missing user email",
          );
          details.push({
            receiptId: "summary",
            channel: "email",
            status: "skipped",
            error: "Missing user email",
          });
        } else {
          const result = await sendImportEmail({
            to: email,
            title: summary.title,
            body: summary.body,
            appUrl: appUrl(),
            review: counts.review > 0,
          });
          await updateNotificationEvent(
            admin,
            emailEvent.id,
            result.sent ? "sent" : "failed",
            result.error,
          );
          details.push({
            receiptId: "summary",
            channel: "email",
            status: result.sent ? "sent" : "failed",
            error: result.error ?? undefined,
          });
        }
      } else {
        details.push({
          receiptId: "summary",
          channel: "email",
          status: "skipped",
          error: "Duplicate daily summary",
        });
      }
    }
  }

  return {
    checked: receipts?.length ?? 0,
    sent: details.filter((detail) => detail.status === "sent").length,
    skipped: details.filter((detail) => detail.status === "skipped").length,
    failed: details.filter((detail) => detail.status === "failed").length,
    details,
  };
}
