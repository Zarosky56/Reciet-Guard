import { NextResponse } from "next/server";
import { startOfMonth } from "date-fns";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import { mapReceipts } from "@/lib/receipts/mapper";

export async function GET() {
  const { supabase, user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    return apiError("DATABASE_ERROR", "Could not load dashboard stats.", 500);
  }

  const receipts = mapReceipts(data);
  const active = receipts.filter((receipt) => receipt.status === "active");
  const monthStart = startOfMonth(new Date());

  return NextResponse.json({
    total_receipts: receipts.length,
    active_receipts: active.length,
    expiring_soon: active.filter(
      (receipt) =>
        receipt.days_remaining !== null &&
        receipt.days_remaining >= 0 &&
        receipt.days_remaining <= 3,
    ).length,
    expired_this_month: receipts.filter((receipt) => {
      if (receipt.status !== "expired" || !receipt.return_deadline) {
        return false;
      }

      return new Date(`${receipt.return_deadline}T00:00:00`) >= monthStart;
    }).length,
    money_at_risk: active.reduce(
      (total, receipt) => total + (receipt.price ?? 0),
      0,
    ),
  });
}
