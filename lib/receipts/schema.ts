import { isValid, parseISO } from "date-fns";
import { z } from "zod";

const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null(), z.undefined()])
    .transform((value) => (value ? value : null));

const optionalDate = z
  .union([z.string().trim(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (!value) {
      return null;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isValid(parseISO(value))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use YYYY-MM-DD dates.",
      });
      return z.NEVER;
    }

    return value;
  });

const optionalMoney = z
  .preprocess(
    (value) =>
      value === "" || value === null || value === undefined ? null : value,
    z.coerce.number().nonnegative().nullable(),
  )
  .transform((value) => value ?? null);

export const receiptCreateSchema = z.object({
  store_name: optionalText(255),
  item_name: optionalText(500),
  price: optionalMoney,
  currency: z
    .string()
    .trim()
    .length(3)
    .default("USD")
    .transform((value) => value.toUpperCase()),
  purchase_date: optionalDate,
  return_deadline: optionalDate,
  warranty_deadline: optionalDate,
  raw_email_text: optionalText(10000).optional(),
  ai_confidence: z.coerce.number().min(0).max(1).nullable().optional(),
  status: z.enum(["active", "returned", "kept", "expired"]).default("active"),
  product_brand: optionalText(120).optional(),
  product_model: optionalText(200).optional(),
  serial_number: optionalText(120).optional(),
  category: optionalText(40).optional(),
  warranty_period_months: z.coerce
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),
  extraction_provider: z
    .enum(["document_ai", "gemini", "groq", "manual"])
    .nullable()
    .optional(),
  notes: optionalText(2000).optional(),
});

export const receiptUpdateSchema = receiptCreateSchema.partial();

export type ReceiptCreateInput = z.infer<typeof receiptCreateSchema>;
export type ReceiptUpdateInput = z.infer<typeof receiptUpdateSchema>;
