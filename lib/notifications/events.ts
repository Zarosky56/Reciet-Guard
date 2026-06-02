import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/supabase";

type AdminClient = SupabaseClient<Database>;
type NotificationChannel = Database["public"]["Tables"]["notification_events"]["Insert"]["channel"];
type NotificationType = Database["public"]["Tables"]["notification_events"]["Insert"]["type"];
type DeliveryStatus =
  Database["public"]["Tables"]["notification_events"]["Update"]["delivery_status"];

interface CreateNotificationEventInput {
  userId: string;
  receiptId?: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  thresholdDays?: number | null;
  dedupeKey: string;
  title: string;
  body: string;
  metadata?: Json;
}

export async function createNotificationEvent(
  supabase: AdminClient,
  input: CreateNotificationEventInput,
) {
  const { data, error } = await supabase
    .from("notification_events")
    .insert({
      user_id: input.userId,
      receipt_id: input.receiptId ?? null,
      channel: input.channel,
      type: input.type,
      threshold_days: input.thresholdDays ?? null,
      dedupe_key: input.dedupeKey,
      title: input.title,
      body: input.body,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { created: false as const, id: null, duplicate: true as const };
    }

    throw error;
  }

  return { created: true as const, id: data.id, duplicate: false as const };
}

export async function updateNotificationEvent(
  supabase: AdminClient,
  id: string,
  status: DeliveryStatus,
  errorMessage?: string | null,
) {
  await supabase
    .from("notification_events")
    .update({
      delivery_status: status,
      error_message: errorMessage ?? null,
    })
    .eq("id", id);
}
