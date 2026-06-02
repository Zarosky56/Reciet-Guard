/**
 * Pure reducer for onboarding step navigation.
 *
 * Validates: Requirements 1.5, 1.7, 1.9
 *
 * No side effects, no DOM access. Given the current step index and an action,
 * returns either the next step index or a completion signal.
 */

import type { OnboardingStepIndex } from "./types";

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type OnboardingAction =
  | { type: "advance" }
  | { type: "back" }
  | { type: "skip" }
  | { type: "finish" }
  | { type: "swipe"; deltaX: number; deltaY: number };

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type OnboardingReducerResult =
  | { type: "step"; step: OnboardingStepIndex }
  | { type: "complete" };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum horizontal travel (CSS pixels) to commit a swipe. */
const SWIPE_MIN_HORIZONTAL = 64;

/** Divisor for computing steps moved from horizontal travel. */
const SWIPE_STEP_DIVISOR = 96;

/** Minimum step index. */
const MIN_STEP: OnboardingStepIndex = 1;

/** Maximum step index. */
const MAX_STEP: OnboardingStepIndex = 8;

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

/**
 * Compute the next onboarding state given the current step and an action.
 *
 * - `advance`: step N -> N+1 when N < 8; unchanged at step 8.
 * - `back`: step N → N-1 when N > 1; unchanged at step 1.
 * - `skip`: returns a completion signal (available before the final step).
 * - `finish`: returns a completion signal (used on step 7).
 * - `swipe({ deltaX, deltaY })`: commits iff |Δx| ≥ 64 AND |Δx| ≥ 2|Δy|.
 *   Steps moved = floor(|dx| / 96), minimum 1, clamped to remaining steps
 *   in that direction. Result clamped to [1, 8].
 *   Direction: deltaX < 0 → forward (left swipe), deltaX > 0 → backward.
 */
export function onboardingReducer(
  current: OnboardingStepIndex,
  action: OnboardingAction,
): OnboardingReducerResult {
  switch (action.type) {
    case "advance": {
      if (current < MAX_STEP) {
        return { type: "step", step: (current + 1) as OnboardingStepIndex };
      }
      return { type: "step", step: current };
    }

    case "back": {
      if (current > MIN_STEP) {
        return { type: "step", step: (current - 1) as OnboardingStepIndex };
      }
      return { type: "step", step: current };
    }

    case "skip":
    case "finish": {
      return { type: "complete" };
    }

    case "swipe": {
      const { deltaX, deltaY } = action;
      const absDx = Math.abs(deltaX);
      const absDy = Math.abs(deltaY);

      // Ignore gesture if horizontal travel is insufficient or too diagonal
      if (absDx < SWIPE_MIN_HORIZONTAL || absDx < 2 * absDy) {
        return { type: "step", step: current };
      }

      // Compute raw steps moved (minimum 1)
      const rawSteps = Math.max(1, Math.floor(absDx / SWIPE_STEP_DIVISOR));

      // Direction: deltaX < 0 means left swipe -> forward (+), deltaX > 0 means right swipe -> backward (-)
      const direction = deltaX < 0 ? 1 : -1;

      // Compute target step and clamp to [1, 5]
      const target = current + direction * rawSteps;
      const clamped = Math.max(MIN_STEP, Math.min(MAX_STEP, target)) as OnboardingStepIndex;

      return { type: "step", step: clamped };
    }
  }
}
