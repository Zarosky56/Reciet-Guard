/**
 * Onboarding state types and constants.
 *
 * Validates: Requirements 2.1, 2.3, 2.4, 2.5
 */

/** Serialisable record persisted across sessions. */
export interface OnboardingState {
  completed: boolean;
  lastStep: number; // integer, 0 <= lastStep <= 8; 0 means "not yet entered"
  version: number; // schema version; current value is the literal 1
}

/** Valid step indices within the onboarding flow (1-based). */
export type OnboardingStepIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** localStorage key used by Onboarding_Persistence. */
export const ONBOARDING_STORAGE_KEY = "receipt_guardian.onboarding_v1";

/** Current schema version. Used to detect stale persisted state. */
export const CURRENT_ONBOARDING_VERSION = 1 as const;

/** Immutable default state used when no valid persisted state exists. */
export const DEFAULT_ONBOARDING_STATE: OnboardingState = Object.freeze({
  completed: false,
  lastStep: 0,
  version: 1,
});
