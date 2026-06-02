import { NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/api";

export async function POST() {
  const { supabase, user, response } = await requireApiUser();
  if (response || !user) return response;

  const { error } = await supabase
    .from("user_gmail_connections")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      {
        error: {
          code: "GMAIL_DISCONNECT_FAILED",
          message: "Could not disconnect Gmail.",
          status: 500,
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ disconnected: true });
}
