import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import {
  getVapidPublicKey,
} from "@/lib/notifications/push";
import {
  mapNotificationPreferences,
  normalizeCurrency,
  normalizeReminderThresholds,
} from "@/lib/notifications/preferences";

const preferencesSchema = z.object({
  defaultCurrency: z.string().trim().length(3).optional(),
  onboardingCompleted: z.boolean().optional(),
  introToAppEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  reminderThresholds: z.array(z.number().int()).optional(),
});

const profileSelect =
  "default_currency, onboarding_completed, intro_to_app_enabled, email_notifications_enabled, push_notifications_enabled, reminder_thresholds";

export async function GET() {
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;

  const { data } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    preferences: mapNotificationPreferences(data),
    vapidPublicKey: getVapidPublicKey(),
  });
}

export async function PATCH(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid preferences.",
      400,
    );
  }

  const update: Record<string, unknown> = {};
  if (parsed.data.defaultCurrency !== undefined) {
    update.default_currency = normalizeCurrency(parsed.data.defaultCurrency);
  }
  if (parsed.data.onboardingCompleted !== undefined) {
    update.onboarding_completed = parsed.data.onboardingCompleted;
  }
  if (parsed.data.introToAppEnabled !== undefined) {
    update.intro_to_app_enabled = parsed.data.introToAppEnabled;
  }
  if (parsed.data.emailNotificationsEnabled !== undefined) {
    update.email_notifications_enabled =
      parsed.data.emailNotificationsEnabled;
  }
  if (parsed.data.pushNotificationsEnabled !== undefined) {
    update.push_notifications_enabled = parsed.data.pushNotificationsEnabled;
  }
  if (parsed.data.reminderThresholds !== undefined) {
    update.reminder_thresholds = normalizeReminderThresholds(
      parsed.data.reminderThresholds,
    );
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id)
    .select(profileSelect)
    .single();

  if (error || !data) {
    return apiError("DATABASE_ERROR", "Could not save preferences.", 500);
  }

  return NextResponse.json({
    preferences: mapNotificationPreferences(data),
    vapidPublicKey: getVapidPublicKey(),
  });
}
