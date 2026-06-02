import { describe, expect, it } from "vitest";

import {
  mapNotificationPreferences,
  normalizeCurrency,
  normalizeReminderThresholds,
} from "@/lib/notifications/preferences";
import { normalizeVapidSubject } from "@/lib/notifications/push";

describe("notification preferences", () => {
  it("normalizes reminder thresholds to allowed values in descending order", () => {
    expect(normalizeReminderThresholds([3, 20, 999, 1, 3, 0])).toEqual([
      20,
      3,
      1,
      0,
    ]);
  });

  it("falls back to the recommended threshold set", () => {
    expect(normalizeReminderThresholds(["bad"])).toEqual([20, 7, 3, 1, 0]);
  });

  it("normalizes currency codes", () => {
    expect(normalizeCurrency("inr")).toBe("INR");
    expect(normalizeCurrency("rupees")).toBe("USD");
  });

  it("maps missing profile flags to safe defaults", () => {
    expect(mapNotificationPreferences(null)).toMatchObject({
      defaultCurrency: "USD",
      onboardingCompleted: false,
      introToAppEnabled: false,
      emailNotificationsEnabled: true,
      pushNotificationsEnabled: false,
      reminderThresholds: [20, 7, 3, 1, 0],
    });
  });

  it("normalizes VAPID subjects for web push", () => {
    expect(normalizeVapidSubject("owner@example.com")).toBe(
      "mailto:owner@example.com",
    );
    expect(normalizeVapidSubject("mailto:owner@example.com")).toBe(
      "mailto:owner@example.com",
    );
    expect(normalizeVapidSubject("https://example.com")).toBe(
      "https://example.com",
    );
    expect(normalizeVapidSubject("not a valid subject")).toBe(
      "mailto:admin@receiptguardian.app",
    );
  });
});
