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
    return_deadline:
      explicitReturnDeadline ??
      (purchaseDate ? format(addDays(parseISO(purchaseDate), 30), "yyyy-MM-dd") : null),
    warranty_deadline: normalizeDate(parsed.warranty_deadline ?? null),
  };
}
