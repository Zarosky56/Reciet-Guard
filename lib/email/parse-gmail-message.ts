import "server-only";

import type { gmail_v1 } from "googleapis";

export interface GmailAttachmentRef {
  filename: string;
  mimeType: string;
  attachmentId: string;
  size: number;
}

export interface ParsedGmailMessage {
  gmailMessageId: string;
  fromAddress: string | null;
  subject: string | null;
  receivedAt: string;
  bodyText: string;
  attachmentFilenames: string[];
  /** PDF/image attachments suitable for Document AI processing. */
  receiptAttachments: GmailAttachmentRef[];
}

const RECEIPT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function decodeBase64Url(data: string) {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function collectBodyParts(
  part: gmail_v1.Schema$MessagePart | undefined,
  textParts: string[],
  htmlParts: string[],
  attachmentFilenames: string[],
  receiptAttachments: GmailAttachmentRef[],
) {
  if (!part) {
    return;
  }

  const filename = part.filename ?? "";
  const mimeType = part.mimeType ?? "";
  const attachmentId = part.body?.attachmentId ?? "";

  if (filename) {
    attachmentFilenames.push(filename);
    if (
      attachmentId &&
      RECEIPT_MIME_TYPES.has(mimeType.toLowerCase())
    ) {
      receiptAttachments.push({
        filename,
        mimeType,
        attachmentId,
        size: Number(part.body?.size ?? 0),
      });
    }
  }

  const data = part.body?.data;
  if (data && mimeType === "text/plain") {
    textParts.push(decodeBase64Url(data));
  }

  if (data && mimeType === "text/html") {
    htmlParts.push(stripHtml(decodeBase64Url(data)));
  }

  for (const child of part.parts ?? []) {
    collectBodyParts(child, textParts, htmlParts, attachmentFilenames, receiptAttachments);
  }
}

function headerValue(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
) {
  return (
    headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())
      ?.value ?? null
  );
}

export function extractEmailAddress(header: string | null | undefined) {
  if (!header) {
    return null;
  }

  const match = header.match(/<([^>]+)>/);
  const raw = match?.[1] ?? header;
  const email = raw.trim().toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export function parseGmailMessage(
  message: gmail_v1.Schema$Message,
): ParsedGmailMessage {
  const headers = message.payload?.headers;
  const textParts: string[] = [];
  const htmlParts: string[] = [];
  const attachmentFilenames: string[] = [];
  const receiptAttachments: GmailAttachmentRef[] = [];

  collectBodyParts(
    message.payload ?? undefined,
    textParts,
    htmlParts,
    attachmentFilenames,
    receiptAttachments,
  );

  if (message.payload?.body?.data) {
    const decoded = decodeBase64Url(message.payload.body.data);
    if (message.payload.mimeType === "text/html") {
      htmlParts.push(stripHtml(decoded));
    } else {
      textParts.push(decoded);
    }
  }

  const fromHeader = headerValue(headers, "from");

  return {
    gmailMessageId: message.id ?? "",
    fromAddress: extractEmailAddress(fromHeader),
    subject: headerValue(headers, "subject"),
    receivedAt: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString(),
    bodyText: textParts.join("\n\n").trim() || htmlParts.join("\n\n").trim(),
    attachmentFilenames,
    receiptAttachments,
  };
}
