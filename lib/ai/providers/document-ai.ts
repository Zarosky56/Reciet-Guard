import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

import { getGoogleAuth } from "@/lib/google-cloud/auth";
import type { AIExtractionData } from "@/types/receipt";

/**
 * Document AI provider — uses the user's Google Cloud trial credits to extract
 * receipt data from PDFs/images with higher accuracy than text-only LLM parsing.
 *
 * Cost guard rails (see .kiro/steering/cost-rules.md):
 *  - Gated behind `ENABLE_DOCUMENT_AI=true` env flag.
 *  - Caller catches `DocumentAiUnavailableError` and falls back to Gemini → Groq.
 *  - Errors that look billing/quota-related are treated as "unavailable" so the
 *    chain silently degrades when trial credits run out.
 *  - Auth uses our shared helper (ADC locally, WIF on Vercel).
 */

export class DocumentAiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentAiUnavailableError";
  }
}

export interface DocumentAiInput {
  /** Raw bytes of the document. */
  content: Buffer;
  /** MIME type, e.g. "application/pdf", "image/jpeg", "image/png". */
  mimeType: string;
}

async function getClient(): Promise<DocumentProcessorServiceClient> {
  // Don't cache: WIF auth is per-request (each Vercel function invocation
  // has its own OIDC token in the request header).
  return new DocumentProcessorServiceClient({
    auth: await getGoogleAuth(),
  });
}

export function isDocumentAiEnabled(): boolean {
  if (process.env.ENABLE_DOCUMENT_AI !== "true") {
    return false;
  }
  return Boolean(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
      process.env.DOCUMENT_AI_PROCESSOR_ID,
  );
}

const BILLING_KEYWORDS = [
  "billing",
  "quota",
  "exceeded",
  "exhausted",
  "permission_denied",
  "permissiondenied",
  "not authorized",
  "not enabled",
  "disabled",
  "unauthenticated",
  "could not load the default credentials",
];

function looksLikeBillingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return BILLING_KEYWORDS.some((keyword) => message.includes(keyword));
}

function buildProcessorName(): string {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;
  const location = process.env.DOCUMENT_AI_LOCATION ?? "us";

  if (!projectId || !processorId) {
    throw new DocumentAiUnavailableError("Document AI is not configured");
  }

  return `projects/${projectId}/locations/${location}/processors/${processorId}`;
}

interface ExpenseEntity {
  type?: string | null;
  mentionText?: string | null;
  normalizedValue?: {
    text?: string | null;
    moneyValue?: {
      currencyCode?: string | null;
      units?: string | number | null;
      nanos?: number | null;
    } | null;
    dateValue?: {
      year?: number | null;
      month?: number | null;
      day?: number | null;
    } | null;
  } | null;
  confidence?: number | null;
}

function pickEntity(
  entities: ExpenseEntity[],
  ...types: string[]
): ExpenseEntity | undefined {
  for (const type of types) {
    const found = entities.find((entity) => entity.type === type);
    if (found) return found;
  }
  return undefined;
}

function entityText(entity: ExpenseEntity | undefined): string | null {
  if (!entity) return null;
  const normalized = entity.normalizedValue?.text?.trim();
  if (normalized) return normalized;
  const mention = entity.mentionText?.trim();
  return mention && mention.length > 0 ? mention : null;
}

function entityMoney(
  entity: ExpenseEntity | undefined,
): { amount: number | null; currency: string | null } {
  if (!entity) return { amount: null, currency: null };

  const money = entity.normalizedValue?.moneyValue;
  if (money) {
    const units = typeof money.units === "string" ? Number(money.units) : (money.units ?? 0);
    const nanos = money.nanos ?? 0;
    const amount = Number(units) + Number(nanos) / 1e9;
    return {
      amount: Number.isFinite(amount) ? amount : null,
      currency: money.currencyCode?.toUpperCase() ?? null,
    };
  }

  const text = entityText(entity);
  if (!text) return { amount: null, currency: null };
  const cleaned = text.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const amount = Number.parseFloat(cleaned);
  return {
    amount: Number.isFinite(amount) ? amount : null,
    currency: null,
  };
}

function entityDate(entity: ExpenseEntity | undefined): string | null {
  if (!entity) return null;
  const date = entity.normalizedValue?.dateValue;
  if (date?.year && date.month && date.day) {
    const year = String(date.year).padStart(4, "0");
    const month = String(date.month).padStart(2, "0");
    const day = String(date.day).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return entityText(entity);
}

function averageConfidence(entities: ExpenseEntity[]): number {
  const values = entities
    .map((entity) => entity.confidence)
    .filter((value): value is number => typeof value === "number");
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.min(1, Math.max(0, sum / values.length));
}

/**
 * Process a document with Document AI and return structured receipt fields.
 * Throws `DocumentAiUnavailableError` when the service is unreachable, the
 * trial has ended, or any billing/quota-related error occurs. Callers should
 * catch this and fall back to the next provider.
 */
export async function extractWithDocumentAi(
  input: DocumentAiInput,
): Promise<AIExtractionData> {
  if (!isDocumentAiEnabled()) {
    throw new DocumentAiUnavailableError("Document AI is disabled");
  }

  const name = buildProcessorName();
  const client = await getClient();

  let document;
  try {
    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: input.content,
        mimeType: input.mimeType,
      },
    });
    document = result.document;
  } catch (error) {
    if (looksLikeBillingError(error)) {
      throw new DocumentAiUnavailableError(
        `Document AI unavailable (likely billing/quota): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    throw error;
  }

  const entities = (document?.entities ?? []) as ExpenseEntity[];

  // Many invoices use different field names. Try common variants.
  const supplier = pickEntity(
    entities,
    "supplier_name",
    "merchant_name",
    "receiver_name",
    "vendor_name",
    "seller_name",
  );
  const lineItem = pickEntity(
    entities,
    "line_item",
    "line_item/description",
    "line_item_description",
    "description",
  );
  const total = pickEntity(
    entities,
    "total_amount",
    "net_amount",
    "grand_total",
    "amount_due",
    "balance_due",
    "total_due",
    "invoice_total",
    "amount_paid",
    "subtotal",
  );
  const currencyEntity = pickEntity(entities, "currency", "currency_code");
  const purchaseDate = pickEntity(
    entities,
    "receipt_date",
    "invoice_date",
    "purchase_date",
    "issue_date",
    "date",
  );
  const returnDeadline = pickEntity(entities, "return_deadline", "return_by");
  const warrantyDeadline = pickEntity(
    entities,
    "warranty_deadline",
    "warranty_expiry",
  );

  const totalMoney = entityMoney(total);
  const currency =
    totalMoney.currency ??
    entityText(currencyEntity)?.toUpperCase() ??
    "USD";

  return {
    store_name: entityText(supplier),
    item_name: entityText(lineItem),
    price: totalMoney.amount,
    currency,
    purchase_date: entityDate(purchaseDate),
    return_deadline: entityDate(returnDeadline),
    warranty_deadline: entityDate(warrantyDeadline),
    confidence: averageConfidence(entities),
  };
}
