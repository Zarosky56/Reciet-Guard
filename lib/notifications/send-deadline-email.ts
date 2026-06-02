import "server-only";

import { Resend, type Attachment } from "resend";

import { sendGmailEmail } from "@/lib/notifications/gmail-email";
import type { ReminderAttachment } from "@/lib/notifications/reminder-attachments";

interface SendDeadlineEmailInput {
  to: string;
  itemName: string | null;
  storeName: string | null;
  purchaseDate: string | null;
  returnDeadline: string | null;
  warrantyDeadline: string | null;
  deadlineDate: string;
  deadlineKind: "return" | "warranty";
  thresholdDays: number;
  appUrl: string;
  attachment?: ReminderAttachment | null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function thresholdLabel(days: number) {
  if (days === 0) return "due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

function attachmentForResend(
  attachment: ReminderAttachment | null | undefined,
): Attachment[] | undefined {
  if (!attachment || attachment.mode !== "attachment") return undefined;

  return [
    {
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    },
  ];
}

export async function sendDeadlineEmail({
  to,
  itemName,
  storeName,
  purchaseDate,
  returnDeadline,
  warrantyDeadline,
  deadlineDate,
  deadlineKind,
  thresholdDays,
  appUrl,
  attachment,
}: SendDeadlineEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

  const safeItem = itemName ?? "Your tracked item";
  const safeStore = storeName ?? "Unknown store";
  const deadlineLabel = deadlineKind === "return" ? "Return window" : "Warranty";
  const label = thresholdLabel(thresholdDays);
  const dashboardLink = `${appUrl}/dashboard${
    deadlineKind === "warranty" ? "#warranty" : ""
  }`;
  const signedLink =
    attachment?.mode === "link"
      ? `\nAttachment download: ${attachment.signedUrl}`
      : "";

  const subject = `${deadlineLabel} ${label}: ${safeItem}`;
  const htmlRows = [
    ["Store", safeStore],
    ["Item", safeItem],
    ["Purchase date", purchaseDate ?? "Not recorded"],
    ["Return deadline", returnDeadline ?? "Not recorded"],
    ["Warranty deadline", warrantyDeadline ?? "Not recorded"],
  ]
    .map(
      ([labelText, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0">${escapeHtml(labelText)}</td>
          <td style="padding:6px 0">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  const attachmentNote =
    attachment?.mode === "link"
      ? `<p style="line-height:1.6">The receipt file is too large to attach safely. <a href="${attachment.signedUrl}">Download ${escapeHtml(attachment.filename)}</a>.</p>`
      : attachment?.mode === "attachment"
        ? `<p style="line-height:1.6">The receipt file is attached to this email.</p>`
        : "";

  const text = `${deadlineLabel} ${label} for ${safeItem} from ${safeStore}.
Deadline: ${deadlineDate}
Purchase date: ${purchaseDate ?? "Not recorded"}
Return deadline: ${returnDeadline ?? "Not recorded"}
Warranty deadline: ${warrantyDeadline ?? "Not recorded"}
Open Receipt Guardian: ${dashboardLink}${signedLink}`;
  const html = `
      <div style="font-family:Inter,Arial,sans-serif;padding:24px">
        <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(deadlineLabel)} ${escapeHtml(label)}</h1>
        <p style="line-height:1.6">
          ${escapeHtml(safeItem)} from ${escapeHtml(safeStore)} has a ${escapeHtml(deadlineKind)} deadline on <strong>${escapeHtml(deadlineDate)}</strong>.
        </p>
        <table style="margin-top:12px;border-collapse:collapse;font-size:14px">
          ${htmlRows}
        </table>
        ${attachmentNote}
        <p style="margin-top:20px">
          <a href="${dashboardLink}" style="border:1px solid currentColor;padding:10px 14px;border-radius:8px;text-decoration:none">
            Open dashboard
          </a>
        </p>
      </div>
    `;
  const gmailAttachments =
    attachment?.mode === "attachment"
      ? [
          {
            filename: attachment.filename,
            contentType: attachment.contentType,
            content: attachment.content,
          },
        ]
      : undefined;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
      attachments: attachmentForResend(attachment),
    });

    if (!error) {
      return { sent: true, error: null };
    }

    const fallback = await sendGmailEmail({
      to,
      subject,
      text,
      html,
      attachments: gmailAttachments,
    });
    return fallback.sent
      ? fallback
      : { sent: false, error: `${error.message}; Gmail fallback: ${fallback.error}` };
  }

  return sendGmailEmail({
    to,
    subject,
    text,
    html,
    attachments: gmailAttachments,
  });
}
