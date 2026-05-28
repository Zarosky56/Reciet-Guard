// Feature: premium-ui-redesign — Phase 2 verification.
//
// Property 7: Contrast ratios meet WCAG 2.1 AA on every documented
// foreground/background pair.
//
// **Validates: Requirements 2.5, 11.1, 11.2**
//
// For any (foreground-token, background-token) pair P declared in the
// "Contrast verification" matrix in design.md, the relative-luminance
// contrast ratio of P must be ≥ the documented threshold:
//   - normal text  → ≥ 4.5:1   (WCAG 2.1 AA, Requirement 11.1)
//   - large text   → ≥ 3:1     (≥18px bold or ≥24px regular)
//   - UI / border  → ≥ 3:1     (Requirement 11.2)
//
// The test parses the redesigned `--color-*` tokens out of `app/globals.css`
// (the section after the "Premium redesign tokens — Phase 1 (task 2.1)"
// marker, mirroring the strategy used by `token-parity.property.test.ts`),
// converts each oklch() value to linear sRGB via the canonical Björn
// Ottosson transform, and computes the WCAG 2.1 contrast ratio directly
// from the linear values (the WCAG decode step is the inverse of the
// gamma-encode we would otherwise apply — so we skip the round trip).
//
// fast-check picks a pair from the documented set on every run; on failure
// it shrinks to the smallest counter-example, which gives us the offending
// pair name and the actual computed ratio.

import { readFileSync } from "node:fs";
import path from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// File-path constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GLOBALS_CSS_PATH = path.join(REPO_ROOT, "app", "globals.css");
const REDESIGN_MARKER = "Premium redesign tokens — Phase 1 (task 2.1)";

// ---------------------------------------------------------------------------
// OKLCH parsing
// ---------------------------------------------------------------------------

interface OkLch {
  l: number; // 0..1
  c: number; // chroma, ≥0
  h: number; // hue degrees
}

/**
 * Read `app/globals.css`, slice off the redesign section (everything after
 * the marker comment), and pull out every `--color-*: oklch(L C H);` line
 * into a name → OkLch map.
 *
 * The legacy block above the marker uses hex literals and is irrelevant to
 * Property 7 — those tokens are deleted in task 11.1.
 */
function readRedesignOklchTokens(): Map<string, OkLch> {
  const css = readFileSync(GLOBALS_CSS_PATH, "utf8");
  const markerIdx = css.indexOf(REDESIGN_MARKER);
  if (markerIdx === -1) {
    throw new Error(
      `Could not find redesign marker "${REDESIGN_MARKER}" in ${GLOBALS_CSS_PATH}. ` +
        `Property 7 anchors its OKLCH parsing to that marker; if it has been ` +
        `renamed, update both this file and token-parity.property.test.ts.`,
    );
  }
  const redesignSection = css.slice(markerIdx);

  // Match `  --color-name: oklch(L C H);` (ignoring extra whitespace, alpha).
  // Accept fractional values for L and C, accept negative H, ignore inline
  // alpha (`/ a`) since the redesign tokens never use it.
  const pattern =
    /--(color-[a-z-]+)\s*:\s*oklch\(\s*([0-9.]+)\s+([0-9.]+)\s+(-?[0-9.]+)\s*\)\s*;/g;

  const out = new Map<string, OkLch>();
  for (const m of redesignSection.matchAll(pattern)) {
    const [, name, lStr, cStr, hStr] = m;
    out.set(name, {
      l: Number(lStr),
      c: Number(cStr),
      h: Number(hStr),
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// OKLCH → linear sRGB (Björn Ottosson, https://bottosson.github.io/posts/oklab/)
// ---------------------------------------------------------------------------

interface LinearRgb {
  r: number;
  g: number;
  b: number;
}

function oklchToLinearRgb({ l: L, c, h }: OkLch): LinearRgb {
  // OKLCH → OKLab.
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLab → LMS (cube-rooted cone responses).
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const lCubed = l_ * l_ * l_;
  const mCubed = m_ * m_ * m_;
  const sCubed = s_ * s_ * s_;

  // LMS → linear sRGB.
  const r = 4.0767416621 * lCubed - 3.3077115913 * mCubed + 0.2309699292 * sCubed;
  const g = -1.2684380046 * lCubed + 2.6097574011 * mCubed - 0.3413193965 * sCubed;
  const blue = -0.0041960863 * lCubed - 0.7034186147 * mCubed + 1.707614701 * sCubed;

  // Clamp into [0, 1]. Values outside the sRGB gamut would otherwise produce
  // nonsensical luminance; in practice the redesign palette stays in-gamut so
  // this clamp is a guard rail for future token edits, not a routine path.
  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, blue)),
  };
}

// ---------------------------------------------------------------------------
// WCAG 2.1 relative luminance + contrast ratio
// ---------------------------------------------------------------------------

/**
 * WCAG 2.1 relative luminance for a color in *linear* sRGB. The standard
 * WCAG formula expects gamma-encoded sRGB and applies an inverse-gamma decode
 * before weighting; since `oklchToLinearRgb` already returns the linear-light
 * values, we apply the channel weights directly. (The two paths produce the
 * same number to floating-point precision.)
 */
function relativeLuminance({ r, g, b }: LinearRgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.1 contrast ratio between two colors. Order-independent.
 */
function contrastRatio(a: LinearRgb, b: LinearRgb): number {
  const lA = relativeLuminance(a);
  const lB = relativeLuminance(b);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Documented contrast pairs (design.md → "Contrast verification" table)
// ---------------------------------------------------------------------------

type PairKind = "text" | "ui" | "decorative";

interface DocumentedPair {
  name: string;
  fg: string; // CSS-token name (without leading `--`)
  bg: string;
  kind: PairKind;
  /** WCAG 2.1 AA threshold for this pair. */
  threshold: number;
}

const DOCUMENTED_PAIRS: ReadonlyArray<DocumentedPair> = [
  // Text on canvas/surface (Requirement 11.1, ≥4.5).
  {
    name: "text-primary on canvas",
    fg: "color-text-primary",
    bg: "color-canvas",
    kind: "text",
    threshold: 4.5,
  },
  {
    name: "text-secondary on canvas",
    fg: "color-text-secondary",
    bg: "color-canvas",
    kind: "text",
    threshold: 4.5,
  },
  {
    name: "text-secondary on surface",
    fg: "color-text-secondary",
    bg: "color-surface",
    kind: "text",
    threshold: 4.5,
  },
  {
    name: "text-muted on canvas",
    fg: "color-text-muted",
    bg: "color-canvas",
    // text-muted is documented in design.md → "Contrast verification" with
    // a "(decorative-only fallback to ≥3:1)" annotation, and Property 7's
    // own prose carves out an explicit exception: "with the exception of
    // text-muted which may be ≥3:1 when classified as decorative-only".
    // Honor that fallback here — text-muted is used for placeholders and
    // captions, never for primary reading content.
    kind: "decorative",
    threshold: 3,
  },
  // Accent used for primary CTAs / link text (Requirement 11.1, ≥4.5).
  {
    name: "accent on canvas",
    fg: "color-accent",
    bg: "color-canvas",
    kind: "text",
    threshold: 4.5,
  },
  {
    name: "accent on surface",
    fg: "color-accent",
    bg: "color-surface",
    kind: "text",
    threshold: 4.5,
  },
  // Focus ring / UI indicator (Requirement 11.2, ≥3).
  {
    name: "border-focus on canvas",
    fg: "color-border-focus",
    bg: "color-canvas",
    kind: "ui",
    threshold: 3,
  },
  {
    name: "border-focus on surface",
    fg: "color-border-focus",
    bg: "color-surface",
    kind: "ui",
    threshold: 3,
  },
];

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("Property 7: contrast ratios meet WCAG 2.1 AA (Requirements 2.5, 11.1, 11.2)", () => {
  const tokens = readRedesignOklchTokens();

  it("redesign OKLCH tokens are parsed from globals.css", () => {
    // Sanity check: if the parser failed silently the property below would
    // throw on every pair with the same "missing token" error and the
    // counter-example would be uninformative. Anchor on the canonical names.
    expect(tokens.has("color-canvas")).toBe(true);
    expect(tokens.has("color-surface")).toBe(true);
    expect(tokens.has("color-text-primary")).toBe(true);
    expect(tokens.has("color-text-secondary")).toBe(true);
    expect(tokens.has("color-text-muted")).toBe(true);
    expect(tokens.has("color-accent")).toBe(true);
    expect(tokens.has("color-border-focus")).toBe(true);
  });

  it("every documented foreground/background pair meets its WCAG 2.1 AA threshold", () => {
    fc.assert(
      fc.property(fc.constantFrom(...DOCUMENTED_PAIRS), (pair) => {
        const fgTok = tokens.get(pair.fg);
        const bgTok = tokens.get(pair.bg);
        if (!fgTok || !bgTok) {
          throw new Error(
            `Documented pair "${pair.name}" references an unknown token ` +
              `(fg=${pair.fg}, bg=${pair.bg}). The redesign palette must ` +
              `include both tokens.`,
          );
        }
        const fg = oklchToLinearRgb(fgTok);
        const bg = oklchToLinearRgb(bgTok);
        const ratio = contrastRatio(fg, bg);
        if (ratio < pair.threshold) {
          throw new Error(
            `Pair "${pair.name}" fails WCAG 2.1 AA: ratio ${ratio.toFixed(2)}:1 ` +
              `< required ${pair.threshold}:1 (kind=${pair.kind}).`,
          );
        }
        return true;
      }),
      // Cover every documented pair deterministically; fast-check still
      // shrinks on failure to surface the smallest offender.
      { numRuns: Math.max(DOCUMENTED_PAIRS.length * 4, 100) },
    );
  });

  // Note: design.md's "Contrast verification" table publishes one-decimal
  // numbers (e.g. 16.8:1, 7.4:1) computed during the design phase. The task
  // brief explicitly says we should "not match the documented number
  // exactly — small drift is fine as long as the threshold is met." The
  // property above is the binding correctness check; we do not pin the
  // exact ratio here.
});
