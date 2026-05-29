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

/** Pick the entity with the largest money amount across the listed types. */
function pickLargestMoneyEntity(
  entities: ExpenseEntity[],
  ...types: string[]
): { entity: ExpenseEntity; amount: number } | null {
  let best: { entity: ExpenseEntity; amount: number } | null = null;
  for (const entity of entities) {
    if (!entity.type || !types.includes(entity.type)) continue;
    const amount = entityMoney(entity).amount;
    if (amount === null || amount <= 0) continue;
    if (!best || amount > best.amount) {
      best = { entity, amount };
    }
  }
  return best;
}

function entityText(entity: ExpenseEntity | undefined): string | null {
  if (!entity) return null;
  const normalized = entity.normalizedValue?.text?.trim();
  if (normalized) return normalized;
  const mention = entity.mentionText?.trim();
  return mention && mention.length > 0 ? mention : null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  "₹": "INR",
  "rs.": "INR",
  "rs ": "INR",
  inr: "INR",
  "$": "USD",
  usd: "USD",
  "€": "EUR",
  eur: "EUR",
  "£": "GBP",
  gbp: "GBP",
  "¥": "JPY",
  jpy: "JPY",
};

function detectCurrencyFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (lower.includes(symbol)) return code;
  }
  return null;
}

function entityMoney(
  entity: ExpenseEntity | undefined,
): { amount: number | null; currency: string | null } {
  if (!entity) return { amount: null, currency: null };

  // Try the structured Money value first.
  const money = entity.normalizedValue?.moneyValue;
  if (money) {
    const units = typeof money.units === "string" ? Number(money.units) : (money.units ?? 0);
    const nanos = money.nanos ?? 0;
    const amount = Number(units) + Number(nanos) / 1e9;
    if (Number.isFinite(amount) && amount !== 0) {
      return {
        amount,
        currency: money.currencyCode?.toUpperCase() ?? null,
      };
    }
  }

  // Fall back to parsing the raw text. Indian invoices often have
  // "₹ 2,999.00" or "Rs. 2,999/-" which the structured parser sometimes
  // misreads as 0. Be lenient about symbols and separators.
  const text = entityText(entity);
  if (!text) return { amount: null, currency: null };

  const detectedCurrency =
    money?.currencyCode?.toUpperCase() ?? detectCurrencyFromText(text);

  // Strip currency symbols and trailing markers, keep digits/separators.
  const cleaned = text
    .replace(/[^\d.,-]/g, "")
    .replace(/(\d),(\d{3})/g, "$1$2") // "2,999" → "2999"
    .replace(/,/g, ".") // any leftover comma → decimal point (EU style)
    .replace(/(\.\d+)\./g, "$1"); // collapse extra dots

  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount === 0) {
    return { amount: null, currency: detectedCurrency };
  }

  return { amount, currency: detectedCurrency };
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
  // Total: try labeled "total" fields first. We do NOT fall back to "largest
  // money anywhere" because Document AI sometimes mislabels barcodes, phone
  // numbers, GSTINs, etc. as money. If labeled totals fail, the orchestrator
  // falls through to Vertex AI multimodal which reads the PDF visually.
  const totalCandidates = [
    "total_amount",
    "grand_total",
    "amount_due",
    "balance_due",
    "total_due",
    "invoice_total",
    "amount_paid",
    "net_amount",
  ];
  const labeledTotal = pickLargestMoneyEntity(entities, ...totalCandidates);
  const totalMoney = labeledTotal
    ? entityMoney(labeledTotal.entity)
    : { amount: null as number | null, currency: null as string | null };
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
