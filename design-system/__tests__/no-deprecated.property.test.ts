// Feature: premium-ui-redesign, Property 4: Deprecated classes and
// keyframes are absent from the codebase.
//
// Validates: Requirements 5.5, 5.6, 5.7, 6.7, 8.6, 13.4, 13.5, 13.6,
//            14.3, 14.4
//
// Property (verbatim from `design.md` → "Property 4"):
//   For any deprecated identifier N in the deprecation set, no file in
//   the live codebase (under `app/`, `components/`, `lib/`,
//   `tailwind.config.ts`, or `app/globals.css`) contains a textual
//   occurrence of N — neither as a class name, nor as a keyframe
//   definition, nor as a component import or JSX usage.
//
// The deprecated identifiers fall into four categories that map to the
// Phase-4 cleanup tasks (11.1, 11.2, 11.3) and to the requirements they
// validate:
//
//   1. Deprecated CSS classes (Tasks 11.1, Requirements 5.5, 5.6, 5.7,
//      13.4, 13.6, 14.3) — `border-conic-soft`, `bg-scene-hero`,
//      `bg-scene-auth`, `bg-aurora-action`, `bg-aurora-soft`,
//      `bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`,
//      `text-gradient-primary`, `text-gradient-action`,
//      `bg-card-elevated`.
//   2. Deprecated keyframes (Task 11.2, Requirements 6.7, 8.6, 14.4) —
//      `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`,
//      `shimmer`, `fade-in-up`, `pulse-red`.
//   3. Deprecated shadow tokens (Task 11.2, Requirements 5.2, 5.3,
//      8.6, 14.4) — `shadow-card-sm`, `shadow-card-lift`,
//      `shadow-glow-action`, `shadow-glow-soft`, `shadow-inner-hair`,
//      `shadow-toast`.
//   4. Deprecated component exports (Task 11.3, Requirements 6.7, 8.6,
//      14.4) — `FadeIn`, `Stagger`, `StaggerItem`, `HoverLift`,
//      `ButtonLoader`, `ScanGlyph`.
//
// ---------------------------------------------------------------------------
// Comment-handling
// ---------------------------------------------------------------------------
//
// Phase-4 migration notes legitimately mention these identifiers in
// JSDoc and inline comments to explain *why* a file no longer uses
// them (e.g. `* Removed the <FadeIn> page-level entrance animation.`).
// A naive textual scan would flag every such note as a violation. The
// property test strips comments before scanning so only live code is
// checked. The strip step is deliberately conservative — it removes
// `/* … */` block comments, `// …` line comments, and JSX-level
// `{/* … */}` comments, leaving string literals and template literals
// untouched. A deprecated identifier appearing inside a string literal
// (e.g. a className, JSX attribute value, or import path) is still a
// violation and is correctly flagged.
//
// ---------------------------------------------------------------------------
// Domain & exclusions
// ---------------------------------------------------------------------------
//
// The walk roots match Property 4's documented scope: the live
// application source under `app/`, `components/`, `lib/`, plus the two
// token-source files `tailwind.config.ts` and `app/globals.css`. The
// `design-system/__tests__/**` directory is excluded — these property
// tests reference the deprecated names as detection regexes (the
// catalogue lives in `_arbitraries`-style enumerations, not as live
// code), and including them would create a self-referential loop where
// the very rule that enforces the ban becomes a violation of itself.

import fc from "fast-check";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Repository layout
// ---------------------------------------------------------------------------

const REPO_ROOT = join(__dirname, "..", "..");

/**
 * Directory roots that are walked recursively. Files inside these
 * roots are subject to the deprecated-identifier ban.
 */
const WALK_ROOTS = ["app", "components", "lib"] as const;

/**
 * Single token-source files that are scanned in addition to the
 * recursive walk. `tailwind.config.ts` is the keyframe / shadow
 * source of truth; `app/globals.css` is the CSS-class source of
 * truth.
 */
const EXTRA_FILES = [
  "tailwind.config.ts",
  "app/globals.css",
] as const;

/**
 * File extensions scanned by the recursive walk. CSS files are
 * included because deprecated classes were originally declared in
 * `app/globals.css` and the cleanup task (11.1) deletes them — the
 * test must catch a regression where one is re-introduced as a `.css`
 * declaration.
 */
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
 * Directory names skipped during the recursive walk. The
 * `__tests__` exclusion is the substantive one — those property
 * tests legitimately reference deprecated names as detection
 * regexes. The remaining names are build/cache artefacts.
 */
const SKIP_DIRS = new Set([
  "__tests__",
  "node_modules",
  ".next",
  ".turbo",
  ".vercel",
  "dist",
  "out",
  "coverage",
  "build",
]);

// ---------------------------------------------------------------------------
// Deprecated identifier catalogue
// ---------------------------------------------------------------------------

/**
 * Deprecated CSS classes (Phase 4, task 11.1). Removed from
 * `app/globals.css` and from `theme.extend.backgroundImage` in
 * `tailwind.config.ts`. Validates Requirements 5.5, 5.6, 5.7, 13.4,
 * 13.6, 14.3.
 */
const DEPRECATED_CSS_CLASSES = [
  "border-conic-soft",
  "bg-scene-hero",
  "bg-scene-auth",
  "bg-aurora-action",
  "bg-aurora-soft",
  "bg-grid-faint",
  "mask-fade-radial",
  "mask-fade-bottom",
  "text-gradient-primary",
  "text-gradient-action",
  "bg-card-elevated",
] as const;

/**
 * Deprecated keyframes (Phase 4, task 11.2). Removed from
 * `theme.extend.keyframes` and from `theme.extend.animation` in
 * `tailwind.config.ts`. Validates Requirements 6.7, 8.6, 14.4.
 *
 * Note: `loader-step` deliberately does *not* match `loader-rail` —
 * each name is enumerated explicitly so the matcher's word-boundary
 * pattern (below) cannot collapse two identifiers into one.
 */
const DEPRECATED_KEYFRAMES = [
  "ledger-scan",
  "loader-rail",
  "loader-step",
  "glow-pulse",
  "shimmer",
  "fade-in-up",
  "pulse-red",
] as const;

/**
 * Deprecated shadow tokens (Phase 4, task 11.2). Removed from
 * `theme.extend.boxShadow` in `tailwind.config.ts`. Only
 * `shadow-overlay` survives. Validates Requirements 5.2, 5.3, 8.6,
 * 14.4.
 */
const DEPRECATED_SHADOWS = [
  "shadow-card-sm",
  "shadow-card-lift",
  "shadow-glow-action",
  "shadow-glow-soft",
  "shadow-inner-hair",
  "shadow-toast",
] as const;

/**
 * Deprecated component exports (Phase 4, task 11.3). The legacy
 * motion shims (`FadeIn`, `Stagger`, `StaggerItem`, `HoverLift`)
 * and the legacy loader shim (`ButtonLoader`) were deleted from
 * `components/motion/motion-primitives.tsx` and
 * `components/ui/loaders.tsx`. `ScanGlyph` was removed in task 5.3.
 * Validates Requirements 6.7, 8.6, 14.4.
 *
 * These names are matched as whole-word identifiers, so substrings
 * inside longer names (`StaggerItem` vs `Stagger`) are checked
 * independently and the more specific name is enumerated explicitly.
 */
const DEPRECATED_EXPORTS = [
  "FadeIn",
  "Stagger",
  "StaggerItem",
  "HoverLift",
  "ButtonLoader",
  "ScanGlyph",
] as const;

/**
 * The fixed enumerated deprecation set. Each entry pairs an
 * identifier with the kind of match the textual scan should perform
 * — "kebab" identifiers (CSS classes, keyframes, shadow utilities)
 * use a non-alphanumeric / non-dash boundary so `bg-grid-faint`
 * cannot match the redesigned `border-border-strong`; "ident"
 * identifiers (component exports) use a JS word boundary so
 * `Stagger` cannot match `Staggered` or `MyStagger`.
 */
type DeprecatedKind = "kebab" | "ident";
interface DeprecatedIdentifier {
  name: string;
  kind: DeprecatedKind;
  category: string;
}

const DEPRECATED_IDENTIFIERS: ReadonlyArray<DeprecatedIdentifier> = [
  ...DEPRECATED_CSS_CLASSES.map((name) => ({
    name,
    kind: "kebab" as const,
    category: "css-class",
  })),
  ...DEPRECATED_KEYFRAMES.map((name) => ({
    name,
    kind: "kebab" as const,
    category: "keyframe",
  })),
  ...DEPRECATED_SHADOWS.map((name) => ({
    name,
    kind: "kebab" as const,
    category: "shadow",
  })),
  ...DEPRECATED_EXPORTS.map((name) => ({
    name,
    kind: "ident" as const,
    category: "export",
  })),
];

// ---------------------------------------------------------------------------
// Comment stripping
// ---------------------------------------------------------------------------

/**
 * Strip block comments (`/* … *\/`), line comments (`// …`), and JSX
 * comment expressions (`{/* … *\/}`) from `source`, replacing each
 * comment with a run of spaces of equal length so character offsets
 * (and therefore line numbers) are preserved for diagnostics.
 *
 * Strings, template literals, and regex literals are left untouched
 * — a deprecated identifier appearing inside a string literal (e.g.
 * a className, JSX prop value, import specifier) is still a real
 * code reference and must be flagged.
 *
 * The state machine handles the four lexical contexts that can
 * legitimately contain `//` or `/*` without starting a comment:
 *   - inside a single-quoted string `'…'`,
 *   - inside a double-quoted string `"…"`,
 *   - inside a backtick template `\`…\``,
 *   - inside a regex literal `/…/flags` (only entered when the
 *     preceding non-whitespace character makes a regex syntactically
 *     valid in TypeScript / JavaScript).
 *
 * For `.css` input the regex-literal branch is unreachable because
 * the heuristic that opens it requires a JS-level operator context.
 * That is fine — CSS comments are only `/* … *\/` and the block-
 * comment branch handles them.
 */
function stripComments(source: string): string {
  const out: string[] = [];
  let i = 0;
  const n = source.length;

  type Mode =
    | "code"
    | "lineComment"
    | "blockComment"
    | "singleString"
    | "doubleString"
    | "template";
  let mode: Mode = "code";

  /**
   * Track whether the most-recent non-whitespace, non-comment
   * character could legally precede a regex literal. After an
   * identifier or numeric literal a `/` is division; after `=`,
   * `(`, `,`, `;`, `:`, `!`, `&`, `|`, `?`, `{`, `}`, `[`,
   * `return`, etc. it is the start of a regex.
   */
  let regexAllowed = true;

  /** Substrate-mode look-back: what terminator closes the active context. */
  while (i < n) {
    const ch = source[i];
    const next = i + 1 < n ? source[i + 1] : "";

    switch (mode) {
      case "code": {
        if (ch === "/" && next === "/") {
          mode = "lineComment";
          out.push("  ");
          i += 2;
          continue;
        }
        if (ch === "/" && next === "*") {
          mode = "blockComment";
          out.push("  ");
          i += 2;
          continue;
        }
        if (ch === "'") {
          mode = "singleString";
          out.push(ch);
          regexAllowed = false;
          i += 1;
          continue;
        }
        if (ch === '"') {
          mode = "doubleString";
          out.push(ch);
          regexAllowed = false;
          i += 1;
          continue;
        }
        if (ch === "`") {
          mode = "template";
          out.push(ch);
          regexAllowed = false;
          i += 1;
          continue;
        }
        if (ch === "/" && regexAllowed) {
          // Tentatively a regex literal. Scan ahead until an
          // unescaped closing `/`. Be conservative: if the scan
          // hits a newline, abandon the regex hypothesis and treat
          // the `/` as division (a regex literal cannot span
          // lines in JavaScript).
          let j = i + 1;
          let closed = false;
          let inCharClass = false;
          while (j < n) {
            const c = source[j];
            if (c === "\n") break;
            if (c === "\\" && j + 1 < n) {
              j += 2;
              continue;
            }
            if (c === "[") inCharClass = true;
            else if (c === "]") inCharClass = false;
            else if (c === "/" && !inCharClass) {
              closed = true;
              break;
            }
            j += 1;
          }
          if (closed) {
            // Skip flags after the closing slash.
            let k = j + 1;
            while (k < n && /[a-z]/.test(source[k])) k += 1;
            out.push(source.slice(i, k));
            i = k;
            regexAllowed = false;
            continue;
          }
          // Fall through to the default branch (treat as
          // division operator).
        }
        // Default: any code character. Update `regexAllowed` based
        // on whether `ch` is a value-producing token.
        out.push(ch);
        if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
          // Whitespace is transparent for the regex/division
          // context determination; do not change `regexAllowed`.
        } else if (
          ch === "(" ||
          ch === "{" ||
          ch === "[" ||
          ch === "," ||
          ch === ";" ||
          ch === ":" ||
          ch === "!" ||
          ch === "&" ||
          ch === "|" ||
          ch === "?" ||
          ch === "=" ||
          ch === "+" ||
          ch === "-" ||
          ch === "*" ||
          ch === "%" ||
          ch === "<" ||
          ch === ">" ||
          ch === "^" ||
          ch === "~" ||
          ch === "}"
        ) {
          regexAllowed = true;
        } else {
          regexAllowed = false;
        }
        i += 1;
        continue;
      }
      case "lineComment": {
        if (ch === "\n") {
          mode = "code";
          regexAllowed = true;
          out.push("\n");
          i += 1;
          continue;
        }
        // Replace comment chars with spaces to preserve column
        // alignment for diagnostics.
        out.push(ch === "\t" ? "\t" : " ");
        i += 1;
        continue;
      }
      case "blockComment": {
        if (ch === "*" && next === "/") {
          mode = "code";
          regexAllowed = true;
          out.push("  ");
          i += 2;
          continue;
        }
        out.push(
          ch === "\n" ? "\n" : ch === "\t" ? "\t" : " ",
        );
        i += 1;
        continue;
      }
      case "singleString": {
        out.push(ch);
        if (ch === "\\" && i + 1 < n) {
          out.push(source[i + 1]);
          i += 2;
          continue;
        }
        if (ch === "'") {
          mode = "code";
        }
        i += 1;
        continue;
      }
      case "doubleString": {
        out.push(ch);
        if (ch === "\\" && i + 1 < n) {
          out.push(source[i + 1]);
          i += 2;
          continue;
        }
        if (ch === '"') {
          mode = "code";
        }
        i += 1;
        continue;
      }
      case "template": {
        out.push(ch);
        if (ch === "\\" && i + 1 < n) {
          out.push(source[i + 1]);
          i += 2;
          continue;
        }
        if (ch === "`") {
          mode = "code";
        }
        // Note: template-literal expressions (`${…}`) re-enter
        // code context. Property 4 only cares whether the
        // identifier appears textually, and string interpolation
        // is rare in this codebase, so we leave the simpler
        // model in place. If a `${ deprecatedName }` interpolation
        // ever lands, it will still be flagged because the
        // identifier appears inside the template body, which we
        // pass through verbatim.
        i += 1;
        continue;
      }
    }
  }

  return out.join("");
}

// ---------------------------------------------------------------------------
// Matcher
// ---------------------------------------------------------------------------

/**
 * Build a global regex that finds the deprecated identifier `name`
 * with a boundary matching its kind. Cached per (name, kind) so the
 * fast-check property body does not recompile the same expression on
 * every iteration.
 */
const matcherCache = new Map<string, RegExp>();
function matcherFor(id: DeprecatedIdentifier): RegExp {
  const key = `${id.kind}:${id.name}`;
  const cached = matcherCache.get(key);
  if (cached) {
    cached.lastIndex = 0;
    return cached;
  }
  const escaped = id.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // For "kebab" identifiers (CSS classes, keyframes, shadow tokens):
  // disallow letters, digits, underscore, and hyphen on either side
  // so `bg-grid-faint` cannot match inside `bg-grid-faint-extra`.
  // For "ident" identifiers (component exports): use the JS word
  // boundary so `Stagger` matches `Stagger` but not `StaggerItem`,
  // `MyStagger`, or `Staggered`.
  const boundary =
    id.kind === "kebab"
      ? `(?<![A-Za-z0-9_-])${escaped}(?![A-Za-z0-9_-])`
      : `\\b${escaped}\\b`;
  const re = new RegExp(boundary, "g");
  matcherCache.set(key, re);
  return re;
}

interface DeprecatedHit {
  identifier: DeprecatedIdentifier;
  line: number;
  column: number;
  excerpt: string;
}

function findHits(
  source: string,
  identifiers: ReadonlyArray<DeprecatedIdentifier>,
): DeprecatedHit[] {
  const stripped = stripComments(source);
  const hits: DeprecatedHit[] = [];
  for (const id of identifiers) {
    const re = matcherFor(id);
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(stripped)) !== null) {
      const offset = m.index;
      // Compute (line, column) from the offset on the *original*
      // source. Because `stripComments` replaces comment characters
      // with spaces / preserves newlines, offsets in the stripped
      // string equal offsets in the original.
      const before = source.slice(0, offset);
      const newlineCount = (before.match(/\n/g) ?? []).length;
      const lineStart = before.lastIndexOf("\n") + 1;
      const lineEnd = source.indexOf("\n", offset);
      const excerpt = source
        .slice(lineStart, lineEnd === -1 ? source.length : lineEnd)
        .trim()
        .slice(0, 200);
      hits.push({
        identifier: id,
        line: newlineCount + 1,
        column: offset - lineStart + 1,
        excerpt,
      });
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// File system walk
// ---------------------------------------------------------------------------

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
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
        acc.push(toPosix(relative(REPO_ROOT, full)));
      }
    }
  }
  return acc;
}

function buildScannableFiles(): string[] {
  const collected: string[] = [];
  for (const root of WALK_ROOTS) {
    walk(join(REPO_ROOT, root), collected);
  }
  for (const extra of EXTRA_FILES) {
    const abs = join(REPO_ROOT, extra);
    try {
      if (statSync(abs).isFile()) {
        collected.push(toPosix(extra));
      }
    } catch {
      // Missing extra file is a configuration error — fail loudly
      // in the sanity check below rather than silently.
    }
  }
  // Deduplicate and sort for deterministic iteration order.
  return Array.from(new Set(collected)).sort();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 4: deprecated classes and keyframes are absent (Requirements 5.5, 5.6, 5.7, 6.7, 8.6, 13.4, 13.5, 13.6, 14.3, 14.4)", () => {
  const scannable = buildScannableFiles();

  it("the scannable file set is non-empty and pins the documented anchors", () => {
    // Sanity check: if the walk roots break, every property below
    // would silently pass. Anchor the test on a few files we know
    // must exist in the redesigned tree.
    expect(scannable.length).toBeGreaterThan(0);
    expect(scannable).toContain("tailwind.config.ts");
    expect(scannable).toContain("app/globals.css");
    expect(scannable).toContain("components/motion/motion-primitives.tsx");
    expect(scannable).toContain("components/ui/loaders.tsx");
  });

  it("the deprecation catalogue covers the four categories called out in the task", () => {
    // Anchor the catalogue's shape so a future edit cannot
    // accidentally drop a category. The exact identifier strings
    // are pinned by the next test.
    const categories = new Set(
      DEPRECATED_IDENTIFIERS.map((id) => id.category),
    );
    expect(categories).toEqual(
      new Set(["css-class", "keyframe", "shadow", "export"]),
    );
    expect(DEPRECATED_IDENTIFIERS.length).toBe(
      DEPRECATED_CSS_CLASSES.length +
        DEPRECATED_KEYFRAMES.length +
        DEPRECATED_SHADOWS.length +
        DEPRECATED_EXPORTS.length,
    );
  });

  it("for any deprecated identifier, no live source file contains a textual occurrence", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DEPRECATED_IDENTIFIERS),
        fc.constantFrom(...scannable),
        (identifier, relPath) => {
          const source = readFileSync(join(REPO_ROOT, relPath), "utf8");
          const hits = findHits(source, [identifier]);
          if (hits.length === 0) return true;
          const summary = hits
            .slice(0, 5)
            .map(
              (h) =>
                `  ${relPath}:${h.line}:${h.column}  [${h.identifier.category}]  ${h.identifier.name}\n    ${h.excerpt}`,
            )
            .join("\n");
          throw new Error(
            `Deprecated identifier "${identifier.name}" (${identifier.category}) ` +
              `appears as live code in ${relPath}:\n${summary}\n\n` +
              `Fix options:\n` +
              `  - Replace the reference with the redesigned token / primitive ` +
              `(see design.md → "Token system" / "Component primitives").\n` +
              `  - If the mention belongs in a JSDoc / migration note, move it ` +
              `into a // line comment or a /* … */ block comment so the property ` +
              `test ignores it.`,
          );
        },
      ),
      // The product domain is finite (|identifiers| × |files|).
      // Sample enough runs that every (identifier, file) pair is
      // hit in expectation. fast-check still shrinks counter-
      // examples to the smallest offending pair on failure.
      {
        numRuns: Math.max(
          400,
          DEPRECATED_IDENTIFIERS.length * scannable.length * 2,
        ),
      },
    );
  });

  it("exhaustively, every (deprecated-identifier, file) pair is clean", () => {
    // Belt-and-braces companion: enumerate the full (identifier x
    // file) product so the property cannot pass vacuously when
    // sampling misses an offender. Per design.md → "Sampling
    // strategy": "Tests that operate over a finite, fully
    // enumerable domain iterate the full domain explicitly."
    const failures: string[] = [];
    for (const relPath of scannable) {
      const source = readFileSync(join(REPO_ROOT, relPath), "utf8");
      const hits = findHits(source, DEPRECATED_IDENTIFIERS);
      for (const h of hits) {
        failures.push(
          `  ${relPath}:${h.line}:${h.column}  [${h.identifier.category}]  ${h.identifier.name}\n    ${h.excerpt}`,
        );
      }
    }
    if (failures.length > 0) {
      throw new Error(
        `Deprecated identifier(s) detected as live code:\n${failures.join(
          "\n",
        )}`,
      );
    }
  });
});
