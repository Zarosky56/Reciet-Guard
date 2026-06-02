import { describe, expect, it } from "vitest";

import { onboardingReducer } from "@/lib/onboarding/state";
import type { OnboardingStepIndex } from "@/lib/onboarding/types";

describe("onboardingReducer", () => {
  describe("advance", () => {
    it("advances from step 1 to step 2", () => {
      const result = onboardingReducer(1, { type: "advance" });
      expect(result).toEqual({ type: "step", step: 2 });
    });

    it("advances from step 4 to step 5", () => {
      const result = onboardingReducer(4, { type: "advance" });
      expect(result).toEqual({ type: "step", step: 5 });
    });

    it("advances from step 7 to step 8", () => {
      const result = onboardingReducer(7, { type: "advance" });
      expect(result).toEqual({ type: "step", step: 8 });
    });

    it("stays at step 8 when advancing", () => {
      const result = onboardingReducer(8, { type: "advance" });
      expect(result).toEqual({ type: "step", step: 8 });
    });
  });

  describe("back", () => {
    it("goes back from step 3 to step 2", () => {
      const result = onboardingReducer(3, { type: "back" });
      expect(result).toEqual({ type: "step", step: 2 });
    });

    it("stays at step 1 when going back", () => {
      const result = onboardingReducer(1, { type: "back" });
      expect(result).toEqual({ type: "step", step: 1 });
    });
  });

  describe("skip", () => {
    it("returns complete signal from any step", () => {
      for (const step of [1, 2, 3, 4, 5, 6, 7, 8] as OnboardingStepIndex[]) {
        const result = onboardingReducer(step, { type: "skip" });
        expect(result).toEqual({ type: "complete" });
      }
    });
  });

  describe("finish", () => {
    it("returns complete signal", () => {
      const result = onboardingReducer(7, { type: "finish" });
      expect(result).toEqual({ type: "complete" });
    });
  });

  describe("swipe", () => {
    it("ignores swipe with insufficient horizontal travel", () => {
      const result = onboardingReducer(3, { type: "swipe", deltaX: 50, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 3 });
    });

    it("ignores swipe when vertical travel exceeds half of horizontal", () => {
      // |deltaX| = 100, |deltaY| = 60 → 100 < 2*60 = 120, so ignored
      const result = onboardingReducer(3, { type: "swipe", deltaX: -100, deltaY: 60 });
      expect(result).toEqual({ type: "step", step: 3 });
    });

    it("commits forward swipe (deltaX < 0) advancing one step", () => {
      // deltaX = -96, |deltaX| = 96 ≥ 64, |deltaY| = 0 ≤ 48
      // steps = floor(96/96) = 1, direction forward
      const result = onboardingReducer(2, { type: "swipe", deltaX: -96, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 3 });
    });

    it("commits backward swipe (deltaX > 0) going back one step", () => {
      // deltaX = 96, direction backward
      const result = onboardingReducer(3, { type: "swipe", deltaX: 96, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 2 });
    });

    it("moves multiple steps on large swipe", () => {
      // deltaX = -250, steps = floor(250/96) = 2
      const result = onboardingReducer(1, { type: "swipe", deltaX: -250, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 3 });
    });

    it("clamps forward swipe at step 8", () => {
      // From step 4, deltaX = -500, steps = floor(500/96) = 5
      // target = 4 + 5 = 9, clamped to 8
      const result = onboardingReducer(4, { type: "swipe", deltaX: -500, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 8 });
    });

    it("clamps backward swipe at step 1", () => {
      // From step 2, deltaX = 500, steps = floor(500/96) = 5
      // target = 2 - 5 = -3, clamped to 1
      const result = onboardingReducer(2, { type: "swipe", deltaX: 500, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 1 });
    });

    it("commits swipe at exactly the threshold (|deltaX| = 64)", () => {
      // |deltaX| = 64 ≥ 64, |deltaY| = 0 ≤ 32
      // steps = floor(64/96) = 0, but minimum is 1
      const result = onboardingReducer(2, { type: "swipe", deltaX: -64, deltaY: 0 });
      expect(result).toEqual({ type: "step", step: 3 });
    });

    it("handles negative deltaY correctly", () => {
      // |deltaX| = 100, |deltaY| = 40 → 100 ≥ 2*40 = 80, commits
      const result = onboardingReducer(3, { type: "swipe", deltaX: -100, deltaY: -40 });
      expect(result).toEqual({ type: "step", step: 4 });
    });

    it("uses absolute values for the diagonal check", () => {
      // |deltaX| = 64, |deltaY| = 32 → 64 ≥ 2*32 = 64, commits (boundary)
      const result = onboardingReducer(2, { type: "swipe", deltaX: -64, deltaY: -32 });
      expect(result).toEqual({ type: "step", step: 3 });
    });
  });
});
