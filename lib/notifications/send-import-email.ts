import "server-only";

import { Resend } from "resend";

import { sendGmailEmail } from "@/lib/notifications/gmail-email";

interface SendImportEmailInput {
  to: string;
  title: string;
  body: string;
  appUrl: string;
  review?: boolean;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendImportEmail({
  to,
  title,
  body,
  appUrl,
  review = false,
}: SendImportEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

  const href = `${appUrl}${review ? "/receipts/review" : "/dashboard"}`;
  const text = `${body}\n\nOpen Receipt Guardian: ${href}`;
  const html = `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px">
        <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
        <p style="line-height:1.6">${escapeHtml(body)}</p>
        <p style="margin-top:20px">
          <a href="${href}" style="border:1px solid currentColor;padding:10px 14px;border-radius:8px;text-decoration:none">
            ${review ? "Review receipt" : "Open dashboard"}
          </a>
        </p>
      </div>
    `;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: title,
      text,
      html,
    });

    if (!error) {
      return { sent: true, error: null };
    }

    const fallback = await sendGmailEmail({ to, subject: title, text, html });
    return fallback.sent
      ? fallback
      : { sent: false, error: `${error.message}; Gmail fallback: ${fallback.error}` };
  }

  return sendGmailEmail({ to, subject: title, text, html });
}
