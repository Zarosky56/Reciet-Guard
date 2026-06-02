/**
 * Onboarding_Persistence — localStorage I/O + Onboarding_Serializer.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7
 *
 * Behavioural contract:
 * - loadOnboardingState performs feature detection, reads once, and falls
 *   back to in-memory storage if any step throws.
 * - After a single localStorage failure, a module-scoped flag disables all
 *   subsequent localStorage access for the page lifetime.
 * - saveOnboardingState never throws; returns true on success, false on failure.
 * - parseOnboardingState returns null for malformed JSON, missing/extra keys,
 *   wrong types, or version !== CURRENT_ONBOARDING_VERSION.
 * - serializeOnboardingState emits { completed, lastStep, version } in fixed
 *   insertion order.
 */

import {
  CURRENT_ONBOARDING_VERSION,
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STORAGE_KEY,
  type OnboardingState,
} from "./types";

// Module-scoped flag: once localStorage throws, we never retry.
let localStorageDisabled = false;

/**
 * Serialize an OnboardingState to a JSON string with fixed key order.
 * Pure function — no side effects.
 */
export function serializeOnboardingState(state: OnboardingState): string {
  return JSON.stringify({
    completed: state.completed,
    lastStep: state.lastStep,
    version: state.version,
  });
}

/**
 * Parse a raw string into an OnboardingState, or return null if the input
 * is malformed, has missing/extra keys, wrong types, or a non-current version.
 * Pure function — no side effects.
 */
export function parseOnboardingState(raw: string): OnboardingState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  // Must be a plain object (not null, not an array)
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  // Must have exactly three own enumerable keys
  const keys = Object.keys(obj);
  if (keys.length !== 3) {
    return null;
  }
  if (!keys.includes("completed") || !keys.includes("lastStep") || !keys.includes("version")) {
    return null;
  }

  // Type checks
  if (typeof obj.completed !== "boolean") {
    return null;
  }
  if (typeof obj.lastStep !== "number" || !Number.isInteger(obj.lastStep)) {
    return null;
  }
  if (typeof obj.version !== "number" || !Number.isInteger(obj.version)) {
    return null;
  }

  // Version must match current
  if (obj.version !== CURRENT_ONBOARDING_VERSION) {
    return null;
  }

  return {
    completed: obj.completed,
    lastStep: obj.lastStep as number,
    version: obj.version as number,
  };
}

/**
 * Load onboarding state from localStorage.
 *
 * Performs feature detection inside a try/catch, reads once, and overwrites
 * the key with serialize(DEFAULT) on missing/empty/corrupt/wrong-version values.
 *
 * Never throws. On any localStorage error, sets localStorageDisabled = true
 * and returns the default state (in-memory only for the page lifetime).
 */
export function loadOnboardingState(): OnboardingState {
  if (localStorageDisabled) {
    return { ...DEFAULT_ONBOARDING_STATE };
  }

  try {
    // Feature detection: verify localStorage is accessible
    if (typeof window === "undefined") {
      localStorageDisabled = true;
      return { ...DEFAULT_ONBOARDING_STATE };
    }

    const probeKey = "__onboarding_probe__";
    localStorage.setItem(probeKey, "1");
    localStorage.removeItem(probeKey);

    // Read exactly once
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);

    // Missing or empty
    if (raw === null || raw === "") {
      const defaultSerialized = serializeOnboardingState(DEFAULT_ONBOARDING_STATE);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, defaultSerialized);
      return { ...DEFAULT_ONBOARDING_STATE };
    }

    // Attempt parse
    const state = parseOnboardingState(raw);

    // Corrupt or wrong version
    if (state === null) {
      const defaultSerialized = serializeOnboardingState(DEFAULT_ONBOARDING_STATE);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, defaultSerialized);
      return { ...DEFAULT_ONBOARDING_STATE };
    }

    return state;
  } catch {
    // SecurityError, QuotaExceededError, or any other DOMException
    localStorageDisabled = true;
    return { ...DEFAULT_ONBOARDING_STATE };
  }
}

/**
 * Save onboarding state to localStorage synchronously.
 * Returns true on success, false on failure. Never throws.
 */
export function saveOnboardingState(state: OnboardingState): boolean {
  if (localStorageDisabled) {
    return false;
  }

  try {
    const serialized = serializeOnboardingState(state);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, serialized);
    return true;
  } catch {
    localStorageDisabled = true;
    return false;
  }
}

// Re-export types and constants for convenience
export {
  CURRENT_ONBOARDING_VERSION,
  DEFAULT_ONBOARDING_STATE,
  ONBOARDING_STORAGE_KEY,
  type OnboardingState,
} from "./types";
