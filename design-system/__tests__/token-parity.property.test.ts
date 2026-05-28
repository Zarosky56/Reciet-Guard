// Feature: premium-ui-redesign — Phase 1 verification.
//
// Property 1 — Color-token parity.
// Validates: Requirements 2.2, 2.3
//
// Requirement 2.2 — Every color token MUST be defined in BOTH `tailwind.config.ts`
// (under `theme.extend.colors`) and as a CSS custom property on `:root` in
// `app/globals.css`, and the two SHALL agree exactly.
// Requirement 2.3 — Updates SHALL touch both locations or be rejected.
//
// Approach (see tasks.md → 3.1):
//   1. Parse `app/globals.css` for every `--color-*` declaration in `:root`
//      AFTER the marker comment "Premium redesign tokens — Phase 1 (task 2.1)".
//      This isolates the redesigned tokens from the legacy block above so the
//      test is meaningful for the new system; legacy tokens (`--color-bg`,
//      `--color-action`, etc.) live above the marker, are slated for deletion
//      in task 11.1, and have no Tailwind mapping in the redesigned theme.
//   2. Parse `tailwind.config.ts` (via the imported config object) and extract
//      every leaf entry under `theme.extend.colors` whose VALUE matches
//      `var(--color-*)`. This naturally excludes the legacy hex/rgba entries
//      (`bg`, `bg-elevated`, `surface-elevated`, `action`, `action-strong`,
//      `action-soft`, `action-glow`) and yields the redesign keys only.
//      Nested objects with a `DEFAULT` key flatten to the parent key (e.g.
//      `border.DEFAULT → border`, `border.strong → border-strong`).
//   3. The "property" — drawn over the UNION of both name sets — is that every
//      name appears in BOTH sources AND that the Tailwind value is exactly
//      `var(--color-${name})`.
//
// Choice on legacy tokens (per tasks.md note): they are EXCLUDED from the
// parity check by anchoring CSS parsing at the redesign-section marker and by
// filtering Tailwind to only `var(--color-*)`-valued entries. Both filters are
// necessary; either alone would surface noise from the deprecated palette.

import { readFileSync } from "node:fs";
import path from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import tailwindConfig from "../../tailwind.config";

// ---------------------------------------------------------------------------
// File-path constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GLOBALS_CSS_PATH = path.join(REPO_ROOT, "app", "globals.css");
const REDESIGN_MARKER = "Premium redesign tokens — Phase 1 (task 2.1)";

// ---------------------------------------------------------------------------
// CSS parsing — extract `--color-*` from the redesign section of `:root`
// ---------------------------------------------------------------------------

/** Extract the body (between braces) of the first `:root { ... }` block. */
function extractRootBody(css: string): string {
  const rootIdx = css.indexOf(":root");
  if (rootIdx < 0) {
    throw new Error("app/globals.css does not contain a `:root` block");
  }
  const braceStart = css.indexOf("{", rootIdx);
  if (braceStart < 0) {
    throw new Error("app/globals.css `:root` block is missing an opening brace");
  }
  let depth = 1;
  let i = braceStart + 1;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }
  if (depth !== 0) {
    throw new Error("app/globals.css `:root` block has unbalanced braces");
  }
  return css.slice(braceStart + 1, i);
}

/**
 * Parse every `--color-*: <value>;` declaration from the redesign section
 * (everything after the redesign marker comment) of `:root`.
 *
 * @returns Map keyed by the full CSS variable name (e.g. `--color-canvas`)
 *          with the trimmed declaration value.
 */
function parseRedesignColorTokens(css: string): Map<string, string> {
  const rootBody = extractRootBody(css);
  const markerOffset = rootBody.indexOf(REDESIGN_MARKER);
  if (markerOffset < 0) {
    throw new Error(
      `app/globals.css :root block is missing the redesign marker "${REDESIGN_MARKER}"`,
    );
  }
  const redesignSection = rootBody.slice(markerOffset);

  const map = new Map<string, string>();
  const declRegex = /(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = declRegex.exec(redesignSection)) !== null) {
    // Last declaration wins, mirroring the CSS cascade.
    map.set(match[1], match[2].trim());
  }
  return map;
}

// ---------------------------------------------------------------------------
// Tailwind parsing — extract leaf entries whose value is `var(--color-*)`
// ---------------------------------------------------------------------------

const VAR_COLOR_REGEX = /^var\((--color-[a-z0-9-]+)\)$/;

/**
 * Walk `theme.extend.colors` and return a Map from flat Tailwind key to the
 * CSS-variable name it references. Nested keys named `DEFAULT` flatten to
 * the parent key, matching Tailwind's class-generation behavior:
 *
 *   { border: { DEFAULT: "var(--color-border)", strong: "var(--color-border-strong)" } }
 *
 * yields:
 *
 *   border         → --color-border
 *   border-strong  → --color-border-strong
 *
 * Entries whose value is NOT `var(--color-*)` (e.g. legacy hex/rgba literals
 * like `bg: "#08080C"` or `action-soft: "rgba(...)"`) are skipped — they live
 * outside the redesign-token system and are deleted in task 11.
 */
function extractTailwindColorTokens(
  colors: Record<string, unknown>,
): Map<string, string> {
  const out = new Map<string, string>();

  function visit(value: unknown, flatKey: string): void {
    if (typeof value === "string") {
      const m = VAR_COLOR_REGEX.exec(value.trim());
      if (m && flatKey !== "") {
        out.set(flatKey, m[1]);
      }
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        const nextKey =
          childKey === "DEFAULT"
            ? flatKey
            : flatKey === ""
              ? childKey
              : `${flatKey}-${childKey}`;
        visit(childValue, nextKey);
      }
    }
  }

  for (const [topKey, topValue] of Object.entries(colors)) {
    visit(topValue, topKey);
  }
  return out;
}

function readTailwindColorMap(): Record<string, unknown> {
  const extend = tailwindConfig.theme?.extend as
    | { colors?: Record<string, unknown> }
    | undefined;
  if (!extend?.colors) {
    throw new Error("tailwind.config.ts is missing `theme.extend.colors`");
  }
  return extend.colors;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 1 — color-token parity (globals.css ⇄ tailwind.config.ts)", () => {
  // Parse both sources once for the whole suite.
  const cssText = readFileSync(GLOBALS_CSS_PATH, "utf-8");
  const cssTokens = parseRedesignColorTokens(cssText);
  const tailwindTokens = extractTailwindColorTokens(readTailwindColorMap());

  // Reduce each side to a flat name set (strip the `--color-` prefix on the
  // CSS side so the two sets are directly comparable).
  const cssNames = new Set<string>(
    [...cssTokens.keys()].map((v) => v.replace(/^--color-/, "")),
  );
  const tailwindNames = new Set<string>(tailwindTokens.keys());
  const unionNames = new Set<string>([...cssNames, ...tailwindNames]);

  it("the union of redesign color-token names is non-empty (sanity check on the parsers)", () => {
    expect(unionNames.size, "no redesign color tokens were extracted").toBeGreaterThan(0);
    expect(cssNames.size, "globals.css redesign section yielded zero --color-* tokens").toBeGreaterThan(0);
    expect(tailwindNames.size, "tailwind.config.ts yielded zero var(--color-*) entries").toBeGreaterThan(0);
  });

  it("for every name in either source, the same name is declared in BOTH globals.css and tailwind.config.ts (Requirement 2.2)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...unionNames), (name) => {
        expect(
          cssNames.has(name),
          `name "${name}" is referenced by tailwind.config.ts but no --color-${name} is declared in app/globals.css redesign section`,
        ).toBe(true);
        expect(
          tailwindNames.has(name),
          `name "${name}" is declared as --color-${name} in app/globals.css but is not exposed under theme.extend.colors in tailwind.config.ts (or its value is not var(--color-${name}))`,
        ).toBe(true);
      }),
      { numRuns: unionNames.size * 4 },
    );
  });

  it("every tailwind value of the form var(--color-X) references a CSS custom property declared in globals.css, and the X matches the flat tailwind key (Requirement 2.3)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...tailwindNames), (name) => {
        const tailwindVar = tailwindTokens.get(name);
        expect(tailwindVar, `internal: tailwindTokens missing key ${name}`).toBeDefined();
        // The CSS variable referenced must match the flat key by construction:
        // tailwind key "border-strong" → var(--color-border-strong).
        expect(
          tailwindVar,
          `tailwind key "${name}" maps to ${tailwindVar}, expected var(--color-${name})`,
        ).toBe(`--color-${name}`);
        // And that variable must actually be declared in globals.css.
        expect(
          cssTokens.has(tailwindVar as string),
          `tailwind references ${tailwindVar} but no such custom property is declared in app/globals.css redesign section`,
        ).toBe(true);
      }),
      { numRuns: tailwindNames.size * 4 },
    );
  });
});
