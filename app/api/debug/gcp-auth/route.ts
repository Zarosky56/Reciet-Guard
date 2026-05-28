import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  getGoogleAuth,
  getProjectId,
  hasVercelWifCredentials,
} from "@/lib/google-cloud/auth";

/**
 * Diagnostic endpoint for Google Cloud auth.
 * Authenticated via WEBHOOK_SECRET so it can't be hit anonymously.
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

  const h = await headers();
  const headerToken = h.get("x-vercel-oidc-token");

  const env = {
    GOOGLE_CLOUD_PROJECT_ID: Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID),
    GCP_WIF_AUDIENCE_set: Boolean(process.env.GCP_WIF_AUDIENCE),
    GCP_WIF_AUDIENCE_value: process.env.GCP_WIF_AUDIENCE ?? null,
    GCP_WIF_SERVICE_ACCOUNT_set: Boolean(process.env.GCP_WIF_SERVICE_ACCOUNT),
    GCP_WIF_SERVICE_ACCOUNT_value: process.env.GCP_WIF_SERVICE_ACCOUNT ?? null,
    OIDC_via_header_present: Boolean(headerToken),
    OIDC_via_header_length: headerToken?.length ?? 0,
    OIDC_via_env_present: Boolean(process.env.VERCEL_OIDC_TOKEN),
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    ENABLE_VERTEX_AI: process.env.ENABLE_VERTEX_AI ?? null,
    ENABLE_DOCUMENT_AI: process.env.ENABLE_DOCUMENT_AI ?? null,
    DOCUMENT_AI_PROCESSOR_ID_set: Boolean(process.env.DOCUMENT_AI_PROCESSOR_ID),
  };

  const result: Record<string, unknown> = {
    ok: true,
    env,
    hasVercelWifCredentials: await hasVercelWifCredentials(),
  };

  try {
    const auth = await getGoogleAuth();
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
