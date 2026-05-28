import { NextResponse } from "next/server";

import { extractReceipt } from "@/lib/ai/extract-receipt";
import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import {
  insertAttachmentRow,
  listReceiptAttachments,
} from "@/lib/receipts/attachments";
import { mapReceipt } from "@/lib/receipts/mapper";
import {
  buildStoragePath,
  isAllowedMime,
  MAX_ATTACHMENT_BYTES,
  uploadReceiptFile,
} from "@/lib/storage/receipt-storage";
import type {
  AIExtractionData,
  AttachmentKind,
  AttachmentSource,
} from "@/types/receipt";

const KINDS = new Set<AttachmentKind>([
  "receipt",
  "warranty_card",
  "product_photo",
  "invoice",
  "other",
]);

const SOURCES = new Set<AttachmentSource>([
  "upload",
  "camera",
  "email_attachment",
  "generated",
]);

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !receipt) {
    return apiError("NOT_FOUND", "Receipt not found.", 404);
  }

  const attachments = await listReceiptAttachments(supabase, id);
  return NextResponse.json({ attachments });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { supabase, user, response } = await requireApiUser();
  if (response) return response;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return apiError(
      "INVALID_CONTENT_TYPE",
      "Use multipart/form-data with a 'file' field.",
      400,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("INVALID_BODY", "Could not parse upload.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("FILE_REQUIRED", "Attach a file under 'file'.", 400);
  }

  if (file.size === 0) {
    return apiError("FILE_EMPTY", "The uploaded file is empty.", 400);
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return apiError(
      "FILE_TOO_LARGE",
      `File exceeds ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB limit.`,
      413,
    );
  }
  if (!isAllowedMime(file.type)) {
    return apiError(
      "UNSUPPORTED_TYPE",
      `Unsupported file type: ${file.type || "unknown"}.`,
      415,
    );
  }

  const kindRaw = (formData.get("kind") ?? "receipt").toString();
  const sourceRaw = (formData.get("source") ?? "upload").toString();
  const kind: AttachmentKind = KINDS.has(kindRaw as AttachmentKind)
    ? (kindRaw as AttachmentKind)
    : "receipt";
  const source: AttachmentSource = SOURCES.has(sourceRaw as AttachmentSource)
    ? (sourceRaw as AttachmentSource)
    : "upload";
  const reExtract = (formData.get("reExtract") ?? "false").toString() === "true";

  const { data: receiptRow, error: receiptError } = await supabase
    .from("receipts")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (receiptError || !receiptRow) {
    return apiError("NOT_FOUND", "Receipt not found.", 404);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = buildStoragePath({
    userId: user.id,
    receiptId: id,
    filename: file.name,
  });

  try {
    await uploadReceiptFile(supabase, {
      storagePath,
      body: buffer,
      mimeType: file.type as Parameters<typeof uploadReceiptFile>[1]["mimeType"],
    });
  } catch (error) {
    return apiError(
      "STORAGE_ERROR",
      error instanceof Error ? error.message : "Upload failed.",
      500,
    );
  }

  let attachment;
  try {
    attachment = await insertAttachmentRow(supabase, {
      receiptId: id,
      userId: user.id,
      storagePath,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      kind,
      source,
    });
  } catch (error) {
    return apiError(
      "DATABASE_ERROR",
      error instanceof Error ? error.message : "Could not save attachment.",
      500,
    );
  }

  let extracted: AIExtractionData | null = null;
  let extractionStatus: "skipped" | "success" | "needs_review" = "skipped";
  let provider: string | null = null;

  if (reExtract) {
    const result = await extractReceipt({
      emailText: file.name,
      document: { content: buffer, mimeType: file.type },
    });
    extractionStatus = result.status;
    provider = result.provider;
    if (result.status === "success") {
      extracted = result.data;
      const updates: Record<string, unknown> = {
        ai_confidence: result.data.confidence,
        extraction_provider: result.provider,
      };
      if (result.data.store_name) updates.store_name = result.data.store_name;
      if (result.data.item_name) updates.item_name = result.data.item_name;
      if (result.data.price !== null) updates.price = result.data.price;
      if (result.data.currency) updates.currency = result.data.currency;
      if (result.data.purchase_date)
        updates.purchase_date = result.data.purchase_date;
      if (result.data.return_deadline)
        updates.return_deadline = result.data.return_deadline;
      if (result.data.warranty_deadline)
        updates.warranty_deadline = result.data.warranty_deadline;

      const { data: updatedRow } = await supabase
        .from("receipts")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("*")
        .single();

      return NextResponse.json(
        {
          attachment,
          extraction: {
            status: extractionStatus,
            provider,
            data: extracted,
          },
          receipt: updatedRow ? mapReceipt(updatedRow) : null,
        },
        { status: 201 },
      );
    }
  }

  return NextResponse.json(
    {
      attachment,
      extraction: { status: extractionStatus, provider, data: extracted },
    },
    { status: 201 },
  );
}
