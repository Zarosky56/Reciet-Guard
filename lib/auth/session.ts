import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function ensureProfile(userId: string) {
  const supabase = await createClient();
  const forwardingAddress = process.env.GMAIL_USER_EMAIL ?? null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, forwarding_address, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    if (!existing.forwarding_address && forwardingAddress) {
      const { data } = await supabase
        .from("profiles")
        .update({ forwarding_address: forwardingAddress })
        .eq("id", userId)
        .select("id, forwarding_address, created_at, updated_at")
        .single();

      return data ?? existing;
    }

    return existing;
  }

  const { data } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      forwarding_address: forwardingAddress,
    })
    .select("id, forwarding_address, created_at, updated_at")
    .single();

  return data;
}
