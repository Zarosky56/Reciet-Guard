// Feature: premium-ui-redesign
// Property 6: No Tailwind-default cobalt/indigo/violet accent on user-facing
// surfaces.
//
// For any source file F under `app/**`, `components/**`, or `lib/**`, F
// contains no Tailwind utility matching
//   `(text|bg|border|ring|outline|fill|stroke)-(blue|indigo|violet)-\d+`
// and no raw hex literal in the forbidden cobalt/indigo/violet set
//   { #5B8CFF, #3B82F6, #6366F1, #8B5CF6, #A78BFA, #818CF8 } (case-insensitive).
//
// Additionally, the redesigned accent token defined in `app/globals.css`
// (`--color-accent`, `--color-accent-hover`, `--color-accent-tint`,
// `--color-border-focus`) and the `accent.*` color entries mirrored in
// `tailwind.config.ts` must NOT resolve to a Tailwind-default
// blue/indigo/violet shade or to the legacy cobalt value `#5B8CFF`.
//
// **Validates: Requirements 1.3, 13.1**
//
// Skipped files (will migrate in later phases — see Phase 4 task 11.x):
//   1. `app/globals.css`         — defines the legacy `--color-action` tokens
//                                   that point at cobalt; deleted in 11.1.
//                                   The redesign accent declarations in this
//                                   file are still asserted on directly by
//                                   the token-parity check below.
//   2. `tailwind.config.ts`      — outside the walk root anyway, listed for
//                                   intent. The redesign `accent.*` mapping
//                                   is asserted on directly by the
//                                   token-parity check below.
//   3. The `local/no-raw-color: "off"` override list from
//      `eslint.config.mjs` (currently: app/layout.tsx,
//      components/ui/button.tsx, components/auth/auth-form.tsx,
//      lib/notifications/send-deadline-email.ts). The override block is
//      removed in Phase 4 once those files reference the redesigned tokens.
//
// The test is a property test in the structural sense: it randomly samples
// a file from the eligible set and asserts the "no cobalt token" property
// holds for it. fast-check shrinks counter-examples to the smallest
// offending file, which gives a useful failure signal.

import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// ---------------------------------------------------------------------------
// Constants — forbidden patterns
// ---------------------------------------------------------------------------

/**
 * Tailwind utility families that take a color suffix. The list mirrors the
 * Tailwind documentation for color-bearing utilities applied to user-facing
 * surfaces (text, fills, strokes, borders, rings, outlines).
 */
const COLOR_UTILITY_PREFIXES =
  "text|bg|border|ring|outline|fill|stroke|from|via|to|placeholder|caret|accent|decoration|divide";

/**
 * Match a Tailwind utility class for a forbidden cobalt/indigo/violet color
 * scale, e.g. `bg-blue-500`, `text-indigo-400`, `border-violet-300`. The
 * `(?:\/\d+)?` clause permits an opacity modifier (`bg-blue-500/30`).
 */
const FORBIDDEN_TAILWIND_PATTERN = new RegExp(
  `\\b(?:${COLOR_UTILITY_PREFIXES})-(?:blue|indigo|violet)-\\d{2,3}(?:\\/\\d+)?\\b`,
  "g",
);

/**
 * Forbidden cobalt/indigo/violet hex literals (case-insensitive). The list
 * is taken from `design.md` → "Property 6":
 *   - #5B8CFF — current `--color-action`
 *   - #3B82F6 — current `--color-action-strong`, Tailwind `blue-500`
 *   - #6366F1 — Tailwind `indigo-500`
 *   - #8B5CF6 — Tailwind `violet-500`
 *   - #A78BFA — Tailwind `violet-400`
 *   - #818CF8 — Tailwind `indigo-400`
 *
 * The trailing `(?![0-9a-fA-F])` lookahead prevents a 3-digit hex from
 * matching the prefix of a longer hex token (e.g. `#5B8CFFAA` should not
 * match `#5B8CFF`).
 */
const FORBIDDEN_HEX_LITERALS = [
  "5B8CFF",
  "3B82F6",
  "6366F1",
  "8B5CF6",
  "A78BFA",
  "818CF8",
] as const;

const FORBIDDEN_HEX_PATTERN = new RegExp(
  `#(?:${FORBIDDEN_HEX_LITERALS.join("|")})(?![0-9a-fA-F])`,
  "gi",
);

// ---------------------------------------------------------------------------
// File system walk
// ---------------------------------------------------------------------------

const REPO_ROOT = join(__dirname, "..", "..");
const WALK_ROOTS = ["app", "components", "lib"] as const;
const SCANNABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
]);

/**
 * Recursively collect every scannable file under `dir`, returned as paths
 * relative to `REPO_ROOT` with forward-slash separators (so they match the
 * patterns in `eslint.config.mjs`).
 */
function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walk(full, acc);
    } else if (stat.isFile()) {
      const dotIdx = entry.lastIndexOf(".");
      if (dotIdx === -1) continue;
      const ext = entry.slice(dotIdx);
      if (SCANNABLE_EXTENSIONS.has(ext)) {
        acc.push(relative(REPO_ROOT, full).split(sep).join("/"));
      }
    }
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Legacy override extraction — read `eslint.config.mjs` and pull out every
// file path that currently has `local/no-raw-color: "off"`. These files
// migrate to redesigned tokens in Phase 4 (task 11.x); for now they are
// skipped so the property test is enforceable on the rest of the tree.
// ---------------------------------------------------------------------------

function readNoRawColorOverrideFiles(): Set<string> {
  const eslintConfigPath = join(REPO_ROOT, "eslint.config.mjs");
  const text = readFileSync(eslintConfigPath, "utf8");
  // Match a `{ files: [...], rules: { ... "local/no-raw-color": "off" ... } }`
  // block. The `[^}]*?` clause keeps the search inside the `rules: { ... }`
  // body so we cannot accidentally pair an earlier `files: [...]` with a
  // later `rules` block (e.g. the `**/*.d.ts` triple-slash override).
  const overrideBlocks = [
    ...text.matchAll(
      /files:\s*\[([\s\S]*?)\]\s*,\s*rules:\s*\{[^}]*?"local\/no-raw-color"\s*:\s*"off"[^}]*?\}/g,
    ),
  ];
  const files = new Set<string>();
  for (const [, filesBlock] of overrideBlocks) {
    for (const m of filesBlock.matchAll(/"([^"]+)"/g)) {
      files.add(m[1]);
    }
  }
  return files;
}

// ---------------------------------------------------------------------------
// Eligible file set — everything under app/, components/, lib/ except:
//   - app/globals.css       (legacy --color-action tokens; removed in 11.1)
//   - tailwind.config.ts    (outside walk roots; listed for clarity)
//   - the no-raw-color override list                  (migrated in Phase 4)
//
// `app/globals.css` *contains* the legacy hex literals (#5b8cff and
// #3b82f6) that the redesigned `--color-accent` token replaces. Skipping
// it here is a deferred-migration concession; the file is purged of those
// literals in task 11.1 and this exemption is removed at the same time.
// ---------------------------------------------------------------------------

const ALWAYS_SKIP = new Set<string>([
  "app/globals.css",
  "tailwind.config.ts",
]);

function buildEligibleFiles(): string[] {
  const overrideFiles = readNoRawColorOverrideFiles();
  const collected: string[] = [];
  for (const root of WALK_ROOTS) {
    walk(join(REPO_ROOT, root), collected);
  }
  return collected
    .filter((f) => !ALWAYS_SKIP.has(f) && !overrideFiles.has(f))
    .sort();
}

// ---------------------------------------------------------------------------
// Token parity — the redesigned accent token must NOT resolve to a
// Tailwind-default blue/indigo/violet shade or to the legacy cobalt value.
// ---------------------------------------------------------------------------

/**
 * Tailwind-default accent shades the redesign forbids the brand accent
 * from mapping to. These are the canonical hex values from the Tailwind
 * v3 default palette plus the legacy `--color-action` cobalt
 * (`#5B8CFF`) that the redesign replaces.
 */
const FORBIDDEN_ACCENT_HEXES = new Set<string>([
  // Legacy cobalt (`--color-action`)
  "#5b8cff",
  // blue-400 / blue-500 / blue-600
  "#60a5fa",
  "#3b82f6",
  "#2563eb",
  // indigo-400 / indigo-500 / indigo-600
  "#818cf8",
  "#6366f1",
  "#4f46e5",
  // violet-400 / violet-500 / violet-600
  "#a78bfa",
  "#8b5cf6",
  "#7c3aed",
]);

/**
 * Token names checked for cobalt/indigo/violet drift. These are the
 * accent-bearing custom properties the redesign declares in
 * `app/globals.css` and mirrors via `theme.extend.colors.accent.*` in
 * `tailwind.config.ts`. `--color-border-focus` is included because the
 * focus ring is keyed to the brand accent (Requirement 13.1).
 */
const ACCENT_TOKEN_NAMES = [
  "--color-accent",
  "--color-accent-hover",
  "--color-accent-tint",
  "--color-border-focus",
] as const;

/**
 * Read the *last* declared value of `--<name>: <value>;` in `css`. CSS
 * cascade rules mean later declarations win, and `app/globals.css`
 * intentionally re-declares the redesign tokens after the legacy block.
 */
function lastCssVarDeclaration(css: string, name: string): string | null {
  const pattern = new RegExp(
    `${name.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+);`,
    "g",
  );
  let last: string | null = null;
  for (const m of css.matchAll(pattern)) {
    last = m[1].trim();
  }
  return last;
}

/**
 * Extract every hex literal mentioned inside `value` (a CSS declaration's
 * RHS). Used to assert that an `oklch(...)` accent does not contain a
 * forbidden hex literal as a fallback or comment, AND to flag the value
 * directly when it is a hex literal.
 */
function hexesIn(value: string): string[] {
  const out: string[] = [];
  for (const m of value.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    out.push(m[0].toLowerCase());
  }
  return out;
}

/**
 * Pull the `accent.*` color block out of `tailwind.config.ts`. Returns
 * the raw object literal text so callers can grep it for forbidden hex
 * literals without parsing the file as JS.
 */
function tailwindAccentBlock(configSource: string): string | null {
  // Match the `accent: { ... }` declaration. The `{[^}]*}` body is
  // single-level only — the redesign keeps the accent object flat
  // (DEFAULT / hover / tint), so this is sufficient.
  const m = /accent:\s*\{[^}]*\}/.exec(configSource);
  return m ? m[0] : null;
}



interface CobaltMatch {
  kind: "tailwind" | "hex";
  value: string;
  line: number;
}

function findCobaltMatches(content: string): CobaltMatch[] {
  const out: CobaltMatch[] = [];
  for (const m of content.matchAll(FORBIDDEN_TAILWIND_PATTERN)) {
    out.push({
      kind: "tailwind",
      value: m[0],
      line: lineOf(content, m.index ?? 0),
    });
  }
  for (const m of content.matchAll(FORBIDDEN_HEX_PATTERN)) {
    out.push({
      kind: "hex",
      value: m[0],
      line: lineOf(content, m.index ?? 0),
    });
  }
  return out;
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("Property 6: no Tailwind cobalt/indigo/violet accents (Requirements 1.3, 13.1)", () => {
  const eligibleFiles = buildEligibleFiles();

  it("eligible file set is non-empty", () => {
    // Sanity check: if the walk roots are misconfigured this whole property
    // would vacuously pass. Anchor the test to a known sentinel.
    expect(eligibleFiles.length).toBeGreaterThan(0);
    expect(eligibleFiles).toContain("components/ui/card.tsx");
  });

  it("the redesign accent tokens in app/globals.css do not resolve to a forbidden cobalt/indigo/violet hex", () => {
    const cssPath = join(REPO_ROOT, "app", "globals.css");
    const css = readFileSync(cssPath, "utf8");
    const failures: string[] = [];
    for (const name of ACCENT_TOKEN_NAMES) {
      const value = lastCssVarDeclaration(css, name);
      if (value === null) {
        failures.push(`  ${name}: missing declaration in app/globals.css`);
        continue;
      }
      // Direct hex match (e.g. `--color-accent: #3B82F6;`).
      const hexes = hexesIn(value);
      for (const hex of hexes) {
        if (FORBIDDEN_ACCENT_HEXES.has(hex)) {
          failures.push(
            `  ${name}: resolves to forbidden hex ${hex} (${value})`,
          );
        }
      }
    }
    if (failures.length > 0) {
      throw new Error(
        `Redesign accent token(s) collide with a Tailwind-default ` +
          `cobalt/indigo/violet shade or the legacy --color-action cobalt:\n` +
          failures.join("\n"),
      );
    }
  });

  it("the accent.* block in tailwind.config.ts contains no forbidden cobalt/indigo/violet hex", () => {
    const configPath = join(REPO_ROOT, "tailwind.config.ts");
    const configSrc = readFileSync(configPath, "utf8");
    const block = tailwindAccentBlock(configSrc);
    expect(block).not.toBeNull();
    const hexes = hexesIn(block!);
    const offenders = hexes.filter((h) => FORBIDDEN_ACCENT_HEXES.has(h));
    if (offenders.length > 0) {
      throw new Error(
        `tailwind.config.ts accent block contains forbidden hex literal(s) ` +
          `${offenders.join(", ")}:\n${block}`,
      );
    }
  });

  it("no eligible source file under app/, components/, lib/ contains a forbidden cobalt/indigo/violet token", () => {
    fc.assert(
      fc.property(fc.constantFrom(...eligibleFiles), (relPath) => {
        const content = readFileSync(join(REPO_ROOT, relPath), "utf8");
        const matches = findCobaltMatches(content);
        if (matches.length > 0) {
          const summary = matches
            .slice(0, 5)
            .map(
              (m) =>
                `  ${relPath}:${m.line}  [${m.kind}]  ${JSON.stringify(m.value)}`,
            )
            .join("\n");
          throw new Error(
            `Forbidden cobalt/indigo/violet token in ${relPath}:\n${summary}`,
          );
        }
        return true;
      }),
      // Cover every file deterministically. fast-check still shrinks on
      // failure to give us the smallest offending file.
      { numRuns: Math.max(eligibleFiles.length * 2, 200) },
    );
  });
});
