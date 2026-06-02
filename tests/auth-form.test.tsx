// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("AuthForm", () => {
  it("renders Google sign-in on login", () => {
    render(<AuthForm mode="login" />);

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeTruthy();
  });

  it("renders Google sign-up on signup", () => {
    render(<AuthForm mode="signup" />);

    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeTruthy();
  });
});
