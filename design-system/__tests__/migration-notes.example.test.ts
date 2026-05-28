import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Example test for §13 (Migration notes) of
 * `design-system/COMPONENT_PATTERNS.md`.
 *
 * Validates: Requirements 8.9, 14.7
 *
 * Per Requirement 14.7, every removed or renamed `Component_Primitive` prop,
 * variant, or export must be documented in a migration note inside
 * `design-system/COMPONENT_PATTERNS.md`. Per Requirement 8.9, each entry must
 * carry a justification so the deletion is traceable.
 *
 * This test scans §13 for a heading that names each removal documented by
 * the redesign and asserts that the subsection carries a `**Reason:**`
 * justification line.
 *
 * The redesign's catalogued removals (from design.md and tasks 11.1 / 11.3):
 *   - Motion primitives: <FadeIn>, <Stagger>, <StaggerItem>, <HoverLift>
 *   - Motion ease constant: premiumEase
 *   - <Button> `default` CVA variant alias
 *   - <ButtonLoader> shim
 *   - <UrgencyBadge>.pulse parent-controlled prop
 *   - <AmbientBackground>.variant="auth" | "app"
 */

const COMPONENT_PATTERNS_PATH = resolve(
  __dirname,
  "..",
  "COMPONENT_PATTERNS.md",
);
const source = readFileSync(COMPONENT_PATTERNS_PATH, "utf8");

interface Subsection {
  /** The verbatim heading line of the §13.x subsection (e.g. `### 13.4 …`). */
  heading: string;
  /** The body of the subsection, up to the next §13.x heading. */
  body: string;
}

/**
 * Slice out the `## 13. Migration notes` section. Stops at the next top-level
 * `##` heading whose number is not 13 (e.g. `## Document maintenance`).
 */
function extractMigrationSection(md: string): string {
  const headingRe = /^##\s+13\.\s+Migration notes\s*$/m;
  const headingMatch = headingRe.exec(md);
  expect(
    headingMatch,
    "expected `## 13. Migration notes` heading in COMPONENT_PATTERNS.md",
  ).not.toBeNull();
  const start = headingMatch!.index;

  const after = md.slice(start + headingMatch![0].length);
  const nextHeadingRe = /^##\s+(?!13\.)/m;
  const nextMatch = nextHeadingRe.exec(after);
  const end = nextMatch
    ? start + headingMatch![0].length + nextMatch.index
    : md.length;

  return md.slice(start, end);
}

/**
 * Split the migration-notes section into its `### 13.x …` subsections, keyed
 * by their heading line.
 */
function extractSubsections(sectionMd: string): Subsection[] {
  const subsections: Subsection[] = [];
  let current: Subsection | null = null;

  for (const line of sectionMd.split("\n")) {
    if (/^###\s+13\.\d+\b/.test(line)) {
      if (current) subsections.push(current);
      current = { heading: line, body: "" };
    } else if (current) {
      current.body += line + "\n";
    }
  }
  if (current) subsections.push(current);

  return subsections;
}

const migrationSection = extractMigrationSection(source);
const subsections = extractSubsections(migrationSection);

/**
 * Each documented removal: a `label` for the test name and a `matches`
 * predicate that recognises the §13.x heading covering it.
 *
 * The needles deliberately include surrounding backticks where possible so
 * that, e.g., a heading mentioning `<Stagger>` is not falsely matched by an
 * entry that only names `<StaggerItem>`.
 */
const REMOVED_ITEMS: Array<{
  label: string;
  matches: (heading: string) => boolean;
}> = [
  {
    label: "<FadeIn> motion primitive export",
    matches: (h) => h.includes("`<FadeIn>`"),
  },
  {
    label: "<Stagger> motion primitive export",
    matches: (h) => h.includes("`<Stagger>`"),
  },
  {
    label: "<StaggerItem> motion primitive export",
    matches: (h) => h.includes("`<StaggerItem>`"),
  },
  {
    label: "<HoverLift> motion primitive export",
    matches: (h) => h.includes("`<HoverLift>`"),
  },
  {
    label: "premiumEase constant",
    matches: (h) => h.includes("`premiumEase`"),
  },
  {
    label: "<Button> `default` CVA variant alias",
    matches: (h) =>
      h.includes("`<Button>`") && h.includes("`default`") && /CVA/.test(h),
  },
  {
    label: "<ButtonLoader> shim",
    matches: (h) => h.includes("`<ButtonLoader>`"),
  },
  {
    label: "<UrgencyBadge>.pulse parent-controlled prop",
    matches: (h) => h.includes("<UrgencyBadge>.pulse"),
  },
  {
    label: '<AmbientBackground>.variant="auth" | "app"',
    matches: (h) =>
      h.includes("<AmbientBackground>.variant=") &&
      h.includes('"auth"') &&
      h.includes('"app"'),
  },
];

describe("COMPONENT_PATTERNS.md §13 — Migration notes (Requirements 8.9, 14.7)", () => {
  it("contains a `## 13. Migration notes` section", () => {
    expect(source).toMatch(/^##\s+13\.\s+Migration notes\s*$/m);
  });

  it("contains at least one §13.x subsection", () => {
    expect(
      subsections.length,
      "expected at least one `### 13.x …` migration-note subsection",
    ).toBeGreaterThan(0);
  });

  it.each(REMOVED_ITEMS)(
    "documents the removal of $label in a §13.x heading",
    ({ label, matches }) => {
      const matched = subsections.filter((s) => matches(s.heading));
      expect(
        matched,
        `expected a §13.x heading covering "${label}"; available headings:\n${subsections
          .map((s) => `  ${s.heading.trim()}`)
          .join("\n")}`,
      ).not.toHaveLength(0);
    },
  );

  it.each(REMOVED_ITEMS)(
    "provides a **Reason:** justification for $label",
    ({ label, matches }) => {
      const matched = subsections.filter((s) => matches(s.heading));
      // The "documented" assertion above will already have failed if matched
      // is empty; here we re-guard so this test reports the more specific
      // failure (missing Reason) when the heading exists.
      expect(matched.length).toBeGreaterThan(0);

      // A `**Reason:**` line followed by at least one non-whitespace
      // character of justification text. Whitespace between the marker and
      // the text may be a regular space or a newline (markdown rendering
      // doesn't care which).
      const reasonRe = /\*\*Reason:\*\*\s+\S/;
      const haveReason = matched.some((s) => reasonRe.test(s.body));

      expect(
        haveReason,
        `expected a "**Reason:**" line with justification text in the §13.x subsection covering "${label}"`,
      ).toBe(true);
    },
  );
});
