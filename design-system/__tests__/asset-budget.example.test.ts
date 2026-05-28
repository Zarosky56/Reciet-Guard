// Feature: premium-ui-redesign, Task 13.3
// Example test for the asset budget and runtime restrictions.
//
// Validates: Requirements 12.4
//
// Requirement 12.4 (verbatim):
//   "THE redesigned ambient/background layer SHALL NOT introduce any image
//    asset larger than 16 KB and SHALL NOT use a `<canvas>`, WebGL, or
//    `<video>` element on any In_Scope_Screen."
//
// This file pins both halves of that rule with two concrete, deterministic
// assertions:
//
//   1. Asset budget — every file under `public/` is at most 16 KB
//      (16 * 1024 = 16384 bytes). The walk is recursive and covers every
//      file extension, since the bound is on bytes, not on file type.
//
//   2. Runtime restriction — no source file under `app/`, `components/`,
//      or `lib/` references the forbidden runtime primitives. The scan is
//      a heuristic textual match for:
//        - `<canvas`  followed by whitespace, `/`, or `>` — a JSX element
//        - `<video`   followed by whitespace, `/`, or `>` — a JSX element
//        - `WebGLRenderingContext` — the canonical WebGL DOM identifier
//        - `webgl`    case-insensitive — catches GL utility names, the
//                     `getContext("webgl")` lookup, and any `WebGL2*`
//                     identifier as a side-effect
//        - `gl-…`     import names — `from "gl-…"`, `import("gl-…")`,
//                     `require("gl-…")` — catches the well-known GL
//                     ecosystem packages (`gl-matrix`, `gl-react`,
//                     `gl-vec3`, etc.) that would only land in this
//                     codebase to drive a WebGL/canvas surface.
//
// The source scan excludes `design-system/__tests__/**` so this very file
// (which references the forbidden patterns as detection regexes) does not
// trip the rule. The walk roots `app/`, `components/`, `lib/` already
// exclude the `__tests__` directory by construction; the exclusion is
// kept explicit per the task description in case the walk roots widen.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// Repository layout
// ---------------------------------------------------------------------------

const REPO_ROOT = join(__dirname, "..", "..");

/** 16 KB ceiling per Requirement 12.4. */
const ASSET_BUDGET_BYTES = 16 * 1024;

const PUBLIC_DIR = join(REPO_ROOT, "public");

/**
 * Source roots scanned for forbidden runtime primitives. The walk is
 * limited to user-facing source — design-system docs, test code, and
 * tooling files (under `scripts/`, `eslint-rules/`, etc.) are out of
 * scope per the task definition.
 */
const SOURCE_WALK_ROOTS = ["app", "components", "lib"] as const;

/** Source extensions scanned by the runtime-restriction check. */
const SOURCE_EXTENSIONS = new Set<string>([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

/**
 * Path prefixes (relative to the repo root, forward-slash separated)
 * excluded from the source scan even when they fall under one of the
 * walk roots above. The walk roots already exclude
 * `design-system/__tests__/**` by construction; the explicit list is
 * documented for future maintainers.
 */
const EXCLUDED_PATH_PREFIXES = ["design-system/__tests__/"] as const;

// ---------------------------------------------------------------------------
// File system walks
// ---------------------------------------------------------------------------

interface PublicAsset {
  /** Path relative to `public/`, forward-slash separated. */
  relPath: string;
  size: number;
}

function walkPublic(dir: string, base: string, acc: PublicAsset[] = []): PublicAsset[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      walkPublic(full, base, acc);
    } else if (s.isFile()) {
      acc.push({
        relPath: relative(base, full).split(sep).join("/"),
        size: s.size,
      });
    }
  }
  return acc;
}

interface SourceFile {
  /** Path relative to repo root, forward-slash separated. */
  relPath: string;
  absPath: string;
}

function walkSource(dir: string, acc: SourceFile[] = []): SourceFile[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let s;
    try {
      s = statSync(full);
    } catch {
      continue;
    }
    if (s.isDirectory()) {
      walkSource(full, acc);
    } else if (s.isFile()) {
      const dotIdx = entry.lastIndexOf(".");
      if (dotIdx === -1) continue;
      if (!SOURCE_EXTENSIONS.has(entry.slice(dotIdx))) continue;
      const rel = relative(REPO_ROOT, full).split(sep).join("/");
      if (EXCLUDED_PATH_PREFIXES.some((p) => rel.startsWith(p))) continue;
      acc.push({ relPath: rel, absPath: full });
    }
  }
  return acc;
}

// ---------------------------------------------------------------------------
// Forbidden runtime primitives
// ---------------------------------------------------------------------------

interface ForbiddenPattern {
  /** Human-readable name shown in the failure message. */
  name: string;
  /** Heuristic match. Anchored with word boundaries where it makes sense. */
  pattern: RegExp;
}

const FORBIDDEN_PATTERNS: readonly ForbiddenPattern[] = [
  // JSX `<canvas>` element. The `[\s/>]` tail prevents false positives
  // against identifiers like `canvasContext` while still catching
  // `<canvas>`, `<canvas/>`, and `<canvas …>`.
  { name: "<canvas> JSX element", pattern: /<canvas[\s/>]/ },
  // JSX `<video>` element, same shape as the canvas guard.
  { name: "<video> JSX element", pattern: /<video[\s/>]/ },
  // The canonical WebGL DOM identifier (case-sensitive — this is a
  // well-known global).
  {
    name: "WebGLRenderingContext identifier",
    pattern: /\bWebGLRenderingContext\b/,
  },
  // Catch-all WebGL substring (case-insensitive). Covers
  // `getContext("webgl")`, `WebGL2RenderingContext`, `webglUtils`, etc.
  { name: "webgl substring (case-insensitive)", pattern: /webgl/i },
  // GL ecosystem package imports — `from "gl-matrix"`, `import("gl-react")`,
  // `require("gl-vec3")`. The `["']` group covers both quoting styles.
  {
    name: "gl-* package import",
    pattern: /(?:from|import|require)\s*\(?\s*["']gl-[\w-]+/,
  },
] as const;

function lineOf(content: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < content.length; i++) {
    if (content.charCodeAt(i) === 10 /* \n */) line += 1;
  }
  return line;
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("asset budget and runtime restrictions — example test (Requirements 12.4)", () => {
  it("every file under public/ is at most 16 KB", () => {
    const assets = walkPublic(PUBLIC_DIR, PUBLIC_DIR);

    // Sanity: the walk must surface at least one file. If `public/` is
    // empty the assertion would vacuously pass; the brand mark
    // (`public/brand/mark.svg`, shipped in task 2.4) is the
    // ground-truth sentinel.
    expect(assets.length).toBeGreaterThan(0);
    expect(assets.map((a) => a.relPath)).toContain("brand/mark.svg");

    const offenders = assets.filter((a) => a.size > ASSET_BUDGET_BYTES);
    if (offenders.length > 0) {
      const summary = offenders
        .map(
          (a) =>
            `  public/${a.relPath} — ${a.size} bytes (over 16 KB by ${
              a.size - ASSET_BUDGET_BYTES
            } bytes)`,
        )
        .join("\n");
      throw new Error(
        `Found ${offenders.length} public asset(s) over the 16 KB ` +
          `Requirement 12.4 budget:\n${summary}`,
      );
    }
  });

  it("no user-facing source under app/, components/, lib/ references <canvas>, <video>, WebGL, or gl-* packages", () => {
    const sourceFiles: SourceFile[] = [];
    for (const root of SOURCE_WALK_ROOTS) {
      walkSource(join(REPO_ROOT, root), sourceFiles);
    }

    // Sanity: the walk must reach a known sentinel file. If we have
    // zero source files this property would vacuously pass.
    expect(sourceFiles.length).toBeGreaterThan(0);
    expect(sourceFiles.map((f) => f.relPath)).toContain(
      "components/visual/ambient-background.tsx",
    );

    const violations: string[] = [];
    for (const file of sourceFiles) {
      const content = readFileSync(file.absPath, "utf8");
      for (const { name, pattern } of FORBIDDEN_PATTERNS) {
        const match = pattern.exec(content);
        if (match) {
          violations.push(
            `  ${file.relPath}:${lineOf(content, match.index)} — ${name} ` +
              `(matched ${JSON.stringify(match[0])})`,
          );
        }
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Forbidden runtime primitive(s) found in user-facing source ` +
          `(Requirement 12.4 forbids <canvas>, <video>, WebGL, and gl-* ` +
          `imports on any In_Scope_Screen):\n${violations.join("\n")}`,
      );
    }
  });
});
