import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSignedUrl,
  downloadReceiptFile,
} from "@/lib/storage/receipt-storage";
import type { Database } from "@/types/supabase";

type AdminClient = SupabaseClient<Database>;

const MAX_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export type ReminderAttachment =
  | {
      mode: "attachment";
      filename: string;
      contentType: string;
      content: Buffer;
    }
  | {
      mode: "link";
      filename: string;
      contentType: string;
      signedUrl: string;
      sizeBytes: number;
    };

type AttachmentRow = {
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  size_bytes: number;
};

export async function selectReminderAttachment(
  supabase: AdminClient,
  receiptId: string,
): Promise<ReminderAttachment | null> {
  const { data, error } = await supabase
    .from("attachments")
    .select("storage_path, original_filename, mime_type, size_bytes, is_primary, created_at")
    .eq("receipt_id", receiptId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as AttachmentRow;
  const filename = row.original_filename ?? "receipt-attachment";

  if (row.size_bytes <= MAX_EMAIL_ATTACHMENT_BYTES) {
    try {
      return {
        mode: "attachment",
        filename,
        contentType: row.mime_type,
        content: await downloadReceiptFile(supabase, row.storage_path),
      };
    } catch {
      // Fall through to a signed link if the file cannot be downloaded.
    }
  }

  const signedUrl = await createSignedUrl(
    supabase,
    row.storage_path,
    60 * 60 * 24,
  );

  if (!signedUrl) return null;

  return {
    mode: "link",
    filename,
    contentType: row.mime_type,
    signedUrl,
    sizeBytes: row.size_bytes,
  };
}
