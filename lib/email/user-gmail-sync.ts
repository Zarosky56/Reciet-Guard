import "server-only";

import { google } from "googleapis";
import { extractReceipt } from "@/lib/ai/extract-receipt";
import { parseGmailMessage, type GmailAttachmentRef, type ParsedGmailMessage } from "@/lib/email/parse-gmail-message";
import { createGmailOAuthClient, decryptOAuthToken, encryptOAuthToken } from "@/lib/email/user-gmail-oauth";
import { notifyGmailImport } from "@/lib/notifications/gmail-import";
import { insertAttachmentRow } from "@/lib/receipts/attachments";
import { buildStoragePath, isAllowedMime, uploadReceiptFile } from "@/lib/storage/receipt-storage";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SyncResult {
  checked: number;
  imported: number;
  needs_review: number;
  skipped_duplicate: number;
  skipped_expired: number;
  failed: number;
}

export async function syncUserGmailReceipts(
  userId: string,
  options?: { origin?: string },
): Promise<SyncResult> {
  const admin = createAdminClient();
  const origin = options?.origin ?? "http://localhost:3000";

  const result: SyncResult = {
    checked: 0,
    imported: 0,
    needs_review: 0,
    skipped_duplicate: 0,
    skipped_expired: 0,
    failed: 0,
  };

  const startedAt = new Date().toISOString();

  // 1. Fetch user's Gmail connection
  const { data: connection, error: connError } = await admin
    .from("user_gmail_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (connError || !connection) {
    await logSyncRun(userId, startedAt, "failed", result, "No Gmail connection found.");
    throw new Error("Gmail connection not found for this user.");
  }

  if (connection.status !== "connected" || connection.needs_reconnect) {
    await logSyncRun(userId, startedAt, "failed", result, "Gmail connection requires reconnection.");
    throw new Error("Gmail connection is not active or needs reconnection.");
  }

  let accessToken = connection.access_token;
  const refreshToken = connection.refresh_token;

  if (!refreshToken) {
    await logSyncRun(userId, startedAt, "failed", result, "No refresh token available.");
    throw new Error("No refresh token available. Please reconnect Gmail.");
  }

  // 2. Check if access token is expired or close to it
  const expiresAt = connection.expires_at ? new Date(connection.expires_at).getTime() : 0;
  const bufferTime = 60 * 1000; // 1 minute buffer

  if (expiresAt - Date.now() < bufferTime) {
    try {
      const oauthClient = createGmailOAuthClient(origin);
      oauthClient.setCredentials({
        refresh_token: decryptOAuthToken(refreshToken),
      });

      const { credentials } = await oauthClient.refreshAccessToken();
      const newAccessToken = credentials.access_token;
      const newExpiry = credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : new Date(Date.now() + 3500 * 1000).toISOString();

      if (newAccessToken) {
        accessToken = encryptOAuthToken(newAccessToken);
        const { error: updateError } = await admin
          .from("user_gmail_connections")
          .update({
            access_token: accessToken,
            expires_at: newExpiry,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        if (updateError) {
          console.error("[sync refresh token update]", updateError);
        }
      }
    } catch (refreshError) {
      console.error("[sync refresh token failed]", refreshError);
      const message = refreshError instanceof Error ? refreshError.message : "";
      
      // If the permission has been revoked or refresh token is invalid
      if (
        message.includes("invalid_grant") ||
        message.includes("invalid_request") ||
        message.includes("unauthorized")
      ) {
        await admin
          .from("user_gmail_connections")
          .update({
            status: "disconnected",
            needs_reconnect: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id);
      }

      await logSyncRun(userId, startedAt, "failed", result, `Token refresh failed: ${message}`);
      throw new Error(`Failed to refresh Gmail credentials: ${message}`);
    }
  }

  // 3. Create Gmail client
  let gmail;
  try {
    const oauthClient = createGmailOAuthClient(origin);
    oauthClient.setCredentials({
      access_token: decryptOAuthToken(accessToken),
      refresh_token: decryptOAuthToken(refreshToken),
    });
    gmail = google.gmail({ version: "v1", auth: oauthClient });
  } catch (clientError) {
    console.error("[sync gmail client init failed]", clientError);
    const message = clientError instanceof Error ? clientError.message : "";
    await logSyncRun(userId, startedAt, "failed", result, `Client init failed: ${message}`);
    throw clientError;
  }

  // 4. Construct Gmail Search Query
  const syncPreferences = (connection.sync_preferences as any) || {};
  const timeWindow = syncPreferences.timeWindow || "2d";
  const allowedSenders = syncPreferences.allowedSenders || [];

  let days = "2";
  if (timeWindow === "new") days = "1";
  else if (timeWindow === "2d") days = "2";
  else if (timeWindow === "7d") days = "7";
  else if (timeWindow === "14d") days = "14";

  let fromFilter = "";
  // If allowedSenders is configured, and it does not include "others", filter strictly.
  // If it includes "others" or is empty, we do not filter by from address to scan all.
  if (allowedSenders.length > 0 && !allowedSenders.includes("others")) {
    const senderQueries = allowedSenders.map((s: string) => `from:${s}`);
    fromFilter = ` (${senderQueries.join(" OR ")})`;
  }

  const query = `newer_than:${days}d subject:(invoice OR receipt OR order OR bill)${fromFilter}`;

  // 5. Fetch and process messages (strictly up to 5 per run)
  try {
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 5,
    });

    const messages = listResponse.data.messages || [];
    result.checked = messages.length;

    for (const msgRef of messages) {
      if (!msgRef.id) continue;

      // 5a. Check if already processed for this user
      const { data: existingLog } = await admin
        .from("email_logs")
        .select("id")
        .eq("gmail_message_id", msgRef.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingLog) {
        result.skipped_duplicate++;
        continue;
      }

      // 5b. Get full email details
      const fullMsg = await gmail.users.messages.get({
        userId: "me",
        id: msgRef.id,
        format: "full",
      });

      const parsed = parseGmailMessage(fullMsg.data);

      // 5c. Download primary attachment if eligible
      let document: { buffer: Buffer; mimeType: string } | null = null;
      const primaryAttachment = parsed.receiptAttachments[0];
      if (primaryAttachment && primaryAttachment.size <= 20 * 1024 * 1024) {
        try {
          const attachResponse = await gmail.users.messages.attachments.get({
            userId: "me",
            messageId: parsed.gmailMessageId,
            id: primaryAttachment.attachmentId,
          });
          const attachData = attachResponse.data.data;
          if (attachData) {
            document = {
              buffer: Buffer.from(attachData.replace(/-/g, "+").replace(/_/g, "/"), "base64"),
              mimeType: primaryAttachment.mimeType,
            };
          }
        } catch (attachErr) {
          console.error(`[sync attachment download failed msgId=${parsed.gmailMessageId}]`, attachErr);
        }
      }

      // 5d. Run AI Extraction
      try {
        const extraction = await extractReceipt({
          emailText: parsed.bodyText.length > 20 ? parsed.bodyText : parsed.subject ?? "",
          document: document
            ? { content: document.buffer, mimeType: document.mimeType }
            : undefined,
          subject: parsed.subject,
        });

        if (extraction.status !== "success") {
          // Extraction needs review (AI failed or low confidence)
          await admin.from("email_logs").insert({
            user_id: userId,
            gmail_message_id: parsed.gmailMessageId,
            from_address: parsed.fromAddress,
            subject: parsed.subject,
            received_at: parsed.receivedAt,
            processing_status: "needs_review",
            error_message: extraction.error || "AI confidence below threshold",
          });

          await notifyGmailImport(admin, {
            userId,
            userEmail: parsed.fromAddress || connection.gmail_email || "",
            messageId: parsed.gmailMessageId,
            status: "needs_review",
            error: extraction.error,
          });

          result.needs_review++;
          continue;
        }

        // 5e. Deadline check
        const hasPastDeadline = isDeadlineInPast(extraction.data.return_deadline) || isDeadlineInPast(extraction.data.warranty_deadline);

        if (hasPastDeadline) {
          // Discard expired receipts! Save to email_logs as failed to avoid re-syncing
          await admin.from("email_logs").insert({
            user_id: userId,
            gmail_message_id: parsed.gmailMessageId,
            from_address: parsed.fromAddress,
            subject: parsed.subject,
            received_at: parsed.receivedAt,
            processing_status: "failed",
            error_message: "Skipped: Return or warranty deadline is in the past.",
          });

          result.skipped_expired++;
          continue;
        }

        // 5f. Insert receipt
        const { data: newReceipt, error: receiptError } = await admin
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
            raw_email_text: parsed.bodyText.slice(0, 10000),
            ai_confidence: extraction.data.confidence,
            extraction_provider: extraction.provider,
            status: "active",
          })
          .select("id")
          .single();

        if (receiptError || !newReceipt) {
          throw receiptError ?? new Error("Failed to insert receipt");
        }

        // 5g. Save attachment to storage if exists
        if (document && primaryAttachment && isAllowedMime(primaryAttachment.mimeType)) {
          try {
            const storagePath = buildStoragePath({
              userId,
              receiptId: newReceipt.id,
              filename: primaryAttachment.filename,
            });
            await uploadReceiptFile(admin, {
              storagePath,
              body: document.buffer,
              mimeType: primaryAttachment.mimeType,
            });
            await insertAttachmentRow(admin, {
              receiptId: newReceipt.id,
              userId,
              storagePath,
              originalFilename: primaryAttachment.filename,
              mimeType: primaryAttachment.mimeType,
              sizeBytes: document.buffer.byteLength,
              kind: "receipt",
              source: "email_attachment",
              isPrimary: true,
            });
          } catch (storageErr) {
            console.error("[sync attachment upload failed]", storageErr);
          }
        }

        // 5h. Log success and trigger notifications
        await admin.from("email_logs").insert({
          user_id: userId,
          receipt_id: newReceipt.id,
          gmail_message_id: parsed.gmailMessageId,
          from_address: parsed.fromAddress,
          subject: parsed.subject,
          received_at: parsed.receivedAt,
          processing_status: "success",
        });

        await notifyGmailImport(admin, {
          userId,
          userEmail: parsed.fromAddress || connection.gmail_email || "",
          receiptId: newReceipt.id,
          messageId: parsed.gmailMessageId,
          itemName: extraction.data.item_name,
          storeName: extraction.data.store_name,
          status: "success",
        });

        result.imported++;
      } catch (err) {
        console.error(`[sync message processing failed msgId=${msgRef.id}]`, err);
        const errMsg = err instanceof Error ? err.message : "Sync failed";
        
        await admin.from("email_logs").insert({
          user_id: userId,
          gmail_message_id: parsed.gmailMessageId,
          from_address: parsed.fromAddress,
          subject: parsed.subject,
          received_at: parsed.receivedAt,
          processing_status: "failed",
          error_message: errMsg,
        });

        result.failed++;
      }
    }

    // 6. Update last_sync_at timestamp
    await admin
      .from("user_gmail_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    await logSyncRun(userId, startedAt, "success", result);
    return result;
  } catch (syncError) {
    console.error("[sync gmail execution failed]", syncError);
    const message = syncError instanceof Error ? syncError.message : "Gmail sync execution failed";
    await logSyncRun(userId, startedAt, "failed", result, message);
    throw syncError;
  }
}

function isDeadlineInPast(deadlineStr: string | null | undefined): boolean {
  if (!deadlineStr) return false;
  try {
    const deadline = new Date(deadlineStr);
    if (isNaN(deadline.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    return deadlineDate < today;
  } catch {
    return false;
  }
}

async function logSyncRun(
  userId: string,
  startedAt: string,
  status: "success" | "failed",
  counts: SyncResult,
  errorSummary?: string,
) {
  try {
    const admin = createAdminClient();
    await admin.from("gmail_sync_runs").insert({
      user_id: userId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      status,
      checked_count: counts.checked,
      imported_count: counts.imported,
      needs_review_count: counts.needs_review,
      skipped_duplicate_count: counts.skipped_duplicate,
      skipped_expired_count: counts.skipped_expired,
      failed_count: counts.failed,
      error_summary: errorSummary || null,
    });
  } catch (err) {
    console.error("[sync run audit logging failed]", err);
  }
}
