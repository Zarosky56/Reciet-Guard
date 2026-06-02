import "server-only";

import { createGmailClient } from "@/lib/email/gmail-client";

interface GmailEmailAttachment {
  filename: string;
  contentType: string;
  content: Buffer;
}

interface SendGmailEmailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: GmailEmailAttachment[];
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function encodeBase64Url(value: string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function encodePart(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function boundary(name: string) {
  return `receipt_guardian_${name}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function buildAlternativePart(text: string, html: string, altBoundary: string) {
  return [
    `--${altBoundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodePart(text),
    `--${altBoundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encodePart(html),
    `--${altBoundary}--`,
  ].join("\r\n");
}

function buildRawMessage(input: SendGmailEmailInput, from: string) {
  const altBoundary = boundary("alt");
  const safeSubject = sanitizeHeader(input.subject);
  const safeTo = sanitizeHeader(input.to);
  const safeFrom = sanitizeHeader(from);

  const headers = [
    `To: ${safeTo}`,
    `From: ${safeFrom}`,
    `Subject: ${safeSubject}`,
    "MIME-Version: 1.0",
  ];

  const attachments = input.attachments ?? [];
  if (attachments.length === 0) {
    return encodeBase64Url(
      [
        ...headers,
        `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
        "",
        buildAlternativePart(input.text, input.html, altBoundary),
      ].join("\r\n"),
    );
  }

  const mixedBoundary = boundary("mixed");
  const attachmentParts = attachments.map((attachment) =>
    [
      `--${mixedBoundary}`,
      `Content-Type: ${sanitizeHeader(attachment.contentType)}; name="${sanitizeHeader(
        attachment.filename,
      )}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${sanitizeHeader(
        attachment.filename,
      )}"`,
      "",
      attachment.content.toString("base64"),
    ].join("\r\n"),
  );

  return encodeBase64Url(
    [
      ...headers,
      `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
      "",
      `--${mixedBoundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      "",
      buildAlternativePart(input.text, input.html, altBoundary),
      ...attachmentParts,
      `--${mixedBoundary}--`,
    ].join("\r\n"),
  );
}

export async function sendGmailEmail(input: SendGmailEmailInput) {
  const from = process.env.GMAIL_USER_EMAIL;
  if (!from) {
    return { sent: false, error: "GMAIL_USER_EMAIL is not configured" };
  }

  try {
    const gmail = createGmailClient();
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: buildRawMessage(input, from),
      },
    });
    return { sent: true, error: null };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Gmail send failed",
    };
  }
}
