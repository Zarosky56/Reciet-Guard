import "server-only";

import { ExternalAccountClient, GoogleAuth } from "google-auth-library";

/**
 * Google Cloud authentication for both local dev and Vercel.
 *
 *  - Local dev: uses `gcloud auth application-default login` (ADC).
 *  - Vercel: uses Workload Identity Federation. Vercel issues an OIDC token
 *    via `VERCEL_OIDC_TOKEN`; we exchange it for a Google access token using
 *    the WIF audience configured in env vars.
 *
 * Required env vars for Vercel WIF (all set in Vercel project settings):
 *   GCP_WIF_AUDIENCE              audience URL of the WIF provider
 *     e.g. //iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/vercel/providers/vercel
 *   GCP_WIF_SERVICE_ACCOUNT       service account email to impersonate
 *     e.g. receipt-guard-app@receipt-guardian-497713.iam.gserviceaccount.com
 *
 * Locally on Windows, only run `gcloud auth application-default login` once.
 */

const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

let cachedAuth: GoogleAuth | null = null;

function buildWifClient() {
  const audience = process.env.GCP_WIF_AUDIENCE;
  const serviceAccount = process.env.GCP_WIF_SERVICE_ACCOUNT;
  const oidcToken = process.env.VERCEL_OIDC_TOKEN;

  if (!audience || !serviceAccount || !oidcToken) {
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

/** Returns a Google auth client suitable for any GCP API. */
export function getGoogleAuth(): GoogleAuth {
  if (cachedAuth) return cachedAuth;

  const wifClient = buildWifClient();
  if (wifClient) {
    cachedAuth = new GoogleAuth({
      scopes: SCOPES,
      authClient: wifClient,
    });
  } else {
    cachedAuth = new GoogleAuth({ scopes: SCOPES });
  }

  return cachedAuth;
}

/** Returns the resolved Google Cloud project ID. */
export async function getProjectId(): Promise<string> {
  const explicit = process.env.GOOGLE_CLOUD_PROJECT_ID;
  if (explicit) return explicit;

  const auth = getGoogleAuth();
  const projectId = await auth.getProjectId();
  if (!projectId) {
    throw new Error("Could not determine GOOGLE_CLOUD_PROJECT_ID");
  }
  return projectId;
}

/** True when Vercel WIF is fully configured. */
export function hasVercelWifCredentials(): boolean {
  return Boolean(
    process.env.GCP_WIF_AUDIENCE &&
      process.env.GCP_WIF_SERVICE_ACCOUNT &&
      process.env.VERCEL_OIDC_TOKEN,
  );
}

/** True when ANY Google Cloud credentials path is available. */
export function hasGoogleCloudCredentials(): boolean {
  if (hasVercelWifCredentials()) return true;
  // Local ADC presence — best-effort check via env var set by gcloud.
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.CLOUDSDK_CONFIG ||
      process.env.HOME ||
      process.env.USERPROFILE,
  );
}

export function clearCachedAuth() {
  cachedAuth = null;
}
