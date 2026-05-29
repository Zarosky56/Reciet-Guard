import "server-only";

import { extractReceipt } from "@/lib/ai/extract-receipt";
import { createGmailClient } from "@/lib/email/gmail-client";
import type {
  GmailAttachmentRef,
  ParsedGmailMessage,
} from "@/lib/email/parse-gmail-message";
import { createAdminClient } from "@/lib/supabase/admin";

export interface GmailProcessingResult {
  messageId: string;
  status: "success" | "duplicate" | "unknown_sender" | "needs_review" | "failed";
  receiptId?: string;
  error?: string;
}

async function findUserIdByEmail(email: string) {
  const admin = createAdminClient();
  let page = 1;

  while (page <= 50) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (match) {
      return match.id;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }

  return null;
}

/**
 * Download a Gmail attachment's raw bytes via the Gmail API.
 * Returns null on failure so callers can fall back to text extraction.
 */
async function downloadAttachment(
  gmailMessageId: string,
  attachment: GmailAttachmentRef,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const gmail = createGmailClient();
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: gmailMessageId,
      id: attachment.attachmentId,
    });

    const data = response.data.data;
    if (!data) return null;

    const buffer = Buffer.from(
      data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );

    return { buffer, mimeType: attachment.mimeType };
  } catch {
    return null;
  }
}

export async function processParsedEmail(
  email: ParsedGmailMessage,
): Promise<GmailProcessingResult> {
  const admin = createAdminClient();

  if (!email.gmailMessageId) {
    return {
      messageId: "",
      status: "failed",
      error: "Missing Gmail message ID",
    };
  }

  const { data: existingLog } = await admin
    .from("email_logs")
    .select("id, receipt_id, processing_status")
    .eq("gmail_message_id", email.gmailMessageId)
    .maybeSingle();

  if (existingLog) {
    return {
      messageId: email.gmailMessageId,
      status: "duplicate",
      receiptId: existingLog.receipt_id ?? undefined,
    };
  }

  if (!email.fromAddress) {
    await admin.from("email_logs").insert({
      gmail_message_id: email.gmailMessageId,
      from_address: null,
      subject: email.subject,
      received_at: email.receivedAt,
      processing_status: "failed",
      error_message: "Missing From address",
    });

    return {
      messageId: email.gmailMessageId,
      status: "failed",
      error: "Missing From address",
    };
  }

  const userId = await findUserIdByEmail(email.fromAddress);

  if (!userId) {
    await admin.from("email_logs").insert({
      gmail_message_id: email.gmailMessageId,
      from_address: email.fromAddress,
      subject: email.subject,
      received_at: email.receivedAt,
      processing_status: "failed",
      error_message: "Unknown sender",
    });

    return {
      messageId: email.gmailMessageId,
      status: "unknown_sender",
    };
  }

  // If a PDF/image attachment is present, download it and try Document AI first.
  let document: { buffer: Buffer; mimeType: string } | null = null;
  const primaryAttachment = email.receiptAttachments[0];
  if (primaryAttachment && primaryAttachment.size <= 20 * 1024 * 1024) {
    document = await downloadAttachment(email.gmailMessageId, primaryAttachment);
  }

  try {
    const extraction = await extractReceipt({
      emailText: email.bodyText.length > 20 ? email.bodyText : email.subject ?? "",
      document: document
        ? { content: document.buffer, mimeType: document.mimeType }
        : undefined,
      subject: email.subject,
    });

    if (extraction.status !== "success") {
      await admin.from("email_logs").insert({
        user_id: userId,
        gmail_message_id: email.gmailMessageId,
        from_address: email.fromAddress,
        subject: email.subject,
        received_at: email.receivedAt,
        processing_status: "needs_review",
        error_message: extraction.error,
      });

      return {
        messageId: email.gmailMessageId,
        status: "needs_review",
        error: extraction.error,
      };
    }

    const { data: receipt, error: receiptError } = await admin
      .from("receipts")
      .insert({
        user_id: userId,
        store_name: extraction.data.store_name,
        item_name: extraction.data.item_name,
        price: extraction.data.price,
        currency: extraction.data.currency,
        purchase_date: extraction.data.purchase_date,
        return_deadline: extraction.data.return_deadline,
        warranty_deadline: extraction.data.warranty_deadline ?? null,
        raw_email_text: email.bodyText.slice(0, 10000),
        ai_confidence: extraction.data.confidence,
        extraction_provider: extraction.provider,
        status: "active",
      })
      .select("id")
      .single();

    if (receiptError || !receipt) {
      throw receiptError ?? new Error("Receipt insert failed");
    }

    await admin.from("email_logs").insert({
      user_id: userId,
      receipt_id: receipt.id,
      gmail_message_id: email.gmailMessageId,
      from_address: email.fromAddress,
      subject: email.subject,
      received_at: email.receivedAt,
      processing_status: "success",
    });

    return {
      messageId: email.gmailMessageId,
      status: "success",
      receiptId: receipt.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email failed";

    await admin.from("email_logs").insert({
      user_id: userId,
      gmail_message_id: email.gmailMessageId,
      from_address: email.fromAddress,
      subject: email.subject,
      received_at: email.receivedAt,
      processing_status: "failed",
      error_message: message,
    });

    return {
      messageId: email.gmailMessageId,
      status: "failed",
      error: message,
    };
  }
}
