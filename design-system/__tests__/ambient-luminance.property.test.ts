// Feature: premium-ui-redesign — Phase 2 verification.
//
// Property 18 — The hero ambient layer is at most 8% lighter than the canvas
// and uses no perceptible gradient stop.
// Validates: Requirements 13.9
//
// Requirement 13.9 (verbatim):
//   WHERE an ambient atmospheric layer is used at the page level (e.g. a
//   subtle background shift), THE layer SHALL be a single tonal element
//   no more than 8% lighter than the canvas, SHALL NOT contain a
//   perceptible gradient stop or center, and SHALL NOT be layered with
//   a grid or noise mesh.
//
// Property 18 (design.md → "Property 18", verbatim):
//   For any render of `<AmbientBackground variant="hero" />`, the computed
//   background-color of the tonal band, expressed in OKLCH L, is at most
//   0.08 greater than `--color-canvas`'s L; and the computed
//   `background-image` is either `none` or a single-color `mask-image`
//   with no `linear-gradient` containing more than two stops with
//   differing hues, no `radial-gradient`, and no `conic-gradient`.
//
// Note on the "8% lighter" wording. Requirements.md phrases the cap as a
// percentage. design.md operationalizes it as an ABSOLUTE delta in OKLCH
// L: `L_raised - L_canvas <= 0.08`. The design document is the authoritative
// formalization for property tests, so this test uses the absolute-Δ
// interpretation. Under that rule the redesign tokens
// (`--color-canvas: oklch(0.13 ...)`, `--color-canvas-raised: oklch(0.16 ...)`)
// give Δ = 0.03, well under the 0.08 cap.
//
// Two universally-quantified checks make up the property:
//
//   (A) Token check — over any rendered hero band, the L of the band's
//       fill (which equals `--color-canvas-raised` because the component
//       paints `bg-canvas-raised`) is at most 0.08 greater than the L of
//       `--color-canvas`. Quantification ranges over the documented
//       viewport widths so the reader sees the universal-render shape;
//       the band does not vary by viewport, so the assertion factors
//       through to a single check on the tokens themselves.
//
//   (B) Gradient-shape check — over the source of
//       `components/visual/ambient-background.tsx`, no `radial-gradient`
//       or `conic-gradient` appears anywhere, and any `linear-gradient`
//       appears only as the value of a CSS `mask-image` /
//       `WebkitMaskImage` declaration (not on `background` or
//       `backgroundImage` / `background-image`). The single allowed
//       linear-gradient drives opacity via the alpha mask only — the
//       painted color is the flat `bg-canvas-raised` fill, with no
//       perceptible stop or center in the visible color.

import { readFileSync } from "node:fs";
import path from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

import { arbViewport } from "./_arbitraries";

// ---------------------------------------------------------------------------
// File-path constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const GLOBALS_CSS_PATH = path.join(REPO_ROOT, "app", "globals.css");
const AMBIENT_SOURCE_PATH = path.join(
  REPO_ROOT,
  "components",
  "visual",
  "ambient-background.tsx",
);
const REDESIGN_MARKER = "Premium redesign tokens — Phase 1 (task 2.1)";

// The Property 18 absolute-Δ cap on OKLCH L.
const MAX_L_DELTA = 0.08;

// ---------------------------------------------------------------------------
// OKLCH parsing
// ---------------------------------------------------------------------------

/**
 * Parse the L (lightness) channel from an `oklch(L C H[ / A])` literal. The
 * redesign canvas tokens are written as `oklch(0.13 0.005 270)` etc. — three
 * whitespace-separated components, no slash alpha. Returns the L value as a
 * number in [0, 1]. Throws on a malformed literal (the test fails loudly
 * rather than silently treating a parse error as a passing case).
 */
function parseOklchL(literal: string): number {
  const trimmed = literal.trim();
  const m = /^oklch\(\s*([0-9]*\.?[0-9]+)\s+/.exec(trimmed);
  if (!m) {
    throw new Error(
      `expected oklch(L C H ...) literal, got ${JSON.stringify(literal)}`,
    );
  }
  const L = Number(m[1]);
  if (!Number.isFinite(L) || L < 0 || L > 1) {
    throw new Error(
      `parsed L value ${L} from ${JSON.stringify(literal)} is outside [0, 1]`,
    );
  }
  return L;
}

/**
 * Read the redesign section of `:root` in `app/globals.css` and pull the
 * declared value of a single `--color-*` custom property. The redesign
 * section starts at the marker comment so we don't accidentally pick up
 * the legacy hex/rgba block above it (which redeclares some names with
 * different values and is removed in task 11.1).
 */
function readRedesignTokenValue(css: string, varName: string): string {
  const markerIdx = css.indexOf(REDESIGN_MARKER);
  if (markerIdx < 0) {
    throw new Error(
      `app/globals.css is missing the redesign-section marker "${REDESIGN_MARKER}"`,
    );
  }
  const redesignSection = css.slice(markerIdx);
  // Match `--color-canvas: <value>;` (last declaration wins, mirroring the cascade).
  const re = new RegExp(
    `${varName.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+);`,
    "g",
  );
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(redesignSection)) !== null) last = m;
  if (!last) {
    throw new Error(
      `app/globals.css redesign section does not declare ${varName}`,
    );
  }
  return last[1].trim();
}

// ---------------------------------------------------------------------------
// Source-shape inspection
// ---------------------------------------------------------------------------

interface GradientFinding {
  /** Kind of forbidden gradient. */
  kind: "radial-gradient" | "conic-gradient" | "linear-gradient-on-background";
  /** 1-indexed line number of the offending occurrence. */
  line: number;
  /** A short slice of the offending line for the error message. */
  excerpt: string;
}

const FORBIDDEN_RADIAL = /\bradial-gradient\s*\(/g;
const FORBIDDEN_CONIC = /\bconic-gradient\s*\(/g;

/**
 * Match every `linear-gradient(...)` occurrence with the surrounding ~80
 * characters of left context. This lets us decide whether the gradient is
 * being used as a `mask-image` (allowed — the alpha-fade in
 * `HERO_BAND_MASK_STYLE`) or as a paint on `background` / `backgroundImage`
 * (forbidden by Property 18).
 */
const LINEAR_GRADIENT_WITH_CONTEXT = /([\s\S]{0,80})\blinear-gradient\s*\(/g;

/**
 * Predicate: does the left-context of a `linear-gradient(...)` occurrence
 * indicate that the value is being assigned to a CSS `mask-image` /
 * `-webkit-mask-image` / `WebkitMaskImage` / `maskImage` property?
 *
 * Two surface forms must be recognised:
 *   - inline style object — `maskImage: "linear-gradient(...)"` —
 *     the character immediately before `linear-gradient` is the opening
 *     quote (`"` or `'`), so the matcher allows an optional quote at the
 *     end of the context.
 *   - CSS rule — `mask-image: linear-gradient(...)` — the character
 *     immediately before `linear-gradient` is whitespace.
 *
 * The matcher anchors at the end of the captured left context (`$` with
 * no `m` flag = end of input) so `maskImage:` must be the most recent
 * property declaration before the gradient.
 */
function isMaskImageAssignment(leftContext: string): boolean {
  return /(maskImage|WebkitMaskImage|mask-image|-webkit-mask-image)\s*:\s*["']?\s*$/.test(
    leftContext,
  );
}

function lineNumberAt(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

function extractLine(text: string, offset: number): string {
  const start = text.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
  const end = text.indexOf("\n", offset);
  return text.slice(start, end < 0 ? text.length : end).trim();
}

/**
 * Scan the AmbientBackground source for forbidden gradient shapes:
 *   - any `radial-gradient(...)`
 *   - any `conic-gradient(...)`
 *   - any `linear-gradient(...)` NOT assigned to a `mask-image` /
 *     `WebkitMaskImage` property (i.e. used as a visible-color paint).
 */
function findForbiddenGradients(source: string): GradientFinding[] {
  const findings: GradientFinding[] = [];

  for (const m of source.matchAll(FORBIDDEN_RADIAL)) {
    const offset = m.index ?? 0;
    findings.push({
      kind: "radial-gradient",
      line: lineNumberAt(source, offset),
      excerpt: extractLine(source, offset),
    });
  }

  for (const m of source.matchAll(FORBIDDEN_CONIC)) {
    const offset = m.index ?? 0;
    findings.push({
      kind: "conic-gradient",
      line: lineNumberAt(source, offset),
      excerpt: extractLine(source, offset),
    });
  }

  for (const m of source.matchAll(LINEAR_GRADIENT_WITH_CONTEXT)) {
    const leftContext = m[1];
    if (isMaskImageAssignment(leftContext)) continue;
    // Compute the offset of the actual `linear-gradient` keyword (the
    // match starts at the beginning of the captured left context).
    const offset = (m.index ?? 0) + leftContext.length;
    findings.push({
      kind: "linear-gradient-on-background",
      line: lineNumberAt(source, offset),
      excerpt: extractLine(source, offset),
    });
  }

  return findings;
}

// ---------------------------------------------------------------------------
// One-shot loads
// ---------------------------------------------------------------------------

const cssText = readFileSync(GLOBALS_CSS_PATH, "utf-8");
const ambientSource = readFileSync(AMBIENT_SOURCE_PATH, "utf-8");

const canvasLiteral = readRedesignTokenValue(cssText, "--color-canvas");
const canvasRaisedLiteral = readRedesignTokenValue(
  cssText,
  "--color-canvas-raised",
);
const L_canvas = parseOklchL(canvasLiteral);
const L_canvasRaised = parseOklchL(canvasRaisedLiteral);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 18 — ambient-band luminance and gradient shape (Requirement 13.9)", () => {
  it("parses the redesign canvas tokens out of app/globals.css (parser sanity)", () => {
    // If parsing breaks, every subsequent assertion would be vacuous — pin
    // expected token shapes here so a future edit to the CSS that reformats
    // the literal surfaces as a clear failure.
    expect(canvasLiteral.startsWith("oklch(")).toBe(true);
    expect(canvasRaisedLiteral.startsWith("oklch(")).toBe(true);
    expect(L_canvas).toBeGreaterThan(0);
    expect(L_canvasRaised).toBeGreaterThan(0);
    expect(L_canvasRaised).toBeGreaterThanOrEqual(L_canvas);
  });

  it("for any rendered hero band at any documented viewport width, L(band) - L(canvas) <= 0.08 (Property 18, token check)", () => {
    fc.assert(
      fc.property(arbViewport(), (width) => {
        // The hero band paints `bg-canvas-raised` — a flat fill driven
        // entirely by the `--color-canvas-raised` token. The band does
        // not vary by viewport (height is capped at 320px and the fill
        // is uniform), so the universal quantification over viewport
        // widths factors through to the same token check on every run.
        // Including the viewport in the property keeps the universal-
        // render shape readable and lets fast-check shrink failures to
        // the smallest counterexample width if a future edit ever makes
        // the band viewport-dependent.
        void width;
        const delta = L_canvasRaised - L_canvas;
        if (delta > MAX_L_DELTA) {
          throw new Error(
            `hero ambient band is too light: ` +
              `L(--color-canvas-raised) - L(--color-canvas) = ` +
              `${L_canvasRaised.toFixed(4)} - ${L_canvas.toFixed(4)} = ` +
              `${delta.toFixed(4)}, exceeds the ${MAX_L_DELTA} cap from ` +
              `Property 18 / Requirement 13.9. Lower the L of ` +
              `--color-canvas-raised in app/globals.css.`,
          );
        }
        return true;
      }),
      // Cover every documented viewport width at least once.
      { numRuns: 25 },
    );
  });

  it("the AmbientBackground source contains no forbidden gradient shape (Property 18, gradient-shape check)", () => {
    const findings = findForbiddenGradients(ambientSource);
    if (findings.length > 0) {
      const summary = findings
        .slice(0, 5)
        .map(
          (f) =>
            `  components/visual/ambient-background.tsx:${f.line}  [${f.kind}]  ${JSON.stringify(f.excerpt)}`,
        )
        .join("\n");
      throw new Error(
        `Property 18: AmbientBackground must not paint any radial-gradient, ` +
          `conic-gradient, or visible-color linear-gradient. Found:\n${summary}\n` +
          `The only allowed gradient is a single linear-gradient assigned to ` +
          `mask-image / WebkitMaskImage, which drives opacity, not color.`,
      );
    }
    expect(findings).toHaveLength(0);
  });

  it("the only linear-gradient in AmbientBackground is on a mask-image declaration (positive verification of the allowed shape)", () => {
    // Companion check: confirm that the component actually does fade via
    // `mask-image: linear-gradient(...)`. This guards against a future edit
    // that deletes the mask entirely (which would technically pass the
    // "no forbidden gradient" check above but would also delete the
    // single-tonal-band intent of `variant="hero"`).
    const allLinearGradients = [
      ...ambientSource.matchAll(LINEAR_GRADIENT_WITH_CONTEXT),
    ];
    expect(
      allLinearGradients.length,
      "AmbientBackground source contains no linear-gradient at all — the hero band should fade out via a single mask-image: linear-gradient(...) declaration",
    ).toBeGreaterThan(0);
    for (const m of allLinearGradients) {
      expect(
        isMaskImageAssignment(m[1]),
        `linear-gradient at line ${lineNumberAt(ambientSource, (m.index ?? 0) + m[1].length)} is not assigned to a mask-image property — Property 18 forbids visible-color gradients on the ambient band`,
      ).toBe(true);
    }
  });
});
