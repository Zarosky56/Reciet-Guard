# REVIEW.md — Design Quality Assurance & Review Protocol

> **Role:** This document defines the systematic review process for ensuring every page, component, and interaction meets Receipt Guardian's premium quality bar. It provides checklists, scoring rubrics, and escalation paths for design decisions that fall outside documented rules.

> **Authority chain:** `REVIEW.md` operates alongside `IMPLEMENTATION.md`. Implementation defines *how to build*. Review defines *how to verify*.

---

## 1. Purpose

Design review exists because:
- Premium quality is invisible when done right and painfully obvious when wrong
- AI agents need explicit verification criteria, not subjective "looks good"
- Drift accumulates silently — review catches it before it compounds
- A single misaligned element degrades the entire page's perceived quality
- Consistency across pages requires systematic cross-referencing, not memory

This document answers: "How do I know this page is done?"

---

## 2. Review Philosophy

### Core Beliefs
1. **Review is not optional** — Every page passes through review before being marked complete.
2. **Review is objective** — Every check has a pass/fail criterion. No "it feels right."
3. **Review catches drift** — The primary enemy is not bugs but gradual inconsistency.
4. **Review is fast** — A well-structured checklist takes 5 minutes, not 30.
5. **Review is constructive** — Findings are fixes, not criticisms.

### What Review Is NOT
- Not a redesign opportunity — review validates, it doesn't reimagine
- Not a feature request session — review checks what exists against what's specified
- Not subjective — "I prefer" is not a valid review finding
- Not exhaustive — review checks the documented rules, not every possible issue

---

## 3. Review Tiers

### Tier 1: Token Compliance (Automated)
**Frequency:** Every file save
**Duration:** <30 seconds
**Scope:** Single component or page file

| Check | Pass Criterion | Fail Example |
|---|---|---|
| No raw hex colors | All colors use Tailwind tokens | `text-[#E8E8ED]` instead of `text-text-primary` |
| No arbitrary spacing | All spacing from the scale | `p-7`, `gap-5`, `mt-[13px]` |
| No inline styles | Zero `style={{}}` attributes | `style={{ color: 'red' }}` |
| Correct font usage | Only `font-sans` and `font-mono` | `font-serif`, custom font imports |
| No forbidden classes | No `bg-gradient-*`, `backdrop-blur-*` | Any gradient or blur utility |
| Component usage | UI components used, not raw elements | `<button className="...">` instead of `<Button>` |

### Tier 2: Structural Review (Manual, per-page)
**Frequency:** After implementation pass (Step 4 of lifecycle)
**Duration:** 3-5 minutes
**Scope:** Full page

| Check | Pass Criterion |
|---|---|
| Container width matches spec | Page uses correct `max-w-*` from page spec |
| Section order matches spec | Sections appear in documented order |
| Grid breakpoints correct | Columns match spec at each breakpoint |
| Spacing rhythm consistent | `gap-6` between sections, `gap-4` within |
| Typography hierarchy clear | Largest = most important, scale followed exactly |
| Semantic HTML used | `<main>`, `<nav>`, `<section>`, `<h1>`-`<h3>` present |
| No orphaned elements | Every element belongs to a logical group |

### Tier 3: Interaction Review (Manual, per-page)
**Frequency:** After polish pass (Step 7 of lifecycle)
**Duration:** 5-8 minutes
**Scope:** All interactive elements on page

| Element Type | Required States | Verification |
|---|---|---|
| Primary Button | hover, focus-visible, active, disabled | All 4 states visually distinct |
| Secondary Button | hover, focus-visible, active, disabled | All 4 states visually distinct |
| Ghost Button | hover, focus-visible, active, disabled | All 4 states visually distinct |
| Input | default, focus, filled, disabled | Border transitions smoothly |
| Card (interactive) | default, hover | Lifts on hover, border brightens |
| Link | default, hover, focus-visible | Color shifts, no underline |
| Dialog | open, backdrop click, escape key | Closes correctly both ways |

### Tier 4: Cross-Page Consistency Review
**Frequency:** After every 3 pages completed
**Duration:** 10-15 minutes
**Scope:** All completed pages compared

| Check | Pass Criterion |
|---|---|
| Same semantic level = same classes | All page titles use identical classes across pages |
| Same component role = same variant | Primary CTAs use same Button variant everywhere |
| Same container type = same width | All auth pages use `max-w-md`, all data pages use `max-w-6xl` |
| Same spacing pattern = same values | Section gaps identical across pages |
| Same interaction pattern = same behavior | All forms submit the same way |
| Color usage consistent | Blue only for actions, never decorative |
| Motion consistent | Same durations, same easing, same properties |

---

## 4. Review Checklists

### Pre-Commit Checklist (Every Change)
```
□ No TypeScript errors (tsc --noEmit passes)
□ No ESLint warnings (eslint passes with --max-warnings=0)
□ No raw hex colors in component files
□ No arbitrary spacing values
□ No inline styles
□ All interactive elements use UI components
□ Icons from lucide-react only
□ No new dependencies added without justification
```

### Page Completion Checklist
```
□ Page spec read and requirements met
□ DESIGN.md anti-patterns checked (§10)
□ All breakpoints verified (mobile, tablet, desktop, ultrawide)
□ Touch targets ≥44px on all interactive elements
□ Focus-visible states on all interactive elements
□ Loading states for all async operations
□ Error states handled (toast notifications)
□ Empty states present where applicable
□ No horizontal scroll at any viewport width
□ Only one animated element on page (if any)
□ prefers-reduced-motion respected
□ Semantic HTML structure correct
□ Page title (document.title) set appropriately
```

### Component Completion Checklist
```
□ Uses cn() for className merging
□ Accepts className prop for extension
□ Spreads remaining props (...props)
□ Uses correct Tailwind tokens (no raw values)
□ Has all required interaction states
□ Accessible (aria-labels, roles, keyboard navigation)
□ Works at all breakpoints
□ Matches existing component patterns in components/ui/
□ No business logic in UI component (separation of concerns)
```

---

## 5. Scoring Rubric

Each page receives a quality score after review. The score determines whether the page can be marked complete.

### Scoring Categories (1-5 each)

| Category | 1 (Fail) | 3 (Acceptable) | 5 (Premium) |
|---|---|---|---|
| **Token Compliance** | Raw hex, arbitrary spacing | Mostly correct, 1-2 violations | Perfect token usage throughout |
| **Typography** | Random sizes, no hierarchy | Correct scale, minor weight issues | Perfect hierarchy, rhythm, scale |
| **Spacing** | Inconsistent, arbitrary values | Mostly correct, minor gaps | Mathematical precision throughout |
| **Responsiveness** | Broken at mobile or tablet | Works but awkward at some widths | Elegant at every viewport |
| **Interactions** | Missing hover/focus states | Most states present | Every element has complete states |
| **Consistency** | Doesn't match sibling pages | Mostly matches, minor drift | Indistinguishable quality level |

### Pass Threshold
- **Minimum to ship:** All categories ≥3, no category at 1
- **Premium standard:** All categories ≥4, at least 3 categories at 5
- **Target:** All categories at 5

### Failure Actions
- Score 1 in any category → return to implementation (Step 4)
- Score 2 in any category → return to critique (Step 6)
- Score 3 in 3+ categories → return to polish (Step 7)
- All scores ≥4 → page complete

---

## 6. Common Review Findings

### Typography Drift (Most Common)
**Symptom:** Page "feels off" but nothing is obviously wrong.
**Cause:** Wrong font weight or size on 1-2 elements.
**Fix:** Compare every text element against DESIGN.md §3 type scale.

### Spacing Inconsistency (Second Most Common)
**Symptom:** Page feels "uneven" or "cramped in places."
**Cause:** Mixed spacing values within the same section.
**Fix:** Audit all gap/padding values against DESIGN.md §4 spacing scale.

### Missing Interaction States
**Symptom:** Page feels "flat" or "unresponsive."
**Cause:** Hover, focus, or active states missing on interactive elements.
**Fix:** Check every button, input, link, and card against the interaction matrix.

### Container Width Mismatch
**Symptom:** Page feels "too wide" or "too narrow."
**Cause:** Wrong `max-w-*` value for the page type.
**Fix:** Check page spec for correct container width.

### Color Leakage
**Symptom:** Page has unexpected color accents.
**Cause:** Semantic colors (success/warning/danger) used decoratively.
**Fix:** Ensure colors are only used for their documented semantic purpose.

---

## 7. Review Workflow for AI Agents

### Self-Review Protocol
AI agents must self-review before presenting work as complete:

```
1. STOP after implementation
2. READ the page spec one more time
3. CHECK every element against the spec
4. VERIFY at 3 breakpoints (375px, 768px, 1280px)
5. RUN through the anti-pattern list (DESIGN.md §10)
6. CONFIRM no new patterns introduced without documentation
7. COMPARE with previously completed pages for consistency
8. ONLY THEN mark the page as complete
```

### Review Output Format
When reporting review results, use this structure:

```
## Review: [Page Name]

### Token Compliance: [Score]/5
- [Finding or "No issues"]

### Typography: [Score]/5
- [Finding or "No issues"]

### Spacing: [Score]/5
- [Finding or "No issues"]

### Responsiveness: [Score]/5
- [Finding or "No issues"]

### Interactions: [Score]/5
- [Finding or "No issues"]

### Consistency: [Score]/5
- [Finding or "No issues"]

### Overall: [Total]/30
### Verdict: [PASS / NEEDS WORK / FAIL]
```

---

## 8. Escalation Rules

### When to Deviate from Specs
Sometimes a spec doesn't account for a real-world constraint. Deviations are allowed when:
1. The spec creates an accessibility violation
2. The spec creates a usability problem at a specific breakpoint
3. The spec conflicts with a higher-authority document (DESIGN.md)
4. The spec is physically impossible with current components

### How to Document Deviations
```
DEVIATION: [What was changed]
REASON: [Why the spec couldn't be followed]
AUTHORITY: [Which higher rule takes precedence]
IMPACT: [What this changes about the page]
```

### When to Update Specs vs. Deviate
- **Update the spec** if the deviation improves the system and should apply everywhere
- **Document as deviation** if it's a one-off constraint specific to this page
- **Never silently deviate** — undocumented deviations are bugs

---

## 9. Anti-Patterns in Review

### DO NOT:
- ❌ Skip review because "it looks fine"
- ❌ Review only at desktop width
- ❌ Accept "close enough" on token values
- ❌ Review aesthetics before structure
- ❌ Add new features during review (review validates, doesn't create)
- ❌ Compare to external products during review (compare to specs only)
- ❌ Review multiple pages simultaneously (context switching causes missed issues)
- ❌ Trust memory — always re-read the spec during review
- ❌ Skip cross-page consistency checks
- ❌ Mark a page complete without running through the full checklist

---

## 10. Continuous Improvement

### After Every Review Cycle
1. Note any new anti-patterns discovered
2. Note any spec gaps that caused confusion
3. Note any checklist items that should be added
4. Update relevant documents (DESIGN.md, page specs, or this file)

### Review Metrics to Track
- Average score per page (trending up = system working)
- Most common finding category (indicates systemic weakness)
- Time to pass review (decreasing = patterns maturing)
- Number of deviations per page (should be near zero)

---

## Document Maintenance

### When to Update REVIEW.md
- New review finding becomes common (add to §6)
- New component type needs interaction states defined
- Scoring rubric needs calibration
- New checklist item proves consistently valuable

### When NOT to Update REVIEW.md
- Page-specific review notes (those go in implementation tracking)
- One-off findings that won't recur
- Subjective preferences that aren't backed by design rules
