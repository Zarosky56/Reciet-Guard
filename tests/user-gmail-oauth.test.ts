import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createGmailAuthUrl,
  decryptOAuthToken,
  encryptOAuthToken,
  GMAIL_READONLY_SCOPE,
  sanitizeOAuthNext,
} from "@/lib/email/user-gmail-oauth";

describe("user Gmail OAuth helpers", () => {
  beforeEach(() => {
    vi.stubEnv("GMAIL_CLIENT_ID", "test-client-id");
    vi.stubEnv("GMAIL_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv(
      "OAUTH_ENCRYPTION_KEY",
      Buffer.from("0123456789abcdef0123456789abcdef").toString("base64"),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps OAuth redirects inside the app", () => {
    expect(sanitizeOAuthNext("/settings?gmail=connect")).toBe(
      "/settings?gmail=connect",
    );
    expect(sanitizeOAuthNext("https://evil.example/settings")).toBe("/dashboard");
    expect(sanitizeOAuthNext("//evil.example/settings")).toBe("/dashboard");
    expect(sanitizeOAuthNext(null)).toBe("/dashboard");
  });

  it("encrypts OAuth tokens using an authenticated round trip", () => {
    const encrypted = encryptOAuthToken("refresh-token-value");

    expect(encrypted).not.toBe("refresh-token-value");
    expect(decryptOAuthToken(encrypted)).toBe("refresh-token-value");
  });

  it("builds a read-only Gmail consent URL", () => {
    const authUrl = new URL(
      createGmailAuthUrl({
        origin: "https://app.example",
        state: "state-123",
        loginHint: "person@example.com",
      }),
    );

    expect(authUrl.hostname).toBe("accounts.google.com");
    expect(authUrl.searchParams.get("access_type")).toBe("offline");
    expect(authUrl.searchParams.get("prompt")).toBe("consent");
    expect(authUrl.searchParams.get("scope")).toBe(GMAIL_READONLY_SCOPE);
    expect(authUrl.searchParams.get("state")).toBe("state-123");
    expect(authUrl.searchParams.get("login_hint")).toBe("person@example.com");
    expect(authUrl.searchParams.get("redirect_uri")).toBe(
      "https://app.example/api/auth/gmail/callback",
    );
  });
});
