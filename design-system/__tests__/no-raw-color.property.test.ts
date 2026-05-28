// Feature: premium-ui-redesign, Property 2: No raw color literals in user-facing source
// Validates: Requirements 2.4
//
// Property: For any source file F under `app/**`, `components/**`, or
// `lib/**` (excluding the legacy override allow-list and any line tagged
// `// allow:color`), the textual content of F contains no raw color
// literal matching `#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `hsl(`, `hsla(`,
// `oklch(`, or `oklab(`.
//
// This test mirrors the enforcement behavior of the custom ESLint rule
// `local/no-raw-color` defined in `eslint-rules/no-raw-color.js` and
// registered in `eslint.config.mjs`. Running it independently of ESLint
// catches regressions whether they slip past linting (CI misconfig,
// per-file overrides growing) or land in places ESLint is not invoked
// against, and frames the rule as a verifiable universal property over
// the source tree.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fc from "fast-check";
import { describe, it } from "vitest";

// ---------------------------------------------------------------------------
// Patterns — mirror the ESLint rule's HEX_PATTERN and FUNC_PATTERN exactly.
// The two lookaheads on the hex pattern eliminate false positives from
// anchor hrefs (`#account` would otherwise match as `#acc`) and over-long
// hex blobs.
// ---------------------------------------------------------------------------
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])(?![a-zA-Z])/g;
const FUNC_PATTERN = /\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\s*\(/g;
const ALLOW_MARKER = "allow:color";

// ---------------------------------------------------------------------------
// Scan roots, file extensions, and directories to skip during traversal.
// ---------------------------------------------------------------------------
const SCAN_ROOTS = ["app", "components", "lib"] as const;
const FILE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SKIP_DIRS = new Set([
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
// Legacy override list — must mirror the per-file `local/no-raw-color: "off"`
// block in `eslint.config.mjs`. These files contain pre-redesign hex
// literals that will be migrated in Phase 2/3 tasks (see tracking comments
// in `eslint.config.mjs`):
//   - app/layout.tsx                       — task 2.3 (Geist swap)
//   - components/ui/button.tsx             — task 5.7 (Button rebuild)
//   - components/auth/auth-form.tsx        — task 8.2 (AuthShell)
//   - lib/notifications/send-deadline-email.ts — task 11.x (transactional
//     email HTML; tokens may not be inlinable, may keep // allow:color
//     markers permanently)
// When a file is migrated and removed from the ESLint override block, it
// must be removed from this list in the same change. Property 4
// (`no-deprecated.property.test.ts`, task 11.4) catches stragglers.
// ---------------------------------------------------------------------------
const LEGACY_OVERRIDES: ReadonlySet<string> = new Set(
  [
    "app/layout.tsx",
    "components/ui/button.tsx",
    "components/auth/auth-form.tsx",
    "lib/notifications/send-deadline-email.ts",
  ].map(toPosix),
);

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTS.has(ext)) out.push(full);
    }
  }
}

function collectScannableFiles(): string[] {
  const all: string[] = [];
  for (const root of SCAN_ROOTS) {
    const abs = path.join(REPO_ROOT, root);
    if (fs.existsSync(abs)) walk(abs, all);
  }
  return all
    .map((abs) => toPosix(path.relative(REPO_ROOT, abs)))
    .filter((rel) => !LEGACY_OVERRIDES.has(rel))
    .sort();
}

interface Offender {
  line: number;
  matches: string[];
  content: string;
}

function findRawColorOffenders(relPath: string): Offender[] {
  const abs = path.join(REPO_ROOT, relPath);
  const source = fs.readFileSync(abs, "utf8");
  const lines = source.split(/\r?\n/);
  const offenders: Offender[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(ALLOW_MARKER)) continue;
    const matches: string[] = [];
    HEX_PATTERN.lastIndex = 0;
    FUNC_PATTERN.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = HEX_PATTERN.exec(line)) !== null) matches.push(m[0]);
    while ((m = FUNC_PATTERN.exec(line)) !== null) matches.push(m[0]);
    if (matches.length > 0) {
      offenders.push({ line: i + 1, matches, content: line });
    }
  }
  return offenders;
}

describe("Property 2: No raw color literals in user-facing source", () => {
  const files = collectScannableFiles();

  it("collects a non-empty file list to scan", () => {
    if (files.length === 0) {
      throw new Error(
        `Expected to find scannable files under ${SCAN_ROOTS.join(
          ", ",
        )} relative to ${REPO_ROOT}, but found none. ` +
          `Either the repo layout changed or the test is mis-rooted.`,
      );
    }
  });

  it("for any randomly-sampled file, contains no raw color literal", () => {
    fc.assert(
      fc.property(fc.constantFrom(...files), (file) => {
        const offenders = findRawColorOffenders(file);
        if (offenders.length === 0) return;
        const detail = offenders
          .map(
            (o) =>
              `  ${file}:${o.line}: [${o.matches.join(", ")}]  ${o.content
                .trim()
                .slice(0, 200)}`,
          )
          .join("\n");
        throw new Error(
          `Raw color literal(s) found in ${file}:\n${detail}\n\n` +
            `Fix options:\n` +
            `  - Replace the literal with a design token (see app/globals.css and tailwind.config.ts).\n` +
            `  - When unavoidable (e.g. transactional email HTML), append \`// ${ALLOW_MARKER}\` to the line.\n` +
            `  - If the file is a documented legacy holdover, add it to the override block in eslint.config.mjs ` +
            `AND to LEGACY_OVERRIDES in this test file in the same change.`,
        );
      }),
      // The domain is finite (~50 files); use enough runs to sample every
      // file with overwhelming probability while keeping the test fast.
      { numRuns: Math.max(200, files.length * 5) },
    );
  });

  it("exhaustively, every scannable file contains no raw color literal", () => {
    // Belt-and-braces companion to the property test above: enumerate
    // the full domain explicitly so a regression cannot hide behind
    // sampling. Per design.md: "Tests that operate over a finite, fully
    // enumerable domain iterate the full domain explicitly."
    const failures: string[] = [];
    for (const file of files) {
      const offenders = findRawColorOffenders(file);
      if (offenders.length === 0) continue;
      for (const o of offenders) {
        failures.push(
          `  ${file}:${o.line}: [${o.matches.join(", ")}]  ${o.content
            .trim()
            .slice(0, 200)}`,
        );
      }
    }
    if (failures.length > 0) {
      throw new Error(
        `Raw color literals detected across the source tree:\n${failures.join(
          "\n",
        )}`,
      );
    }
  });
});
