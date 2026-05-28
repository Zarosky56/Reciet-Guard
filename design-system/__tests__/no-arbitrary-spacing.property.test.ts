// Feature: premium-ui-redesign, Property 3: No arbitrary-value Tailwind
// utilities for spacing, sizing, typography, or grid.
//
// Validates: Requirements 3.5, 4.2, 4.5
//
// For any source file F under `app/**`, `components/**`, or `lib/**`
// (excluding the legacy-override list declared in `eslint.config.mjs` for
// the `local/no-arbitrary-spacing` rule and the canonical token-source
// allow-list `components/ui/typography.tsx`, `components/ui/grid.tsx`,
// `tailwind.config.ts`), F must contain no Tailwind arbitrary-value
// utility matching the offender pattern documented in the design
// document and the ESLint rule:
//
//     (p|m|gap|space-x|space-y|top|left|right|bottom|inset|w|h
//      |min-w|min-h|max-w|max-h|text|leading|tracking
//      |grid-cols|grid-rows)-\[[^\]]+\]
//
// The override list is read at test time from `eslint.config.mjs` so the
// test, the lint rule, and the redesign migration plan all share a single
// source of truth. As Phase 2 / Phase 3 land, files are removed from the
// override list and immediately become subject to this property — making
// the cleanup measurable rather than aspirational.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const repoRoot = resolve(__dirname, "..", "..");

/** Directories scanned for source files. Mirrors the ESLint rule scope. */
const SCAN_DIRS = ["app", "components", "lib"] as const;

/** Source-file extensions scanned. Mirrors the ESLint rule glob. */
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

/**
 * The exact offender pattern documented in
 * `eslint-rules/no-arbitrary-spacing.js` and `design.md` → Property 3.
 *
 * Longer prefixes (`min-w`, `grid-cols`, `space-x`, `space-y`) are listed
 * before their shorter sub-prefixes so the regex engine matches the most
 * specific token first. The leading `(?<![A-Za-z0-9-])` lookbehind rejects
 * tail matches inside a longer dashed identifier.
 */
const ARBITRARY_PATTERN =
  /(?<![A-Za-z0-9-])(?:min-w|min-h|max-w|max-h|space-x|space-y|grid-cols|grid-rows|gap|top|left|right|bottom|inset|text|leading|tracking|p|m|w|h)-\[[^\]]+\]/g;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPosix(absOrRelPath: string): string {
  return absOrRelPath.split(sep).join("/");
}

/**
 * Recursively walk `root` and collect every regular file whose extension
 * is in `SOURCE_EXTENSIONS`. Returns absolute paths.
 */
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
 * Parse `eslint.config.mjs` and return the union of every file path in the
 * `files: [...]` arrays of every flat-config block whose `rules` object
 * sets `"local/no-arbitrary-spacing": "off"`.
 *
 * Two such blocks exist today:
 *   1. The token-source allow-list (`components/ui/typography.tsx`,
 *      `components/ui/grid.tsx`, `tailwind.config.ts`).
 *   2. The pre-redesign legacy override list (long, shrinking each phase).
 *
 * The matching is regex-based but constrained: the negative lookahead
 * `(?!files:\s*\[)` ensures we never associate one block's `files: [...]`
 * with a different block's rule, which would otherwise let the regex
 * engine reach across object boundaries.
 */
function loadNoArbitrarySpacingOverrides(): Set<string> {
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

// ---------------------------------------------------------------------------
// One-shot file discovery (runs once when this module loads).
// ---------------------------------------------------------------------------

const overrideSet = loadNoArbitrarySpacingOverrides();

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
  .filter((rel) => !overrideSet.has(rel))
  .sort();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 3: no arbitrary-value Tailwind spacing/typography/grid utilities", () => {
  it("loads a non-empty override list from eslint.config.mjs", () => {
    expect(overrideSet.size).toBeGreaterThan(0);
    // The token-source allow-list must always include `tailwind.config.ts`
    // (the canonical token source). If this file is removed from the
    // allow-list, that's a regression in the lint configuration.
    expect(overrideSet.has("tailwind.config.ts")).toBe(true);
    expect(overrideSet.has("components/ui/typography.tsx")).toBe(true);
    expect(overrideSet.has("components/ui/grid.tsx")).toBe(true);
  });

  it("discovers source files outside the override list", () => {
    // Sanity: the test must actually have something to check against.
    // If this assertion ever fails, the walk or the override list is
    // broken — the property below would otherwise be vacuously true.
    expect(candidateFiles.length).toBeGreaterThan(0);
  });

  it("any non-overridden source file under app/, components/, lib/ contains no arbitrary-value utility", () => {
    fc.assert(
      fc.property(fc.constantFrom(...candidateFiles), (file) => {
        const absPath = resolve(repoRoot, file);
        const content = readFileSync(absPath, "utf8");
        ARBITRARY_PATTERN.lastIndex = 0;
        const match = ARBITRARY_PATTERN.exec(content);
        if (match === null) return true;
        // Surface the offending utility (and the file) in fast-check's
        // shrunk-counterexample report.
        throw new Error(
          `File "${file}" contains forbidden arbitrary-value utility "${match[0]}". ` +
            `Replace it with a token from tailwind.config.ts / app/globals.css, or — if the file ` +
            `is still mid-migration — add it to the legacy-override list for ` +
            `\`local/no-arbitrary-spacing\` in \`eslint.config.mjs\` with a tracked migration task.`,
        );
      }),
      {
        // Ensure every file in the candidate set is sampled at least
        // once on average. Property 3 is universally quantified over the
        // file tree, so the iteration count scales with the tree size.
        numRuns: Math.max(100, candidateFiles.length * 2),
      },
    );
  });
});
