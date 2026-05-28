import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSignedUrl } from "@/lib/storage/receipt-storage";
import type {
  Attachment,
  AttachmentKind,
  AttachmentSource,
  AttachmentWithUrl,
} from "@/types/receipt";

const ATTACHMENT_KINDS: readonly AttachmentKind[] = [
  "receipt",
  "warranty_card",
  "product_photo",
  "invoice",
  "other",
];

const ATTACHMENT_SOURCES: readonly AttachmentSource[] = [
  "upload",
  "camera",
  "email_attachment",
  "generated",
];

type AttachmentRow = Record<string, unknown>;

function asKind(value: unknown): AttachmentKind {
  return ATTACHMENT_KINDS.includes(value as AttachmentKind)
    ? (value as AttachmentKind)
    : "other";
}

function asSource(value: unknown): AttachmentSource {
  return ATTACHMENT_SOURCES.includes(value as AttachmentSource)
    ? (value as AttachmentSource)
    : "upload";
}

function mapAttachment(row: AttachmentRow): Attachment {
  return {
    id: String(row.id),
    receipt_id: String(row.receipt_id),
    user_id: String(row.user_id),
    storage_path: String(row.storage_path),
    original_filename:
      typeof row.original_filename === "string" ? row.original_filename : null,
    mime_type: String(row.mime_type),
    size_bytes: Number(row.size_bytes ?? 0),
    kind: asKind(row.kind),
    source: asSource(row.source),
    is_primary: Boolean(row.is_primary),
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
  };
}

export async function listReceiptAttachments(
  supabase: SupabaseClient,
  receiptId: string,
): Promise<AttachmentWithUrl[]> {
  const { data, error } = await supabase
    .from("attachments")
    .select("*")
    .eq("receipt_id", receiptId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load attachments: ${error.message}`);
  }

  const rows = (data ?? []).map(mapAttachment);

  return Promise.all(
    rows.map(async (att) => ({
      ...att,
      signed_url: await createSignedUrl(supabase, att.storage_path),
    })),
  );
}

export async function insertAttachmentRow(
  supabase: SupabaseClient,
  args: {
    receiptId: string;
    userId: string;
    storagePath: string;
    originalFilename: string | null;
    mimeType: string;
    sizeBytes: number;
    kind: AttachmentKind;
    source: AttachmentSource;
    isPrimary?: boolean;
  },
): Promise<Attachment> {
  const { data, error } = await supabase
    .from("attachments")
    .insert({
      receipt_id: args.receiptId,
      user_id: args.userId,
      storage_path: args.storagePath,
      original_filename: args.originalFilename,
      mime_type: args.mimeType,
      size_bytes: args.sizeBytes,
      kind: args.kind,
      source: args.source,
      is_primary: args.isPrimary ?? false,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to record attachment: ${error?.message}`);
  }

  return mapAttachment(data);
}
