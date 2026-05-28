import { NextResponse } from "next/server";

import {
  getGoogleAuth,
  getProjectId,
  hasVercelWifCredentials,
} from "@/lib/google-cloud/auth";

/**
 * Diagnostic endpoint for Google Cloud auth.
 * Authenticated via WEBHOOK_SECRET so it can't be hit anonymously.
 *
 *   GET /api/debug/gcp-auth
 *   Authorization: Bearer <WEBHOOK_SECRET>
 *
 * Reports presence of WIF env vars, Vercel OIDC token, and tries to fetch a
 * Google access token. Helpful when WIF setup is failing.
 */

function authorized(request: Request): boolean {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return false;
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const env = {
    GOOGLE_CLOUD_PROJECT_ID: Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID),
    GCP_WIF_AUDIENCE_set: Boolean(process.env.GCP_WIF_AUDIENCE),
    GCP_WIF_AUDIENCE_value: process.env.GCP_WIF_AUDIENCE ?? null,
    GCP_WIF_SERVICE_ACCOUNT_set: Boolean(process.env.GCP_WIF_SERVICE_ACCOUNT),
    GCP_WIF_SERVICE_ACCOUNT_value: process.env.GCP_WIF_SERVICE_ACCOUNT ?? null,
    VERCEL_OIDC_TOKEN_present: Boolean(process.env.VERCEL_OIDC_TOKEN),
    VERCEL_OIDC_TOKEN_length: process.env.VERCEL_OIDC_TOKEN?.length ?? 0,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    ENABLE_VERTEX_AI: process.env.ENABLE_VERTEX_AI ?? null,
    ENABLE_DOCUMENT_AI: process.env.ENABLE_DOCUMENT_AI ?? null,
    DOCUMENT_AI_PROCESSOR_ID_set: Boolean(process.env.DOCUMENT_AI_PROCESSOR_ID),
  };

  const result: Record<string, unknown> = {
    ok: true,
    env,
    hasVercelWifCredentials: hasVercelWifCredentials(),
  };

  try {
    const auth = getGoogleAuth();
    const projectId = await getProjectId();
    result.projectIdResolved = projectId;
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    result.accessTokenObtained = Boolean(tokenResponse.token);
    result.accessTokenLength = tokenResponse.token?.length ?? 0;
  } catch (error) {
    result.authError =
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: String(error) };
  }

  return NextResponse.json(result);
}
