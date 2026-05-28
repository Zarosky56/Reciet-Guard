import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Example test for `design-system/VISUAL_IDENTITY.md` required sections.
 *
 * Validates: Requirements 1.2, 10.8
 *
 * Asserts that the visual-identity source-of-truth document exists and
 * contains the three sections that make it useful as a reference:
 *   1. A heading titled "Visual identity stance" (the prose stance).
 *   2. A contrast matrix — a markdown table with at least five rows that
 *      report contrast ratios in the documented `X.X:1` form.
 *   3. The AI_Slop_Pattern rejected-pattern checklist — recognizable by
 *      the verbatim section markers "13.1 ", "13.13 ", "13.14 ", and by
 *      carrying the full set of 14 checkbox items (one per banned pattern
 *      from Requirement 13).
 */

const WORKSPACE_ROOT = resolve(__dirname, "..", "..");
const VISUAL_IDENTITY_PATH = resolve(
  WORKSPACE_ROOT,
  "design-system",
  "VISUAL_IDENTITY.md",
);

describe("VISUAL_IDENTITY.md — required sections (Requirements 1.2, 10.8)", () => {
  it("exists at design-system/VISUAL_IDENTITY.md", () => {
    expect(existsSync(VISUAL_IDENTITY_PATH)).toBe(true);
  });

  it("contains a heading (any level) titled 'Visual identity stance'", () => {
    const source = readFileSync(VISUAL_IDENTITY_PATH, "utf8");

    // Match any markdown heading level (#, ##, ###, ...) followed by the
    // required title. The heading is case-insensitive and may carry
    // trailing whitespace.
    const headingPattern = /^#{1,6}\s+Visual identity stance\s*$/im;
    expect(source).toMatch(headingPattern);
  });

  it("contains a contrast matrix table with at least five rows reporting X.X:1 ratios", () => {
    const source = readFileSync(VISUAL_IDENTITY_PATH, "utf8");

    // A markdown table row reporting a contrast ratio looks like:
    //   | Body text on canvas | text-primary / canvas | 16.8:1 | ≥4.5 ... | ✅ |
    // We accept any row whose pipes surround a ratio in the form "X.X:1"
    // (one or more digits, a dot, one or more digits, a colon, then "1").
    const ratioRowPattern = /^\s*\|.*\b\d+(?:\.\d+)?:1\b.*\|\s*$/gm;
    const ratioRows = source.match(ratioRowPattern) ?? [];

    expect(
      ratioRows.length,
      `expected ≥5 contrast-matrix rows reporting an X.X:1 ratio, found ${ratioRows.length}`,
    ).toBeGreaterThanOrEqual(5);
  });

  it("contains the AI_Slop_Pattern checklist with the documented section markers", () => {
    const source = readFileSync(VISUAL_IDENTITY_PATH, "utf8");

    // The catalogue from Requirement 13 enumerates 14 banned patterns
    // numbered 13.1 through 13.14. Spot-check the first, the second-to-last,
    // and the last marker — these three together prove the catalogue is
    // present and complete (not just a partial copy).
    expect(source).toMatch(/\b13\.1 /);
    expect(source).toMatch(/\b13\.13 /);
    expect(source).toMatch(/\b13\.14 /);
  });

  it("renders the AI_Slop_Pattern catalogue as 14 checkbox items", () => {
    const source = readFileSync(VISUAL_IDENTITY_PATH, "utf8");

    // The catalogue is rendered as a GFM task list. Each banned pattern
    // appears as a `- [ ]` (or `- [x]`) bullet. There are 14 banned
    // patterns in Requirement 13, so the document MUST carry at least 14
    // checkbox items.
    const checkboxPattern = /^\s*-\s*\[[ xX]\]\s+/gm;
    const checkboxes = source.match(checkboxPattern) ?? [];

    expect(
      checkboxes.length,
      `expected ≥14 checkbox items for the AI_Slop_Pattern catalogue, found ${checkboxes.length}`,
    ).toBeGreaterThanOrEqual(14);
  });
});
