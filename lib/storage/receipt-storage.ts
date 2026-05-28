import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const RECEIPT_BUCKET = "receipt-attachments";

export const ALLOWED_ATTACHMENT_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AttachmentMime = (typeof ALLOWED_ATTACHMENT_MIME)[number];

/** 20 MB hard cap, matches the storage bucket policy. */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export function isAllowedMime(value: string): value is AttachmentMime {
  return (ALLOWED_ATTACHMENT_MIME as readonly string[]).includes(value);
}

function safeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120);
}

/**
 * Build the Storage path for an attachment.
 * Top folder MUST be the user id — RLS depends on it.
 */
export function buildStoragePath(args: {
  userId: string;
  receiptId: string;
  filename: string;
}): string {
  const safe = safeFileName(args.filename) || "file";
  const stamp = Date.now();
  return `${args.userId}/${args.receiptId}/${stamp}-${safe}`;
}

export async function uploadReceiptFile(
  supabase: SupabaseClient,
  args: {
    storagePath: string;
    body: Buffer;
    mimeType: AttachmentMime;
  },
): Promise<void> {
  const { error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .upload(args.storagePath, args.body, {
      contentType: args.mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

export async function downloadReceiptFile(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Storage download failed: ${error?.message ?? "no data"}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function deleteReceiptFile(
  supabase: SupabaseClient,
  storagePath: string,
): Promise<void> {
  await supabase.storage.from(RECEIPT_BUCKET).remove([storagePath]);
}

export async function createSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 60 * 10,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(RECEIPT_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
}
