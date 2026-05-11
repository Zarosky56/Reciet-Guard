import "server-only";

import { addDays, format } from "date-fns";

import { sendDeadlineEmail } from "@/lib/notifications/send-deadline-email";
import { createAdminClient } from "@/lib/supabase/admin";

export interface DeadlineCheckResult {
  checked: number;
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    receiptId: string;
    status: "sent" | "skipped" | "failed";
    error?: string;
  }>;
}

export async function checkDeadlineNotifications(
  now = new Date(),
): Promise<DeadlineCheckResult> {
  const admin = createAdminClient();
  const today = format(now, "yyyy-MM-dd");
  const threeDaysFromNow = format(addDays(now, 3), "yyyy-MM-dd");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const { data: receipts, error } = await admin
    .from("receipts")
    .select(
      "id, user_id, store_name, item_name, return_deadline, notification_sent_3d",
    )
    .eq("status", "active")
    .eq("notification_sent_3d", false)
    .gte("return_deadline", today)
    .lte("return_deadline", threeDaysFromNow);

  if (error) {
    throw error;
  }

  const details: DeadlineCheckResult["details"] = [];

  for (const receipt of receipts ?? []) {
    const { data: userResult, error: userError } =
      await admin.auth.admin.getUserById(receipt.user_id);
    const email = userResult.user?.email;

    if (userError || !email || !receipt.return_deadline) {
      details.push({
        receiptId: receipt.id,
        status: "skipped",
        error: userError?.message ?? "Missing user email or deadline",
      });
      continue;
    }

    const result = await sendDeadlineEmail({
      to: email,
      itemName: receipt.item_name,
      storeName: receipt.store_name,
      returnDeadline: receipt.return_deadline,
      appUrl,
    });

    if (!result.sent) {
      details.push({
        receiptId: receipt.id,
        status: "failed",
        error: result.error ?? "Unknown Resend failure",
      });
      continue;
    }

    await admin
      .from("receipts")
      .update({ notification_sent_3d: true })
      .eq("id", receipt.id);

    details.push({
      receiptId: receipt.id,
      status: "sent",
    });
  }

  return {
    checked: receipts?.length ?? 0,
    sent: details.filter((detail) => detail.status === "sent").length,
    skipped: details.filter((detail) => detail.status === "skipped").length,
    failed: details.filter((detail) => detail.status === "failed").length,
    details,
  };
}
