import "server-only";

import { headers } from "next/headers";
import { ExternalAccountClient, GoogleAuth } from "google-auth-library";

/**
 * Google Cloud authentication for both local dev and Vercel.
 *
 *  - Local dev: uses `gcloud auth application-default login` (ADC).
 *  - Vercel runtime: reads the OIDC token from the `x-vercel-oidc-token` request
 *    header (where Vercel injects it during function invocations) and exchanges
 *    it for a Google access token via Workload Identity Federation.
 *  - Vercel build: falls back to `process.env.VERCEL_OIDC_TOKEN`.
 *
 * Required env vars for Vercel WIF:
 *   GCP_WIF_AUDIENCE              audience URL of the WIF provider
 *   GCP_WIF_SERVICE_ACCOUNT       service account email to impersonate
 *
 * Required project setting on Vercel:
 *   Settings → Security → "Secure backend access with OIDC federation" enabled.
 */

const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

async function readVercelOidcToken(): Promise<string | null> {
  // Header injected at runtime by Vercel functions.
  try {
    const h = await headers();
    const fromHeader = h.get("x-vercel-oidc-token");
    if (fromHeader) return fromHeader;
  } catch {
    // headers() throws outside a request scope (e.g. build time). Ignore.
  }

  // Build-time / local dev fallback (set by `vercel env pull` or in build env).
  return process.env.VERCEL_OIDC_TOKEN ?? null;
}

function buildWifClient(oidcToken: string) {
  const audience = process.env.GCP_WIF_AUDIENCE;
  const serviceAccount = process.env.GCP_WIF_SERVICE_ACCOUNT;

  if (!audience || !serviceAccount) {
    return null;
  }

  return ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    credential_source: {
      url: "data:text/plain;base64," + Buffer.from(oidcToken).toString("base64"),
      format: { type: "text" },
    },
  });
}

/**
 * Returns a Google auth client suitable for any GCP API.
 * NOT cached — each call resolves a fresh OIDC token from the request scope.
 */
export async function getGoogleAuth(): Promise<GoogleAuth> {
  const oidcToken = await readVercelOidcToken();

  if (oidcToken) {
    const wifClient = buildWifClient(oidcToken);
    if (wifClient) {
      return new GoogleAuth({
        scopes: SCOPES,
        authClient: wifClient,
      });
    }
  }

  // Local dev / fallback to ADC.
  return new GoogleAuth({ scopes: SCOPES });
}

/** Returns the resolved Google Cloud project ID. */
export async function getProjectId(): Promise<string> {
  const explicit = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (explicit) return explicit;

  const auth = await getGoogleAuth();
  const projectId = await auth.getProjectId();
  if (!projectId) {
    throw new Error("Could not determine GOOGLE_CLOUD_PROJECT_ID");
  }
  return projectId;
}

/** True when WIF is fully configured (env vars set). */
export async function hasVercelWifCredentials(): Promise<boolean> {
  if (!process.env.GCP_WIF_AUDIENCE || !process.env.GCP_WIF_SERVICE_ACCOUNT) {
    return false;
  }
  const token = await readVercelOidcToken();
  return Boolean(token);
}
