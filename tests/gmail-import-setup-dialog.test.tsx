// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GmailImportSetupDialog } from "@/components/dashboard/gmail-import-setup-dialog";

function mockStatusFetch(status: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => status,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("GmailImportSetupDialog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks for Gmail permission before a manual inbox scan", async () => {
    mockStatusFetch({ connected: false, status: "disconnected" });

    render(
      <GmailImportSetupDialog
        open
        onClose={() => undefined}
        onManualCheck={() => undefined}
        isInboxPending={false}
      />,
    );

    expect(await screen.findByText("Permission needed")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Connect Gmail to check" }),
    ).toBeTruthy();
  });

  it("runs the manual check only after Gmail is connected", async () => {
    mockStatusFetch({
      connected: true,
      gmailEmail: "person@example.com",
      status: "connected",
      needsReconnect: false,
    });
    const onClose = vi.fn();
    const onManualCheck = vi.fn();

    render(
      <GmailImportSetupDialog
        open
        onClose={onClose}
        onManualCheck={onManualCheck}
        isInboxPending={false}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Run one-time check" }));

    expect(onManualCheck).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("saves guided auto-fetch preferences for connected Gmail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          connected: true,
          gmailEmail: "person@example.com",
          status: "connected",
          needsReconnect: false,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            timeWindow: "14d",
            autoFetchEnabled: true,
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    const onClose = vi.fn();

    render(
      <GmailImportSetupDialog
        open
        onClose={onClose}
        onManualCheck={() => undefined}
        isInboxPending={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Auto fetch Set rules first." }));
    fireEvent.click(await screen.findByRole("button", { name: "Last 14 days" }));
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ask first" }));
    fireEvent.click(await screen.findByRole("button", { name: "Every import" }));
    fireEvent.click(await screen.findByRole("button", { name: "Return only" }));
    fireEvent.click(await screen.findByRole("button", { name: "Save auto fetch setup" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/auth/gmail/preferences",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining('"timeWindow":"14d"'),
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      timeWindow: "14d",
      uncertainAction: "ask_first",
      notificationPref: "every_import",
      reminderPref: "return_only",
    });
  });
});
