import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";

const unsubscribeSchema = z.object({
  endpoint: z.string().url().optional(),
});

export async function POST(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const parsed = unsubscribeSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid unsubscribe request.", 400);
  }

  let query = supabase
    .from("push_subscriptions")
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (parsed.data.endpoint) {
    query = query.eq("endpoint", parsed.data.endpoint);
  }

  const { error } = await query;
  if (error) {
    return apiError("DATABASE_ERROR", "Could not disable notifications.", 500);
  }

  await supabase
    .from("profiles")
    .update({ push_notifications_enabled: false })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
