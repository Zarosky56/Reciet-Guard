import "server-only";

import crypto from "node:crypto";

import { google } from "googleapis";

export const GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_OAUTH_STATE_COOKIE = "receipt_guardian_gmail_oauth_state";
export const GMAIL_OAUTH_NEXT_COOKIE = "receipt_guardian_gmail_oauth_next";

const TOKEN_PREFIX = "v1";

export function getGmailOAuthConfig(origin: string) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri =
    process.env.GMAIL_OAUTH_REDIRECT_URI ??
    `${origin}/api/auth/gmail/callback`;

  const missing = [
    ["GMAIL_CLIENT_ID", clientId],
    ["GMAIL_CLIENT_SECRET", clientSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Gmail OAuth environment variables: ${missing.join(", ")}`);
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function createGmailOAuthClient(origin: string) {
  const config = getGmailOAuthConfig(origin);
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri,
  );
}

export function createGmailOAuthState() {
  return crypto.randomBytes(32).toString("base64url");
}

export function sanitizeOAuthNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function createGmailAuthUrl({
  origin,
  state,
  loginHint,
}: {
  origin: string;
  state: string;
  loginHint?: string | null;
}) {
  const client = createGmailOAuthClient(origin);
  return client.generateAuthUrl({
    access_type: "offline",
    include_granted_scopes: false,
    prompt: "consent",
    scope: [GMAIL_READONLY_SCOPE],
    state,
    login_hint: loginHint ?? undefined,
  });
}

function getEncryptionKey() {
  const raw = process.env.OAUTH_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("Missing OAUTH_ENCRYPTION_KEY.");
  }

  const trimmed = raw.trim();
  const candidates = [
    Buffer.from(trimmed, "base64"),
    Buffer.from(trimmed, "hex"),
    Buffer.from(trimmed, "utf8"),
  ];
  const key = candidates.find((candidate) => candidate.length === 32);

  if (!key) {
    throw new Error("OAUTH_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return key;
}

export function encryptOAuthToken(token: string | null | undefined) {
  if (!token) return null;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    TOKEN_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptOAuthToken(value: string | null | undefined) {
  if (!value) return null;

  const [version, ivText, authTagText, encryptedText] = value.split(".");
  if (
    version !== TOKEN_PREFIX ||
    !ivText ||
    !authTagText ||
    !encryptedText
  ) {
    throw new Error("Unsupported OAuth token format.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagText, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
