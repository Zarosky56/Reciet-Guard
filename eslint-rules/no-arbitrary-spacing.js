"use strict";

/**
 * ESLint rule: no-arbitrary-spacing
 *
 * Forbids Tailwind arbitrary-value utilities for spacing, sizing,
 * positioning, typography, and grid track definitions in user-facing
 * source under `app/`, `components/`, and `lib/`. Every layout value
 * must trace back to a token defined in `tailwind.config.ts`.
 *
 * Implements Requirements 3.5, 4.2, and 4.5 of the Premium UI Redesign
 * spec.
 *
 * Pattern flagged (matches the literal regex documented in
 * `.kiro/specs/premium-ui-redesign/tasks.md` task 1.3):
 *
 *     (p|m|gap|space-[xy]|top|left|right|bottom|inset|w|h
 *      |min-w|min-h|max-w|max-h|text|leading|tracking
 *      |grid-cols|grid-rows)-\[[^\]]+\]
 *
 * Examples that fail:
 *   - `p-[16px]`, `m-[3px]`, `gap-[10px]`, `space-x-[8px]`
 *   - `top-[2px]`, `inset-[0]`, `w-[520px]`, `min-h-[100vh]`
 *   - `text-[15px]`, `leading-[1.02]`, `tracking-[-0.025em]`
 *   - `grid-cols-[1fr_2rem]`, `grid-rows-[auto_1fr]`
 *
 * Examples that pass (because the prefix isn't in the list):
 *   - `bg-[#fff]` (color → handled by `no-raw-color`)
 *   - `flex-[1_1_0]`, `font-[Inter]`, `border-[2px]`
 *   - `pl-[5px]`, `mx-[3px]` (Tailwind direction-suffix variants;
 *     intentionally narrow per the spec regex)
 *
 * Exemptions (handled at the registration site in `eslint.config.mjs`,
 * not in this rule):
 *   - `components/ui/typography.tsx` (the type-scale primitive defines
 *     the canonical `text-*`/`leading-*`/`tracking-*` utilities)
 *   - `components/ui/grid.tsx` (the grid primitive owns `grid-cols-*`
 *     and `grid-rows-*` track definitions)
 *   - `tailwind.config.ts` (the token source)
 */

// Build the offender pattern from the spec regex, plus a leading
// negative lookbehind so prefixes don't false-match the tail of a
// longer identifier (e.g. the `text` in `tnum-text-[...]` should not
// trigger if the longer string isn't a Tailwind utility on its own).
//
// The alternation order matters: longer prefixes (`min-w`, `grid-cols`,
// `space-x`, etc.) are listed before their shorter sub-prefixes so the
// regex engine matches the most specific token first.
const PREFIX_ALTERNATION =
  "(?:" +
  [
    "min-w",
    "min-h",
    "max-w",
    "max-h",
    "space-x",
    "space-y",
    "grid-cols",
    "grid-rows",
    "gap",
    "top",
    "left",
    "right",
    "bottom",
    "inset",
    "text",
    "leading",
    "tracking",
    "p",
    "m",
    "w",
    "h",
  ].join("|") +
  ")";

// `(?<![A-Za-z0-9-])` rejects tail-matches inside a longer dashed
// identifier (e.g. `bg-grid-cols-[…]` would otherwise match the
// `grid-cols-[…]` slice; the lookbehind blocks it).
const ARBITRARY_PATTERN = new RegExp(
  "(?<![A-Za-z0-9-])" + PREFIX_ALTERNATION + "-\\[[^\\]]+\\]",
  "g",
);

/**
 * Scan a string for arbitrary-value Tailwind utilities and return the
 * offsets within the scanned text plus the matched substring.
 */
function findMatches(text) {
  const matches = [];
  let m;
  ARBITRARY_PATTERN.lastIndex = 0;
  while ((m = ARBITRARY_PATTERN.exec(text)) !== null) {
    matches.push({ index: m.index, match: m[0] });
  }
  return matches;
}

/**
 * Map a character offset within a (possibly multi-line) string back to
 * a 0-based line number relative to the start of the string.
 */
function offsetToRelativeLine(text, offset) {
  let line = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10 /* \n */) line++;
  }
  return line;
}

/** @type {import("eslint").Rule.RuleModule} */
const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid Tailwind arbitrary-value utilities for spacing, sizing, positioning, typography, and grid; require design tokens.",
    },
    schema: [],
    messages: {
      arbitrarySpacing:
        "Arbitrary Tailwind utility '{{value}}' is forbidden. Use a token from the spacing/typography/container scale defined in `tailwind.config.ts` and `app/globals.css`. Allowed in `components/ui/typography.tsx`, `components/ui/grid.tsx`, and `tailwind.config.ts` only.",
    },
  },
  create(context) {
    const source =
      context.sourceCode || (context.getSourceCode && context.getSourceCode());
    if (!source) return {};

    function reportMatches(node, text) {
      if (typeof text !== "string" || text.length === 0) return;
      const matches = findMatches(text);
      if (matches.length === 0) return;
      const baseLine = node.loc ? node.loc.start.line : 1;
      for (const m of matches) {
        const relLine = offsetToRelativeLine(text, m.index);
        const absLine = baseLine + relLine;
        context.report({
          node,
          loc: {
            start: { line: absLine, column: 0 },
            end: { line: absLine, column: 0 },
          },
          messageId: "arbitrarySpacing",
          data: { value: m.match },
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          reportMatches(node, node.value);
        }
      },
      TemplateElement(node) {
        const cooked = node.value && node.value.cooked;
        reportMatches(node, cooked);
      },
      JSXText(node) {
        reportMatches(node, node.value);
      },
    };
  },
};

module.exports = rule;
