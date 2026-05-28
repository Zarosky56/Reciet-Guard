import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Example test for font configuration in `app/layout.tsx`.
 *
 * Validates: Requirements 3.1, 3.2, 12.3
 *
 * Asserts that exactly two `next/font/google` calls are present (the chosen
 * UI sans-serif and the mono), both restricted to the Latin subset, with
 * `display: "swap"`, only the UI sans is preloaded, and both are bound to
 * the documented CSS variables (`--font-ui` and `--font-mono`).
 */

const layoutPath = resolve(__dirname, "..", "..", "app", "layout.tsx");
const layoutSource = readFileSync(layoutPath, "utf8");

/**
 * Extract the option object literal passed to a `next/font/google` font
 * factory call (e.g. `Geist({ ... })`). Returns the raw text between the
 * outermost braces of the call argument so individual options can be
 * inspected with simple regex.
 */
function extractFontCallOptions(source: string, fontName: string): string {
  const callStart = source.indexOf(`${fontName}({`);
  expect(callStart, `${fontName}() call not found in app/layout.tsx`).toBeGreaterThanOrEqual(0);

  // Walk the source from the opening brace, tracking nested braces, and
  // return the substring between the outermost `{` and matching `}`.
  const openBraceIndex = source.indexOf("{", callStart);
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openBraceIndex + 1, i);
      }
    }
  }
  throw new Error(`Could not locate closing brace for ${fontName}() options`);
}

describe("font configuration in app/layout.tsx", () => {
  it("imports exactly two fonts from next/font/google", () => {
    // There must be a single import statement from next/font/google.
    const importMatches = layoutSource.match(
      /import\s*\{[^}]*\}\s*from\s*["']next\/font\/google["']/g,
    );
    expect(importMatches, "expected exactly one next/font/google import").toHaveLength(1);

    const importStatement = importMatches![0];
    const namedImports = importStatement
      .replace(/^import\s*\{/, "")
      .replace(/\}\s*from.*$/, "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    expect(namedImports).toHaveLength(2);
    expect(namedImports).toEqual(expect.arrayContaining(["Geist", "JetBrains_Mono"]));
  });

  it("invokes exactly two font factories (Geist and JetBrains_Mono)", () => {
    const geistCalls = layoutSource.match(/\bGeist\s*\(/g) ?? [];
    const monoCalls = layoutSource.match(/\bJetBrains_Mono\s*\(/g) ?? [];

    expect(geistCalls).toHaveLength(1);
    expect(monoCalls).toHaveLength(1);

    // Total `next/font` factory invocations must be exactly two — no third
    // font may be loaded (Requirement 12.3 keeps the font budget tight).
    expect(geistCalls.length + monoCalls.length).toBe(2);
  });

  it("configures the UI sans (Geist) with Latin subset, swap, preload, and --font-ui", () => {
    const options = extractFontCallOptions(layoutSource, "Geist");

    expect(options).toMatch(/variable:\s*["']--font-ui["']/);
    expect(options).toMatch(/subsets:\s*\[\s*["']latin["']\s*\]/);
    expect(options).toMatch(/display:\s*["']swap["']/);
    expect(options).toMatch(/preload:\s*true/);
  });

  it("configures the mono (JetBrains_Mono) with Latin subset, swap, no preload, and --font-mono", () => {
    const options = extractFontCallOptions(layoutSource, "JetBrains_Mono");

    expect(options).toMatch(/variable:\s*["']--font-mono["']/);
    expect(options).toMatch(/subsets:\s*\[\s*["']latin["']\s*\]/);
    expect(options).toMatch(/display:\s*["']swap["']/);
    expect(options).toMatch(/preload:\s*false/);
  });

  it("preloads only the UI sans (exactly one preload: true across both font option objects)", () => {
    const geistOptions = extractFontCallOptions(layoutSource, "Geist");
    const monoOptions = extractFontCallOptions(layoutSource, "JetBrains_Mono");

    const geistPreloadTrue = geistOptions.match(/preload:\s*true/g) ?? [];
    const geistPreloadFalse = geistOptions.match(/preload:\s*false/g) ?? [];
    const monoPreloadTrue = monoOptions.match(/preload:\s*true/g) ?? [];
    const monoPreloadFalse = monoOptions.match(/preload:\s*false/g) ?? [];

    expect(geistPreloadTrue).toHaveLength(1);
    expect(geistPreloadFalse).toHaveLength(0);
    expect(monoPreloadTrue).toHaveLength(0);
    expect(monoPreloadFalse).toHaveLength(1);
  });
});
