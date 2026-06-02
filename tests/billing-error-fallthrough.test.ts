import { describe, expect, it } from "vitest";

import { isBillingOrQuotaError } from "@/lib/ai/extract-receipt";

describe("isBillingOrQuotaError", () => {
  it("returns true for HTTP 402 status", () => {
    const error = Object.assign(new Error("Payment Required"), { status: 402 });
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns true for HTTP 402 via statusCode property", () => {
    const error = { statusCode: 402, message: "Payment Required" };
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns true for HTTP 402 via code property", () => {
    const error = { code: 402, message: "Payment Required" };
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns true for HTTP 403 with billing keyword", () => {
    const error = Object.assign(
      new Error("Billing is not enabled for this project"),
      { status: 403 },
    );
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns true for HTTP 403 with quota keyword", () => {
    const error = Object.assign(
      new Error("Quota exceeded for this API"),
      { status: 403 },
    );
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns false for HTTP 403 without billing/quota keywords", () => {
    const error = Object.assign(
      new Error("Permission denied: insufficient scope"),
      { status: 403 },
    );
    expect(isBillingOrQuotaError(error)).toBe(false);
  });

  it("returns true for BILLING_DISABLED in message", () => {
    const error = new Error("Error: BILLING_DISABLED - enable billing on your project");
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns true for RESOURCE_EXHAUSTED in message", () => {
    const error = new Error("RESOURCE_EXHAUSTED: Quota exceeded");
    expect(isBillingOrQuotaError(error)).toBe(true);
  });

  it("returns false for null/undefined", () => {
    expect(isBillingOrQuotaError(null)).toBe(false);
    expect(isBillingOrQuotaError(undefined)).toBe(false);
  });

  it("returns false for a generic error", () => {
    const error = new Error("Network timeout");
    expect(isBillingOrQuotaError(error)).toBe(false);
  });

  it("returns false for HTTP 500 errors", () => {
    const error = Object.assign(new Error("Internal Server Error"), { status: 500 });
    expect(isBillingOrQuotaError(error)).toBe(false);
  });

  it("handles string errors with BILLING_DISABLED", () => {
    expect(isBillingOrQuotaError("BILLING_DISABLED")).toBe(true);
  });

  it("handles string errors with RESOURCE_EXHAUSTED", () => {
    expect(isBillingOrQuotaError("RESOURCE_EXHAUSTED: quota limit")).toBe(true);
  });
});
