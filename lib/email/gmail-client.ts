import "server-only";

import { google } from "googleapis";

export const GMAIL_MODIFY_SCOPE = "https://www.googleapis.com/auth/gmail.modify";

export function createGmailClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail API credentials are not configured");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({
    version: "v1",
    auth: oauth2Client,
  });
}
