import "server-only";

import { Resend } from "resend";

interface SendDeadlineEmailInput {
  to: string;
  itemName: string | null;
  storeName: string | null;
  returnDeadline: string;
  appUrl: string;
}

export async function sendDeadlineEmail({
  to,
  itemName,
  storeName,
  returnDeadline,
  appUrl,
}: SendDeadlineEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey) {
    return {
      sent: false,
      error: "RESEND_API_KEY is not configured",
    };
  }

  const resend = new Resend(apiKey);
  const subject = `Return window closes soon: ${itemName ?? "receipt"}`;
  const safeItem = itemName ?? "Your tracked item";
  const safeStore = storeName ?? "Unknown store";

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    text: `${safeItem} from ${safeStore} has a return deadline on ${returnDeadline}. Open Receipt Guardian: ${appUrl}/dashboard`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0A0A0F;color:#E8E8ED;padding:24px">
        <h1 style="font-size:20px;margin:0 0 12px">Return window closing soon</h1>
        <p style="color:#A0A0B8;line-height:1.6">
          ${safeItem} from ${safeStore} has a return deadline on <strong>${returnDeadline}</strong>.
        </p>
        <p style="margin-top:20px">
          <a href="${appUrl}/dashboard" style="background:#3B82F6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">
            Open dashboard
          </a>
        </p>
      </div>
    `,
  });

  if (error) {
    return {
      sent: false,
      error: error.message,
    };
  }

  return {
    sent: true,
    error: null,
  };
}
