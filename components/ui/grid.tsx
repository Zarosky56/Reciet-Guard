import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * `<Grid>` — the only sanctioned multi-column grid primitive for
 * user-facing screens (Requirement 4.5, design "Spacing, Layout, and
 * Radius Scale" → "Grid primitive").
 *
 * One-off `grid-cols-[Xfr_Yrem]` declarations in page or composition
 * code are forbidden by the `local/no-arbitrary-spacing` ESLint rule;
 * this file is on the rule's allow-list so the canonical track
 * definitions live here and only here.
 *
 * Props:
 *   - `cols`: 1 | 2 | 3 — column count at the largest breakpoint.
 *     Smaller breakpoints collapse toward a single column for mobile.
 *   - `gap`: "card" (16px, design "Card-internal gap") |
 *            "section" (32px, design "Section gap").
 *
 * Both `gap` values come from the spacing scale (`gap-4`, `gap-8`); no
 * arbitrary spacing values are used.
 */

type GridProps = HTMLAttributes<HTMLDivElement> & {
  cols: 1 | 2 | 3;
  gap: "card" | "section";
};

// Static lookups so Tailwind's JIT can statically extract the class
// names. Do not inline these as template strings.
const COLS_CLASSNAMES: Record<GridProps["cols"], string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
};

const GAP_CLASSNAMES: Record<GridProps["gap"], string> = {
  card: "gap-4",
  section: "gap-8",
};

export function Grid({
  cols,
  gap,
  className,
  ...props
}: GridProps) {
  return (
    <div
      className={cn("grid", COLS_CLASSNAMES[cols], GAP_CLASSNAMES[gap], className)}
      {...props}
    />
  );
}
