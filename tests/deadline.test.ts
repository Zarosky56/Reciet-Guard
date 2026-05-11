import { describe, expect, it } from "vitest";

import {
  getDaysRemaining,
  getUrgency,
  sortByUrgency,
} from "@/lib/receipts/deadline";
import type { ReceiptWithUrgency } from "@/types/receipt";

const now = new Date("2026-05-11T12:00:00");

describe("deadline calculator", () => {
  it("returns green for more than 7 days", () => {
    expect(getUrgency("2026-05-21", now)).toBe("green");
  });

  it("returns yellow for 3-7 days", () => {
    expect(getUrgency("2026-05-16", now)).toBe("yellow");
  });

  it("returns red for less than 3 days or expired", () => {
    expect(getUrgency("2026-05-12", now)).toBe("red");
    expect(getUrgency("2026-05-01", now)).toBe("red");
  });

  it("handles calendar boundaries", () => {
    expect(getDaysRemaining("2026-05-12", now)).toBe(1);
  });

  it("sorts active urgent receipts before resolved receipts", () => {
    const base = {
      user_id: "user",
      store_name: "Store",
      item_name: "Item",
      price: 10,
      currency: "USD",
      purchase_date: "2026-05-01",
      warranty_deadline: null,
      raw_email_text: null,
      ai_confidence: null,
      notification_sent_7d: false,
      notification_sent_3d: false,
      notification_sent_1d: false,
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: "2026-05-01T00:00:00.000Z",
    } satisfies Partial<ReceiptWithUrgency>;

    const receipts = [
      {
        ...base,
        id: "kept",
        status: "kept",
        return_deadline: "2026-05-12",
        days_remaining: 1,
        urgency: "red",
      },
      {
        ...base,
        id: "urgent",
        status: "active",
        return_deadline: "2026-05-12",
        days_remaining: 1,
        urgency: "red",
      },
      {
        ...base,
        id: "later",
        status: "active",
        return_deadline: "2026-06-01",
        days_remaining: 21,
        urgency: "green",
      },
    ] as ReceiptWithUrgency[];

    expect(sortByUrgency(receipts).map((receipt) => receipt.id)).toEqual([
      "urgent",
      "later",
      "kept",
    ]);
  });
});
