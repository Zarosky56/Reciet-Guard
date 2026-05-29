import { addDays, format, isValid, parseISO } from "date-fns";
import { z } from "zod";

import type { AIExtractionData } from "@/types/receipt";

const nullableString = z
  .union([z.string().trim().min(1), z.null(), z.undefined()])
  .transform((value) => (value ? value : null));

const extractionSchema = z.object({
  store_name: nullableString,
  item_name: nullableString,
  price: z
    .union([z.coerce.number().nonnegative(), z.null(), z.undefined()])
    .transform((value) => (typeof value === "number" ? value : null)),
  currency: z
    .union([z.string().trim().length(3), z.null(), z.undefined()])
    .transform((value) => (value ? value.toUpperCase() : "USD")),
  purchase_date: nullableString,
  return_deadline: nullableString,
  warranty_deadline: nullableString.optional(),
  confidence: z.coerce.number().min(0).max(1).catch(0),
});

function normalizeDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);
  if (!isValid(parsed)) {
    return null;
  }

  return format(parsed, "yyyy-MM-dd");
}

export function normalizeExtractionData(input: unknown): AIExtractionData {
  const parsed = extractionSchema.parse(input);
  const purchaseDate = normalizeDate(parsed.purchase_date);
  const explicitReturnDeadline = normalizeDate(parsed.return_deadline);

  return {
    ...parsed,
    purchase_date: purchaseDate,
    return_deadline: explicitReturnDeadline,
    warranty_deadline: normalizeDate(parsed.warranty_deadline ?? null),
  };
}

/**
 * Apply smart defaults for return deadlines AFTER provider extraction.
 *
 * Behavior:
 *  - If the provider already returned an explicit return_deadline, keep it.
 *  - Otherwise, infer one from the email subject/body only when the message
 *    looks like a consumer product purchase (Amazon, Flipkart, Shopify, etc).
 *  - For everything else (service invoices, B2B, subscriptions), leave null
 *    so the user isn't shown a fake "30-day return" reminder.
 */
const PURCHASE_KEYWORDS = [
  "order",
  "shipment",
  "shipped",
  "delivery",
  "delivered",
  "tracking",
  "purchase",
  "buy",
  "amazon",
  "flipkart",
  "shopify",
  "myntra",
  "ajio",
  "meesho",
  "nykaa",
  "bestbuy",
  "walmart",
  "target",
];

const SUBSCRIPTION_KEYWORDS = [
  "subscription",
  "recurring",
  "renewal",
  "monthly",
  "annual",
  "auto-pay",
  "autopay",
  "service charge",
  "consultation",
];

export function looksLikeProductPurchase(
  emailText: string,
  subject?: string | null,
): boolean {
  const haystack = `${subject ?? ""} ${emailText}`.toLowerCase();

  if (SUBSCRIPTION_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return false;
  }

  return PURCHASE_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

export function applyReturnDeadlineDefault(
  data: AIExtractionData,
  context: { emailText: string; subject?: string | null },
): AIExtractionData {
  if (data.return_deadline) return data;
  if (!data.purchase_date) return data;
  if (!looksLikeProductPurchase(context.emailText, context.subject)) {
    return data;
  }

  const purchaseDate = parseISO(data.purchase_date);
  if (!isValid(purchaseDate)) return data;

  return {
    ...data,
    return_deadline: format(addDays(purchaseDate, 30), "yyyy-MM-dd"),
  };
}
