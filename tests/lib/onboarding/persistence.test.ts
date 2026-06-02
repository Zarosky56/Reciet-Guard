/**
 * Unit tests for lib/onboarding/persistence.ts
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6, 2.7
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// We need to reset the module-scoped `localStorageDisabled` flag between tests,
// so we use dynamic imports with vi.resetModules().
describe("lib/onboarding/persistence", () => {
  let serializeOnboardingState: typeof import("@/lib/onboarding/persistence").serializeOnboardingState;
  let parseOnboardingState: typeof import("@/lib/onboarding/persistence").parseOnboardingState;
  let loadOnboardingState: typeof import("@/lib/onboarding/persistence").loadOnboardingState;
  let saveOnboardingState: typeof import("@/lib/onboarding/persistence").saveOnboardingState;

  // Mock localStorage
  let store: Record<string, string>;
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
  };

  beforeEach(async () => {
    vi.resetModules();
    store = {};

    // Set up window and localStorage mocks
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", mockLocalStorage);
    mockLocalStorage.getItem.mockImplementation((key: string) => store[key] ?? null);
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => { store[key] = value; });
    mockLocalStorage.removeItem.mockImplementation((key: string) => { delete store[key]; });

    const mod = await import("@/lib/onboarding/persistence");
    serializeOnboardingState = mod.serializeOnboardingState;
    parseOnboardingState = mod.parseOnboardingState;
    loadOnboardingState = mod.loadOnboardingState;
    saveOnboardingState = mod.saveOnboardingState;
  });

  describe("serializeOnboardingState", () => {
    it("emits JSON with fixed key order: completed, lastStep, version", () => {
      const result = serializeOnboardingState({ completed: true, lastStep: 3, version: 1 });
      expect(result).toBe('{"completed":true,"lastStep":3,"version":1}');
    });

    it("serializes the default state correctly", () => {
      const result = serializeOnboardingState({ completed: false, lastStep: 0, version: 1 });
      expect(result).toBe('{"completed":false,"lastStep":0,"version":1}');
    });
  });

  describe("parseOnboardingState", () => {
    it("parses a valid serialized state", () => {
      const raw = '{"completed":true,"lastStep":4,"version":1}';
      expect(parseOnboardingState(raw)).toEqual({ completed: true, lastStep: 4, version: 1 });
    });

    it("returns null for malformed JSON", () => {
      expect(parseOnboardingState("{not json")).toBeNull();
    });

    it("returns null for non-object values", () => {
      expect(parseOnboardingState("42")).toBeNull();
      expect(parseOnboardingState('"string"')).toBeNull();
      expect(parseOnboardingState("null")).toBeNull();
      expect(parseOnboardingState("[1,2,3]")).toBeNull();
    });

    it("returns null for missing keys", () => {
      expect(parseOnboardingState('{"completed":true,"lastStep":0}')).toBeNull();
    });

    it("returns null for extra keys", () => {
      expect(parseOnboardingState('{"completed":true,"lastStep":0,"version":1,"extra":"val"}')).toBeNull();
    });

    it("returns null for wrong types", () => {
      expect(parseOnboardingState('{"completed":"yes","lastStep":0,"version":1}')).toBeNull();
      expect(parseOnboardingState('{"completed":true,"lastStep":"0","version":1}')).toBeNull();
      expect(parseOnboardingState('{"completed":true,"lastStep":0,"version":"1"}')).toBeNull();
    });

    it("returns null for non-integer lastStep", () => {
      expect(parseOnboardingState('{"completed":true,"lastStep":1.5,"version":1}')).toBeNull();
    });

    it("returns null for wrong version", () => {
      expect(parseOnboardingState('{"completed":true,"lastStep":0,"version":2}')).toBeNull();
      expect(parseOnboardingState('{"completed":true,"lastStep":0,"version":0}')).toBeNull();
    });
  });

  describe("loadOnboardingState", () => {
    it("returns default and writes to storage when key is missing", () => {
      const result = loadOnboardingState();
      expect(result).toEqual({ completed: false, lastStep: 0, version: 1 });
      expect(store["receipt_guardian.onboarding_v1"]).toBe('{"completed":false,"lastStep":0,"version":1}');
    });

    it("returns default and overwrites when key is empty string", () => {
      store["receipt_guardian.onboarding_v1"] = "";
      const result = loadOnboardingState();
      expect(result).toEqual({ completed: false, lastStep: 0, version: 1 });
      expect(store["receipt_guardian.onboarding_v1"]).toBe('{"completed":false,"lastStep":0,"version":1}');
    });

    it("returns default and overwrites when value is corrupt JSON", () => {
      store["receipt_guardian.onboarding_v1"] = "not json at all";
      const result = loadOnboardingState();
      expect(result).toEqual({ completed: false, lastStep: 0, version: 1 });
      expect(store["receipt_guardian.onboarding_v1"]).toBe('{"completed":false,"lastStep":0,"version":1}');
    });

    it("returns default and overwrites when version is wrong", () => {
      store["receipt_guardian.onboarding_v1"] = '{"completed":true,"lastStep":3,"version":2}';
      const result = loadOnboardingState();
      expect(result).toEqual({ completed: false, lastStep: 0, version: 1 });
      expect(store["receipt_guardian.onboarding_v1"]).toBe('{"completed":false,"lastStep":0,"version":1}');
    });

    it("returns the stored state when valid", () => {
      store["receipt_guardian.onboarding_v1"] = '{"completed":true,"lastStep":5,"version":1}';
      const result = loadOnboardingState();
      expect(result).toEqual({ completed: true, lastStep: 5, version: 1 });
    });

    it("catches localStorage throws and returns default", () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new DOMException("SecurityError");
      });
      const result = loadOnboardingState();
      expect(result).toEqual({ completed: false, lastStep: 0, version: 1 });
    });

    it("disables localStorage after a throw; subsequent save returns false", () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new DOMException("SecurityError");
      });
      loadOnboardingState();
      // Now localStorage is disabled
      const saved = saveOnboardingState({ completed: true, lastStep: 5, version: 1 });
      expect(saved).toBe(false);
    });
  });

  describe("saveOnboardingState", () => {
    it("returns true on successful write", () => {
      const result = saveOnboardingState({ completed: true, lastStep: 3, version: 1 });
      expect(result).toBe(true);
      expect(store["receipt_guardian.onboarding_v1"]).toBe('{"completed":true,"lastStep":3,"version":1}');
    });

    it("returns false and sets localStorageDisabled on throw", async () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new DOMException("QuotaExceededError");
      });
      const result = saveOnboardingState({ completed: true, lastStep: 3, version: 1 });
      expect(result).toBe(false);

      // Subsequent calls also return false without retrying
      mockLocalStorage.setItem.mockClear();
      const result2 = saveOnboardingState({ completed: true, lastStep: 3, version: 1 });
      expect(result2).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it("never throws even when localStorage throws", () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("unexpected");
      });
      expect(() => saveOnboardingState({ completed: true, lastStep: 3, version: 1 })).not.toThrow();
    });
  });
});
