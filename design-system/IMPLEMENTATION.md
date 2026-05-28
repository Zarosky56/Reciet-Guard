# IMPLEMENTATION.md — Frontend Operating Manual

> **Role:** This document governs how AI agents (and human developers) execute UI/UX implementation across Receipt Guardian. It defines the four-phase migration model, the workflow lifecycle, the lint-and-test guardrails, and the anti-drift rules introduced by the premium-ui-redesign spec. Every implementation decision must be traceable to a rule in this file or in `DESIGN.md` / `VISUAL_IDENTITY.md`.

> **Authority chain:** `IMPLEMENTATION.md` → `DESIGN.md` / `VISUAL_IDENTITY.md` → page specs → component source.

---

## 1. Purpose

`IMPLEMENTATION.md` is the operational layer between design intent and shipped code. `DESIGN.md` defines *what* the app should look like. `VISUAL_IDENTITY.md` defines the rejected pattern catalogue. `IMPLEMENTATION.md` defines *how to get there* — the four-phase migration order, the property-test posture, the lint guardrails, and the verification gates that prevent the codebase from drifting back into AI-slop.

This file exists because:
- The redesign succeeds only when tokens, primitives, screens, and docs land in the documented order.
- Property tests under `npm run sadtest` are the structural enforcement of `DESIGN.md`; they are not optional.
- AI agents need explicit workflow instructions, not just design principles.
- A four-phase migration only stays shippable at every step if everyone follows the same sequence.

---

## 2. Workflow Philosophy

### Core Tenets

1. **Tokens are the foundation.** No primitive is restyled before the token it depends on lands in `app/globals.css` and `tailwind.config.ts`. No screen is re-skinned before its primitives are migrated.
2. **Property tests are the spec.** The 18 properties enumerated in `design.md` § Correctness Properties are the structural definition of "done." If a property test fails, the implementation is wrong, not the test (unless triage reveals a spec gap, in which case escalate).
3. **The redesign is migrational, not big-bang.** Compatibility shims (the legacy `Stagger`/`StaggerItem`/`HoverLift`/`FadeIn` re-exports, the `<ButtonLoader>` shim, the Button `default → primary` alias) exist to keep the codebase shippable between phases. They are deleted in Phase 4.
4. **Premium restraint over flashy visuals.** If it triggers a Requirement 13 AI_Slop_Pattern, it is rejected. Restraint is the brief.
5. **The docs are authoritative for behavior.** When code disagrees with `DESIGN.md`, the code is the bug. When the docs themselves are the bug, fix both in the same change.

### What "Premium" Means in Practice

- Every element resolves to a token; raw hex / `rgb(`/ `oklch(` literals exist only in `tailwind.config.ts`, `app/globals.css`, and `public/**` SVGs.
- Spacing is on the documented scale; `no-arbitrary-spacing` lint catches the rest.
- Typography flows through the nine `--text-*` steps; arbitrary `text-[NN]`/`leading-[NN]` is rejected outside the scale layer.
- One accent color (`oklch(0.78 0.13 78)` — burnished amber). No cobalt, no indigo, no violet, no inline opacity.
- Motion is meaningful, not decorative. One indeterminate loop visible at a time.

---

## 3. The Four-Phase Migration Model

The redesign ships in four atomic phases. The app is shippable at every checkpoint between phases. Tasks in `tasks.md` are organized to match this model exactly.

```
Phase 1 — Tokens          → app/globals.css, tailwind.config.ts, fonts, BrandMark SVG
Phase 2 — Primitives      → components/ui/*, components/motion/*, components/visual/*, chrome
Phase 3 — Screens         → landing → auth → dashboard → profile/settings → test-extraction
Phase 4 — Cleanup         → delete deprecated classes / keyframes / shims, sync docs, enforce budgets
```

### Phase 1 — Tokens

- Add every color, radius, container, motion, and typography token to `:root` in `app/globals.css`.
- Mirror them in `tailwind.config.ts` (`theme.extend.colors|borderRadius|maxWidth|transitionDuration|transitionTimingFunction|keyframes|animation`).
- Swap Inter for Geist Sans (UI) and keep JetBrains Mono (mono) via `next/font`. Preload only the UI sans regular weight.
- Author `public/brand/mark.svg` and ship `<BrandMark>`.
- Mark deprecated CSS classes / Tailwind keys with `@deprecated` comments — do not delete yet.

The phase ends when the property tests under `design-system/__tests__/` for color-token parity, raw-color absence, arbitrary-spacing absence, cobalt absence, font configuration, and Brand_Mark all pass.

### Phase 2 — Primitives

- Rebuild `<Reveal>`, `<Grid>`, `<Loader>`, `<Badge>`, `<Avatar>`, `<Skeleton>`, `<AmbientBackground>`, `<Button>`, `<Card>`, `<Input>`, `<Textarea>`, `<Dialog>`, `<PageLoader>`, `<RouteProgress>`, `<MobileBottomNav>`, `<DashboardHeader>`.
- Preserve every existing prop signature except where a deprecated visual prop is removed and a migration note is authored in `COMPONENT_PATTERNS.md` (Requirement 8.9).
- Compatibility shims: `Stagger`/`StaggerItem`/`HoverLift`/`FadeIn` re-export `<Reveal>`; `<ButtonLoader>` re-exports `<Loader size="sm">`; the Button `default` CVA variant aliases `primary`.
- Restrict `framer-motion` to `<Dialog>` open/close only.

The phase ends when the redesigned-primitives property tests (forbidden gradients, contrast, reduced-motion, interactive states, touch targets, icon stroke width, ambient-band luminance) all pass.

### Phase 3 — Screens

Re-skin in this order — each screen's spec doc lands in the same change:

1. `app/page.tsx` (Landing) — single `<AmbientBackground variant="hero">`, `<Grid cols={3}>` proof points, `max-w-wide`.
2. `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` via `<AuthShell>` — `max-w-auth`, no `bg-scene-auth`, no `border-conic-soft`.
3. `app/(dashboard)/dashboard/page.tsx` and `components/receipts/*` — single hero `<Card>`, segmented filter chips on `bg-accent-tint`, no aurora layering.
4. `app/(dashboard)/profile/page.tsx` (`max-w-narrow`) and `app/(dashboard)/settings/page.tsx` (`max-w-content`) — single-column stacked sections.
5. `app/test-extraction/page.tsx` — developer-tool tone preserved; tokens swapped only.

The phase ends when the screen-level property tests (type-scale coverage, spacing-scale coverage, urgency indicators, no horizontal overflow, decorative budget) all pass.

### Phase 4 — Cleanup

- Delete deprecated CSS classes from `app/globals.css`: `border-conic-soft`, `bg-scene-hero`, `bg-scene-auth`, `bg-aurora-action`, `bg-aurora-soft`, `bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`, `text-gradient-primary`, `text-gradient-action`, `bg-card-elevated`.
- Delete deprecated keyframes from `tailwind.config.ts`: `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red`.
- Delete deprecated shadow tokens: `shadow-card-sm`, `shadow-card-lift`, `shadow-glow-action`, `shadow-glow-soft`, `inner-hair`. Keep only `shadow-overlay`.
- Delete the `Stagger`/`StaggerItem`/`HoverLift`/`FadeIn` re-exports, the Button `default` CVA alias, the `<ButtonLoader>` shim, and the `<UrgencyBadge>` `pulse` parent override.
- Sync `DESIGN.md`, `COMPONENT_PATTERNS.md`, `REFERENCES.md`, `IMPLEMENTATION.md`, `REVIEW.md`, `ACCESSIBILITY.md`, `PERFORMANCE.md`, `VISUAL_IDENTITY.md`, and the per-screen specs.
- Land the `performance-budget` CI job (`scripts/check-bundle-size.mjs`).

The phase ends when `no-deprecated.property.test.ts`, `route-inventory.property.test.ts`, `asset-budget.example.test.ts`, and `toaster-config.example.test.ts` all pass and CI is green.

---

## 4. Per-Page Lifecycle

Within Phase 3, every page implementation follows this sequence. Skip no step.

### Step 1 — Read Relevant Specs

- `design-system/DESIGN.md` for global tokens, motion, anti-patterns.
- `design-system/VISUAL_IDENTITY.md` for the rejected AI_Slop_Pattern catalogue.
- `design-system/<page>.md` for the page-specific composition (hero, content order, container).
- `design-system/navigation.md` if the page consumes the `DashboardHeader` or `MobileBottomNav`.
- `design-system/COMPONENT_PATTERNS.md` for the data-card, stat-card, form-card, empty-state, auth-shell, and dashboard-hero patterns.
- The existing page source.

### Step 2 — Audit Current Implementation

List every component used. Check each against:
- Token rules in `DESIGN.md` § Token system.
- The redesigned primitive contracts in `COMPONENT_PATTERNS.md`.
- The 14 AI_Slop_Pattern items in Requirement 13.

Produce a prioritized fix list.

### Step 3 — Implement Structural Re-skin

- Fix layout structure first (container width, `<Grid>` usage, section order).
- Replace deprecated tokens / classes with redesigned tokens.
- Replace deprecated primitives (`Stagger`, `FadeIn`, `<ButtonLoader>`, etc.) with their redesigned counterparts.
- Keep data flow, API calls, and prop signatures intact.

### Step 4 — Verify Responsiveness

- Mobile (<640px): single column, full-width inputs, stacked sections.
- Tablet (640–1024px): intermediate layouts; `<Grid cols={2}>` where the spec allows.
- Desktop (≥1024px): full multi-column with the documented `max-w-*` clamp.
- Touch targets ≥ 44×44 CSS pixels.
- No horizontal overflow at any documented viewport (`no-horizontal-overflow.property.test.ts` is the gate).

### Step 5 — Run Property Tests

```
npm run sadtest
```

This runs Vitest against every `design-system/__tests__/*.test.ts` file. The 18 redesign properties are the structural definition of "done" for this page.

If a property fails, **triage**:
- Test is wrong → fix the test, document the change.
- Implementation is wrong → fix the code.
- Spec is wrong → escalate to the user; never silently change the acceptance criteria.

### Step 6 — Manual Quality Pass

- Hover, focus-visible, active, and disabled states present on every interactive element.
- Reduced-motion (`prefers-reduced-motion: reduce`): every animation goes static via `data-reduced-motion="static"`.
- Toast / loader / dialog semantics preserved.
- Single decorative element per screen (Requirement 13.13, 13.14).

### Step 7 — Validate Against `DESIGN.md` Anti-patterns

Run through the 14 AI_Slop_Pattern items. Any single hit is a hard fail. The `REVIEW.md` Tier-1 checklist enumerates each item with a pass/fail criterion.

### Step 8 — Update the Page Spec

Update `design-system/<page>.md` so the documented composition matches the shipped composition. The doc is the source of truth; the code is the bug if they diverge.

### Step 9 — Move to the Next Page

Mark the page complete only when every property test in scope is green and no Tier-1 AI_Slop_Pattern is present.

---

## 5. Tooling and Commands

### Project scripts

| Command | Purpose | Notes |
|---|---|---|
| `npm run dev` | Start the Next.js dev server on port 3100 | Turbopack enabled |
| `npm run build` | Production build | Required before bundle-size check |
| `npm run start` | Run the production build | After `npm run build` |
| `npm run lint` | ESLint with `--max-warnings=0` | Includes `no-raw-color` and `no-arbitrary-spacing` |
| `npm run typecheck` | `tsc --noEmit` | Type-only verification |
| `npm run sadtest` | Run Vitest once (the property + example test suite) | The redesign's primary structural gate |
| `npm run test:watch` | Vitest in watch mode | For local iteration only |
| `node scripts/check-bundle-size.mjs` | Compare `/dashboard` first-load JS + total CSS against `design-system/__tests__/bundle-baseline.json` | Run after `npm run build` |

### CI jobs

`.github/workflows/ci.yml` runs the following:

- `lint` — `npm run lint`
- `typecheck` — `npm run typecheck`
- `sadtest` — `npm run sadtest`
- `performance-budget` — `npm run build` then `node scripts/check-bundle-size.mjs`

Every job blocks merge.

### Lint guardrails

Two custom ESLint rules enforce the token system at edit time:

- **`no-raw-color`** (`eslint-rules/no-raw-color.js`) flags `#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`, `oklab(` literals in `app/`, `components/`, `lib/`. Allowed in `tailwind.config.ts`, `app/globals.css`, and `public/**/*.svg`. Per-line escape hatch: trailing `// allow:color` comment.
- **`no-arbitrary-spacing`** (`eslint-rules/no-arbitrary-spacing.js`) flags `(p|m|gap|space-[xy]|top|left|right|bottom|inset|w|h|min-w|min-h|max-w|max-h|text|leading|tracking|grid-cols|grid-rows)-\[…\]` arbitrary-value Tailwind utilities. Allowed in `components/ui/typography.tsx`, `components/ui/grid.tsx`, and `tailwind.config.ts`.

Both rules ship at severity `error`.

### Property-test posture

Property tests live in `design-system/__tests__/*.test.ts` and are picked up by the existing Vitest `sadtest` config. They use `fast-check` with smart generators in `_arbitraries.ts` (`arbInScopeScreen`, `arbButtonProps`, `arbReceipt`, `arbViewport`, `arbTextContent`).

Each property test:
- States the property number and which requirement clauses it validates (`**Validates: Requirements X.Y**`).
- Implements one and only one property — never two in the same file.
- Uses the smart generators and the `In_Scope_Screen` scope; never invents new screens or new prop spaces.

---

## 6. shadcn-style Component Rules

### Preferred primitives

| Component | File | Use for |
|---|---|---|
| **Button** | `components/ui/button.tsx` | Every clickable action — 4 variants × 4 sizes |
| **Card** | `components/ui/card.tsx` | Every content container — uniform `p-5` |
| **Input** / **Textarea** | `components/ui/input.tsx` | Every text input |
| **Dialog** | `components/ui/dialog.tsx` | Every modal — the only retained `framer-motion` consumer |
| **Badge** | `components/ui/badge.tsx` | Status / urgency / tag indicators |
| **Avatar** | `components/ui/avatar.tsx` | User identity surfaces |
| **Skeleton** | `components/ui/skeleton.tsx` | Async placeholder fills (static) |
| **Loader** | `components/ui/loaders.tsx` | Every async progress signal — single dot + label |
| **PageLoader** | `components/ui/page-loader.tsx` | Full-page route load |
| **RouteProgress** | `components/ui/route-progress.tsx` | The single allowed indeterminate loop during navigation |
| **Grid** | `components/ui/grid.tsx` | Every multi-column layout (forbids one-off `grid-cols-[…]`) |

### Extension strategy

- **Add variants via CVA** when a pattern repeats 3+ times. Do not fork primitives.
- **Override via `className`** for the final 5–10% of differences; primitives merge with `cn()`.
- **New primitives** go in `components/ui/` and follow the existing prop-passthrough + `cn()` pattern.

### Customization boundaries

- **DO** change padding, color tokens, icon sizes, border styles via `className`.
- **DON'T** change the base CVA, remove accessibility attributes, or mix icon libraries.
- **DO** add a Button variant if a third primary-CTA color emerges (none is planned).
- **DON'T** create one-off variants that duplicate existing ones.

### Accessibility expectations

- Every interactive element ships hover, focus-visible, active, and disabled states.
- Decorative icons get `aria-hidden="true"` and inherit `currentColor`; the parent carries the `aria-label`.
- Dialogs trap focus and close on Escape.
- Every input has an associated label.
- Focus-visible includes a non-color signal (thickness, offset, or shape change) — Requirement 11.3.

### Achieving premium feel with these primitives

Premium is the sum of correct micro-decisions:
1. **Spacing is on the scale.** No `p-7`. No `gap-[13px]`.
2. **Typography flows through the type scale.** Geist Sans + JetBrains Mono with `cv11`/`ss03`/`tnum`. No system fonts.
3. **Color restraint.** One accent (amber `oklch(0.78 0.13 78)`). One tinted-accent (`bg-accent-tint`). Semantic colors only for status.
4. **Border subtlety.** `border-border` is barely visible against `surface`; that is intentional.
5. **Motion is state, not entrance.** 150ms hover, 220ms card lift, 80ms press. No bounce, no spring.

---

## 7. Anti-Drift Rules

The following rules block the codebase from regressing into AI-slop. Each rule maps to a Requirement clause and a property test.

### Token discipline
- Same role → same token. All page titles use `text-2xl font-semibold tracking-[-0.015em]` (= `--text-title-lg`).
- Same component role → same variant. Primary CTAs use `<Button variant="primary" size="lg">` everywhere.
- Same container type → same width token. Auth pages use `max-w-auth`; data pages use `max-w-wide`.
- No font-size experimentation. If a heading "feels too big", the spacing is wrong, not the size.

### Component discipline
- One Button. One Card. One Input. One Loader. One Grid.
- One icon library (`lucide-react`) with one stroke width (`1.75`) and a curated allow-list.
- The Brand_Mark is an SVG asset; never a Lucide icon in a tile.

### Decorative discipline
- At most one decorative element per screen (Requirement 13.13, 13.14).
- The "remove it" test: if removing an element doesn't hurt usability, remove it.
- The "template" test: if it could be lifted into a Tailwind UI template wholesale, it is wrong.

### Forbidden AI-template patterns

Actively resist:
- Tailwind-default cobalt / indigo / violet accents.
- Purple-to-blue, blue-to-cyan, orange-to-pink linear gradients.
- `bg-clip-text` gradient text.
- Masked dotted / grid mesh backgrounds.
- Radial "aurora" or "spotlight" gradient blobs.
- Conic-gradient halos around icon / logo tiles.
- Glassmorphism (translucent fill + `backdrop-blur-*`) outside the Toaster and modal scrim.
- Stagger-fade entrance animations on lists, hero sections, or proof grids.
- "Trusted by thousands", "How it works", "Get started in 60 seconds", "Quiet deadlines. Loud savings." as decorative copy.
- Lucide icons used as the brand mark inside a rounded-square tile.

The full catalogue is in `VISUAL_IDENTITY.md` and Requirement 13.

---

## 8. Priority Hierarchy

Resolve conflicts using this order:

| Priority | Concern | Example |
|---|---|---|
| 1. Usability | Can the user accomplish the task? | Tappable before beautiful |
| 2. Accessibility | WCAG 2.1 AA contrast, focus-visible non-color signal, reduced-motion | Non-negotiable |
| 3. Hierarchy | Is the visual importance clear? | Primary CTA dominates |
| 4. Responsiveness | Works at every documented viewport? | No horizontal overflow |
| 5. Token compliance | Are colors, spacing, type all on the scale? | `no-raw-color`, `no-arbitrary-spacing` |
| 6. Interaction quality | Hover / focus / active / disabled all present? | Every interactive element |
| 7. Motion restraint | One indeterminate loop max, transform/opacity only | `attention` + `route-progress` |
| 8. Decoration restraint | At most one decorative element per screen | The "remove it" test |

Never sacrifice a higher priority for a lower one. A beautifully gradient-laden button that fails contrast is still wrong.

---

## 9. Example Workflows

### Token addition workflow

```
1. Add the token to :root in app/globals.css.
2. Mirror it in tailwind.config.ts under theme.extend.{colors|borderRadius|maxWidth|...}.
3. Run npm run sadtest — the token-parity property test will fail until both sides agree.
4. Document the token in DESIGN.md § Token system and in REFERENCES.md § 1.
5. Run npm run lint and npm run typecheck.
```

### Primitive migration workflow

```
1. Read the primitive's contract in COMPONENT_PATTERNS.md.
2. Refactor the primitive to consume only redesigned tokens and the redesigned Motion_Language.
3. Preserve the prop signature. If a prop is removed, add a migration note in COMPONENT_PATTERNS.md.
4. Add or update the corresponding property test under design-system/__tests__/.
5. Run npm run sadtest.
6. Run npm run lint, npm run typecheck, npm run build.
7. Update REFERENCES.md if the contract changed.
```

### Screen re-skin workflow

```
1. Read DESIGN.md, VISUAL_IDENTITY.md, design-system/<page>.md, navigation.md.
2. Audit the current page against the AI_Slop_Pattern checklist.
3. Replace deprecated tokens / primitives with redesigned counterparts.
4. Verify at 375px, 768px, 1280px.
5. Run npm run sadtest.
6. Update design-system/<page>.md to match the shipped composition.
7. Run REVIEW.md Tier-1 checklist (AI_Slop_Pattern hard-fail).
8. Mark the page complete.
```

### Bundle-budget workflow

```
1. Run npm run build.
2. Run node scripts/check-bundle-size.mjs.
3. If the script exits non-zero, the redesign exceeded the budget.
4. Investigate: which import added weight? Can it be lazy-loaded? Can a primitive shrink?
5. Re-run until green.
```

---

## 10. Premium UX Standards

### What makes the redesigned UI feel premium

Premium is defined by what is *absent*, not what is *present*:

- **Absent:** gradients, glassmorphism, conic halos, shadows on resting cards, decorative tiles around icons, multi-color palettes, stagger entrances, fade-up reveals, generic placeholder copy.
- **Present:** mathematical spacing, the Geist + JetBrains Mono pair with three OpenType features, one amber accent, subtle borders, single-purpose motion, token-driven everything.

### Calm visual density

- Compartmentalize related information in cards (`p-5`, `bg-surface`, `border-border`, `rounded-lg`).
- Breathe — `gap-6` between subsections, `gap-8` between top-level sections.
- Limit columns — three max for cards, two for forms, one for reading.
- Mute secondary information aggressively — `text-text-secondary` and `text-text-muted` are real tools, not fallbacks.

### Intentional hierarchy

- **Size = importance.** The most important element is the largest. No exceptions.
- **Color = action.** Amber means "click me." Nothing else is amber.
- **Position = priority.** Top-left is most important; bottom-right is least.
- **Whitespace = grouping.** Things closer together are related; things further apart are separate categories.

### Avoiding AI-slop aesthetics

The Receipt Guardian aesthetic is: dark canvas, restrained, typography-driven, one amber accent, mathematically spaced, motion-minimal. If a generated draft does not match this description, it is wrong. The full rejection catalogue lives in `VISUAL_IDENTITY.md` and is enforced by Requirement 13 plus the `REVIEW.md` Tier-1 checklist.

---

## Document Maintenance

### When to update `IMPLEMENTATION.md`

- A new lint rule, property test category, or CI job is added.
- A workflow step proves consistently problematic and the fix is systemic.
- A new component primitive enters `components/ui/`.
- A phase of the migration completes and the migration model needs updating.

### When NOT to update `IMPLEMENTATION.md`

- A single page needs a one-off workflow adjustment (document it in the page spec, not here).
- A component gets a minor `className` customization.
- Content or copy changes.

### Version

This is a living document. As the codebase grows and patterns mature, the workflow should be refined. The goal is not to freeze the process but to ensure every change is intentional, tokenized, and tested.
