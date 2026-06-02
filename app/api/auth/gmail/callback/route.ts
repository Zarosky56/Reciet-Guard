import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";

import { requireApiUser } from "@/lib/auth/api";
import {
  createGmailOAuthClient,
  encryptOAuthToken,
  GMAIL_OAUTH_NEXT_COOKIE,
  GMAIL_OAUTH_STATE_COOKIE,
  GMAIL_READONLY_SCOPE,
  sanitizeOAuthNext,
} from "@/lib/email/user-gmail-oauth";

function redirectWithStatus(origin: string, next: string, status: string) {
  const url = new URL(next, origin);
  url.searchParams.set("gmail", status);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  const requestUrl = new URL(request.url);
  if (response || !user) {
    return redirectWithStatus(requestUrl.origin, "/login", "auth-required");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value;
  const next = sanitizeOAuthNext(
    cookieStore.get(GMAIL_OAUTH_NEXT_COOKIE)?.value ?? "/settings",
  );
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    return redirectWithStatus(requestUrl.origin, next, "permission-denied");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithStatus(requestUrl.origin, next, "invalid-state");
  }

  try {
    const oauthClient = createGmailOAuthClient(requestUrl.origin);
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const gmail = google.gmail({ version: "v1", auth: oauthClient });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const gmailEmail = profile.data.emailAddress ?? user.email ?? null;

    const { data: existing } = await supabase
      .from("user_gmail_connections")
      .select("refresh_token, sync_preferences")
      .eq("user_id", user.id)
      .maybeSingle();

    const encryptedRefresh =
      encryptOAuthToken(tokens.refresh_token) ?? existing?.refresh_token ?? null;

    if (!encryptedRefresh) {
      return redirectWithStatus(requestUrl.origin, next, "missing-refresh-token");
    }

    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null;

    const { error: upsertError } = await supabase
      .from("user_gmail_connections")
      .upsert(
        {
          user_id: user.id,
          gmail_email: gmailEmail,
          access_token: encryptOAuthToken(tokens.access_token),
          refresh_token: encryptedRefresh,
          expires_at: expiresAt,
          scope: tokens.scope ?? GMAIL_READONLY_SCOPE,
          status: "connected",
          needs_reconnect: false,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sync_preferences: existing?.sync_preferences ?? {},
        },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      return redirectWithStatus(requestUrl.origin, next, "save-failed");
    }

    const redirect = redirectWithStatus(requestUrl.origin, next, "connected");
    redirect.cookies.delete(GMAIL_OAUTH_STATE_COOKIE);
    redirect.cookies.delete(GMAIL_OAUTH_NEXT_COOKIE);
    return redirect;
  } catch (callbackError) {
    console.error("[gmail oauth callback]", callbackError);
    return redirectWithStatus(requestUrl.origin, next, "callback-failed");
  }
}
