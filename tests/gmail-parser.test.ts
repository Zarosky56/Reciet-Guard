import { describe, expect, it } from "vitest";

import {
  extractEmailAddress,
  parseGmailMessage,
} from "@/lib/email/parse-gmail-message";

describe("Gmail message parsing", () => {
  it("extracts normalized email addresses", () => {
    expect(extractEmailAddress("Ada Lovelace <Ada@Example.com>")).toBe(
      "ada@example.com",
    );
  });

  it("decodes plain text message body", () => {
    const data = Buffer.from("Thanks for your order").toString("base64url");
    const parsed = parseGmailMessage({
      id: "gmail-1",
      internalDate: String(Date.UTC(2026, 4, 11)),
      payload: {
        mimeType: "text/plain",
        headers: [
          { name: "From", value: "shopper@example.com" },
          { name: "Subject", value: "Order receipt" },
        ],
        body: { data },
      },
    });

    expect(parsed.gmailMessageId).toBe("gmail-1");
    expect(parsed.fromAddress).toBe("shopper@example.com");
    expect(parsed.subject).toBe("Order receipt");
    expect(parsed.bodyText).toContain("Thanks for your order");
  });
});
