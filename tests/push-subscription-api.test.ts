import { beforeEach, describe, expect, it, vi } from "vitest";

import { requireApiUser } from "@/lib/auth/api";
import { POST } from "@/app/api/notifications/subscribe/route";

vi.mock("@/lib/auth/api", () => ({
  requireApiUser: vi.fn(),
}));

function createSupabaseMock() {
  const pushUpsert = vi.fn().mockResolvedValue({ error: null });
  const profileEq = vi.fn().mockResolvedValue({ error: null });
  const profileUpdate = vi.fn(() => ({ eq: profileEq }));
  const from = vi.fn((table: string) => {
    if (table === "push_subscriptions") {
      return { upsert: pushUpsert };
    }

    if (table === "profiles") {
      return { update: profileUpdate };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  return {
    supabase: { from },
    from,
    pushUpsert,
    profileUpdate,
    profileEq,
  };
}

describe("push subscription API", () => {
  beforeEach(() => {
    vi.mocked(requireApiUser).mockReset();
  });

  it("persists the subscription and enables push notifications for the user", async () => {
    const mocks = createSupabaseMock();
    vi.mocked(requireApiUser).mockResolvedValue({
      supabase: mocks.supabase as never,
      user: { id: "user-1" } as never,
      response: null,
    });

    const response = await POST(
      new Request("https://app.example/api/notifications/subscribe", {
        method: "POST",
        headers: { "user-agent": "vitest" },
        body: JSON.stringify({
          endpoint: "https://push.example/subscription",
          keys: {
            p256dh: "p256dh-key-value",
            auth: "auth-key",
          },
        }),
      }),
    );

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(mocks.pushUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        endpoint: "https://push.example/subscription",
        p256dh: "p256dh-key-value",
        auth: "auth-key",
        user_agent: "vitest",
        enabled: true,
      }),
      { onConflict: "endpoint" },
    );
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      push_notifications_enabled: true,
    });
    expect(mocks.profileEq).toHaveBeenCalledWith("id", "user-1");
  });

  it("rejects malformed subscriptions before writing to the database", async () => {
    const mocks = createSupabaseMock();
    vi.mocked(requireApiUser).mockResolvedValue({
      supabase: mocks.supabase as never,
      user: { id: "user-1" } as never,
      response: null,
    });

    const response = await POST(
      new Request("https://app.example/api/notifications/subscribe", {
        method: "POST",
        body: JSON.stringify({ endpoint: "not-a-url" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.pushUpsert).not.toHaveBeenCalled();
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });
});
