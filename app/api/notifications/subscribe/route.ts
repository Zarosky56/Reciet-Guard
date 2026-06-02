import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(10),
    auth: z.string().min(8),
  }),
});

export async function POST(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid push subscription.",
      400,
    );
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: request.headers.get("user-agent"),
      enabled: true,
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return apiError("DATABASE_ERROR", "Could not save subscription.", 500);
  }

  await supabase
    .from("profiles")
    .update({ push_notifications_enabled: true })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}
