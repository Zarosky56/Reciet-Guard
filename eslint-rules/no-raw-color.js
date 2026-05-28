"use strict";

/**
 * ESLint rule: no-raw-color
 *
 * Forbids raw color literals (hex, rgb/rgba, hsl/hsla, oklch, oklab) in
 * user-facing source under `app/`, `components/`, and `lib/`. Every color
 * must trace back to a token defined in `tailwind.config.ts` and
 * `app/globals.css`.
 *
 * Implements Requirement 2.4 of the Premium UI Redesign spec.
 *
 * Exemptions (handled at the registration site in `eslint.config.mjs`,
 * not in this rule):
 *   - `tailwind.config.ts`
 *   - `app/globals.css` (CSS files are not linted by this config)
 *   - `public/**`/*.svg` (asset files, not linted)
 *
 * Inline exemption: append `// allow:color` (or place it as a comment on
 * the same line) to suppress the rule for that specific line when a raw
 * color literal is unavoidable (e.g. transactional email HTML where CSS
 * variables cannot be used).
 */

// The hex pattern is `#` + 3-to-8 hex chars, with two lookaheads to
// prevent false positives:
//   1. `(?![0-9a-fA-F])` ensures the run is maximal — a 9+ char hex
//      blob is not silently truncated to 8.
//   2. `(?![a-zA-Z])` rejects identifier-like continuations such as
//      anchor hrefs (`#account` would otherwise match as `#acc`).
// `_` is intentionally permitted as a trailing char so hex literals
// embedded inside Tailwind arbitrary-value utilities such as
// `bg-[linear-gradient(180deg,#6a96ff_0%,#3b82f6_100%)]` are still
// flagged.
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])(?![a-zA-Z])/g;
const FUNC_PATTERN = /\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\s*\(/g;
const ALLOW_MARKER = "allow:color";

/**
 * Scan a string for raw color tokens and return their offsets within the
 * scanned text plus the matched substring and category.
 */
function findMatches(text) {
  const matches = [];
  let m;
  HEX_PATTERN.lastIndex = 0;
  while ((m = HEX_PATTERN.exec(text)) !== null) {
    matches.push({ index: m.index, match: m[0], kind: "hex" });
  }
  FUNC_PATTERN.lastIndex = 0;
  while ((m = FUNC_PATTERN.exec(text)) !== null) {
    matches.push({ index: m.index, match: m[0], kind: "function" });
  }
  return matches;
}

/**
 * Map a character offset within a (possibly multi-line) string back to a
 * 0-based line number relative to the start of the string.
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
        "Forbid raw color literals (hex, rgb, hsl, oklch, oklab); require design tokens.",
    },
    schema: [],
    messages: {
      rawColor:
        "Raw color literal '{{value}}' is forbidden. Use a design token (Tailwind theme color or CSS variable from app/globals.css) instead. Add `// allow:color` on this line to suppress when unavoidable.",
    },
  },
  create(context) {
    const source =
      context.sourceCode || (context.getSourceCode && context.getSourceCode());
    if (!source) return {};

    /** Cache: 1-based line number → boolean */
    const allowLineCache = new Map();

    function hasAllowCommentOnLine(line) {
      if (allowLineCache.has(line)) return allowLineCache.get(line);
      const comments = source.getAllComments();
      const has = comments.some((comment) => {
        if (typeof comment.value !== "string") return false;
        if (!comment.value.includes(ALLOW_MARKER)) return false;
        // Comment must overlap the target line.
        return (
          comment.loc &&
          comment.loc.start.line <= line &&
          comment.loc.end.line >= line
        );
      });
      allowLineCache.set(line, has);
      return has;
    }

    function reportMatches(node, text) {
      if (typeof text !== "string" || text.length === 0) return;
      const matches = findMatches(text);
      if (matches.length === 0) return;
      const baseLine = node.loc ? node.loc.start.line : 1;
      for (const m of matches) {
        const relLine = offsetToRelativeLine(text, m.index);
        const absLine = baseLine + relLine;
        if (hasAllowCommentOnLine(absLine)) continue;
        context.report({
          node,
          loc: {
            start: { line: absLine, column: 0 },
            end: { line: absLine, column: 0 },
          },
          messageId: "rawColor",
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
