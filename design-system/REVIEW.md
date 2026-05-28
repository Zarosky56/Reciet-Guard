# REVIEW.md — Design Quality Assurance & Review Protocol

> **Role:** This document defines the systematic review process for ensuring every page, component, and interaction meets Receipt Guardian's premium quality bar. It provides checklists, scoring rubrics, and escalation paths. It is the gate between "implemented" and "shippable."

> **Authority chain:** `REVIEW.md` operates alongside `IMPLEMENTATION.md`. Implementation defines *how to build*. Review defines *how to verify*. The 14 AI_Slop_Pattern items from Requirement 13 are reproduced here as the **Tier-1 hard-fail check**: a single failure on any Tier-1 item blocks merge regardless of other scores.

---

## 1. Purpose

Design review exists because:

- Premium quality is invisible when correct and painfully obvious when wrong.
- AI agents need explicit verification criteria, not subjective "looks good."
- Drift accumulates silently — review catches it before it compounds.
- A single AI_Slop_Pattern slipping through degrades the entire perceived craft level.
- Cross-page consistency requires systematic cross-referencing, not memory.

This document answers: "How do I know this page is done?"

---

## 2. Review Philosophy

### Core Beliefs

1. **Review is not optional.** Every page passes through review before being marked complete.
2. **Review is objective.** Every check has a pass/fail criterion. No "it feels right."
3. **Tier-1 (AI_Slop_Pattern) failures are hard-fail.** A single hit blocks merge — the page returns to implementation. There is no "score 4/5 with one Tier-1 hit." That is a 0.
4. **Review catches drift.** The primary enemy is not bugs but gradual inconsistency.
5. **Review is fast.** Tier-1 takes 5 minutes, Tier-2 takes 5 more.
6. **Review is constructive.** Findings are fixes, not critiques.

### What Review Is NOT

- Not a redesign opportunity — review validates, it does not reimagine.
- Not a feature request session — review checks what exists against what is specified.
- Not subjective — "I prefer" is not a valid review finding.
- Not a substitute for property tests — the Vitest `sadtest` job is the structural gate; review is the perceptual gate.

---

## 3. Review Tiers

Tier 1 is hard-fail. Tier 2 is a numeric scoring rubric. Both must pass before a page ships.

### Tier 1 — AI_Slop_Pattern Hard-Fail Checklist (Mandatory)

This tier reproduces the 14 items in Requirement 13 (Anti-AI-Slop Catalogue). **Any single fail in this tier blocks merge.** No score, no average, no negotiation. The page returns to implementation.

Run this tier first. If anything fails here, do not bother with Tier 2 — fix Tier 1 and re-review from scratch.

#### Tier-1 hard-fail criteria

| # | Pattern | Pass criterion | Fail example | Source |
|---|---|---|---|---|
| **T1-1** | Tailwind-default cobalt / indigo / violet accent | No occurrence of `indigo-500`, `violet-500`, `blue-500`, `#3B82F6`, `#5B8CFF`, or any default Tailwind blue/indigo/violet utility on a user-facing surface. The single accent is `--color-accent` (`oklch(0.78 0.13 78)`). | Any `bg-blue-500`, `text-indigo-500`, `border-violet-500`, or hard-coded `#3B82F6`/`#5B8CFF` on a rendered element. | Req 13.1, 1.3 |
| **T1-2** | Hue-shifting linear gradient backgrounds | No purple→blue, blue→cyan, or orange→pink linear gradient on hero, CTA, or card. The `theme.extend.backgroundImage` map for the redesign defines no multi-stop gradient utilities. | A `bg-gradient-to-r from-purple-600 to-blue-500` (or similar) on any surface. | Req 13.2, 2.7 |
| **T1-3** | `bg-clip-text` gradient text | No `bg-clip-text` utility on any heading, subhead, body element, or wordmark. The `text-gradient-primary` / `text-gradient-action` classes are deleted from `globals.css`. | A heading rendered with `bg-gradient-to-r from-X to-Y bg-clip-text text-transparent`. | Req 13.3, 3.7 |
| **T1-4** | Masked dotted / grid mesh background | No `bg-grid-faint`, `mask-fade-radial`, or `mask-fade-bottom` layered behind hero or card content. These classes are deleted from `globals.css`. | A hero section with `bg-grid-faint mask-fade-radial` overlaid. | Req 13.4, 5.7 |
| **T1-5** | Radial "aurora" / "spotlight" gradient blob | No `bg-aurora-action`, `bg-aurora-soft`, `bg-scene-hero`, or `bg-scene-auth` as a card-internal layer. These classes are deleted from `globals.css`. | A card with a radial-gradient blob in its `::before` or as a `bg-aurora-*` utility. | Req 13.5, 5.6 |
| **T1-6** | Conic-gradient halo around icon / logo tile | No `border-conic-soft` on any element. The class is deleted from `globals.css`. The Brand_Mark renders as the `public/brand/mark.svg` asset with no surrounding tile. | A logo wrapped in a rounded-square with a conic-gradient ring. | Req 13.6, 5.5, 1.4 |
| **T1-7** | Glassmorphism on a non-allow-listed surface | No `backdrop-blur-*` utility outside the global `Toaster` and the `Dialog` / `PageLoader` modal scrim (≤ 8px). | A `DashboardHeader` styled with `backdrop-blur-xl`. | Req 13.7, 5.4 |
| **T1-8** | Stagger-fade entrance animation | No `Stagger`, `StaggerItem`, `FadeIn`, or `framer-motion`-driven fade-up reveal on lists, hero sections, or proof grids. The `<Reveal>` primitive is the only retained motion primitive and is consumed only by `<Dialog>`. | A landing-page hero whose children fade-up with `framer-motion` on mount. | Req 13.8, 6.2, 6.3, 6.7 |
| **T1-9** | Ambient layer with perceptible gradient stop | If an `<AmbientBackground variant="hero">` is present, it is a single tonal element ≤ 8% lighter than `--color-canvas`, has no perceptible gradient stop or center, and is not layered with a grid or noise mesh. | An ambient layer with a visible center-fade or stacked grid pattern. | Req 13.9 |
| **T1-10** | Stacked AI-template combo | The composition does NOT combine "dark canvas + cobalt-blue accent + radial gradient + grid pattern + glow shadow" on the same screen. Even one of these on its own may be acceptable in isolation; the combination is a hard fail. | A dashboard hero with cobalt accent CTAs, an aurora blob, a grid mesh, and a glow-shadow CTA. | Req 13.10 |
| **T1-11** | Generic placeholder copy | No "Quiet deadlines. Loud savings.", "Trusted by thousands", "How it works", or "Get started in 60 seconds" as decorative copy unless explicitly approved as part of the redesign's voice work. | Any of the listed phrases appearing as a hero eyebrow or proof-points heading. | Req 13.11 |
| **T1-12** | Lucide icon as the brand mark in a tile | The header and auth shells render `<BrandMark>` (the SVG asset). No `lucide-react` icon (`ReceiptText`, `MailCheck`, etc.) wrapped in a rounded-square tile is used as the brand. | An auth page rendering `<ReceiptText>` inside a bordered tile next to the wordmark. | Req 13.12, 1.4, 1.5 |
| **T1-13** | More than one slop-stack element on one composition | The composition does NOT stack more than one of: tile-bordered icon, gradient text, conic halo, aurora background, dotted grid, glow shadow. | A landing hero with both a gradient heading and an aurora background, or a card with both a glow shadow and a conic-bordered icon. | Req 13.13 |
| **T1-14** | Landing hero exceeds the decorative-element budget | The landing page hero contains at most ONE of: ambient tonal background, structural rule line, single typographic mark. Two or more is a hard fail. | A landing hero with an ambient layer AND a structural rule AND a typographic mark. | Req 13.14 |

#### How to run Tier 1

For each page or composition under review, walk through items T1-1 through T1-14 in order. Mark each `pass` or `fail`. If any item is `fail`, halt — the page is not shippable. Document the failure, return to implementation, and re-review from scratch after the fix.

A complete Tier-1 pass is `T1-1 … T1-14: pass`. Anything else blocks.

### Tier 2 — Token Compliance (Automated, ≤30s per file)

This tier is enforced by lint and the property-test suite. A failure here is a structural defect.

| Check | Enforced by | Pass criterion |
|---|---|---|
| No raw color literals | `eslint-rules/no-raw-color` + `no-raw-color.property.test.ts` | Zero `#hex`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`, `oklab(` in `app/`, `components/`, `lib/` (lint exemptions only) |
| No arbitrary spacing | `eslint-rules/no-arbitrary-spacing` + `no-arbitrary-spacing.property.test.ts` | Zero `(p\|m\|gap\|space-[xy]\|top\|left\|right\|bottom\|inset\|w\|h\|min-w\|min-h\|max-w\|max-h\|text\|leading\|tracking\|grid-cols\|grid-rows)-[…]` outside the type-scale and grid layer |
| No deprecated identifiers | `no-deprecated.property.test.ts` | Zero references to `border-conic-soft`, `bg-scene-hero`, `bg-scene-auth`, `bg-aurora-action`, `bg-aurora-soft`, `bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`, `text-gradient-primary`, `text-gradient-action`, `bg-card-elevated`, `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red`, `shadow-card-sm`, `shadow-card-lift`, `shadow-glow-action`, `shadow-glow-soft`, `inner-hair` |
| No inline `style={{}}` colors | Manual check | Zero `style={{ color }}` / `style={{ background }}` in `components/` |
| Correct font usage | `font-config.example.test.ts` | Only `font-sans` (Geist) and `font-mono` (JetBrains Mono); no system fallbacks beyond what's defined in `tailwind.config.ts` |
| UI components used, not raw elements | Manual check | Buttons use `<Button>`; cards use `<Card>`; inputs use `<Input>` / `<Textarea>` |

A Tier-2 failure does not automatically hard-fail the way Tier-1 does, but a Tier-2 failure that survives after one fix attempt is treated as Tier-1 (the codebase is regressing).

### Tier 3 — Structural Review (Manual, per page)

Run after structural implementation, before polish. 3–5 minutes per page.

| Check | Pass criterion |
|---|---|
| Container width matches spec | Page uses the documented `max-w-{auth\|narrow\|content\|wide}` |
| Section order matches spec | Sections appear in documented order with correct gaps |
| Grid breakpoints correct | `<Grid cols={1\|2\|3}>` matches spec at each breakpoint |
| Spacing rhythm consistent | `gap-8` between top-level sections, `gap-6` between subsections, `gap-4` within cards, `gap-2` for label-to-input |
| Typography hierarchy clear | Largest element is the most important; type-scale steps used as documented |
| Semantic HTML used | `<main>`, single `<h1>`, `<nav>`, `<section>` present |
| No orphaned elements | Every element belongs to a logical group |

### Tier 4 — Interaction Review (Manual, per page)

Run after polish. 5–8 minutes per page.

| Element | Required states | Verification |
|---|---|---|
| Primary Button | hover, focus-visible, active, disabled | All four states pairwise visually distinct (Property 11) |
| Secondary Button | hover, focus-visible, active, disabled | All four states distinct |
| Ghost Button | hover, focus-visible, active, disabled | All four states distinct |
| Danger Button | hover, focus-visible, active, disabled | All four states distinct |
| Input / Textarea | resting, hover, focus, invalid, disabled | Border-color transition smooth; focus-visible includes a non-color signal (1px outline at 1px offset) |
| Card (interactive) | resting, hover, focus-visible | `border-border-strong -translate-y-0.5` on hover; `outline` on keyboard focus |
| Link | resting, hover, focus-visible | Color shift only; no underline added decoratively |
| Dialog | open, scrim click, Escape key | Closes both ways; focus trap holds |
| Touch targets | 44×44 CSS-px minimum | Verified at mobile viewport |

### Tier 5 — Cross-Page Consistency Review

Run after every 3 pages complete. 10–15 minutes.

| Check | Pass criterion |
|---|---|
| Same semantic level → same classes | All page titles use identical `--text-title-lg` step classes |
| Same component role → same variant | Primary CTAs use `<Button variant="primary" size="lg">` everywhere |
| Same container type → same width | Auth → `max-w-auth`; Profile → `max-w-narrow`; Settings/Test Extraction → `max-w-content`; Dashboard/Landing → `max-w-wide` |
| Same spacing pattern → same values | Section gaps identical across pages |
| Same interaction pattern → same behavior | Forms submit via same toast + loader vocabulary |
| Color usage consistent | Amber accent only for actions; semantic colors only for status |
| Motion consistent | Same durations, same easings, same transform/opacity properties |

---

## 4. Review Checklists

### Pre-commit checklist (every change)

```
□ npm run lint passes with --max-warnings=0
□ npm run typecheck passes
□ no-raw-color: zero raw color literals introduced
□ no-arbitrary-spacing: zero arbitrary-value Tailwind utilities introduced
□ No new dependencies without justification
□ No inline style attributes added
□ Icons are from lucide-react allow-list with strokeWidth={1.75}
```

### Page completion checklist

```
□ Tier-1 AI_Slop_Pattern hard-fail check: T1-1 through T1-14 all pass
□ Page spec read; composition matches
□ DESIGN.md anti-pattern checklist clean
□ All breakpoints verified (375px, 768px, 1280px)
□ Touch targets ≥44×44 CSS pixels
□ Focus-visible non-color signal present on every interactive element
□ Loading states use the redesigned <Loader> (no Loader2 spinner)
□ Error states use toast notifications
□ Empty states use the redesigned dashed-border pattern (no aurora overlay)
□ No horizontal scroll at any documented viewport
□ At most one indeterminate animation visible (RouteProgress OR a single attention pulse)
□ prefers-reduced-motion: every animation degrades via data-reduced-motion="static"
□ Semantic HTML structure correct (<main>, single <h1>, <nav>)
□ npm run sadtest passes for the touched files
□ design-system/<page>.md updated to match the shipped composition
```

### Component completion checklist

```
□ Uses cn() for className merging
□ Accepts className prop for extension
□ Spreads remaining props (...props)
□ Consumes only redesigned tokens (no raw values, no deprecated tokens)
□ Has all required interaction states
□ Accessible (aria-labels, roles, keyboard navigation)
□ Works at all breakpoints
□ Matches existing primitive patterns in components/ui/
□ No business logic in UI component (separation of concerns)
□ Prop signature preserved (or migration note authored in COMPONENT_PATTERNS.md)
```

---

## 5. Scoring Rubric (Tier 2)

After Tier 1 (AI_Slop_Pattern) passes cleanly, score the page across the categories below. **Tier-1 must pass first; no Tier-2 score can rescue a Tier-1 failure.**

### Scoring categories (1–5 each)

| Category | 1 (Fail) | 3 (Acceptable) | 5 (Premium) |
|---|---|---|---|
| **Token compliance** | Raw hex, arbitrary spacing, deprecated tokens | Mostly correct, 1–2 minor violations | Perfect token usage throughout |
| **Typography** | Random sizes, no hierarchy | Type scale followed, minor weight issues | Perfect hierarchy and rhythm |
| **Spacing** | Inconsistent, arbitrary values | Mostly correct, minor gap inconsistencies | Mathematical precision throughout |
| **Responsiveness** | Broken at mobile or tablet | Works but awkward at some widths | Elegant at every documented viewport |
| **Interactions** | Missing hover / focus / active / disabled states | Most states present | Every element has all four states + non-color focus signal |
| **Consistency** | Drifts from sibling pages | Mostly matches, minor drift | Indistinguishable craft level |

### Pass threshold

- **Hard-fail (Tier 1):** any single Tier-1 fail → page returns to implementation. No Tier-2 score is calculated.
- **Minimum to ship:** Tier-1 all pass AND every Tier-2 category ≥3 AND no category at 1.
- **Premium standard:** every Tier-2 category ≥4, with at least 3 categories at 5.
- **Target:** every Tier-2 category at 5.

### Failure actions

- **Tier-1 fail (any):** return to implementation (Step 3 of the lifecycle in `IMPLEMENTATION.md` § 4). Re-review from scratch after fix.
- **Tier-2 score 1 in any category:** return to implementation.
- **Tier-2 score 2 in any category:** return to critique pass.
- **Tier-2 score 3 in 3+ categories:** return to polish pass.
- **All Tier-2 scores ≥4 AND Tier-1 clean:** page complete.

---

## 6. Common Review Findings

### AI_Slop_Pattern Tier-1 Hits (Hardest to See, Costliest to Miss)

**Symptom:** Page looks "fine" but feels generic, like it could come from any AI-generated SaaS template.
**Cause:** A Tier-1 pattern slipped past structural review.
**Fix:** Walk T1-1 through T1-14 systematically. The most common live-code regressions are T1-1 (a leftover cobalt accent on a deprecated component), T1-7 (a `backdrop-blur-xl` on the header), and T1-12 (a `<ReceiptText>` icon-in-a-tile in a forgotten auth flow).

### Typography Drift (Common in Tier-2)

**Symptom:** Page "feels off" but nothing is obviously wrong.
**Cause:** Wrong font weight or size on 1–2 elements.
**Fix:** Compare every text element against the nine `--text-*` steps in `app/globals.css`.

### Spacing Inconsistency

**Symptom:** Page feels "uneven" or "cramped in places."
**Cause:** Mixed spacing values within the same section.
**Fix:** Audit all gap / padding values against the spacing scale.

### Missing Interaction States

**Symptom:** Page feels "flat" or "unresponsive."
**Cause:** Hover, focus-visible, active, or disabled state missing on an interactive element.
**Fix:** Walk every button, input, link, and interactive card against Tier-4.

### Container Width Mismatch

**Symptom:** Page feels "too wide" or "too narrow."
**Cause:** Wrong `max-w-*` token for the page type.
**Fix:** Check `REFERENCES.md` § 3 — auth pages use `max-w-auth`, profile uses `max-w-narrow`, settings/test-extraction use `max-w-content`, dashboard/landing use `max-w-wide`.

### Color Leakage

**Symptom:** Unexpected color accents appear where they should not.
**Cause:** Semantic tokens (`success`/`warning`/`danger`) used decoratively, or `text-info` consumed without need.
**Fix:** Semantic colors only for status; the amber accent only for actions.

### Decorative Excess

**Symptom:** A composition feels "AI-template-y" without any single obvious offender.
**Cause:** Two or more of the slop-stack items (tile-bordered icon, gradient text, conic halo, aurora background, dotted grid, glow shadow) coexist on the composition.
**Fix:** Cut to one at most (Requirement 13.13). For landing hero, cut to at most one of: ambient layer, structural rule, single typographic mark (Requirement 13.14).

---

## 7. Review Workflow for AI Agents

### Self-review protocol

AI agents must self-review before presenting work as complete:

```
1. STOP after implementation.
2. RUN npm run sadtest. Confirm all property tests for the touched files are green.
3. RUN npm run lint. Confirm no-raw-color and no-arbitrary-spacing pass.
4. WALK the Tier-1 hard-fail checklist (T1-1 through T1-14) item by item.
   If any item fails, return to implementation. Do not proceed.
5. WALK Tier-2 token compliance.
6. WALK Tier-3 structural review against the page spec.
7. VERIFY at 375px, 768px, and 1280px.
8. WALK Tier-4 interaction review.
9. CONFIRM no new patterns introduced without documentation.
10. ONLY THEN mark the page complete.
```

### Review output format

When reporting review results, use this structure:

```
## Review: <Page Name>

### Tier 1 — AI_Slop_Pattern Hard-Fail (PASS / FAIL)
- T1-1  Cobalt/indigo/violet accent: pass
- T1-2  Hue-shifting gradient bg: pass
- T1-3  bg-clip-text gradient text: pass
- T1-4  Masked grid mesh: pass
- T1-5  Aurora blob: pass
- T1-6  Conic halo: pass
- T1-7  Glassmorphism off allow-list: pass
- T1-8  Stagger-fade entrance: pass
- T1-9  Ambient gradient stop: pass
- T1-10 Stacked slop combo: pass
- T1-11 Generic placeholder copy: pass
- T1-12 Lucide brand-mark in tile: pass
- T1-13 >1 slop-stack item: pass
- T1-14 Landing decorative budget: pass

(If any FAIL → halt, do not score Tier 2.)

### Tier 2 — Scoring Rubric

- Token compliance: <score>/5
- Typography: <score>/5
- Spacing: <score>/5
- Responsiveness: <score>/5
- Interactions: <score>/5
- Consistency: <score>/5

### Overall: <total>/30
### Verdict: PASS / NEEDS WORK / FAIL
```

---

## 8. Escalation Rules

### When to deviate from a spec

Deviations are allowed only when:
1. The spec creates an accessibility violation.
2. The spec creates a usability problem at a specific breakpoint.
3. The spec conflicts with a higher-authority document (`DESIGN.md` or `VISUAL_IDENTITY.md`).
4. The spec is impossible with current primitives.

### Documenting deviations

```
DEVIATION: <what was changed>
REASON: <why the spec couldn't be followed>
AUTHORITY: <which higher rule takes precedence>
IMPACT: <what this changes about the page>
```

### When to update the spec vs. deviate

- **Update the spec** if the deviation should apply everywhere.
- **Document as deviation** if it's a one-off constraint specific to this page.
- **Never silently deviate** — undocumented deviations are bugs.

### When a property test fails

If a property test fails, triage:
1. **Test is wrong** → fix the test, document why.
2. **Implementation is wrong** → fix the code.
3. **Spec is wrong** → escalate to the user; never silently change the acceptance criteria.

A Tier-1 hard-fail rooted in spec ambiguity must be escalated, not papered over.

---

## 9. Anti-Patterns in Review

### Do not:

- ❌ Skip Tier 1 because "it looks fine."
- ❌ Score a page on Tier 2 while a Tier-1 item is failing.
- ❌ Average a Tier-1 fail with a Tier-2 5/5 to declare "good enough."
- ❌ Review only at desktop width.
- ❌ Accept "close enough" on token values.
- ❌ Review aesthetics before structure.
- ❌ Add new features during review.
- ❌ Compare to external products to justify a deviation (compare to specs only).
- ❌ Review multiple pages simultaneously (context switching causes missed issues).
- ❌ Trust memory — always re-read the spec during review.
- ❌ Skip cross-page consistency checks.
- ❌ Mark a page complete without walking the full Tier-1 checklist.

---

## 10. Continuous Improvement

### After every review cycle

1. Note any new Tier-1 hits encountered (these become regression candidates for future property tests).
2. Note any spec gaps that caused confusion.
3. Note any checklist items that should be added.
4. Update the relevant document — `DESIGN.md`, page specs, this file, or `VISUAL_IDENTITY.md`.

### Review metrics to track

- **Tier-1 fail rate per page review** — target: 0. Any non-zero is a regression signal.
- **Average Tier-2 score per page** — trending up = system working.
- **Most common finding category** — indicates systemic weakness.
- **Time to pass review** — decreasing = patterns maturing.
- **Number of deviations per page** — should be near zero.

---

## Document Maintenance

### When to update `REVIEW.md`

- A new AI_Slop_Pattern item is added to Requirement 13 (must be reflected in Tier 1).
- A new property test category lands and gates merge.
- The scoring rubric needs calibration.
- A new checklist item proves consistently valuable across multiple page reviews.

### When NOT to update `REVIEW.md`

- Page-specific review notes (those go in implementation tracking).
- One-off findings that won't recur.
- Subjective preferences that aren't backed by a documented design rule.
