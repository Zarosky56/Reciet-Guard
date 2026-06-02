import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";

export async function GET() {
  const { supabase, user, response } = await requireApiUser();
  if (response || !user) return response;

  const { data, error } = await supabase
    .from("user_gmail_connections")
    .select("gmail_email, status, needs_reconnect, last_sync_at, sync_preferences")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({
      connected: false,
      status: "disconnected",
      needsReconnect: false,
    });
  }

  return NextResponse.json({
    connected: data?.status === "connected" && !data.needs_reconnect,
    gmailEmail: data?.gmail_email ?? null,
    status: data?.status ?? "disconnected",
    needsReconnect: Boolean(data?.needs_reconnect),
    lastSyncAt: data?.last_sync_at ?? null,
    syncPreferences: data?.sync_preferences ?? null,
  });
}
