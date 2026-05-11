import { describe, expect, it } from "vitest";

import { repairJson } from "@/lib/ai/json-repair";
import { normalizeExtractionData } from "@/lib/ai/schema";

describe("AI JSON repair", () => {
  it("parses markdown-wrapped JSON", () => {
    expect(repairJson('```json\n{"store_name":"Nike"}\n```')).toEqual({
      store_name: "Nike",
    });
  });

  it("repairs trailing commas and single quotes", () => {
    expect(repairJson("{'store_name':'Nike',}")).toEqual({
      store_name: "Nike",
    });
  });

  it("defaults return deadline to purchase date plus 30 days", () => {
    const result = normalizeExtractionData({
      store_name: "Example",
      item_name: "Shoes",
      price: 89.99,
      currency: "usd",
      purchase_date: "2026-05-01",
      return_deadline: null,
      confidence: 0.9,
    });

    expect(result.return_deadline).toBe("2026-05-31");
    expect(result.currency).toBe("USD");
  });
});
