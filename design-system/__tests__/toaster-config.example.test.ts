import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Example test for the preserved `<Toaster>` configuration in
 * `app/layout.tsx`.
 *
 * Validates: Requirements 14.6
 *
 * Asserts that the existing Toaster semantics (position, theming, and action
 * button styling) are preserved by the redesign. The redesign may restyle
 * the Toaster — these assertions only pin down the documented contract:
 *
 *   - Imported from `sonner`
 *   - `position="bottom-right"`
 *   - `theme="dark"`
 *   - `toastOptions.classNames` uses the redesigned design tokens
 *     (`border-border`, `bg-surface`, `text-text-primary`, `shadow-overlay`,
 *     `text-text-secondary`, and the redesigned action-button accent).
 */

const layoutPath = resolve(__dirname, "..", "..", "app", "layout.tsx");
const layoutSource = readFileSync(layoutPath, "utf8");

/**
 * Extract the JSX text of a single `<Toaster ... />` element from the
 * source, including everything between the opening `<Toaster` and its
 * matching `/>` (self-closing) tag. Returns the substring so individual
 * props can be inspected with simple regex.
 */
function extractToasterElement(source: string): string {
  const tagStart = source.indexOf("<Toaster");
  expect(
    tagStart,
    "expected a <Toaster ... /> element in app/layout.tsx",
  ).toBeGreaterThanOrEqual(0);

  // Walk forward, tracking nested braces so JSX expressions like
  // `toastOptions={{ ... }}` don't confuse the scanner. Stop at the first
  // `/>` encountered at brace depth zero.
  let depth = 0;
  for (let i = tagStart; i < source.length - 1; i += 1) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    else if (depth === 0 && ch === "/" && source[i + 1] === ">") {
      return source.slice(tagStart, i + 2);
    }
  }
  throw new Error("Could not locate closing '/>' for <Toaster> element");
}

describe("Toaster configuration in app/layout.tsx", () => {
  it("imports Toaster from sonner", () => {
    // There must be a single import statement bringing `Toaster` in from
    // `sonner`. Allow other named imports alongside it but require the
    // specifier to be exactly `sonner` (not a re-export wrapper).
    const importMatches = layoutSource.match(
      /import\s*\{[^}]*\bToaster\b[^}]*\}\s*from\s*["']sonner["']/g,
    );
    expect(
      importMatches,
      "expected exactly one `import { Toaster } from 'sonner'` in app/layout.tsx",
    ).toHaveLength(1);
  });

  it("renders exactly one <Toaster /> element", () => {
    const openTags = layoutSource.match(/<Toaster\b/g) ?? [];
    expect(openTags).toHaveLength(1);
  });

  it("sets position=\"bottom-right\" on the Toaster", () => {
    const toaster = extractToasterElement(layoutSource);
    expect(toaster).toMatch(/\bposition\s*=\s*["']bottom-right["']/);
  });

  it("sets theme=\"dark\" on the Toaster", () => {
    const toaster = extractToasterElement(layoutSource);
    expect(toaster).toMatch(/\btheme\s*=\s*["']dark["']/);
  });

  it("preserves the redesigned tokens in toastOptions.classNames.toast", () => {
    const toaster = extractToasterElement(layoutSource);

    // The toast surface uses the redesigned semantic tokens — border, surface
    // fill, primary text, and the single allowed shadow token.
    expect(toaster).toMatch(/toastOptions\s*=/);
    expect(toaster).toMatch(/\bborder-border\b/);
    expect(toaster).toMatch(/\bbg-surface\b/);
    expect(toaster).toMatch(/\btext-text-primary\b/);
    expect(toaster).toMatch(/\bshadow-overlay\b/);
  });

  it("preserves the secondary text token on the description className", () => {
    const toaster = extractToasterElement(layoutSource);

    // `description` is the secondary line of a toast and must use the
    // redesigned secondary-text token rather than a raw color literal.
    expect(toaster).toMatch(/description\s*:\s*["'][^"']*\btext-text-secondary\b[^"']*["']/);
  });

  it("preserves an action-button accent on the actionButton className", () => {
    const toaster = extractToasterElement(layoutSource);

    // The action button must remain visually distinct via a redesigned
    // accent token (e.g. `bg-action-strong`) — Requirement 14.6 calls out
    // action button styling specifically as a preserved semantic.
    expect(toaster).toMatch(/actionButton\s*:\s*["'][^"']*\bbg-action-[a-z-]+\b[^"']*["']/);
  });
});
