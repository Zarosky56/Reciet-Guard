import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Example test for per-screen spec files (and the navigation chrome doc).
 *
 * Validates: Requirements 9.1, 10.1
 *
 * Asserts that every In_Scope_Screen documented in the requirements has a
 * corresponding spec file under `design-system/`, that each file exists on
 * disk, and that each file is non-empty (has meaningful content beyond
 * trivial whitespace). The navigation doc is included because the chrome
 * shared by Dashboard/Profile/Settings (`MobileBottomNav`, `DashboardHeader`)
 * is documented there per task 5.12 and Requirement 8.7.
 */

const DESIGN_SYSTEM_DIR = resolve(__dirname, "..");

/**
 * Per-screen specs required by Requirement 9.1, plus `navigation.md` which
 * documents the shared dashboard chrome referenced by Requirement 9.6.
 */
const REQUIRED_SPEC_FILES = [
  "landing.md",
  "login.md",
  "signup.md",
  "dashboard.md",
  "profile.md",
  "settings.md",
  "test-extraction.md",
  "navigation.md",
] as const;

/**
 * "Non-empty" means the file has at least some real content — not just an
 * empty file or a file containing only whitespace. We require a small
 * minimum byte count and at least one non-whitespace character so the
 * test catches a stub that was created but never authored.
 */
const MIN_CONTENT_BYTES = 32;

describe("design-system per-screen spec files (Requirements 9.1, 10.1)", () => {
  it.each(REQUIRED_SPEC_FILES)("ships %s under design-system/", (fileName) => {
    const filePath = resolve(DESIGN_SYSTEM_DIR, fileName);
    expect(
      existsSync(filePath),
      `expected design-system/${fileName} to exist`,
    ).toBe(true);
  });

  it.each(REQUIRED_SPEC_FILES)("renders %s as a non-empty file", (fileName) => {
    const filePath = resolve(DESIGN_SYSTEM_DIR, fileName);

    const stats = statSync(filePath);
    expect(
      stats.size,
      `expected design-system/${fileName} to be at least ${MIN_CONTENT_BYTES} bytes`,
    ).toBeGreaterThanOrEqual(MIN_CONTENT_BYTES);

    const contents = readFileSync(filePath, "utf8");
    expect(
      contents.trim().length,
      `expected design-system/${fileName} to contain non-whitespace content`,
    ).toBeGreaterThan(0);
  });
});
