import "server-only";

import { google } from "googleapis";

export const GMAIL_MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

export function createGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  const missing = [
    ["GMAIL_CLIENT_ID", clientId],
    ["GMAIL_CLIENT_SECRET", clientSecret],
    ["GMAIL_REFRESH_TOKEN", refreshToken],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Gmail environment variables: ${missing.join(", ")}`);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}
