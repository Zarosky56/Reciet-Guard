import { describe, expect, it } from "vitest";

import { buildAttentionSummary } from "@/lib/notifications/check-deadlines";

describe("notification attention summaries", () => {
  it("summarizes review-only work with natural wording", () => {
    expect(
      buildAttentionSummary({
        review: 3,
        expiredReturns: 0,
        dueReturns: 0,
        upcomingReturns: 0,
        expiredWarranties: 0,
        dueWarranties: 0,
        upcomingWarranties: 0,
      }),
    ).toEqual({
      title: "Check your dashboard: 3 items need attention",
      body: "3 items need review. Open Receipt Guardian to review them.",
    });
  });

  it("summarizes expired and upcoming deadlines across return and warranty", () => {
    expect(
      buildAttentionSummary({
        review: 1,
        expiredReturns: 2,
        dueReturns: 1,
        upcomingReturns: 4,
        expiredWarranties: 1,
        dueWarranties: 0,
        upcomingWarranties: 2,
      }),
    ).toMatchObject({
      title: "Check your dashboard: 11 items need attention",
      body:
        "1 item needs review, 2 return windows expired, 1 return window is due today, 4 return windows are coming up, 1 warranty expired, 2 warranties are coming up. Open Receipt Guardian to review them.",
    });
  });

  it("returns null when nothing needs attention", () => {
    expect(
      buildAttentionSummary({
        review: 0,
        expiredReturns: 0,
        dueReturns: 0,
        upcomingReturns: 0,
        expiredWarranties: 0,
        dueWarranties: 0,
        upcomingWarranties: 0,
      }),
    ).toBeNull();
  });
});
