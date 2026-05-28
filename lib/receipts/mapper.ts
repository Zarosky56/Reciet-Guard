import { getDaysRemaining, getUrgency, sortByUrgency } from "@/lib/receipts/deadline";
import type { Receipt, ReceiptWithUrgency } from "@/types/receipt";

type ReceiptRow = Record<string, unknown>;

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function boolOrFalse(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function mapReceipt(row: ReceiptRow): ReceiptWithUrgency {
  const receipt: Receipt = {
    id: String(row.id),
    user_id: String(row.user_id),
    store_name: stringOrNull(row.store_name),
    item_name: stringOrNull(row.item_name),
    price: numberOrNull(row.price),
    currency: stringOrNull(row.currency) ?? "USD",
    purchase_date: stringOrNull(row.purchase_date),
    return_deadline: stringOrNull(row.return_deadline),
    warranty_deadline: stringOrNull(row.warranty_deadline),
    raw_email_text: stringOrNull(row.raw_email_text),
    ai_confidence: numberOrNull(row.ai_confidence),
    status:
      row.status === "returned" || row.status === "kept" || row.status === "expired"
        ? row.status
        : "active",
    notification_sent_7d: boolOrFalse(row.notification_sent_7d),
    notification_sent_3d: boolOrFalse(row.notification_sent_3d),
    notification_sent_1d: boolOrFalse(row.notification_sent_1d),
    product_brand: stringOrNull(row.product_brand),
    product_model: stringOrNull(row.product_model),
    serial_number: stringOrNull(row.serial_number),
    category: stringOrNull(row.category),
    warranty_period_months: numberOrNull(row.warranty_period_months),
    extraction_provider:
      row.extraction_provider === "document_ai" ||
      row.extraction_provider === "vertex_ai" ||
      row.extraction_provider === "gemini" ||
      row.extraction_provider === "groq" ||
      row.extraction_provider === "manual"
        ? row.extraction_provider
        : null,
    notes: stringOrNull(row.notes),
    created_at:
      stringOrNull(row.created_at) ?? new Date().toISOString(),
    updated_at:
      stringOrNull(row.updated_at) ?? new Date().toISOString(),
  };

  return {
    ...receipt,
    days_remaining: getDaysRemaining(receipt.return_deadline),
    urgency: getUrgency(receipt.return_deadline),
  };
}

export function mapReceipts(rows: ReceiptRow[] | null | undefined) {
  return sortByUrgency((rows ?? []).map(mapReceipt));
}
