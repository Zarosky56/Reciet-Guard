import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/providers/document-ai", () => ({
  extractWithDocumentAi: vi.fn(),
  isDocumentAiEnabled: vi.fn(() => false),
  DocumentAiUnavailableError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "DocumentAiUnavailableError";
    }
  },
}));

vi.mock("@/lib/ai/providers/vertex-ai", () => ({
  extractWithVertexAi: vi.fn(),
  extractWithVertexAiMultimodal: vi.fn(),
  isVertexAiEnabled: vi.fn(() => false),
  VertexAiUnavailableError: class extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "VertexAiUnavailableError";
    }
  },
}));

vi.mock("@/lib/ai/providers/gemini", () => ({
  extractWithGemini: vi.fn(),
}));

vi.mock("@/lib/ai/providers/groq", () => ({
  extractWithGroq: vi.fn(),
}));

const { extractWithGemini } = await import("@/lib/ai/providers/gemini");
const { extractWithGroq } = await import("@/lib/ai/providers/groq");
const { extractReceipt } = await import("@/lib/ai/extract-receipt");

describe("Error sanitization in AIExtractionResult.error", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const FORBIDDEN_SUBSTRINGS = [
    "upgrade",
    "billing",
    "Document AI",
    "Vertex",
    "console.cloud.google.com",
  ];

  it("never contains forbidden substrings when providers fail with billing errors", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(
      new Error("Please upgrade your billing plan at console.cloud.google.com"),
    );
    vi.mocked(extractWithGroq).mockRejectedValue(
      new Error("BILLING_DISABLED: Vertex AI billing not enabled"),
    );

    const result = await extractReceipt({ emailText: "test receipt" });

    expect(result.status).toBe("needs_review");
    if (result.status === "needs_review") {
      for (const forbidden of FORBIDDEN_SUBSTRINGS) {
        expect(result.error.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
    }
  });

  it("never contains 'Document AI' in the error summary", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(
      new Error("Document AI processor returned an error"),
    );
    vi.mocked(extractWithGroq).mockRejectedValue(
      new Error("Groq rate limited"),
    );

    const result = await extractReceipt({ emailText: "test receipt" });

    expect(result.status).toBe("needs_review");
    if (result.status === "needs_review") {
      expect(result.error).not.toContain("Document AI");
    }
  });

  it("never contains 'Vertex' in the error summary", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(
      new Error("Vertex AI model not responding"),
    );
    vi.mocked(extractWithGroq).mockRejectedValue(
      new Error("timeout"),
    );

    const result = await extractReceipt({ emailText: "test receipt" });

    expect(result.status).toBe("needs_review");
    if (result.status === "needs_review") {
      expect(result.error).not.toContain("Vertex");
    }
  });

  it("never contains 'console.cloud.google.com' in the error summary", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(
      new Error("Enable the API at console.cloud.google.com/apis"),
    );
    vi.mocked(extractWithGroq).mockRejectedValue(
      new Error("service down"),
    );

    const result = await extractReceipt({ emailText: "test receipt" });

    expect(result.status).toBe("needs_review");
    if (result.status === "needs_review") {
      expect(result.error).not.toContain("console.cloud.google.com");
    }
  });

  it("preserves non-sensitive error information", async () => {
    vi.mocked(extractWithGemini).mockRejectedValue(
      new Error("rate limited"),
    );
    vi.mocked(extractWithGroq).mockRejectedValue(
      new Error("timeout"),
    );

    const result = await extractReceipt({ emailText: "test receipt" });

    expect(result.status).toBe("needs_review");
    if (result.status === "needs_review") {
      expect(result.error).toContain("rate limited");
      expect(result.error).toContain("timeout");
    }
  });
});
