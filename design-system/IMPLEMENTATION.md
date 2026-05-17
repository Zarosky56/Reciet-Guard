# IMPLEMENTATION.md — AI Frontend Operating Manual

> **Role:** This document governs how AI agents (and human developers) execute UI/UX implementation across Receipt Guardian. It defines workflows, quality gates, tool usage, and anti-drift rules. Every implementation decision must be traceable to a rule in this file.

> **Authority chain:** `IMPLEMENTATION.md` → `DESIGN.md` → Page specs → Component source

---

## 1. Purpose

IMPLEMENTATION.md is the operational layer between design intent and shipped code. DESIGN.md defines *what* the app should look like. IMPLEMENTATION.md defines *how* to get there — the step-by-step process, the quality checks, the tool invocation rules, and the coordination strategy that prevents pages from drifting apart during iterative development.

This file exists because:
- AI agents need explicit workflow instructions, not just design principles
- Multi-page redesigns drift without a coordination layer
- Premium quality emerges from structured critique loops, not one-shot generation
- shadcn/ui + Impeccable skill + manual refinement must work as a unified system

---

## 2. Workflow Philosophy

### Core Tenets
1. **Iterative refinement over one-shot generation** — Never ship a first draft. Every page goes through implementation → critique → refinement → polish.
2. **Precision over decoration** — Fix spacing and hierarchy before adding visual flair. A perfectly spaced minimal layout beats a decorated messy one.
3. **Consistency over experimentation** — New pages must feel like they belong. Reuse patterns. Match the existing rhythm. Experimentation happens in the design docs, not in production code.
4. **Premium restraint over flashy visuals** — If it feels like a template, it's wrong. Premium SaaS is quiet, intentional, and calm.

### What "Premium" Means in Practice
- Every element has a reason to exist
- Spacing is mathematically consistent (no `p-7`, no `gap-[13px]`)
- Typography follows the scale exactly
- Only one accent color appears on screen
- Motion is so subtle you barely notice it
- The page feels calm even when dense with data

---

## 3. Global Workflow — The 9-Step Lifecycle

Every page implementation must follow this sequence. Skip no step. Each step produces verifiable output.

### Step 1: Read Relevant Specs
**Input:** Page name (e.g., "dashboard")
**Actions:**
1. Read `design-system/DESIGN.md` — global tokens, rules, anti-patterns
2. Read `design-system/<page>.md` — page-specific layout, components, behavior
3. Read `design-system/navigation.md` — if the page has navigation elements
4. Read the existing page source (`app/<route>/page.tsx`) and its components

**Output:** Mental model of what exists vs what the spec demands.

### Step 2: Audit Current Implementation
**Actions:**
1. List every component used on the page
2. Check each component against DESIGN.md token rules
3. Identify spacing inconsistencies (measure against the spacing scale)
4. Check typography against the type scale
5. Verify responsive behavior at 3 breakpoints (mobile, tablet, desktop)
6. Note any anti-patterns from DESIGN.md §10 or the page spec

**Output:** A prioritized list of weaknesses. Example:
```
- Hero spacing uses py-14 but spec says py-20 on desktop
- Card padding is p-4 but spec says p-5 for content cards
- Missing focus-visible on search input
- Mobile CTA buttons stack incorrectly
```

### Step 3: Identify Weaknesses
**Actions:**
1. Categorize weaknesses by severity:
   - **Critical:** Wrong tokens, broken responsiveness, accessibility failures
   - **High:** Inconsistent spacing, wrong typography level, missing hover states
   - **Medium:** Suboptimal component choice, missing empty state
   - **Low:** Polish details, micro-interactions
2. Order fixes by priority (critical → high → medium → low)

**Output:** Ordered fix list. Do not fix low-priority items before critical ones.

### Step 4: Implement Structural Redesign
**Actions:**
1. Fix layout structure first (grid, flex, container widths)
2. Apply correct spacing tokens (gap, padding, margin)
3. Replace raw elements with UI components (Button, Card, Input, etc.)
4. Apply correct color tokens (no raw hex)
5. Ensure semantic HTML (main, nav, section, h1-h3)

**Rules:**
- Change one section at a time. Verify before moving to the next.
- Never delete working functionality to "redesign" — enhance, don't replace.
- Keep existing data flow and API calls intact.

**Output:** Structurally correct page with all tokens applied.

### Step 5: Improve Responsiveness
**Actions:**
1. Test mobile layout (<640px): single column, full-width inputs, stacked sections
2. Test tablet layout (640-1024px): intermediate breakpoints, 2-column grids
3. Test desktop layout (1024px+): full multi-column, max-width constraints
4. Verify touch targets ≥44px on all interactive elements
5. Check that no content is hidden or truncated at any breakpoint
6. Verify ultrawide behavior (content centered, background solid)

**Output:** Page that works correctly at all viewport widths.

### Step 6: Run Critique Pass
**Actions:**
1. Invoke `/impeccable critique` on the page
2. Review every issue raised
3. Fix critical and high-severity issues
4. Document any intentional deviations from critique suggestions

**Output:** Critiqued and corrected page.

### Step 7: Run Polish Pass
**Actions:**
1. Invoke `/impeccable polish` on the page
2. Refine hover states, focus rings, transitions
3. Verify motion duration tokens (150ms buttons, 200ms cards)
4. Check that `prefers-reduced-motion` is respected
5. Ensure toast notifications use correct position and styling
6. Verify loading states (spinners, disabled buttons, skeleton if needed)

**Output:** Polished page with refined interactions.

### Step 8: Validate Consistency with DESIGN.md
**Actions:**
1. Run through the DESIGN.md §10 anti-pattern checklist
2. Verify all colors are Tailwind tokens (no raw hex)
3. Verify all spacing values are from the spacing scale
4. Verify typography matches the type scale
5. Check that only one animated element exists on the page
6. Confirm no gradients, no glassmorphism, no decorative elements

**Output:** DESIGN.md-compliant page.

### Step 9: Move to Next Page
**Actions:**
1. Mark the page as "implemented" in your tracking
2. Note any reusable patterns created during this implementation
3. Begin Step 1 for the next page

**Output:** Clean handoff to next implementation cycle.

---

## 4. Impeccable Command System

The Impeccable skill provides specialized UI commands. Use them at the right time, in the right order. Never skip critique before polish.

### `/impeccable critique`
**When to use:** After structural implementation (Step 6), before polish.
**What it does:** Analyzes the page for UX issues, visual hierarchy problems, accessibility gaps, cognitive load, and anti-patterns.
**Expected outcome:** A list of issues ranked by severity with suggested fixes.
**Best timing:** Immediately after the page renders correctly at all breakpoints.
**Common use cases:**
- New page just implemented
- Existing page being redesigned
- Page feels "off" but you can't identify why
**Anti-patterns:**
- ❌ Using critique before the page is structurally complete
- ❌ Using critique as a substitute for reading DESIGN.md
- ❌ Ignoring critique results because "it looks fine to me"

### `/impeccable polish`
**When to use:** After critique fixes are applied (Step 7).
**What it does:** Refines micro-interactions, hover states, transitions, spacing subtleties, and visual polish details.
**Expected outcome:** Specific CSS/animation refinements that elevate the page from "functional" to "premium."
**Best timing:** After all critique issues are resolved.
**Common use cases:**
- Page is functionally correct but feels "flat"
- Hover states need refinement
- Transitions feel abrupt
- Card interactions need more tactility
**Anti-patterns:**
- ❌ Using polish before critique (polish won't fix structural issues)
- ❌ Applying polish suggestions that violate DESIGN.md motion rules
- ❌ Adding animations that weren't suggested

### `/impeccable typeset`
**When to use:** When typography feels inconsistent or the hierarchy is unclear.
**What it does:** Analyzes and refines the typographic system — font sizes, weights, line heights, and hierarchy.
**Expected outcome:** A consistent type ramp with clear visual hierarchy.
**Best timing:** After layout is stable, before final polish.
**Common use cases:**
- Multiple font sizes feel randomly chosen
- Heading hierarchy is unclear
- Line heights create uneven rhythm
**Anti-patterns:**
- ❌ Using typeset before the layout structure is finalized
- ❌ Deviating from the DESIGN.md type scale based on typeset suggestions

### `/impeccable shape`
**When to use:** When component shapes, border radii, or visual forms feel inconsistent.
**What it does:** Harmonizes border radii, component proportions, and visual shapes across the page.
**Expected outcome:** Consistent visual language where all elements feel like they belong to the same family.
**Best timing:** After component implementation, before polish.
**Common use cases:**
- Mixed border radii on cards vs buttons vs inputs
- Inconsistent component sizing
- Visual weight of elements feels unbalanced
**Anti-patterns:**
- ❌ Using shape before components are correctly implemented
- ❌ Changing border radii away from DESIGN.md tokens

### `/impeccable craft`
**When to use:** For complex UI components that need careful construction (modals, dropdowns, data displays).
**What it does:** Provides detailed implementation guidance for specific UI patterns.
**Expected outcome:** Production-grade component code with proper accessibility, states, and edge cases.
**Best timing:** When building a new complex component from scratch.
**Common use cases:**
- Building a new Dialog variant
- Creating a data table component
- Implementing a dropdown menu
**Anti-patterns:**
- ❌ Using craft for simple components (Button, Input, Badge)
- ❌ Using craft instead of reusing existing components

---

## 5. shadcn/ui Usage Rules

### Preferred Components (Already Implemented)
| Component | File | Use For |
|---|---|---|
| **Button** | `components/ui/button.tsx` | All clickable actions. 4 variants, 4 sizes. |
| **Card** | `components/ui/card.tsx` | All content containers. Card, CardHeader, CardContent, CardFooter. |
| **Badge** | `components/ui/badge.tsx` | Status indicators, tags, labels. |
| **Input** | `components/ui/input.tsx` | Text inputs, search fields. |
| **Textarea** | `components/ui/input.tsx` | Multi-line text input. |
| **Dialog** | `components/ui/dialog.tsx` | Modals, confirmations. |

### Extension Strategy
- **Add variants via CVA** — Button variants are defined in `buttonVariants`. New variants follow the same pattern.
- **Extend via `className`** — 90% of customizations should be `className` overrides, not component changes.
- **New components** — Create in `components/ui/` following the existing pattern (minimal wrapper, `className` passthrough, `cn()` merging).

### Customization Boundaries
- **DO:** Change padding, colors (via tokens), icon sizes, border styles via `className`
- **DON'T:** Change the component's core structure, remove accessibility attributes, change the CVA base styles
- **DO:** Add new variants to CVA when a pattern repeats 3+ times
- **DON'T:** Create one-off variants that duplicate existing ones

### Consistency Requirements
- All buttons must use the Button component. No raw `<button>` with Tailwind classes.
- All cards must use the Card component. No raw `<div>` with card-like styling.
- All inputs must use Input or Textarea. No raw `<input>` with custom classes.
- Icons must come from `lucide-react`. No other icon library.

### Accessibility Expectations
- Every interactive element must have a visible focus state
- Icons without text must have `aria-hidden="true"` and the parent must have `aria-label`
- Dialogs must trap focus and close on Escape
- Form inputs must have associated labels

### Achieving Premium SaaS Aesthetics with shadcn/ui
shadcn/ui provides functional components. Premium feel comes from:
1. **Spacing** — More generous than default. Use `p-5` or `p-6` instead of `p-4`.
2. **Typography** — Inter + JetBrains Mono. Consistent scale. No default system fonts.
3. **Color restraint** — Dark theme with one accent. No rainbow of semantic colors.
4. **Border subtlety** — `border-border` (#2A2A3A) is barely visible against `bg-surface` (#14141B). This creates depth without heavy lines.
5. **Motion precision** — 150ms for buttons, 200ms for cards. No bouncy springs.

---

## 6. Page-by-Page Execution Strategy

### Why Not Redesign All at Once
- **Context window limits** — AI agents can't hold all pages in memory simultaneously
- **Pattern discovery** — Each page reveals reusable patterns for the next
- **Quality degradation** — Simultaneous redesigns drift apart without a reference implementation
- **Testing burden** — One page at a time means one thing to verify

### Incremental Redesign Order
Redesign pages in this order to build patterns progressively:

1. **Landing page** (`/`) — Simplest page, establishes the public-facing aesthetic
2. **Login page** (`/login`) — Auth pattern, card-centric layout
3. **Signup page** (`/signup`) — Reuses login patterns, minor variations
4. **Dashboard** (`/dashboard`) — Most complex, benefits from patterns established above
5. **Test extraction** (`/test-extraction`) — Technical page, minimal design
6. **Settings** (planned) — Uses patterns from dashboard + auth
7. **Profile** (planned) — Uses patterns from settings

### How to Prevent Design Drift
1. **Complete one page fully before starting the next** — A half-done page can't serve as a reference.
2. **Extract reusable patterns** — After each page, note what could be reused (e.g., "the stat card pattern from dashboard should be used in settings").
3. **Cross-reference** — When implementing page N, check pages 1 through N-1 for relevant patterns.
4. **Re-audit periodically** — After every 3 pages, re-audit the first page against DESIGN.md to catch drift.

### How to Reuse Existing Patterns
- **Copy the pattern, not the code** — Understand *why* a pattern works, then apply the principle.
- **Match spacing exactly** — If dashboard uses `gap-6` between sections, settings must too.
- **Match component variants** — If landing uses `size="lg"` for hero CTAs, don't use `size="default"` for equivalent prominence elsewhere.
- **Match typography levels** — If dashboard section titles use `text-xl font-semibold`, all section titles across all pages must match.

---

## 7. Critique & Polish Loops

### The 5-Pass Quality System

#### Pass 1: Implementation
**Goal:** Functional, structurally correct page.
**Checklist:**
- [ ] All sections present and in correct order
- [ ] All components use correct UI library components
- [ ] All tokens applied (colors, spacing, typography)
- [ ] Data flows work (API calls, state management)
- [ ] No console errors

#### Pass 2: Critique
**Goal:** Identify UX and hierarchy issues.
**Method:** `/impeccable critique`
**Checklist:**
- [ ] Visual hierarchy is clear (most important → least important)
- [ ] Cognitive load is manageable (not too many elements competing)
- [ ] Information architecture makes sense
- [ ] Accessibility issues identified
- [ ] Anti-patterns flagged

#### Pass 3: Refinement
**Goal:** Fix all critique issues.
**Checklist:**
- [ ] All critical issues resolved
- [ ] All high-severity issues resolved
- [ ] Medium issues addressed or documented as intentional
- [ ] No new issues introduced by fixes
- [ ] Re-test all breakpoints after changes

#### Pass 4: Responsiveness
**Goal:** Perfect behavior at all viewport sizes.
**Checklist:**
- [ ] Mobile (<640px): single column, full-width inputs, readable text
- [ ] Tablet (640-1024px): intermediate layouts, no awkward breaks
- [ ] Desktop (1024px+): full layout, max-width constraints
- [ ] Ultrawide: centered content, no stretching
- [ ] Touch targets ≥44px
- [ ] No horizontal scroll at any breakpoint

#### Pass 5: Final Polish
**Goal:** Premium feel through micro-interactions.
**Method:** `/impeccable polish`
**Checklist:**
- [ ] Hover states are subtle and consistent
- [ ] Focus rings are visible but not aggressive
- [ ] Transitions use correct duration tokens
- [ ] Button press feedback (`active:scale-[0.98]`)
- [ ] Loading states are non-jarring
- [ ] Empty states are helpful, not punishing
- [ ] Toast notifications appear correctly
- [ ] `prefers-reduced-motion` disables all motion

### How Premium Quality Emerges
Premium quality is the accumulation of correct micro-decisions:
- A card that lifts 2px on hover instead of 4px
- A border that's `#2A2A3A` instead of `#333`
- A gap of `24px` instead of `20px`
- A font weight of `600` instead of `700`
- A transition of `150ms` instead of `300ms`

No single decision makes the page premium. The sum of all correct decisions does. The critique → refinement → polish loop ensures every decision is examined.

---

## 8. Responsiveness Workflow

### Mobile-First Implementation
1. **Start at 375px viewport** (iPhone SE) — the most constrained width
2. **Build single-column layout** — everything stacks vertically
3. **Full-width inputs and buttons** — no fixed widths on mobile
4. **`px-6` horizontal padding** — 24px side margins
5. **Test at 375px, 390px, 414px** — common mobile widths

### Breakpoint Validation
For each breakpoint, verify:
| Breakpoint | Check |
|---|---|
| <640px | Single column, readable text, tappable targets |
| ≥640px (sm) | 2-column grids appear where specified |
| ≥768px (md) | Horizontal nav, side-by-side CTAs |
| ≥1024px (lg) | Full multi-column, max-width constraints active |
| ≥1280px (xl) | Content centered, no stretching |

### Touch Ergonomics
- **Minimum touch target: 44x44px** — Apple HIG standard
- **Button heights:** `h-10` (40px) minimum, `h-11` (44px) for primary actions
- **Spacing between tappable elements:** `gap-2` minimum (8px)
- **No hover-dependent critical actions** — everything must work with touch alone
- **No dense button groups** on mobile — if buttons wrap, that's fine

### Ultrawide Layout Handling
- **Content stays centered** — `max-w-{n} mx-auto`
- **Background remains solid `bg-bg`** — no alternating sections
- **No full-bleed content** — text readability degrades on ultrawide
- **No horizontal centering tricks** — just `mx-auto` on the container

### Spacing Adaptation Rules
- **Page padding:** `px-6` mobile → `md:px-8` tablet+
- **Section gaps:** Same at all breakpoints (`gap-6` is always `gap-6`)
- **Card padding:** Same at all breakpoints (don't reduce padding on mobile)
- **Grid gaps:** Same at all breakpoints (don't tighten gaps on mobile)

---

## 9. Motion & Interaction Workflow

### When to Add Animations
- **Only during the polish pass (Pass 5)** — Never during structural implementation
- **Only when DESIGN.md explicitly allows it** — Check §7 Motion System
- **Only one animated element per page** — Currently: red pulse on urgency badges

### How Motion Should Remain Subtle
- **Duration:** 150ms for micro-interactions, 200ms for larger transitions
- **Easing:** CSS default `ease` (no custom cubic-bezier unless specified)
- **Properties:** Only `transform` and `opacity` (GPU-composited, no layout thrashing)
- **Distance:** Cards lift `2px` (0.5 Tailwind unit), not `4px` or more

### Interaction Refinement Process
1. **Identify all interactive elements** on the page
2. **Verify each has a hover state** (desktop) that matches its variant
3. **Verify each has a focus-visible state** (keyboard)
4. **Verify each has an active state** (press feedback)
5. **Verify each has a disabled state** (during async operations)
6. **Check that no element is missing any of these states**

### Hover/Focus Behavior Expectations
| Element | Hover | Focus-Visible | Active | Disabled |
|---|---|---|---|---|
| Primary Button | `brightness-110` | `outline-2 outline-border-focus` | `scale-[0.98]` | `opacity-50` |
| Secondary Button | `bg-surface-hover` | Same | `scale-[0.98]` | `opacity-50` |
| Ghost Button | `text-text-primary` | Same | `scale-[0.98]` | `opacity-50` |
| Danger Button | `bg-red-500/15` | Same | `scale-[0.98]` | `opacity-50` |
| Card | `-translate-y-0.5 border-border-focus` | N/A (not focusable) | N/A | N/A |
| Input | N/A | `border-border-focus` | N/A | N/A |
| Link | `text-blue-300` | `outline-2 outline-border-focus` | N/A | N/A |

---

## 10. Anti-Drift Rules

### Preventing Inconsistent Layouts
- **Same page type = same container width** — All auth pages use `max-w-md`. All data pages use `max-w-6xl`.
- **Same section role = same spacing** — All "major section" separators use `gap-6`.
- **Same component role = same variant** — All primary CTAs use `variant="default" size="lg"`.

### Preventing Typography Drift
- **Lock the type scale** — DESIGN.md §3 is the only allowed type scale. No `text-[15px]`, no `text-base` where `text-sm` is specified.
- **Same semantic level = same classes** — All page titles use `text-2xl font-semibold`. All section titles use `text-xl font-semibold`.
- **No font size experimentation** — If a heading "feels too big," the problem is spacing around it, not the font size.

### Preventing Random Visual Experimentation
- **No "let me try something" moments** — Every visual decision must reference a rule in DESIGN.md or a page spec.
- **No copying from other projects** — Receipt Guardian has its own design language. Stripe's button style is not our button style.
- **No "this looks cool" additions** — Cool is the enemy of consistent. Consistent is premium.

### Preventing Component Inconsistency
- **One Button component** — No alternative button implementations. If you need a new variant, add it to CVA.
- **One Card component** — No alternative card implementations. If you need a different card style, use `className`.
- **One set of icons** — Only `lucide-react`. No mixing icon libraries.

### Preventing Excessive Decoration
- **Count decorative elements** — If you can count more than 0, you have too many.
- **The "remove it" test** — If removing an element doesn't hurt usability, remove it.
- **The "template" test** — If the page looks like it came from a Tailwind template, it needs less decoration.

### Preventing AI-Generated Template Aesthetics
AI models default to certain patterns that must be actively resisted:
- ❌ Gradient hero sections with centered text
- ❌ Feature grids with emoji icons
- ❌ "How it works" sections with numbered steps
- ❌ Testimonial carousels
- ❌ Footer with 4-column link lists
- ❌ Animated counters/statistics
- ❌ Glassmorphism cards
- ❌ Purple/blue gradient CTAs
- ❌ "Trusted by thousands" social proof

If an AI generates any of these, it's wrong. Refer to DESIGN.md §10.

---

## 11. Priority Hierarchy

When making implementation decisions, resolve conflicts using this order:

| Priority | Concern | Example Decision |
|---|---|---|
| **1. Usability** | Can the user accomplish their task? | A button must be tappable before it's beautiful. |
| **2. Hierarchy** | Is the visual importance clear? | The primary CTA must dominate the secondary. |
| **3. Responsiveness** | Does it work on all devices? | Mobile layout must work before desktop is perfected. |
| **4. Typography** | Is the text system correct? | Font sizes and weights must match the scale. |
| **5. Spacing** | Is the rhythm consistent? | Gaps and padding must use the spacing scale. |
| **6. Interaction quality** | Do hover/focus/active states work? | Every interactive element must have complete states. |
| **7. Motion** | Are animations subtle and meaningful? | Only add motion after everything above is correct. |
| **8. Decoration** | Are there unnecessary elements? | Remove decoration. Then remove more. |

**Rule:** Never sacrifice a higher priority for a lower one. A beautiful button that doesn't work is worse than an ugly button that does.

---

## 12. Example Workflows

### Landing Page Redesign Workflow
```
1. Read design-system/DESIGN.md
2. Read design-system/landing.md
3. Read app/page.tsx (current implementation)
4. Audit: check spacing, typography, component usage
5. Identify: hero spacing off, CTA button sizes inconsistent
6. Fix: apply correct py-14 md:py-20, use size="lg" for both CTAs
7. Test: mobile (single col), tablet (side-by-side CTAs), desktop (full width)
8. /impeccable critique → fix issues
9. /impeccable polish → refine interactions
10. Validate against DESIGN.md §10 anti-patterns
11. Mark landing page complete
```

### Dashboard Refinement Workflow
```
1. Read design-system/dashboard.md
2. Read components/receipts/receipt-dashboard.tsx
3. Audit: check all 5 sections, verify grid breakpoints
4. Identify: stat cards need font-mono, empty state needs border-dashed
5. Fix: apply JetBrains Mono to stat values, add border-dashed to empty state
6. Test: mobile (stacked), tablet (2-col receipts), desktop (3-col receipts)
7. /impeccable critique → fix hierarchy issues
8. /impeccable polish → refine card hovers, button states
9. Validate: only one animation (red pulse), no gradients, correct tokens
10. Mark dashboard complete
```

### Critique Loop Workflow
```
1. Complete structural implementation of a page
2. Verify it renders at all breakpoints
3. Run /impeccable critique
4. Review each issue:
   - Critical: fix immediately
   - High: fix before moving on
   - Medium: fix or document
   - Low: note for polish pass
5. Re-test after fixes
6. Run /impeccable critique again if major changes were made
7. Proceed to polish pass
```

### Polish Workflow
```
1. All critique issues resolved
2. Run /impeccable polish
3. Apply suggested refinements that:
   - Match DESIGN.md motion rules
   - Don't add new animations beyond the allowed limit
   - Don't change spacing or typography
4. Manually verify:
   - Every button has hover + focus-visible + active + disabled states
   - Every card has hover lift (if interactive)
   - Every input has focus border transition
   - Toast notifications appear at bottom-right
5. Final check: does the page feel calm and intentional?
```

---

## 13. Premium UX Standards

### What Makes UI Feel Premium
Premium UI is defined by what's *absent*, not what's *present*:
- **Absent:** Gradients, shadows, decorations, emoji, multiple colors, animations, clutter
- **Present:** Perfect spacing, consistent typography, clear hierarchy, one accent color, subtle motion

### How to Create Calm Visual Density
- **Compartmentalize** — Put related information in cards. Cards create visual boundaries that reduce perceived complexity.
- **Breathe** — More whitespace than you think is necessary. When in doubt, add another `gap-4`.
- **Limit columns** — 3 columns max for cards. 2 columns for forms. 1 column for reading.
- **Mute secondary information** — Use `text-secondary` and `text-muted` aggressively. Not everything is `text-primary` importance.

### How to Create Intentional Hierarchy
- **Size = importance** — The most important element is the largest. No exceptions.
- **Color = action** — Blue means "click me." Nothing else should be blue.
- **Position = priority** — Top-left is most important (F-pattern reading). Bottom-right is least.
- **Whitespace = grouping** — Things closer together are related. Things further apart are separate categories.

### How to Avoid AI-Slop Aesthetics
AI-generated UI tends toward specific patterns. Actively resist:
- **Over-decoration:** Gradients, shadows, blur effects, background patterns
- **Template layouts:** Hero → Features → Testimonials → CTA → Footer
- **Color overload:** Purple gradients, blue-to-cyan, multiple accent colors
- **Motion excess:** Fade-in on scroll, stagger animations, hover scale effects
- **Generic typography:** System fonts, inconsistent sizes, no type scale

**The Receipt Guardian aesthetic is:** Dark, restrained, typography-driven, one blue accent, mathematically spaced, motion-minimal. If it doesn't match this description, it's wrong.

---

## Document Maintenance

### When to Update IMPLEMENTATION.md
- New Impeccable commands become available
- New shadcn/ui components are added to the library
- A workflow step proves consistently problematic
- A new anti-pattern is discovered across multiple pages
- The page execution order changes

### When NOT to Update IMPLEMENTATION.md
- A single page needs a one-off workflow adjustment
- A component gets a minor `className` customization
- Content or copy changes

### Version
This is a living document. As the application grows and patterns mature, workflows should be refined. The goal is not to freeze the process but to ensure every change is intentional and documented.
