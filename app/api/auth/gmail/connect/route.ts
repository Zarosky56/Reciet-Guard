import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import {
  createGmailAuthUrl,
  createGmailOAuthState,
  GMAIL_OAUTH_NEXT_COOKIE,
  GMAIL_OAUTH_STATE_COOKIE,
  sanitizeOAuthNext,
} from "@/lib/email/user-gmail-oauth";

const COOKIE_MAX_AGE_SECONDS = 10 * 60;

export async function GET(request: Request) {
  const { user, response } = await requireApiUser();
  if (response) return response;

  const url = new URL(request.url);
  const next = sanitizeOAuthNext(url.searchParams.get("next"));
  const state = createGmailOAuthState();

  let authUrl: string;
  try {
    authUrl = createGmailAuthUrl({
      origin: url.origin,
      state,
      loginHint: user.email,
    });
  } catch (error) {
    return apiError(
      "GMAIL_OAUTH_NOT_CONFIGURED",
      error instanceof Error ? error.message : "Gmail OAuth is not configured.",
      503,
    );
  }

  const redirect = NextResponse.redirect(authUrl);
  const secure = process.env.NODE_ENV === "production";
  redirect.cookies.set(GMAIL_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure,
  });
  redirect.cookies.set(GMAIL_OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure,
  });

  return redirect;
}
