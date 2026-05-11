import { repairJson } from "@/lib/ai/json-repair";
import { extractWithGemini } from "@/lib/ai/providers/gemini";
import { extractWithGroq } from "@/lib/ai/providers/groq";
import { normalizeExtractionData } from "@/lib/ai/schema";
import type { AIExtractionData, AIExtractionResult } from "@/types/receipt";

type ProviderName = "gemini" | "groq";

const fallbackData: AIExtractionData = {
  store_name: null,
  item_name: null,
  price: null,
  currency: "USD",
  purchase_date: null,
  return_deadline: null,
  warranty_deadline: null,
  confidence: 0,
};

const providers: Array<{
  name: ProviderName;
  extract: (emailText: string) => Promise<string>;
}> = [
  { name: "gemini", extract: extractWithGemini },
  { name: "groq", extract: extractWithGroq },
];

export async function extractReceiptFromEmail(
  emailText: string,
): Promise<AIExtractionResult> {
  const failures: string[] = [];

  for (const provider of providers) {
    try {
      const raw = await provider.extract(emailText);
      const repaired = repairJson(raw);
      if (!repaired) {
        failures.push(`${provider.name}: invalid JSON`);
        continue;
      }

      const data = normalizeExtractionData(repaired);
      if (data.confidence >= 0.7) {
        return {
          status: "success",
          provider: provider.name,
          data,
        };
      }

      failures.push(`${provider.name}: low confidence ${data.confidence}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      failures.push(`${provider.name}: ${message}`);
    }
  }

  return {
    status: "needs_review",
    provider: null,
    data: fallbackData,
    error: failures.join("; ") || "Extraction failed",
  };
}
