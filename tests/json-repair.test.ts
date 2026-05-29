import { describe, expect, it } from "vitest";

import { repairJson } from "@/lib/ai/json-repair";
import {
  applyReturnDeadlineDefault,
  normalizeExtractionData,
} from "@/lib/ai/schema";

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

  it("normalizes currency without auto-defaulting return deadline", () => {
    const result = normalizeExtractionData({
      store_name: "Example",
      item_name: "Shoes",
      price: 89.99,
      currency: "usd",
      purchase_date: "2026-05-01",
      return_deadline: null,
      confidence: 0.9,
    });

    expect(result.return_deadline).toBeNull();
    expect(result.currency).toBe("USD");
  });

  it("auto-defaults return deadline only for product-purchase emails", () => {
    const base = normalizeExtractionData({
      store_name: "Example",
      item_name: "Shoes",
      price: 89.99,
      currency: "USD",
      purchase_date: "2026-05-01",
      return_deadline: null,
      confidence: 0.9,
    });

    const productResult = applyReturnDeadlineDefault(base, {
      emailText: "Your Amazon order has shipped",
      subject: "Order Confirmation",
    });
    expect(productResult.return_deadline).toBe("2026-05-31");

    const serviceResult = applyReturnDeadlineDefault(base, {
      emailText: "Monthly subscription invoice for SaaS",
      subject: "Subscription Invoice",
    });
    expect(serviceResult.return_deadline).toBeNull();
  });
});
