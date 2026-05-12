import { createServer } from "node:http";
import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";
import { google } from "googleapis";

function loadLocalEnv() {
  const envPath = ".env.local";
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const port = Number(process.env.GMAIL_OAUTH_PORT ?? 3333);
const redirectUri = `http://localhost:${port}/oauth2callback`;
const scope = "https://www.googleapis.com/auth/gmail.modify";

if (!clientId || !clientSecret) {
  console.error("Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET before running.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri,
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: [scope],
});

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", redirectUri);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      response.writeHead(400, { "Content-Type": "text/plain" });
      response.end("Missing OAuth code.");
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Refresh token generated. You can close this tab.");

    console.log("\nGMAIL_REFRESH_TOKEN=");
    console.log(tokens.refresh_token ?? "(No refresh token returned)");
    console.log(
      "\nPut that value in .env.local. Do not commit it or paste it publicly.",
    );
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain" });
    response.end("OAuth token exchange failed.");
    console.error(error instanceof Error ? error.message : error);
  } finally {
    server.close();
  }
});

server.listen(port, async () => {
  console.log(`Listening on ${redirectUri}`);
  console.log("\nOpen this URL and approve Gmail access:\n");
  console.log(authUrl);
});

await once(server, "close");
