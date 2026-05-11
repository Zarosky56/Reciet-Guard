import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/providers/gemini", () => ({
  extractWithGemini: vi.fn(),
}));

vi.mock("@/lib/ai/providers/groq", () => ({
  extractWithGroq: vi.fn(),
}));

const { extractWithGemini } = await import("@/lib/ai/providers/gemini");
const { extractWithGroq } = await import("@/lib/ai/providers/groq");
const { extractReceiptFromEmail } = await import("@/lib/ai/extract-receipt");

const goodJson = JSON.stringify({
  store_name: "Example Store",
  item_name: "Trail shoes",
  price: 89.99,
  currency: "USD",
  purchase_date: "2026-05-01",
  return_deadline: "2026-05-31",
  warranty_deadline: null,
  confidence: 0.92,
});

describe("AI fallback chain", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses Gemini when confidence is high", async () => {
    vi.mocked(extractWithGemini).mockResolvedValue(goodJson);

    const result = await extractReceiptFromEmail("receipt email text");

    expect(result.status).toBe("success");
    expect(result.provider).toBe("gemini");
    expect(extractWithGroq).not.toHaveBeenCalled();
  });

  it("uses Groq when Gemini fails", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(new Error("rate limited"));
    vi.mocked(extractWithGroq).mockResolvedValue(goodJson);

    const result = await extractReceiptFromEmail("receipt email text");

    expect(result.status).toBe("success");
    expect(result.provider).toBe("groq");
  });

  it("returns needs_review when all providers fail", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(new Error("down"));
    vi.mocked(extractWithGroq).mockRejectedValue(new Error("down"));

    const result = await extractReceiptFromEmail("receipt email text");

    expect(result.status).toBe("needs_review");
    expect(result.data.confidence).toBe(0);
  });
});
