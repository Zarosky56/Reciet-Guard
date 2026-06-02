import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";

const gmailPreferencesSchema = z.object({
  timeWindow: z.enum(["new", "2d", "7d", "14d"]),
  allowedSenders: z
    .array(z.enum(["amazon.in", "amazon.com", "flipkart.com", "apple.com", "uber.com"]))
    .min(1),
  uncertainAction: z.enum(["add_to_review", "ask_first"]),
  notificationPref: z.enum(["every_import", "grouped_summary", "none"]),
  reminderPref: z.enum([
    "return_and_warranty",
    "return_only",
    "warranty_only",
    "none",
  ]),
});

export async function PATCH(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response || !user) return response;

  const body = await request.json().catch(() => null);
  const parsed = gmailPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid Gmail preferences.",
      400,
    );
  }

  const { data: connection } = await supabase
    .from("user_gmail_connections")
    .select("id, status, needs_reconnect")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!connection || connection.status !== "connected" || connection.needs_reconnect) {
    return apiError(
      "GMAIL_NOT_CONNECTED",
      "Connect Gmail before saving auto-fetch preferences.",
      428,
    );
  }

  const { error } = await supabase
    .from("user_gmail_connections")
    .update({
      sync_preferences: {
        ...parsed.data,
        autoFetchEnabled: true,
        updatedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return apiError("DATABASE_ERROR", "Could not save Gmail preferences.", 500);
  }

  return NextResponse.json({
    preferences: {
      ...parsed.data,
      autoFetchEnabled: true,
    },
  });
}
