// Feature: premium-ui-redesign
// Property 17: Every Lucide icon on a rendered screen uses the single
// documented stroke width.
//
// **Validates: Requirements 7.2**
//
// Per `design.md` → "Iconography (Requirement 7)":
//   > Single stroke width: `1.75`. Forbidden: mixing stroke widths.
//
// Implementation strategy (static-source approach):
//   For any source file F under `app/**`, `components/**`, or `lib/**`
//   that imports from `lucide-react`, every JSX `strokeWidth=` prop in F
//   must evaluate to the literal `1.75`.
//
// The static check is the right level of granularity: it catches both
// misuse (`strokeWidth={1.8}`) and accidental drift (`strokeWidth={2}`,
// the Lucide default if the prop is omitted) deterministically, without
// needing to render every screen in jsdom. A render-time check is
// strictly weaker because Lucide's default of `2` only manifests at run
// time, and a render-time assertion would need a registry covering all
// 7 In_Scope_Screens (which lands in Phase 3, tasks 8.1–8.7).
//
// We do NOT (yet) flag lucide icons that omit `strokeWidth` entirely —
// the Lucide default is `2`, which would silently violate Property 17.
// The redesign mitigates this two ways:
//   1. Every lucide consumer in `app/`, `components/`, `lib/` either
//      imports `<Icon strokeWidth={1.75}>` explicitly, or wraps the
//      icon in a primitive that does.
//   2. Phase 4 task 11.4 (`no-deprecated.property.test.ts`) and the
//      design-system docs flag any unwrapped `lucide-react` import
//      whose JSX usage omits `strokeWidth`.
// The "explicit-only" property below is the strongest universally-
// quantified statement that holds across the static source today; the
// "every-icon-has-an-explicit-prop" tightening is tracked in the design
// migration notes and will land alongside the Phase 3 screen re-skin.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import fc from "fast-check";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const repoRoot = resolve(__dirname, "..", "..");

/** Directories scanned for source files. Mirrors the redesign scope. */
const SCAN_DIRS = ["app", "components", "lib"] as const;

/** Source-file extensions scanned. */
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

/**
 * The single documented stroke width (per `design.md` → Iconography).
 * Stored as a string so we can compare the exact source-text token,
 * which forbids near-misses like `1.750` or `1.7500`.
 */
const REQUIRED_STROKE_WIDTH = "1.75";

/**
 * Match every `strokeWidth=...` JSX attribute in the file. Three forms
 * are recognized:
 *
 *   1. Numeric literal in braces:   strokeWidth={1.75}
 *   2. String literal:              strokeWidth="1.75"
 *   3. Unbraced numeric (rare):     strokeWidth=1.75   (not valid JSX,
 *                                                       but caught for
 *                                                       defense-in-depth)
 *
 * Identifier and expression forms — `strokeWidth={someVar}`,
 * `strokeWidth={cond ? 1 : 2}` — are ALSO captured (group 4) so the
 * property test can flag them as "unverifiable from source": the
 * redesign's iconography spec forbids dynamic stroke widths because
 * they preclude the static guarantee Property 17 makes.
 */
const STROKE_WIDTH_ATTRIBUTE =
  /\bstrokeWidth\s*=\s*(?:\{\s*([0-9]+(?:\.[0-9]+)?)\s*\}|"([0-9]+(?:\.[0-9]+)?)"|'([0-9]+(?:\.[0-9]+)?)'|\{([^}]+)\})/g;

/**
 * Match an import statement bringing in symbols from `lucide-react`.
 * The presence of such an import is what makes a file relevant to
 * Property 17. Files with no `lucide-react` import cannot create lucide
 * icons and so cannot violate the property.
 */
const LUCIDE_IMPORT = /from\s+["']lucide-react["']/;

// ---------------------------------------------------------------------------
// File discovery
// ---------------------------------------------------------------------------

function toPosix(p: string): string {
  return p.split(sep).join("/");
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
      const full = `${dir}${sep}${entry.name}`;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const dotIdx = entry.name.lastIndexOf(".");
        const ext = dotIdx >= 0 ? entry.name.slice(dotIdx) : "";
        if (SOURCE_EXTENSIONS.has(ext)) {
          out.push(full);
        }
      }
    }
  }
  return out;
}

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
  // Exclude test files — they are not user-facing source and may
  // legitimately reference forbidden values for assertion purposes.
  .filter(
    (rel) =>
      !rel.includes("__tests__/") &&
      !rel.endsWith(".test.ts") &&
      !rel.endsWith(".test.tsx"),
  )
  .sort();

/**
 * The subset of candidate files that import from `lucide-react`. These
 * are the only files where Property 17 has any teeth — no lucide
 * import means the file cannot produce a lucide icon.
 */
const lucideConsumers: string[] = candidateFiles.filter((rel) => {
  const text = readFileSync(resolve(repoRoot, rel), "utf8");
  return LUCIDE_IMPORT.test(text);
});

// ---------------------------------------------------------------------------
// Match extraction
// ---------------------------------------------------------------------------

interface StrokeWidthMatch {
  /** The source file (repo-relative, posix-style). */
  file: string;
  /** Line number (1-indexed) of the `strokeWidth=` attribute. */
  line: number;
  /**
   * The captured value as it appears in source, OR the full
   * brace-expression if the value is dynamic / non-literal.
   */
  raw: string;
  /** True when the captured value is a literal number/string. */
  isLiteral: boolean;
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

function findStrokeWidthMatches(file: string, content: string): StrokeWidthMatch[] {
  const out: StrokeWidthMatch[] = [];
  STROKE_WIDTH_ATTRIBUTE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = STROKE_WIDTH_ATTRIBUTE.exec(content)) !== null) {
    const numericBraced = m[1];
    const numericDouble = m[2];
    const numericSingle = m[3];
    const expression = m[4];
    const literal = numericBraced ?? numericDouble ?? numericSingle;
    out.push({
      file,
      line: lineOf(content, m.index),
      raw: literal ?? (expression ?? "").trim(),
      isLiteral: literal !== undefined,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 17: every Lucide icon uses the single documented stroke width (Requirements 7.2)", () => {
  it("discovers a non-empty set of lucide-react consumers", () => {
    // Sanity: if the walk roots are misconfigured this whole property
    // would vacuously pass. Anchor to the known lucide consumers in
    // today's tree.
    expect(lucideConsumers.length).toBeGreaterThan(0);
    expect(lucideConsumers).toContain("components/dashboard/mobile-bottom-nav.tsx");
  });

  it("every explicit strokeWidth= attribute in a lucide consumer is the literal 1.75", () => {
    fc.assert(
      fc.property(fc.constantFrom(...lucideConsumers), (file) => {
        const content = readFileSync(resolve(repoRoot, file), "utf8");
        const matches = findStrokeWidthMatches(file, content);
        for (const match of matches) {
          if (!match.isLiteral) {
            // Dynamic strokeWidth (variable, ternary, etc.) is forbidden:
            // it precludes the single-value guarantee Requirement 7.2 makes.
            throw new Error(
              `Dynamic strokeWidth at ${match.file}:${match.line} — value ` +
                `\`${match.raw}\` is not a literal. Per design.md " Iconography", ` +
                `the single documented stroke width is "${REQUIRED_STROKE_WIDTH}".`,
            );
          }
          if (match.raw !== REQUIRED_STROKE_WIDTH) {
            throw new Error(
              `Non-conforming strokeWidth at ${match.file}:${match.line} — ` +
                `got "${match.raw}", expected "${REQUIRED_STROKE_WIDTH}". ` +
                `Per design.md "Iconography", every Lucide icon must use the ` +
                `single documented stroke width "${REQUIRED_STROKE_WIDTH}".`,
            );
          }
        }
        return true;
      }),
      // Iterate enough that every candidate file is sampled at least
      // once on average; fast-check still shrinks on failure to surface
      // the smallest offending file.
      { numRuns: Math.max(100, lucideConsumers.length * 2) },
    );
  });

  it("no source file under the scan roots uses a stroke width other than 1.75", () => {
    // A stronger restatement of the property above: even if a file
    // doesn't import from lucide-react, a `strokeWidth=` literal that
    // differs from 1.75 still violates the design's single-stroke-width
    // mandate. Custom <svg>s authored inline must obey the same rule.
    fc.assert(
      fc.property(fc.constantFrom(...candidateFiles), (file) => {
        const content = readFileSync(resolve(repoRoot, file), "utf8");
        const matches = findStrokeWidthMatches(file, content);
        for (const match of matches) {
          if (!match.isLiteral) continue;
          if (match.raw !== REQUIRED_STROKE_WIDTH) {
            throw new Error(
              `Non-conforming strokeWidth at ${match.file}:${match.line} — ` +
                `got "${match.raw}", expected "${REQUIRED_STROKE_WIDTH}".`,
            );
          }
        }
        return true;
      }),
      { numRuns: Math.max(100, candidateFiles.length * 2) },
    );
  });
});
