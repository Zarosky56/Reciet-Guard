# Implementation Plan: Premium UI Redesign

## Overview

This plan delivers the redesign in four ordered phases that match the design's architecture (Tokens → Primitives → Screens → Cleanup), bracketed by testing-infrastructure setup at the start and documentation/budget enforcement at the end. Each phase ends in a checkpoint that ensures the codebase is shippable on its own. Tasks reference specific requirement clauses for traceability and reference the 18 correctness properties from `design.md` so each universal rule is exercised by an automated property test placed close to the code that proves it.

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Tasks

- [x] 1. Set up testing infrastructure and lint guards
  - [x] 1.1 Install fast-check and create the property-test arbitraries module
    - Add `fast-check` to `devDependencies` and create `design-system/__tests__/_arbitraries.ts` exporting `arbInScopeScreen`, `arbButtonProps`, `arbReceipt`, `arbViewport`, and `arbTextContent` per design "Generators" section
    - Wire the new test file location into the existing Vitest `sadtest` config so files matching `design-system/__tests__/*.test.ts` are picked up
    - _Requirements: 12.6 (declarative-only animations does not affect test infra; this task enables every property test that follows)_

  - [x] 1.2 Add custom ESLint rule `no-raw-color`
    - Implement the rule in `eslint-rules/no-raw-color.js` to flag `#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`, `oklab(` literals in `app/`, `components/`, `lib/`
    - Allow exemptions for `tailwind.config.ts`, `app/globals.css`, `public/**/*.svg`, and lines tagged `// allow:color`
    - Register the rule in `eslint.config.js` (or `.eslintrc`) with severity `error`
    - _Requirements: 2.4_

  - [x] 1.3 Add custom ESLint rule `no-arbitrary-spacing`
    - Implement the rule in `eslint-rules/no-arbitrary-spacing.js` to flag Tailwind arbitrary-value utilities matching `(p|m|gap|space-[xy]|top|left|right|bottom|inset|w|h|min-w|min-h|max-w|max-h|text|leading|tracking|grid-cols|grid-rows)-\[[^\]]+\]`
    - Allow `components/ui/typography.tsx`, `components/ui/grid.tsx`, and `tailwind.config.ts`
    - Register the rule in the lint config with severity `error`
    - _Requirements: 3.5, 4.2, 4.5_

  - [x] 1.4 Snapshot the pre-redesign route inventory and bundle baseline
    - Walk `app/**/page.tsx` and `app/api/**/route.ts`, write the sorted path list to `design-system/__tests__/route-inventory.snapshot.json`
    - Run `next build` once and write `/dashboard` first-load JS gzipped size and total CSS gzipped size to `design-system/__tests__/bundle-baseline.json`
    - _Requirements: 9.8, 12.1, 12.2, 14.1_

- [x] 2. Build the token system (Phase 1)
  - [x] 2.1 Define color, spacing, radius, motion, and font tokens in `app/globals.css`
    - Add every CSS custom property from design "Color tokens", "Spacing scale", "Radius scale", "Container width tokens", "Motion tokens", and "Typography tokens" tables to `:root`
    - Add `font-feature-settings: "cv11", "ss03", "tnum"` to `body` (re-mapped to Geist features when font lands)
    - Extend the existing `@media (prefers-reduced-motion: reduce)` block with the `[data-reduced-motion="static"]` selector so animated indicators can swap to a static variant
    - Mark deprecated classes (`bg-aurora-action`, `bg-scene-hero`, `border-conic-soft`, etc.) with `@deprecated` comments but do not delete them yet
    - _Requirements: 2.1, 2.5, 2.6, 3.3, 3.4, 4.1, 4.3, 4.4, 4.6, 5.1, 6.1, 6.6, 14.5_

  - [x] 2.2 Mirror tokens in `tailwind.config.ts`
    - Add color, radius, container width, transition duration, transition timing function, and keyframe entries to `theme.extend` so each one references the corresponding `var(--color-*)` / `var(--radius-*)` / `var(--motion-*)` from globals
    - Define the `attention` and `route-progress` keyframes; do not yet remove the deprecated `ledger-scan`/`loader-rail`/`shimmer`/`pulse-red`/`fade-in-up`/`glow-pulse` keyframes
    - Add `max-w-auth`, `max-w-narrow`, `max-w-content`, `max-w-wide` width utilities backed by container tokens
    - _Requirements: 2.1, 2.2, 4.1, 4.3, 4.4, 6.1, 6.7_

  - [x] 2.3 Replace Inter with Geist Sans in `app/layout.tsx`
    - Swap `next/font/google` import to `Geist` (or the chosen UI sans documented in `VISUAL_IDENTITY.md`), Latin subset, `display: "swap"`, `preload: true` for regular weight only
    - Keep `JetBrains_Mono` (or the chosen mono) loaded with Latin subset only, no preload
    - Bind the two fonts to `--font-ui` and `--font-mono` CSS variables on `<html>` so globals can pick them up
    - _Requirements: 3.1, 3.2, 12.3_

  - [x] 2.4 Create the Brand_Mark SVG asset and `<BrandMark>` component
    - Author `public/brand/mark.svg` as a 24×24 viewBox typographic mark per design "Typographic mark as the brand mark" — slab `R` with tab cut, no tile, no halo, no gradient
    - Add `components/brand/brand-mark.tsx` that renders the SVG via `next/image` or inline `<svg>` and accepts `size` (`sm`/`md`/`lg`) plus `aria-label` props
    - Do not change consumer call sites yet — `DashboardHeader` and `auth-form` migrate in their own primitive tasks
    - _Requirements: 1.4, 1.5_

- [x] 3. Verify the token foundation
  - [x] 3.1 Write property test for color-token parity
    - **Property 1: Color-token parity**
    - **Validates: Requirements 2.2, 2.3**
    - File: `design-system/__tests__/token-parity.property.test.ts`

  - [x] 3.2 Write property test for absence of raw color literals in source
    - **Property 2: No raw color literals in user-facing source**
    - **Validates: Requirements 2.4**
    - File: `design-system/__tests__/no-raw-color.property.test.ts`

  - [x] 3.3 Write property test for absence of arbitrary-value utilities
    - **Property 3: No arbitrary-value Tailwind utilities for spacing, sizing, typography, or grid**
    - **Validates: Requirements 3.5, 4.2, 4.5**
    - File: `design-system/__tests__/no-arbitrary-spacing.property.test.ts`

  - [x] 3.4 Write property test for absence of cobalt/indigo/violet accents
    - **Property 6: No Tailwind-default cobalt/indigo/violet accent on user-facing surfaces**
    - **Validates: Requirements 1.3, 13.1**
    - File: `design-system/__tests__/no-cobalt.property.test.ts`

  - [x] 3.5 Write example test for font configuration
    - Assert exactly two `next/font` calls in `app/layout.tsx`, Latin subset, preload only on UI sans
    - File: `design-system/__tests__/font-config.example.test.ts`
    - _Requirements: 3.1, 3.2, 12.3_

  - [x] 3.6 Write example test for the Brand_Mark
    - Assert `public/brand/mark.svg` exists, `<BrandMark>` renders the SVG (not a Lucide icon), and the rendered output contains no `lucide-*` class
    - File: `design-system/__tests__/brand-mark.example.test.ts`
    - _Requirements: 1.4, 1.5_

- [x] 4. Checkpoint — token foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Rebuild component primitives (Phase 2)
  - [x] 5.1 Rebuild the `<Reveal>` motion primitive
    - Replace the contents of `components/motion/motion-primitives.tsx` with a single `Reveal` export using framer-motion `motion.div`, transform/opacity only, `--motion-default` duration, `--ease-standard` easing
    - Keep `Stagger`, `StaggerItem`, `HoverLift`, `FadeIn` exports as deprecated re-exports of `Reveal` for one phase so consumers still type-check, with a `@deprecated` JSDoc tag pointing to `<Reveal>`; the legacy exports are deleted in task 11.3
    - _Requirements: 6.7, 13.8_

  - [x] 5.2 Add the `<Grid>` layout primitive
    - Create `components/ui/grid.tsx` exporting `Grid` with `cols: 1 | 2 | 3`, `gap: "card" | "section"`
    - Use only spacing-scale gap values; no arbitrary `grid-cols-[Xfr_Yrem]`
    - _Requirements: 4.5_

  - [x] 5.3 Rebuild the `<Loader>` family
    - Create `components/ui/loaders.tsx` (replacement) exporting one `Loader` component with `label: string`, `size: "sm" | "md"` rendering a 6px static accent dot plus the label
    - Add a thin compatibility shim re-exporting `ButtonLoader` as `<Loader size="sm" />` so call sites in `auth-form.tsx`, `receipt-dashboard.tsx`, and `dashboard-header.tsx` continue to compile during the migration; the shim is deleted in task 11.3
    - Remove the `ScanGlyph`, `ProcessRail`, `ProcessSteps`, `ActionLoader`, `CardActionLoader` exports
    - _Requirements: 6.8, 8.6, 14.4_

  - [x] 5.4 Rebuild the `<Badge>` primitive
    - Update `components/ui/badge.tsx` to use `bg-accent-tint`, `border-border`, no glow shadow, no animation by default
    - Add variants `default`, `success`, `warning`, `danger` keyed to semantic tokens
    - Apply the new `attention` keyframe only when `variant="danger"` AND a `pulse` flag is set internally by `<UrgencyBadge>` for expired urgency
    - _Requirements: 6.4, 8.2, 11.7_

  - [x] 5.5 Rebuild `<Avatar>` and `<Skeleton>` primitives
    - Update `components/ui/avatar.tsx` to use `--radius-pill`, `bg-surface`, `border-border`, no decorative tile
    - Update `components/ui/skeleton.tsx` to render a static `bg-surface-hover` fill with no shimmer animation
    - _Requirements: 5.2, 6.7, 8.1, 8.2_

  - [x] 5.6 Rebuild `<AmbientBackground>`
    - Update `components/visual/ambient-background.tsx` to expose only `variant: "hero" | "off"`
    - `hero` renders one tonal band: `bg-canvas-raised` with a single-color `mask-image: linear-gradient(to bottom, black, transparent)`, height ≤ 320px, no grid, no aurora, no perceptible gradient stop
    - `off` returns `null`; treat the previous `auth` and `app` variants as `off` to preserve the prop API
    - Mark the band node with `data-decorative="true"`
    - _Requirements: 5.6, 5.7, 13.5, 13.9, 13.10_

  - [x] 5.7 Rebuild the `<Button>` primitive
    - Update `components/ui/button.tsx` CVA contract to four variants (`primary` | `secondary` | `ghost` | `danger`) and four sizes (`sm` | `default` | `lg` | `icon`)
    - Keep `default` as a CVA alias of `primary` so existing JSX consumers still compile; the alias is removed in task 11.3
    - Remove the `before:` gradient overlay, `shadow-glow-action` hover shadow, and any `bg-[linear-gradient(...)]` fills
    - Implement focus-visible as a 2px outline at 2px offset (a non-color attribute change)
    - _Requirements: 6.5, 8.1, 8.2, 8.3, 11.3, 11.6_

  - [x] 5.8 Rebuild the `<Card>` primitive
    - Update `components/ui/card.tsx` to render `bg-surface border border-border rounded-lg` with no shadow at rest and no `bg-card-elevated` linear-gradient overlay
    - On `data-interactive={true}`, hover applies `border-border-strong -translate-y-0.5` with `--motion-default` transform-only transition; resting cards do not animate
    - Standardize `CardHeader`/`CardContent`/`CardFooter` padding at `p-5`
    - _Requirements: 5.2, 5.3, 6.4, 6.5, 8.1, 8.2, 8.4_

  - [x] 5.9 Rebuild `<Input>` and `<Textarea>` primitives
    - Update `components/ui/input.tsx` and the textarea component to use `bg-canvas border border-border rounded-sm` resting, `border-border-strong` hover, `border-border-focus` focus with a 1px ring at 1px offset
    - Remove the `focus:shadow-[0_0_0_4px_rgba(...)]` halo
    - Wire `border-danger` for the invalid state via a `data-invalid="true"` attribute or `aria-invalid`
    - _Requirements: 8.1, 8.2, 8.5, 11.3_

  - [x] 5.10 Rebuild the `<Dialog>` primitive
    - Update `components/ui/dialog.tsx` content to use `bg-surface-overlay border-border rounded-lg shadow-overlay`
    - Use `<Reveal>` (from task 5.1) for open/close animation; scrim is `bg-canvas/70 backdrop-blur-sm` with blur ≤ 8px
    - Remove any other framer-motion usage from primitives (Dialog is the only retained consumer)
    - _Requirements: 5.3, 5.4, 6.5, 8.1, 8.2_

  - [x] 5.11 Rebuild `<PageLoader>` and `<RouteProgress>`
    - Update `components/ui/page-loader.tsx` to render a centered `Card` overlay containing the new `<Loader>` and a description, scrim `bg-canvas/70 backdrop-blur-sm`
    - Update `components/ui/route-progress.tsx` to render a 2px top-of-page bar using the new `route-progress` keyframe (linear, 1.2s, accent), and to render a static accent-colored bar when `[data-reduced-motion="static"]` is present
    - This is the single allowed indeterminate loop per Requirement 6.8
    - _Requirements: 5.3, 5.4, 6.6, 6.8, 8.1, 8.6, 11.4, 12.7_

  - [x] 5.12 Rebuild `<MobileBottomNav>`
    - Update `components/dashboard/mobile-bottom-nav.tsx` so the active state is conveyed via icon+label color shift to `text-accent` plus a 2px solid `bg-accent` bar at the top of the active item, no glow shadow
    - Each nav item renders at ≥ 44×44 CSS pixels
    - Document the indicator in `design-system/navigation.md` (the doc edit lives in task 12.6)
    - _Requirements: 6.5, 8.7, 11.6_

  - [x] 5.13 Rebuild `<DashboardHeader>`
    - Update `components/dashboard/dashboard-header.tsx` to render `<BrandMark>` next to the wordmark with no tile, no border, no inner-hair shadow
    - Replace `backdrop-blur-xl` chrome with opaque `bg-canvas-raised`
    - Migrate any `<ButtonLoader>` call site to the new `<Loader size="sm" />` API
    - _Requirements: 1.4, 1.5, 5.4, 8.1, 8.2_

- [x] 6. Verify the redesigned primitives
  - [x] 6.1 Write property test for forbidden gradients and glassmorphism
    - **Property 5: No forbidden gradient or glassmorphism patterns outside the ambient-background and overlay allow-list**
    - **Validates: Requirements 2.7, 3.7, 5.4, 13.2, 13.3, 13.7**
    - File: `design-system/__tests__/no-forbidden-gradients.property.test.ts`

  - [x] 6.2 Write property test for contrast ratios across documented pairs
    - **Property 7: Contrast ratios meet WCAG 2.1 AA on every documented foreground/background pair**
    - **Validates: Requirements 2.5, 11.1, 11.2**
    - File: `design-system/__tests__/contrast.property.test.ts`

  - [x] 6.3 Write property test for reduced-motion behavior on every primitive
    - **Property 8: Reduced-motion users see no active animation on any rendered component**
    - **Validates: Requirements 6.6, 11.4, 15.5**
    - File: `design-system/__tests__/reduced-motion.property.test.ts`

  - [x] 6.4 Write property test for distinct interactive states
    - **Property 11: Five interactive states are pairwise visually distinct and focus differs from resting in a non-color attribute**
    - **Validates: Requirements 11.3, 15.4**
    - File: `design-system/__tests__/interactive-states.property.test.ts`

  - [x] 6.5 Write property test for touch-target sizing
    - **Property 12: Touch targets meet the 44×44 CSS-pixel minimum**
    - **Validates: Requirements 11.6**
    - File: `design-system/__tests__/touch-targets.property.test.ts`

  - [x] 6.6 Write property test for icon stroke width
    - **Property 17: Every Lucide icon on a rendered screen uses the single documented stroke width**
    - **Validates: Requirements 7.2**
    - File: `design-system/__tests__/icon-stroke-width.property.test.ts`

  - [x] 6.7 Write property test for ambient-band luminance
    - **Property 18: The hero ambient layer is at most 8% lighter than the canvas and uses no perceptible gradient stop**
    - **Validates: Requirements 13.9**
    - File: `design-system/__tests__/ambient-luminance.property.test.ts`

- [x] 7. Checkpoint — primitives validated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Re-skin screens (Phase 3)
  - [x] 8.1 Re-skin the Landing page (`app/page.tsx`)
    - Remove `FadeIn`/`Stagger` entrance, `bg-grid-faint`, `bg-scene-hero`, `text-gradient-primary`, `border-conic-soft`
    - Compose the hero with a single `<AmbientBackground variant="hero" />`, display heading, lede paragraph, two CTAs (primary + secondary), and a 3-card proof-points row using `<Grid cols={3} gap="card">`
    - Replace decorative copy "Quiet deadlines. Loud savings." with the approved eyebrow phrase from `design-system/landing.md`
    - Use `max-w-wide` container
    - _Requirements: 6.2, 9.2, 13.11, 13.13, 13.14, 15.7_

  - [x] 8.2 Re-skin Login and Signup via a shared `<AuthShell>` composition
    - Create the `AuthShell` composition (in `components/auth/auth-shell.tsx`) that renders a centered Card at `max-w-auth` with `<BrandMark>` + wordmark above, no `bg-scene-auth`, no `border-conic-soft`, no entrance animation
    - Update `app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx` to render `<AuthShell>` and differ only in heading copy, submit button label, and footer link
    - Update `components/auth/auth-form.tsx` to use the new `<Loader size="sm" />` during pending and to remove the `ReceiptText`-in-a-tile mark
    - _Requirements: 9.3, 13.13_

  - [x] 8.3 Re-skin the Dashboard hero, search, and filters
    - Re-architect the hero block in `components/receipts/receipt-dashboard.tsx` so the title, money-at-risk summary, and intake address render in a single `<Card>` with no aurora, no grid, no mask-fade
    - Re-tone the search input with `/` shortcut, segmented filter chips (`<Button variant="ghost" size="sm" data-active>` with `bg-accent-tint` when active, no glow), and the AI extraction textarea with the new `<Loader>` during pending
    - Use `max-w-wide` for `<main>`
    - _Requirements: 6.3, 9.4, 9.5, 13.13_

  - [x] 8.4 Re-skin receipt cards, urgency badge, empty state, and copy-forwarding-address
    - Update `components/receipts/receipt-card.tsx` to use the data-card pattern with `data-interactive={true}`, preserved absolute-positioned urgency badge, no glow
    - Update `components/receipts/urgency-badge.tsx` so the `attention` pulse fires only on expired-red, with a text label and an `<svg>` icon always present
    - Update `components/receipts/receipt-empty-state.tsx` to use the redesigned dashed-border empty-state pattern with no `bg-aurora-soft` overlay
    - Update `components/receipts/copy-forwarding-address.tsx` to use redesigned tokens; preserve copy/click semantics
    - _Requirements: 6.4, 8.8, 11.7, 13.5_

  - [x] 8.5 Re-skin the Profile page (`app/(dashboard)/profile/page.tsx`)
    - Use `max-w-narrow`, single-column stacked sections with the documented vertical rhythm (section gap 32, card-internal gap 16, label-to-input gap 8)
    - No multi-column grids; share the redesigned `<DashboardHeader>` and `<MobileBottomNav>` chrome
    - _Requirements: 4.5, 4.6, 9.6_

  - [x] 8.6 Re-skin the Settings page (`app/(dashboard)/settings/page.tsx`)
    - Use `max-w-content`, single-column stacked sections, share the redesigned chrome
    - Update `components/settings/logout-section.tsx` to use new `<Button variant="danger">` and `<Loader>` patterns
    - _Requirements: 4.5, 4.6, 9.6_

  - [x] 8.7 Re-skin the Test Extraction page (`app/test-extraction/page.tsx`)
    - Use `max-w-content`; preserve the developer-tool tone (mono code blocks, JSON output area) but switch all colors and fonts to redesigned tokens
    - Update `components/ai/test-extraction-form.tsx` accordingly, using the new `<Loader>` during pending
    - _Requirements: 9.7_

- [x] 9. Verify the re-skinned screens
  - [x] 9.1 Write property test for type-scale coverage across screens
    - **Property 9: Every rendered text element maps to exactly one type-scale step**
    - **Validates: Requirements 3.4, 15.2**
    - File: `design-system/__tests__/type-scale-coverage.property.test.ts`

  - [x] 9.2 Write property test for spacing-scale coverage across screens
    - **Property 10: Every gap between adjacent rendered elements lies on the spacing scale**
    - **Validates: Requirements 4.1, 15.3**
    - File: `design-system/__tests__/spacing-scale-coverage.property.test.ts`

  - [x] 9.3 Write property test for urgency / status indicators combining color + text + icon
    - **Property 13: Urgency, status, and error indicators always combine color with text or icon**
    - **Validates: Requirements 11.7**
    - File: `design-system/__tests__/urgency-indicator.property.test.ts`

  - [x] 9.4 Write property test for absence of horizontal overflow at five viewport widths
    - **Property 15: No horizontal overflow at any documented viewport width**
    - **Validates: Requirements 15.6**
    - File: `design-system/__tests__/no-horizontal-overflow.property.test.ts`

  - [x] 9.5 Write property test for the per-screen decorative-element budget
    - **Property 16: Each screen carries at most one decorative element**
    - **Validates: Requirements 13.13, 13.14, 15.8**
    - File: `design-system/__tests__/decorative-budget.property.test.ts`

- [x] 10. Checkpoint — screens validated
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Clean up deprecated patterns (Phase 4)
  - [x] 11.1 Remove deprecated CSS classes from `app/globals.css`
    - Delete `border-conic-soft`, `bg-scene-hero`, `bg-scene-auth`, `bg-aurora-action`, `bg-aurora-soft`, `bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`, `text-gradient-primary`, `text-gradient-action`, `bg-card-elevated`
    - Grep the codebase first; remove or replace every consumer in the same change so no file references a deleted class
    - _Requirements: 5.5, 5.6, 5.7, 13.4, 13.6, 14.3_

  - [x] 11.2 Remove deprecated keyframes and shadow tokens from `tailwind.config.ts`
    - Delete `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red` keyframes
    - Delete `shadow-card-sm`, `shadow-card-lift`, `shadow-glow-action`, `shadow-glow-soft`, `inner-hair` shadow tokens
    - Keep only `shadow-overlay`
    - _Requirements: 5.2, 5.3, 6.7, 8.6, 14.4_

  - [x] 11.3 Delete legacy primitive exports
    - Remove the `Stagger`/`StaggerItem`/`HoverLift`/`FadeIn` re-exports from `components/motion/motion-primitives.tsx`, leaving only `<Reveal>`
    - Remove the `default` CVA alias from `Button` once all consumers use `primary`
    - Remove the `<ButtonLoader>` shim from the loaders module
    - Remove the unused `pulse` parent-controlled override from `<UrgencyBadge>` and document it in the migration note authored in task 12.3
    - _Requirements: 6.7, 8.9, 13.8, 14.7_

  - [x] 11.4 Write property test for absence of deprecated identifiers
    - **Property 4: Deprecated classes and keyframes are absent from the codebase**
    - **Validates: Requirements 5.5, 5.6, 5.7, 6.7, 8.6, 13.4, 13.5, 13.6, 14.3, 14.4**
    - File: `design-system/__tests__/no-deprecated.property.test.ts`

  - [x] 11.5 Write property test for route-inventory preservation
    - **Property 14: The redesign does not add or remove user-facing routes or API endpoints**
    - **Validates: Requirements 9.8, 14.1**
    - File: `design-system/__tests__/route-inventory.property.test.ts`

- [x] 12. Update design-system documentation as source of truth
  - [x] 12.1 Create `design-system/VISUAL_IDENTITY.md`
    - Author the Visual_Identity prose stance (chosen aesthetic, named references that informed it, named patterns rejected)
    - Embed the contrast matrix from design "Contrast verification" with the actual computed ratios
    - Reproduce the AI_Slop_Pattern catalogue from Requirement 13 as the rejected-pattern checklist
    - _Requirements: 1.2, 1.3, 1.6, 10.8_

  - [x] 12.2 Update `design-system/DESIGN.md
    - Reflect every redesigned token, anti-pattern, and motion rule introduced by Requirements 1-8 and the design "Token system" section
    - Document the chosen UI sans-serif rationale and the three OpenType features applied
    - Document the single accent and the gradient ban
    - _Requirements: 3.2, 3.3, 6.1, 10.1_

  - [x] 12.3 Update `design-system/COMPONENT_PATTERNS.md`
    - Document every Component_Primitive change, including the redesigned empty-state pattern, stat-card pattern, form-card pattern, auth-shell pattern, and dashboard-hero pattern
    - Add a migration-notes section listing every removed prop (`<UrgencyBadge>.pulse`, `<AmbientBackground>.variant="auth"|"app"`, `<ButtonLoader>` component, Button `default` variant alias) with the reason
    - Document the single coherent loading vocabulary
    - _Requirements: 8.6, 8.8, 8.9, 10.2, 14.7_

  - [x] 12.4 Update `design-system/REFERENCES.md`, `IMPLEMENTATION.md`, and `REVIEW.md`
    - Sync `REFERENCES.md` quick-lookup tables to the redesigned tokens exactly
    - Remove deprecated commands/workflow steps from `IMPLEMENTATION.md` and add redesign-specific guidance
    - Update `REVIEW.md` scoring rubric so the AI_Slop_Pattern checklist is a hard-fail Tier-1 check
    - _Requirements: 10.3, 10.4, 10.5_

  - [x] 12.5 Update `design-system/ACCESSIBILITY.md` and `design-system/PERFORMANCE.md`
    - Reflect redesigned tokens, the focus-visible non-color rule, and the reduced-motion strategy in `ACCESSIBILITY.md`
    - Reflect the JS/CSS budgets, font budget, and animation property restriction in `PERFORMANCE.md`
    - _Requirements: 10.6, 11.3, 11.4, 12.1, 12.2, 12.3, 12.6_

  - [x] 12.6 Update per-screen specs
    - Update `landing.md`, `login.md`, `signup.md`, `dashboard.md`, `profile.md`, `settings.md`, `test-extraction.md`, and `navigation.md` with the redesigned compositions and the wireframe-level prose for each hero/main block
    - _Requirements: 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [x] 12.7 Write example test for `VISUAL_IDENTITY.md` required sections
    - Assert the file exists and contains "Visual identity stance", a contrast matrix table, and the AI_Slop_Pattern checklist
    - File: `design-system/__tests__/visual-identity.example.test.ts`
    - _Requirements: 1.2, 10.8_

  - [x] 12.8 Write example test for per-screen spec files
    - Assert each In_Scope_Screen has a corresponding spec file under `design-system/`
    - File: `design-system/__tests__/page-spec-files.example.test.ts`
    - _Requirements: 9.1, 10.1_

  - [x] 12.9 Write example test for migration notes per removed prop
    - Assert `COMPONENT_PATTERNS.md` contains a migration note for each documented removed prop
    - File: `design-system/__tests__/migration-notes.example.test.ts`
    - _Requirements: 8.9, 14.7_

- [x] 13. Wire performance-budget enforcement
  - [x] 13.1 Add the bundle-size check script
    - Author `scripts/check-bundle-size.mjs` that reads `.next/build-manifest.json` and `_next/static/css/*` after `next build`, compares against `design-system/__tests__/bundle-baseline.json`, and exits non-zero if the `/dashboard` first-load JS exceeds baseline + 10 KB or the total CSS exceeds baseline + 5 KB
    - _Requirements: 12.1, 12.2_

  - [x] 13.2 Add the `performance-budget` job to `.github/workflows/ci.yml`
    - Add a job that runs `npm run build` then `node scripts/check-bundle-size.mjs`
    - Keep existing `lint`, `typecheck`, `sadtest` jobs unchanged
    - _Requirements: 12.1, 12.2_

  - [x] 13.3 Write example test for the asset budget and runtime restrictions
    - Assert no image asset under `public/` exceeds 16 KB and no user-facing component imports `<canvas>`, WebGL, or `<video>`
    - File: `design-system/__tests__/asset-budget.example.test.ts`
    - _Requirements: 12.4_

  - [x] 13.4 Write example test for preserved Toaster configuration
    - Assert `<Toaster position="bottom-right" theme="dark" ... />` is present in `app/layout.tsx` with semantics preserved
    - File: `design-system/__tests__/toaster-config.example.test.ts`
    - _Requirements: 14.6_

- [x] 14. Final checkpoint — full validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but every property in `design.md`'s Correctness Properties section is exercised when the optional sub-tasks are completed.
- Each task references specific requirements clauses and, where applicable, a numbered correctness property from `design.md`.
- The four-phase migration matches the design's Architecture: tokens land first (Phase 1, tasks 2-4), primitives are rebuilt against the new tokens (Phase 2, tasks 5-7), screens are re-skinned (Phase 3, tasks 8-10), and deprecated classes/keyframes are deleted last (Phase 4, task 11). The app remains shippable at every checkpoint.
- The `<Reveal>`/`<Loader>`/`<Button>` compatibility shims introduced in Phase 2 are retired in task 11.3 once all consumers migrate. This keeps consumer pages compiling between phases per Requirement 8.9 and 14.7.
- Property tests run under the existing `npm run sadtest` Vitest job; the performance-budget job is added once in task 13.2 and runs alongside the existing `lint`, `typecheck`, `sadtest` jobs in CI.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.4"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2", "2.3", "2.4"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 4, "tasks": ["5.7", "5.8", "5.9", "5.10", "5.11", "5.12", "5.13"] },
    { "id": 5, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7"] },
    { "id": 6, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 8, "tasks": ["11.1", "11.2", "11.3"] },
    { "id": 9, "tasks": ["11.4", "11.5"] },
    { "id": 10, "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6"] },
    { "id": 11, "tasks": ["12.7", "12.8", "12.9", "13.1", "13.3", "13.4"] },
    { "id": 12, "tasks": ["13.2"] }
  ]
}
```
