// Feature: premium-ui-redesign, Property 9: Every rendered text element
// maps to exactly one type-scale step.
//
// **Validates: Requirements 3.4, 15.2**
//
// For any In_Scope_Screen S and *for any* text-bearing element rendered
// within S, the pair `(computed-font-size, computed-font-weight)` must
// match exactly one of the 9 documented type-scale steps:
//
//   { caption, meta, body, body-lg, label,
//     title-sm, title-md, title-lg, display }
//
// defined in `app/globals.css` (CSS custom properties), mirrored in
// `tailwind.config.ts`, and tabulated in `design.md` → "Type scale
// (Requirement 3.4)".
//
// ---------------------------------------------------------------------------
// Why source-scan rather than render-and-measure
// ---------------------------------------------------------------------------
// Property 9 is universally quantified over *rendered* text elements.
// Two practical constraints prevent a full render-and-measure approach
// in the current Phase-3 state:
//
//   1. Six of the 7 In_Scope_Screens (Login, Signup, Dashboard,
//      Profile, Settings, TestExtraction) call `requireUser()` /
//      `await supabase…` server-side; rendering them in jsdom requires
//      a fixture for the auth session and the Supabase client. The
//      `arbInScopeScreen()` registry the design documents is opt-in and
//      will be wired by later screen-render tests as Phase 3 lands.
//
//   2. Tailwind generates its utility CSS at build time. jsdom does
//      NOT load that stylesheet, so `getComputedStyle()` on a Tailwind-
//      classed element reports `font-size: ""`. A render-time check
//      would silently pass for every element — exactly the failure
//      mode our touch-target test calls out.
//
// The task brief explicitly authorises the alternative ("render each
// In_Scope_Screen *or scan its source*"), and the design's "Source-text
// properties" section catalogues the same approach for Properties
// 2/3/4/5/6 — Property 9 fits the same shape.
//
// We therefore enforce Property 9 at the source-text layer. The
// invariant is:
//
//   For any non-overridden source file F under `app/`, `components/`,
//   or `lib/`, F contains NEITHER:
//
//     (a) any Tailwind font-size utility outside the canonical
//         allow-list { text-xs, text-sm, text-base, text-xl,
//         text-2xl, text-6xl } that maps cleanly to one of the 9
//         documented type-scale steps; NOR
//     (b) any Tailwind arbitrary-value utility of the form
//         `text-[NN]` or `leading-[NN]` (which by construction cannot
//         be a documented step — every step ships as a named token).
//
// Forbidden Tailwind classes (font-size only — `text-{color|align|
// wrap|overflow}` are unaffected):
//
//   text-lg   (1.125rem / 18px) — not a step
//   text-3xl  (1.875rem / 30px) — not a step
//   text-4xl  (2.25rem  / 36px) — not a step
//   text-5xl  (3rem     / 48px) — not a step
//   text-7xl  (4.5rem   / 72px) — not a step
//   text-8xl  (6rem     / 96px) — not a step
//   text-9xl  (8rem     /128px) — not a step
//
// The 13px (`--text-meta`) and 42px (`--text-display` default) steps
// have no matching Tailwind utility, so consumers reach them via inline
// `style={{ fontSize: "var(--text-meta)" }}` / `var(--text-display)` —
// see `app/page.tsx` for the canonical pattern. Inline `var(--text-*)`
// declarations are not flagged by this property; they are the
// authoritative way to consume the scale steps that lack a Tailwind
// utility.
//
// ---------------------------------------------------------------------------
// Override-list pattern
// ---------------------------------------------------------------------------
// The redesign migrates screens in waves. Files mid-migration are listed
// under the `local/no-arbitrary-spacing: "off"` block in
// `eslint.config.mjs` — they may still ship arbitrary `text-[NN]` /
// `leading-[NN]` utilities until their owning task lands. Property 9
// reads that same override list and skips those files, mirroring the
// `no-arbitrary-spacing.property.test.ts` pattern. As each migration
// task removes a file from the override list, that file automatically
// comes under Property 9 enforcement — making the cleanup measurable
// rather than aspirational.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { VIEWPORT_WIDTHS, arbInScopeScreen } from "./_arbitraries";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const repoRoot = resolve(__dirname, "..", "..");

/** Directories scanned for source files. Mirrors the redesign scope. */
const SCAN_DIRS = ["app", "components", "lib"] as const;

/** Source-file extensions scanned. */
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

/**
 * Canonical Tailwind font-size utilities permitted by the type scale.
 * Each maps cleanly to one or more of the 9 documented steps:
 *
 *   text-xs   → caption (12px / weight 500) or meta-ish footnotes
 *   text-sm   → body    (14px / weight 400) or label  (14px / weight 500)
 *   text-base → body-lg (16px / weight 400) or title-sm (16px / weight 500)
 *   text-xl   → title-md (20px / weight 600)
 *   text-2xl  → title-lg (24px / weight 600)
 *   text-6xl  → display  (60px / weight 600) at md+ only
 *
 * The 13px (`--text-meta`) and 42px (`--text-display` default) steps
 * have no matching Tailwind utility. They are reached via inline
 * `style={{ fontSize: "var(--text-meta|display)" }}`, which this
 * property does not flag.
 */
const ALLOWED_FONT_SIZE_CLASSES = new Set<string>([
  "text-xs",
  "text-sm",
  "text-base",
  "text-xl",
  "text-2xl",
  "text-6xl",
]);

/**
 * The complete Tailwind font-size class family. `\b` word-boundary
 * anchors at both ends prevent matches inside `text-text-primary`,
 * `text-balance`, `text-accent`, `text-ellipsis`, etc. Responsive
 * prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) are matched because
 * `:` is not a word character — `\b` matches between `:` and `t`.
 */
const TAILWIND_FONT_SIZE_PATTERN =
  /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;

/**
 * Tailwind arbitrary-value utilities for font-size and line-height —
 * the parenthetical clause of the task brief: "(no `text-[NN]` /
 * `leading-[NN]` arbitrary values)".
 *
 * The leading negative lookbehind rejects matches inside a longer
 * dashed identifier (e.g. `min-text-[…]` is not a real Tailwind class
 * but the lookbehind defends against any future false positive).
 */
const ARBITRARY_TYPE_PATTERN =
  /(?<![A-Za-z0-9-])(?:text|leading)-\[[^\]]+\]/g;

/** Full type-scale step set for diagnostic messages. */
const DOCUMENTED_STEPS = [
  "caption",
  "meta",
  "body",
  "body-lg",
  "label",
  "title-sm",
  "title-md",
  "title-lg",
  "display",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPosix(absOrRelPath: string): string {
  return absOrRelPath.split(sep).join("/");
}

function walkSourceTree(root: string): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const name = String(entry.name);
      const full = `${dir}${sep}${name}`;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const dotIdx = name.lastIndexOf(".");
        const ext = dotIdx >= 0 ? name.slice(dotIdx) : "";
        if (SOURCE_EXTENSIONS.has(ext)) {
          out.push(full);
        }
      }
    }
  }
  return out;
}

/**
 * Read `eslint.config.mjs` and return every file path listed in any
 * flat-config block whose `rules` set `"local/no-arbitrary-spacing"`
 * to `"off"`. Property 9 is strictly stronger than that lint rule
 * (it forbids the named scale-misses too, not just `text-[NN]`), so
 * Property 9's skip set is at least the lint rule's override set —
 * any file legitimately shipping `text-[NN]` today must also be
 * exempt from Property 9 until its migration task lands.
 *
 * The negative lookahead `(?!files:\s*\[)` keeps the regex from
 * pairing one block's `files: [...]` with a different block's rule.
 */
function loadOverrideFiles(): Set<string> {
  const configPath = resolve(repoRoot, "eslint.config.mjs");
  const source = readFileSync(configPath, "utf8");
  const overrides = new Set<string>();

  const blockPattern =
    /files:\s*\[([\s\S]*?)\](?:(?!files:\s*\[)[\s\S])*?"local\/no-arbitrary-spacing":\s*"off"/g;
  const filePattern = /"([^"]+)"/g;

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockPattern.exec(source)) !== null) {
    const filesArrayBody = blockMatch[1];
    filePattern.lastIndex = 0;
    let fileMatch: RegExpExecArray | null;
    while ((fileMatch = filePattern.exec(filesArrayBody)) !== null) {
      overrides.add(fileMatch[1]);
    }
  }
  return overrides;
}

/** 1-indexed line of `offset` in `text`. */
function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

/** Trimmed source line containing `offset`. */
function extractLine(text: string, offset: number): string {
  const start = text.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const end = text.indexOf("\n", offset);
  return text.slice(start, end < 0 ? text.length : end).trim();
}

interface TypeScaleViolation {
  /** Repo-relative posix path of the offending file. */
  file: string;
  /** 1-indexed line. */
  line: number;
  /** The exact offending substring (e.g. "text-3xl", "text-[15px]"). */
  match: string;
  /** Why the substring violates Property 9. */
  reason: string;
  /** Trimmed source line for diagnostic context. */
  excerpt: string;
}

function findTypeScaleViolations(
  file: string,
  content: string,
): TypeScaleViolation[] {
  const violations: TypeScaleViolation[] = [];

  // (a) Tailwind font-size utility outside the canonical allow-list.
  TAILWIND_FONT_SIZE_PATTERN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TAILWIND_FONT_SIZE_PATTERN.exec(content)) !== null) {
    const className = m[0];
    if (ALLOWED_FONT_SIZE_CLASSES.has(className)) continue;
    const offset = m.index;
    violations.push({
      file,
      line: lineOf(content, offset),
      match: className,
      reason:
        `\`${className}\` is not in the type-scale allow-list ` +
        `{${[...ALLOWED_FONT_SIZE_CLASSES].sort().join(", ")}}. ` +
        `Replace it with a class that maps to one of the 9 documented ` +
        `steps {${DOCUMENTED_STEPS.join(", ")}}, or use an inline ` +
        `\`style={{ fontSize: "var(--text-{step})" }}\` for the meta ` +
        `(13px) and display-default (42px) steps that have no Tailwind ` +
        `utility.`,
      excerpt: extractLine(content, offset),
    });
  }

  // (b) Arbitrary `text-[NN]` / `leading-[NN]` — by construction
  //     cannot be a documented step (every step ships as a named token).
  ARBITRARY_TYPE_PATTERN.lastIndex = 0;
  while ((m = ARBITRARY_TYPE_PATTERN.exec(content)) !== null) {
    const utility = m[0];
    const offset = m.index;
    violations.push({
      file,
      line: lineOf(content, offset),
      match: utility,
      reason:
        `Arbitrary-value utility \`${utility}\` cannot encode a documented ` +
        `type-scale step — every step is a named token. Replace it with a ` +
        `class from the allow-list or with inline \`var(--text-{step})\`.`,
      excerpt: extractLine(content, offset),
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// One-shot file discovery
// ---------------------------------------------------------------------------

const overrideSet = loadOverrideFiles();

const candidateFiles: string[] = SCAN_DIRS.flatMap((dir) => {
  const root = resolve(repoRoot, dir);
  try {
    statSync(root);
  } catch {
    return [];
  }
  return walkSourceTree(root);
})
  .map((abs) => toPosix(relative(repoRoot, abs)))
  // Tests under `__tests__/` (or `*.test.ts(x)`) are not user-facing
  // source — they may legitimately reference forbidden values for
  // assertion purposes.
  .filter(
    (rel) =>
      !rel.includes("__tests__/") &&
      !rel.endsWith(".test.ts") &&
      !rel.endsWith(".test.tsx"),
  )
  .filter((rel) => !overrideSet.has(rel))
  .sort();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 9: every rendered text element maps to exactly one type-scale step (Requirements 3.4, 15.2)", () => {
  it("loads a non-empty override list from eslint.config.mjs", () => {
    // Sanity: if the override loader breaks the property below would
    // either run on every file (and fail loudly on legitimately
    // mid-migration files) or skip every file (and pass vacuously).
    // Anchor on a known migration entry so the loader is exercised.
    expect(overrideSet.size).toBeGreaterThan(0);
    expect(overrideSet.has("components/receipts/receipt-dashboard.tsx")).toBe(
      true,
    );
  });

  it("discovers source files outside the override list", () => {
    // If this assertion ever fails, the walk or the override list is
    // broken — the universal property would otherwise be vacuously true.
    expect(candidateFiles.length).toBeGreaterThan(0);
  });

  it("all 7 In_Scope_Screen identifiers are addressable via arbInScopeScreen", () => {
    // The screen registry on `arbInScopeScreen()` is the documented
    // future render-time wire-up for Property 9 (design.md →
    // "Render-based properties (Properties 8, 9, 10, …)"). Pin the
    // identifier list here so a future edit to `_arbitraries.ts`
    // surfaces in this test rather than silently dropping a screen
    // from coverage.
    const seen = new Set<string>();
    fc.assert(
      fc.property(arbInScopeScreen(), (screen) => {
        seen.add(screen.name);
        return true;
      }),
      { numRuns: 200 },
    );
    expect([...seen].sort()).toEqual(
      [
        "Dashboard",
        "Landing",
        "Login",
        "Profile",
        "Settings",
        "Signup",
        "TestExtraction",
      ].sort(),
    );
  });

  it("any non-overridden source file uses only type-scale-allowed font-size utilities (no text-3xl / text-[NN] / leading-[NN])", () => {
    fc.assert(
      fc.property(fc.constantFrom(...candidateFiles), (file) => {
        const absPath = resolve(repoRoot, file);
        const content = readFileSync(absPath, "utf8");
        const violations = findTypeScaleViolations(file, content);
        if (violations.length === 0) return true;

        // Surface up to 5 offenders for readability; fast-check still
        // shrinks to the smallest counterexample file.
        const summary = violations
          .slice(0, 5)
          .map(
            (v) =>
              `  ${v.file}:${v.line}  ${v.match}\n    ${v.reason}\n    ${JSON.stringify(v.excerpt)}`,
          )
          .join("\n");
        throw new Error(
          `Property 9 violation — \`${file}\` uses ${violations.length} ` +
            `font-size utility/utilities outside the documented type ` +
            `scale:\n${summary}`,
        );
      }),
      // Cover every file at least once on average; fast-check still
      // shrinks on failure to the smallest offending path.
      { numRuns: Math.max(100, candidateFiles.length * 2) },
    );
  });

  it("the type-scale property holds at every documented viewport width (universal-render shape)", () => {
    // Property 9 is universally quantified over rendered output; the
    // documented set of viewport widths exercises the responsive
    // prefixes that may swap classes (e.g. `text-2xl md:text-6xl` on
    // a hero — text-6xl is the canonical display step at md+). The
    // source-text scan above is viewport-independent, but quantifying
    // here keeps the universal-render shape readable and lets a
    // future render-time tightening slot in without changing the
    // outer fc.property structure.
    fc.assert(
      fc.property(
        fc.constantFrom(...VIEWPORT_WIDTHS),
        fc.constantFrom(...candidateFiles),
        (_width, file) => {
          const absPath = resolve(repoRoot, file);
          const content = readFileSync(absPath, "utf8");
          const violations = findTypeScaleViolations(file, content);
          return violations.length === 0;
        },
      ),
      // Per design.md "Per-property iteration discipline": ≥100 runs;
      // scale with the file × viewport space so each pair is sampled
      // at least once on average.
      {
        numRuns: Math.max(100, candidateFiles.length * VIEWPORT_WIDTHS.length),
      },
    );
  });
});
