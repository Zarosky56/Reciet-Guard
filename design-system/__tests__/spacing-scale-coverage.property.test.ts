// Feature: premium-ui-redesign, Property 10:
// Every gap between adjacent rendered elements lies on the spacing scale.
//
// **Validates: Requirements 4.1, 15.3**
//
// Strategy
// --------
// Property 10's universal claim — "for any In_Scope_Screen S and any parent
// DOM element P with two or more visible children, the gap between
// consecutive children is a non-negative multiple of 4 pixels and is ≤ 96
// pixels" — is verified statically by scanning each In_Scope_Screen's
// source for the spacing/positioning Tailwind utilities that translate
// into runtime gaps. Per the redesign's spacing scale (design.md →
// "Spacing scale"; Requirement 4.1):
//
//     Allowed pixel values: { 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 }
//     Tailwind class numbers:
//                         { 0, 1, 2, 3,  4,  5,  6,  8,  10, 12, 16, 20, 24 }
//
// Off-scale numeric values (e.g. `gap-7` → 28 px, `gap-2.5` → 10 px) and
// arbitrary `[Npx]` values are forbidden by the redesign — both fail the
// property here, which mirrors the lint rule `local/no-arbitrary-spacing`
// (the property is strictly stronger because it also rejects on-tree
// numerics like `gap-7` and half-step values like `gap-2.5` that the
// lint rule cannot detect).
//
// Scope
// -----
// "In_Scope_Screen source" is interpreted as each screen's page entry
// file under `app/`:
//   Landing         → app/page.tsx
//   Login           → app/(auth)/login/page.tsx
//   Signup          → app/(auth)/signup/page.tsx
//   Dashboard       → app/(dashboard)/dashboard/page.tsx
//   Profile         → app/(dashboard)/profile/page.tsx
//   Settings        → app/(dashboard)/settings/page.tsx
//   TestExtraction  → app/test-extraction/page.tsx
//
// The component primitives those pages compose (Button, Card, Grid, …)
// are governed by Property 3 (`no-arbitrary-spacing.property.test.ts`)
// and the lint rule, not by this test. Compositional gaps that originate
// inside primitives still surface in those primitives' own scans.
//
// Prefixes scanned (per the task description in tasks.md → 9.2):
//   `gap-`, `p-`, `m-`, `space-x-`, `space-y-`,
//   `top-`, `left-`, `right-`, `bottom-`
//
// All directional variants of `p-` and `m-` (`px-`, `py-`, `pt-`, `pr-`,
// `pb-`, `pl-`, `ps-`, `pe-`, `mx-`, `my-`, `mt-`, `mr-`, `mb-`, `ml-`,
// `ms-`, `me-`) and the `gap-x-` / `gap-y-` axis variants are included
// because they all consume the same spacing scale. Negative-prefix
// utilities (`-mt-4`, `-top-1`) are matched by allowing an optional
// leading `-` on the prefix — the Tailwind class number after the
// trailing dash is what must lie on the scale.
//
// Values that are NOT on the spacing scale but still legal on positional
// utilities (`top-`, `left-`, `right-`, `bottom-`):
//   - keywords:           `auto`, `full`, `px`, `screen`, `min`, `max`, `fit`
//   - fractional shares:  `1/2`, `1/3`, `1/4`, `2/3`, `3/4`, …
// These render as percentages or single-pixel offsets, not multiples of
// the 4 px base unit, and the design scale doesn't constrain them. The
// scanner treats those tokens as "not a spacing-scale value" and skips
// them silently rather than flagging them as off-scale.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { InScopeScreenName } from "./_arbitraries";
import { arbInScopeScreen } from "./_arbitraries";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const repoRoot = resolve(__dirname, "..", "..");

/**
 * The page entry file for each of the 7 In_Scope_Screens. Stored as
 * forward-slash relative paths so the failure messages render the same
 * way on every platform.
 */
const SCREEN_SOURCES: Record<InScopeScreenName, string> = {
  Landing: "app/page.tsx",
  Login: "app/(auth)/login/page.tsx",
  Signup: "app/(auth)/signup/page.tsx",
  Dashboard: "app/(dashboard)/dashboard/page.tsx",
  Profile: "app/(dashboard)/profile/page.tsx",
  Settings: "app/(dashboard)/settings/page.tsx",
  TestExtraction: "app/test-extraction/page.tsx",
};

/**
 * Allowed Tailwind class numbers per design.md → "Spacing scale". These
 * map to pixel values { 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 }.
 *
 * The set is closed: `gap-7`, `gap-9`, `gap-2.5`, `gap-32` and friends
 * are off-scale even though Tailwind exposes them in its default theme.
 */
const ALLOWED_CLASS_NUMBERS: ReadonlySet<number> = new Set([
  0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24,
]);

/**
 * Spacing-related Tailwind prefixes scanned by this property test.
 *
 * Order matters: longer prefixes (`space-x`, `gap-y`, `bottom`) appear
 * first so the regex alternation matches the most specific token instead
 * of greedily binding to a sub-prefix (`space-x-4` should never match
 * `s-x-4` or similar).
 */
const SPACING_PREFIXES: readonly string[] = [
  // 6–7 chars
  "space-x",
  "space-y",
  "bottom",
  // 5 chars
  "gap-x",
  "gap-y",
  "right",
  // 4 chars
  "left",
  // 3 chars
  "gap",
  "top",
  // 2 chars — directional padding/margin variants
  "px",
  "py",
  "pt",
  "pr",
  "pb",
  "pl",
  "ps",
  "pe",
  "mx",
  "my",
  "mt",
  "mr",
  "mb",
  "ml",
  "ms",
  "me",
  // 1 char — bare padding/margin
  "p",
  "m",
];

/**
 * Positional prefixes for which non-spacing values (`top-1/2`,
 * `left-auto`, `right-full`, `bottom-px`) are valid. Spacing-axis
 * prefixes (`gap-`, `p-`, `m-`, `space-x-`, `space-y-`) do NOT permit
 * these forms — Tailwind only supports them on positional utilities.
 *
 * Currently unused at runtime: the scanner's positional/keyword/fraction
 * branches handle these cases via value-shape checks alone. The set is
 * retained as a documentation artefact for future refinements that may
 * relax constraints per prefix kind.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const POSITIONAL_PREFIXES: ReadonlySet<string> = new Set([
  "top",
  "left",
  "right",
  "bottom",
]);

/**
 * Single regex that matches every spacing-utility token in the file:
 *
 *   - `(?<![A-Za-z0-9_])`        — left boundary: not in the middle of
 *                                  another identifier. We deliberately
 *                                  do NOT exclude `-` from the
 *                                  lookbehind so the leading `-` of a
 *                                  Tailwind negative modifier (`-mt-4`)
 *                                  is consumed by the optional `-?`
 *                                  inside group 1.
 *   - `(-?(?:prefix1|prefix2…))` — group 1: optional negative prefix
 *                                  followed by one of the spacing
 *                                  prefixes. Longer prefixes are listed
 *                                  first in `SPACING_PREFIXES`.
 *   - `-`                        — separator before the value.
 *   - `(value)`                  — group 2: one of the four legal value
 *                                  shapes. The order matters because
 *                                  arbitrary `[…]` literals can contain
 *                                  any character.
 *   - `(?![A-Za-z0-9_])`         — right boundary: not in the middle of
 *                                  another identifier (a digit followed
 *                                  by a dash is allowed because the
 *                                  next utility starts after whitespace
 *                                  in practice; but we keep the
 *                                  lookahead conservative to avoid
 *                                  matching inside compound class names
 *                                  like `top-1-foo`).
 */
const SPACING_UTILITY_PATTERN = new RegExp(
  `(?<![A-Za-z0-9_])` +
    `(-?(?:${SPACING_PREFIXES.join("|")}))` +
    `-` +
    `(\\[[^\\]]+\\]|\\d+(?:\\.\\d+)?(?:/\\d+)?|auto|full|px|screen|min|max|fit)` +
    `(?![A-Za-z0-9_])`,
  "g",
);

// ---------------------------------------------------------------------------
// Violation reporting
// ---------------------------------------------------------------------------

interface SpacingViolation {
  /** Type of violation: arbitrary literal vs. off-scale numeric. */
  kind: "arbitrary" | "off-scale";
  /** The full matched substring (e.g. `gap-2.5`, `p-[12px]`). */
  match: string;
  /** 1-indexed line number in the source file. */
  line: number;
  /** Numeric value parsed from the match (`null` for arbitrary). */
  value: number | null;
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

/**
 * Strip the optional leading `-` (Tailwind negative-modifier) from a
 * captured prefix so callers can check the bare prefix against
 * `POSITIONAL_PREFIXES`.
 */
function bareprefix(prefixCapture: string): string {
  return prefixCapture.startsWith("-")
    ? prefixCapture.slice(1)
    : prefixCapture;
}

/**
 * Scan a source file's text and return every spacing-utility violation:
 * arbitrary `[…]` values (always forbidden) and off-scale numerics
 * (e.g. `gap-7`, `gap-2.5`, `mt-32`).
 *
 * Pure: depends only on `content`. Returns matches in the order they
 * appear in the source.
 */
function findSpacingViolations(content: string): SpacingViolation[] {
  const out: SpacingViolation[] = [];
  SPACING_UTILITY_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SPACING_UTILITY_PATTERN.exec(content)) !== null) {
    const match = m[0];
    const prefix = bareprefix(m[1]);
    const value = m[2];

    // Arbitrary `[…]` value — always a violation regardless of prefix.
    if (value.startsWith("[")) {
      out.push({
        kind: "arbitrary",
        match,
        line: lineOf(content, m.index),
        value: null,
      });
      continue;
    }

    // Fractional positional value (e.g. `top-1/2`). Only allowed on
    // positional prefixes; on a spacing prefix, Tailwind would not
    // generate a class at all so we don't need to flag it. Skip.
    if (value.includes("/")) {
      continue;
    }

    // Keyword value (`auto`, `full`, `px`, `screen`, `min`, `max`, `fit`).
    // Allowed on positional prefixes; on a non-positional prefix some
    // are valid (`p-px` is a Tailwind utility, `m-auto` is a Tailwind
    // utility). None of these consume the spacing scale, so skip.
    if (!/^\d/.test(value)) {
      continue;
    }

    // Numeric value — must lie on the spacing scale.
    const num = Number.parseFloat(value);
    if (!Number.isFinite(num)) continue;
    if (ALLOWED_CLASS_NUMBERS.has(num)) continue;

    // Edge case: `top-1/2`-style fractions reaching here would have been
    // skipped above. Anything left is a numeric off-scale value.
    void prefix; // currently unused; reserved if a future refinement
    // wants to relax constraints for positional prefixes.
    out.push({
      kind: "off-scale",
      match,
      line: lineOf(content, m.index),
      value: num,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// One-shot file load (runs once when the module loads)
// ---------------------------------------------------------------------------

interface LoadedScreen {
  name: InScopeScreenName;
  relPath: string;
  content: string;
}

const loadedScreens: ReadonlyArray<LoadedScreen> = (
  Object.entries(SCREEN_SOURCES) as Array<[InScopeScreenName, string]>
).map(([name, relPath]) => {
  const absPath = resolve(repoRoot, relPath);
  const content = readFileSync(absPath, "utf8");
  return { name, relPath, content };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 10: spacing-scale coverage across In_Scope_Screen sources", () => {
  it("loads source for all 7 In_Scope_Screens", () => {
    expect(loadedScreens).toHaveLength(7);
    for (const { name, relPath, content } of loadedScreens) {
      expect(content.length).toBeGreaterThan(0);
      // Sanity: each source is a real React component module.
      expect(
        content.includes("export default") || content.includes("export function"),
        `${name} (${relPath}) does not look like a page module`,
      ).toBe(true);
    }
  });

  it("the spacing-utility regex correctly classifies sample inputs", () => {
    // Self-test: confirm the scanner agrees with the spec on a curated
    // set of representative cases. If a future refactor breaks the
    // regex, this test surfaces the breakage before the property test
    // does.
    const cases: Array<{
      input: string;
      expectKinds: Array<"arbitrary" | "off-scale">;
    }> = [
      // On-scale: no violations.
      { input: `<div className="gap-4 p-5 mt-2">`, expectKinds: [] },
      { input: `<div className="space-x-6 px-8 py-12">`, expectKinds: [] },
      { input: `<div className="-mt-4 top-0 left-0">`, expectKinds: [] },
      { input: `<div className="md:p-8 lg:gap-6">`, expectKinds: [] },
      // Off-scale numerics.
      { input: `<div className="gap-7">`, expectKinds: ["off-scale"] },
      { input: `<div className="gap-2.5">`, expectKinds: ["off-scale"] },
      { input: `<div className="mt-32">`, expectKinds: ["off-scale"] },
      { input: `<div className="py-0.5">`, expectKinds: ["off-scale"] },
      // Arbitrary literals.
      { input: `<div className="p-[16px]">`, expectKinds: ["arbitrary"] },
      { input: `<div className="gap-[10px]">`, expectKinds: ["arbitrary"] },
      // Positional fractions and keywords: skipped (not spacing-scale).
      { input: `<div className="top-1/2 left-1/3">`, expectKinds: [] },
      { input: `<div className="top-auto bottom-full">`, expectKinds: [] },
      { input: `<div className="m-auto p-px">`, expectKinds: [] },
      // Mixed: count exact violations.
      {
        input: `<div className="gap-4 p-7 mt-[5px]">`,
        expectKinds: ["off-scale", "arbitrary"],
      },
    ];
    for (const { input, expectKinds } of cases) {
      const violations = findSpacingViolations(input);
      expect(
        violations.map((v) => v.kind),
        `unexpected classification for input ${JSON.stringify(input)}`,
      ).toEqual(expectKinds);
    }
  });

  it("every In_Scope_Screen page source uses only on-scale spacing utilities (Property 10, Requirements 4.1, 15.3)", () => {
    // The arbitrary samples one of the seven screen names; we then look
    // up the loaded source by name. fast-check shrinks counter-examples
    // to the smallest offending screen and surfaces the violating
    // utility in the failure message.
    fc.assert(
      fc.property(arbInScopeScreen(), (screen) => {
        const loaded = loadedScreens.find((s) => s.name === screen.name);
        if (!loaded) {
          throw new Error(
            `internal: no source loaded for screen "${screen.name}"`,
          );
        }
        const violations = findSpacingViolations(loaded.content);
        if (violations.length === 0) return true;

        // Surface the first 5 offenders (with line numbers) in the
        // shrunk-counterexample report.
        const summary = violations
          .slice(0, 5)
          .map((v) => {
            const detail =
              v.kind === "arbitrary"
                ? `arbitrary value (forbidden)`
                : `off-scale numeric ${v.value} (allowed: ${[
                    ...ALLOWED_CLASS_NUMBERS,
                  ]
                    .sort((a, b) => a - b)
                    .join(", ")})`;
            return `  ${loaded.relPath}:${v.line}  ${JSON.stringify(v.match)}  — ${detail}`;
          })
          .join("\n");
        const more =
          violations.length > 5
            ? `\n  …and ${violations.length - 5} more violation(s)`
            : "";
        throw new Error(
          `Screen "${screen.name}" has spacing utility/utilities off the redesign scale:\n${summary}${more}\n\n` +
            `The redesign's spacing scale (design.md → "Spacing scale", Requirement 4.1) ` +
            `permits Tailwind class numbers { 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 } only. ` +
            `Replace the offender with the nearest on-scale token, or — for arbitrary [Npx] values — ` +
            `route through a documented token in tailwind.config.ts / app/globals.css.`,
        );
      }),
      // Sample each screen at least 4× on average so fast-check can
      // shrink to the smallest offending source.
      { numRuns: Math.max(40, loadedScreens.length * 6) },
    );
  });
});
