// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GmailConnectionSettings } from "@/components/settings/gmail-connection-settings";

describe("GmailConnectionSettings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the connect action when Gmail is disconnected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          connected: false,
          status: "disconnected",
          needsReconnect: false,
        }),
      }),
    );

    render(<GmailConnectionSettings />);

    expect(await screen.findByText("Not connected")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect Gmail" })).toBeTruthy();
  });

  it("shows check and disconnect actions when Gmail is connected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          connected: true,
          gmailEmail: "person@example.com",
          status: "connected",
          needsReconnect: false,
        }),
      }),
    );

    render(<GmailConnectionSettings />);

    expect(await screen.findByText("Connected")).toBeTruthy();
    expect(screen.getByText("person@example.com")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check now" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeTruthy();
  });
});
