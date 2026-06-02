// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  StepCurrency,
  normalizeOnboardingCurrency,
} from "@/components/onboarding/steps/step-currency";

describe("StepCurrency", () => {
  it("normalizes valid 3-letter currency codes", () => {
    expect(normalizeOnboardingCurrency("inr")).toBe("INR");
    expect(normalizeOnboardingCurrency(" usd ")).toBe("USD");
    expect(normalizeOnboardingCurrency("rupees")).toBe("");
  });

  it("selects a common currency", () => {
    const onChange = vi.fn();
    render(<StepCurrency value="USD" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /INR/i }));

    expect(onChange).toHaveBeenCalledWith("INR");
  });

  it("lets users enter a custom currency instead of mapping Other back to USD", () => {
    const onChange = vi.fn();
    render(<StepCurrency value="USD" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("AUD"), {
      target: { value: "jpy" },
    });

    expect(onChange).toHaveBeenCalledWith("JPY");
  });

  it("shows the current custom currency as selected", () => {
    render(<StepCurrency value="JPY" onChange={() => undefined} />);

    expect(screen.getByText("Selected:")).toBeTruthy();
    expect(screen.getByText("JPY")).toBeTruthy();
    expect(screen.getByDisplayValue("JPY")).toBeTruthy();
  });
});
