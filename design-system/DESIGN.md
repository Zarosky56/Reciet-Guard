# DESIGN.md — Global Design System

> **Authority.** This document is the source of truth for visual tokens, motion language, and global anti-patterns. Page-level specs (`landing.md`, `dashboard.md`, etc.) and primitive specs (`COMPONENT_PATTERNS.md`) defer to this file. When a page or component disagrees with the tokens defined here, the page or component is the bug.
>
> **Cross-references.** This file owns the **token system, motion rules, and global anti-patterns**. Sister documents own:
> - `VISUAL_IDENTITY.md` — the long-form aesthetic stance, named reference products, and the verbatim AI_Slop_Pattern catalogue (Requirement 13).
> - `COMPONENT_PATTERNS.md` — the canonical Component_Primitive contracts and Composition_Pattern blueprints (Requirements 8.1–8.9).
> - `ACCESSIBILITY.md` / `PERFORMANCE.md` — deep accessibility and performance governance.
> - `REFERENCES.md` — the at-a-glance lookup tables that mirror this file.
>
> _Validates Requirements 3.2, 3.3, 6.1, 10.1._

---

## 1. Design philosophy

**"Calm precision, set in graphite-and-brass."** Receipt Guardian is a financial-document tool. Its visual identity is dark, slightly warm, and deliberately uncool — the surface of a single sheet of well-set paper rather than a "premium dark dashboard" template. Type carries the personality; color carries meaning, not mood; motion exists only when state changes.

### Core principles

1. **Content first, chrome last** — Navigation and framing recede; data and actions dominate.
2. **One accent, document-relevant** — A desaturated warm amber (`oklch(0.78 0.13 78)`). Not Tailwind cobalt. Not Linear / Vercel / Stripe / shadcn defaults. The same hue the urgency badge uses for "due soon," promoted to the global accent.
3. **Whitespace is the luxury** — Generous spacing signals quality more than any ornament.
4. **Motion is meaning** — Animate only on user input, state change, or one documented attention signal per screen. Never on entrance.
5. **Dark-only** — `color-scheme: dark` is set at `:root`. No light-mode toggle.
6. **Surface, not depth** — Cards have a fill and a border. They do not have shadows. Only overlays carry the single retained shadow token.

---

## 2. Visual identity

This section satisfies Requirement 1.2's mandate that DESIGN.md carry a single dedicated "Visual identity" section. Long-form prose (named reference products, rejected-pattern justification, screenshot index) lives in `VISUAL_IDENTITY.md`; the load-bearing summary lives here.

### Aesthetic stance

The point of view in one sentence: **"It should read like a well-set ledger page, not like a 2026 SaaS landing template."**

That cashes out as:

- **Dark, but warm.** Canvas is graphite (`oklch(0.13 0.005 270)`) tilted barely toward neutral cool. Text and accents tilt warm (90° hue for text, 78° hue for the accent). The result reads as document-adjacent, not as "cobalt-on-charcoal AI dashboard."
- **One accent, document-relevant.** Warm amber `oklch(0.78 0.13 78)` ≈ `#D9A24C`. Amber is the deadline-domain color the urgency badge already uses for "due soon"; making it the global accent means the entire app speaks the same color language as its most important state.
- **Surface, not depth.** Two surfaces (`canvas` → `surface`) plus an interactive raised step (`surface-hover`) on hover. No shadows at rest. No gradients. No decorative blur.
- **Type-led identity.** The brand mark is a custom typographic `R` SVG, not a Lucide icon in a tile. Headings in Geist Sans with `cv11` / `ss03` / `tnum` carry the personality budget that decoration usually steals.
- **Motion as state, not entrance.** No stagger-fade hero. No reveal-on-scroll. The single allowed indeterminate animation is the 2px route-progress bar; the single allowed attention loop is the expired-urgency pulse.

### Named reference products (informed-by, not copied-from)

Linear, Vercel, Stripe (dashboard + Stripe Press), Apple Settings, Arc Browser, Notion, Raycast. Studied for spacing rhythm, restraint, and hierarchy. **Their accent palettes are explicitly not adopted** — see Requirement 1.3 and the rejected-pattern catalogue. Detailed rationale per product lives in `VISUAL_IDENTITY.md` § "Named reference products."

### Named patterns explicitly rejected

The hard-fail catalogue from Requirement 13 is reproduced verbatim in `VISUAL_IDENTITY.md` § "AI_Slop_Pattern rejected-pattern checklist" and § 11 of this document carries the abbreviated reviewer-facing list. Each banned pattern has either an ESLint rule, a property test, or both behind it.

### Justification rule (Requirement 1.6)

Every token, primitive, and composition added by this redesign traces back to one of three justifications, recorded in the matching design-system spec file:

1. **Domain fit** — the choice strengthens the receipt/deadline language of the product.
2. **AI-slop avoidance** — the choice was checked against the Requirement 13 catalogue and the candidate that matched any banned pattern was rejected.
3. **Reduction** — when two design choices delivered equivalent function, the simpler one was kept (two surfaces over three, one shadow over four, one accent over a palette, one indeterminate animation over five).

---

## 3. Color tokens

All colors are defined in **`oklch()`** for documented L/C/H. Every token has two definitions that **must agree exactly**: a CSS custom property in `app/globals.css` (`:root`) and a Tailwind theme entry in `tailwind.config.ts` that references the variable via `var(--color-…)`. Property test §1 (`design-system/__tests__/token-parity.property.test.ts`) enforces parity.

### Canvas

| Token | Value | Hex (≈) | Usage |
|---|---|---|---|
| `--color-canvas` | `oklch(0.13 0.005 270)` | `#0B0B10` | Page background, input backgrounds |
| `--color-canvas-raised` | `oklch(0.16 0.006 270)` | `#13131A` | Hero ambient band, opaque dashboard header chrome |

### Surface

| Token | Value | Hex (≈) | Usage |
|---|---|---|---|
| `--color-surface` | `oklch(0.19 0.007 270)` | `#1B1B22` | Cards (resting), dialog panels (under overlay), header chrome |
| `--color-surface-hover` | `oklch(0.22 0.008 270)` | `#22222C` | Card hover (interactive), button-secondary hover |
| `--color-surface-overlay` | `oklch(0.21 0.008 270)` | `#1F1F28` | Dialog content (above scrim), PageLoader card, Toaster |

### Border

| Token | Value | Hex (≈) | Usage |
|---|---|---|---|
| `--color-border` | `oklch(0.27 0.009 270)` | `#2C2C38` | Default 1px borders |
| `--color-border-strong` | `oklch(0.34 0.010 270)` | `#3A3A48` | Hover borders, dividers |
| `--color-border-focus` | `oklch(0.78 0.13 78)` | `#D9A24C` | Focus ring (intentionally identical to `--color-accent`) |

### Text

| Token | Value | Hex (≈) | Usage |
|---|---|---|---|
| `--color-text-primary` | `oklch(0.96 0.005 90)` | `#F1EFE9` | Body, headlines, labels |
| `--color-text-secondary` | `oklch(0.74 0.012 90)` | `#B5B0A4` | Descriptions, metadata |
| `--color-text-muted` | `oklch(0.55 0.012 90)` | `#7E7A6F` | Tertiary, placeholders, captions |

### Accent (single brand accent)

| Token | Value | Hex (≈) | Usage |
|---|---|---|---|
| `--color-accent` | `oklch(0.78 0.13 78)` | `#D9A24C` | Primary CTA fill, links, focus ring, active nav indicator |
| `--color-accent-hover` | `oklch(0.83 0.13 78)` | `#E5B05A` | Accent hover and pressed state |
| `--color-accent-tint` | `oklch(0.30 0.06 78)` | `#3F2F18` | Tinted-accent background for selected state, badge fill, active filter chip |

**Accent rationale (Requirement 1.3, 2.5).** The pre-redesign accent was Tailwind cobalt (`#5B8CFF` / `#3B82F6`) — the textbook AI-generated-UI tell. The redesigned accent is desaturated warm amber, defined in a perceptual color space, and meets every constraint:

- **Not a Tailwind default.** `oklch(0.78 0.13 78)` ≠ `blue-500` / `indigo-500` / `violet-500` / `amber-500` / `yellow-500`. It is a custom value chosen for chroma 0.13, lightness 0.78, hue 78°.
- **Not a 1:1 match for Linear / Vercel / Stripe / shadcn.** Those products ship indigo, white, lavender, and zinc respectively.
- **WCAG 2.1 AA on every documented pair.** 8.9:1 against canvas; 7.1:1 against surface (Requirements 2.5, 11.1, 11.2). Full matrix in `VISUAL_IDENTITY.md` § "Contrast matrix."
- **Domain-relevant.** Amber is the deadline-domain color. The urgency badge already uses amber for "due soon"; promoting it to the global accent makes the most important state in the product the same color as the brand.

**Tinted-accent variant (Requirement 2.6).** `bg-accent-tint` is a **pre-tokenized solid** at `oklch(0.30 0.06 78)`. Inline-opacity expressions (`bg-accent/10`) are forbidden — selected nav items, badge fills, and active filter chips use this token directly.

**Accent = focus.** `--color-border-focus` is intentionally the same value as `--color-accent`. "What the user can act on" and "what the user is focused on" speak the same color, removing one degree of cognitive translation.

### Semantic

| Token | Value | Hex (≈) | Usage |
|---|---|---|---|
| `--color-success` | `oklch(0.72 0.16 150)` | `#3FB97A` | Positive status, success toast, "all calm" badge |
| `--color-warning` | `oklch(0.78 0.15 70)` | `#D69544` | Caution, "due soon" urgency |
| `--color-danger` | `oklch(0.65 0.20 25)` | `#D95A4D` | Destructive, expired urgency |
| `--color-info` | `oklch(0.72 0.08 230)` | `#7AA0C2` | Optional info, not used by default |

### Color rules

- **No raw color literals in user-facing source.** Hex, `rgb()`, `hsl()`, `oklch()`, `oklab()` literals are forbidden in `app/`, `components/`, `lib/`. Allow-listed locations are `tailwind.config.ts`, `app/globals.css`, and `public/**/*.svg`. Enforced by `eslint-rules/no-raw-color.js` and property test §2 (`no-raw-color.property.test.ts`).
- **No multi-color or hue-shifting gradient** as a background fill, text fill, or border on any user-facing surface (Requirement 2.7). The single exception is the optional `<AmbientBackground variant="hero">` band — see § 7.
- **No `bg-clip-text`** gradient text (Requirement 3.7, 13.3). Property test §5 (`no-forbidden-gradients.property.test.ts`) enforces this.
- **No `bg-action`-on-canvas (cobalt)** anywhere outside `tailwind.config.ts` deprecated-color keys that have not yet been removed. Property test §6 (`no-cobalt.property.test.ts`) enforces zero usages of `#3B82F6`, `#5B8CFF`, `indigo-500`, `violet-500`, `blue-500`.
- **Text-on-surface contrast.** When a text token sits on a surface other than `canvas`, the contrast pair must be in the matrix in `VISUAL_IDENTITY.md` and `ACCESSIBILITY.md` § 3. Adding a new surface or text token requires re-computing the matrix.

### Two-definitions-one-truth rule (Requirement 2.3)

Every color token is defined twice:

1. As a CSS custom property on `:root` in `app/globals.css`.
2. As a Tailwind theme color in `tailwind.config.ts` (under `theme.extend.colors`) that resolves to `var(--color-…)`.

Both definitions must land in the same change. Property test §1 parses both files and asserts the key sets are equal and the values agree. CI fails if either definition drifts.

---

## 4. Typography tokens

### Font families (Requirement 3.1, 3.2)

| Role | Family | Loaded via | CSS variable |
|---|---|---|---|
| UI sans | **Geist Sans** | `next/font/google` Latin subset, `display: "swap"`, `preload: true` (regular only) | `var(--font-ui)` |
| Mono / data | **JetBrains Mono** | `next/font/google` Latin subset, `display: "swap"`, `preload: false` | `var(--font-mono)` |

Geist replaces Inter (the pre-redesign default). Both fonts are wired up in `app/layout.tsx` and bound to CSS variables on `<html>` so `globals.css` can pick them up in `body { font-family: var(--font-ui), … }`.

**Geist rationale (Requirement 3.2).** Inter is the default Tailwind / shadcn / Vercel-template sans — the textbook "AI dark dashboard" type face. Geist (Vercel's open-source family by Vercel + Basement Studio) was chosen because:

- It is **not** the default Tailwind / shadcn font.
- It has **narrower apertures and a higher x-height** than Inter, giving the UI a slightly more architectural rhythm at the small-to-medium sizes a data tool spends most of its life rendering.
- It ships with cleanly drawn `cv01`, `cv11`, and `tnum` tables, so the personality features (§ "OpenType features" below) compose without a custom font build.
- It is variable, so a single regular-axis file covers the entire weight range used by the redesigned type scale.

Only the regular axis file is preloaded (Requirement 12.3). JetBrains Mono is loaded but not preloaded — the mono only renders on data and code surfaces, not on the critical-path heading and body text.

### OpenType features (Requirement 3.3)

Three minimum, applied globally on `body`:

| Feature | Tag | Effect | Why it earns the slot |
|---|---|---|---|
| Alternate single-story `a` | `cv11` | Replaces the default two-story `a` with a single-story alternate | Gives the lowercase rhythm a recognizable identity at small sizes; pairs Geist's geometric `o` and `e` with a matching humanist `a` |
| Alternate single-story `g` | `ss03` | Replaces the default double-story `g` with a single-story alternate | Improves legibility at 12-14 px UI sizes where the double-story `g` collapses on dark backgrounds |
| Tabular numbers | `tnum` | Forces fixed-width numerals globally | Stat values, prices, dates, deadline countdowns, and money-at-risk figures stay optically aligned across renders without per-call-site `tabular-nums` utilities |

CSS:

```css
body {
  font-family: var(--font-ui), Geist, system-ui, sans-serif;
  font-feature-settings: "cv11", "ss03", "tnum";
}
```

Implementation lives in `app/globals.css`. **`tnum` is global on `body`.** The mono family carries tabular numbers natively — no opt-in needed there. UI consumers that want to suppress `tnum` for prose reading use `font-variant-numeric: normal` (rare).

### Type scale (Requirement 3.4)

Nine steps. All sizes in `rem`. Every step ships size, line-height, tracking, and weight as separate `--text-*` CSS variables in `app/globals.css` so consumers reach for one token, not four.

| Step | Size | Line-height | Tracking | Weight | Usage |
|---|---|---|---|---|---|
| `--text-caption` | `0.75rem` (12 px) | `1rem` (16 px) | `0.04em` | 500 | Stat labels (uppercase), badges |
| `--text-meta` | `0.8125rem` (13 px) | `1.125rem` (18 px) | `0` | 400 | Metadata, footnotes, captions |
| `--text-body` | `0.875rem` (14 px) | `1.5rem` (24 px) | `0` | 400 | Body, descriptions |
| `--text-body-lg` | `1rem` (16 px) | `1.625rem` (26 px) | `0` | 400 | Long-form body, landing lede |
| `--text-label` | `0.875rem` (14 px) | `1.25rem` (20 px) | `0` | 500 | Form labels |
| `--text-title-sm` | `1rem` (16 px) | `1.375rem` (22 px) | `-0.005em` | 500 | Card titles, form section heads |
| `--text-title-md` | `1.25rem` (20 px) | `1.625rem` (26 px) | `-0.01em` | 600 | Section titles |
| `--text-title-lg` | `1.5rem` (24 px) | `1.875rem` (30 px) | `-0.015em` | 600 | Page titles (h1) |
| `--text-display` | `2.625rem` (42 px) → `3.75rem` (60 px) at `md+` | `1.05` | `-0.03em` | 600 | Landing hero only |

**Hero rules (Requirement 3.8).** When the rendered size exceeds 32 px (i.e. `--text-display`), the type scale itself applies `letter-spacing: -0.03em` and consumers add `text-wrap: balance` plus a documented max-line count (2 for the landing hero). Heading-clamping is the responsibility of the type-scale class, not of one-off Tailwind utilities.

### Typography rules

- **Forbidden arbitrary type utilities.** `text-[Npx]`, `leading-[Npx]`, `tracking-[Nem]` are forbidden in user-facing components. Allow-list: `tailwind.config.ts`, `app/globals.css`, `components/ui/typography.tsx` (if added), `components/ui/grid.tsx`. Enforced by `eslint-rules/no-arbitrary-spacing.js` and property test §3 (`no-arbitrary-spacing.property.test.ts`).
- **No `bg-clip-text` gradient text** on any heading, subhead, or body element on any In_Scope_Screen (Requirement 3.7, 13.3).
- **Tabular numbers for numerals** (Requirement 3.6). Stat values, prices, dates, and deadline countdowns inherit `tnum` from `body`. The mono family provides `tabular-nums` natively.
- **No italic** in UI. Reserved for editorial content (the app does not render any).
- **No underline** except on links. Links use `text-accent`, not underline.
- **Type-scale coverage.** Every rendered text element maps to exactly one type-scale step. Property test §9 (`type-scale-coverage.property.test.ts`) enforces this.

---

## 5. Spacing scale

Base unit **4 px**. Allowed steps: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`. These map onto Tailwind's existing `1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24` keys — the redesign does not extend the scale; it forbids arbitrary values via lint and property test.

### Vertical rhythm (Requirement 4.6)

| Rule | Value | Tailwind |
|---|---|---|
| Section gap (between top-level sections of a page) | 32 px | `gap-8` |
| Subsection gap (within a section) | 24 px | `gap-6` |
| Card-internal gap | 16 px | `gap-4` |
| Label-to-input gap | 8 px | `gap-2` |
| Form-row gap (between fields in a row) | 16 px | `gap-4` |

Every In_Scope_Screen is audited per its `design-system/<screen>.md` spec.

### Spacing rules

- **No arbitrary spacing utilities.** `p-[Npx]`, `m-[Npx]`, `gap-[Nrem]`, `space-x-[Npx]`, `space-y-[Npx]`, `top-[Npx]`, etc. are forbidden in user-facing components. Allow-listed files only: `tailwind.config.ts`, `components/ui/typography.tsx` (if added), `components/ui/grid.tsx`. Enforced by `eslint-rules/no-arbitrary-spacing.js`.
- **No one-off grid track definitions.** `grid-cols-[Xfr_Yrem]` is forbidden in page and composition code. Multi-column grids go through the `<Grid>` primitive (`components/ui/grid.tsx`) — see `COMPONENT_PATTERNS.md` § 3.14.
- **Spacing-scale coverage.** Property test §10 (`spacing-scale-coverage.property.test.ts`) enforces that every gap between adjacent rendered elements lies on the spacing scale.

---

## 6. Radius scale

Five named steps (Requirement 4.3). Every primitive picks exactly one step.

| Token | Value | Used by |
|---|---|---|
| `--radius-xs` | `4 px` | Badge |
| `--radius-sm` | `6 px` | Button (`sm`), Input, Textarea, Select |
| `--radius-md` | `10 px` | Button (`default`, `lg`, `icon`) |
| `--radius-lg` | `14 px` | Card, Dialog, PageLoader card, hero ambient band |
| `--radius-pill` | `999 px` | Avatar, status indicator dot, route-progress bar caps |

Radii ≥ 14 px are reserved for top-level containers; never apply `rounded-lg` to inline chrome. The pill radius is reserved for circles and inline status dots.

---

## 7. Container width tokens

Four named widths (Requirement 4.4). Every page's `<main>` uses exactly one.

| Token | Value | Tailwind | Used by |
|---|---|---|---|
| `--container-auth` | `26 rem` (416 px) | `max-w-auth` | Login, Signup |
| `--container-narrow` | `42 rem` (672 px) | `max-w-narrow` | Profile |
| `--container-content` | `56 rem` (896 px) | `max-w-content` | Settings, Test Extraction |
| `--container-wide` | `72 rem` (1152 px) | `max-w-wide` | Landing, Dashboard |

Pages always use `mx-auto px-6 md:px-8` plus exactly one `max-w-*` from the table above.

---

## 8. Surface and elevation

Three elevation levels plus an overlay layer. **No drop shadow at rest.** Depth is conveyed by canvas/surface fill contrast plus border tone.

| Level | Background | Border | Shadow | Used by |
|---|---|---|---|---|
| Canvas | `--color-canvas` | none | none | `<body>`, page background |
| Surface | `--color-surface` | `--color-border` 1 px | none | Cards (resting), dashboard header, mobile bottom nav |
| Raised surface | `--color-surface-hover` | `--color-border-strong` 1 px | none | Card on hover (interactive only), focused inputs |
| Overlay | `--color-surface-overlay` | `--color-border` 1 px | `--shadow-overlay` | Dialog content, Toaster, PageLoader card |

`--shadow-overlay` is the **only** shadow token shipped (Requirement 5.3):

```css
--shadow-overlay:
  0 12px 32px -8px oklch(0 0 0 / 0.55),
  0 2px 6px oklch(0 0 0 / 0.35);
```

The pre-redesign tokens `shadow-card-sm`, `shadow-card-lift`, `shadow-glow-action`, `shadow-glow-soft`, and `inner-hair` were deleted in Phase 4 (`tailwind.config.ts`).

### Backdrop-blur policy (Requirement 5.4)

`backdrop-filter: blur(...)` is forbidden everywhere except:

- The global `<Toaster />` (Sonner's built-in styling).
- The Dialog and PageLoader scrim, capped at **8 px** (`backdrop-blur-sm` in Tailwind = 4 px, well under the cap).

The pre-redesign `backdrop-blur-xl` chrome on `<DashboardHeader>` is deleted; the header is now opaque `bg-canvas-raised`.

### Ambient atmospheric layer (Requirements 5.6, 5.7, 13.5, 13.9)

The hero pages may render at most one tonal element. Implementation: `<AmbientBackground variant="hero" | "off" />` (`components/visual/ambient-background.tsx`).

- `variant="hero"` renders a single fixed band: `bg-canvas-raised`, height ≤ 320 px, masked by `linear-gradient(to bottom, black 0%, transparent 100%)` so the band fades to canvas at the bottom. The mask drives **opacity only**; there is no perceptible gradient stop in the painted color.
- `variant="off"` renders `null`.
- The luminance step from canvas to canvas-raised is ≤ 8 % (Requirement 13.9). Property test §18 (`ambient-luminance.property.test.ts`) enforces this.
- The band carries `data-decorative="true"` so reviewers can audit the per-screen decorative-element budget (≤ 1, Requirement 13.13 / 13.14).
- The pre-redesign `auth` and `app` variants are accepted by the type for backwards compatibility but treated internally as `off`. See `COMPONENT_PATTERNS.md` § 13.6.

### Gradient ban (Requirements 2.7, 13.2, 13.3, 13.5)

No multi-color or hue-shifting gradient is shipped in `tailwind.config.ts` or `app/globals.css` as a fill, text, or border. **The only gradient is the alpha-only mask on the `hero` ambient band**, and that mask drives opacity, not hue. Property test §5 (`no-forbidden-gradients.property.test.ts`) enforces this.

### Removed surface utilities (Requirements 5.5, 5.6, 5.7, 13.4, 13.6, 14.3)

Deleted in Phase 4 from `app/globals.css` and `tailwind.config.ts`:

- `border-conic-soft` (conic-gradient icon-tile halo)
- `bg-scene-hero`, `bg-scene-auth` (radial-gradient page scenes)
- `bg-aurora-action`, `bg-aurora-soft` (radial blob backgrounds)
- `bg-grid-faint` (masked grid mesh)
- `mask-fade-radial`, `mask-fade-bottom` (companion masks for the grid mesh)
- `text-gradient-primary`, `text-gradient-action` (`bg-clip-text` gradient text)
- `bg-card-elevated` (linear-gradient overlay on cards)

Property test §4 (`no-deprecated.property.test.ts`) enforces that none of these identifiers reappear.

---

## 9. Motion tokens and motion language

### Duration tokens (Requirement 6.1)

Four steps (≤ 5 allowed):

| Token | Value | Usage |
|---|---|---|
| `--motion-instant` | `80 ms` | Press feedback (`active:scale-[0.985]`) |
| `--motion-quick` | `150 ms` | Button hover, link color shift |
| `--motion-default` | `220 ms` | Card hover lift, focus border, dialog open |
| `--motion-slow` | `360 ms` | Dialog content slide-in |

### Easing tokens (Requirement 6.1)

Three curves (≤ 4 allowed):

| Token | Value | Usage |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default for all UI transitions |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0.1, 1)` | Dialog open, attention pulse |
| `--ease-linear` | `linear` | Indeterminate progress (route-progress only) |

### Allowed properties (Requirement 6.5)

CSS keyframes and framer-motion animations target **`transform` and `opacity` only**. Animating `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter`, or `background-image` is forbidden in any keyframe.

Pragmatic deviation: hover transitions on `background-color`, `border-color`, and `color` are permitted because they neither trigger layout nor compositor paint cascades, and they are necessary for hover states.

### Allowed triggers (Requirement 6.4)

Motion fires only on:

1. **User input** — hover, focus, press, drag.
2. **State change** — loading → loaded, dialog open/close, status change.
3. **One documented attention signal per screen.** The expired-red urgency badge on the dashboard is the canonical (and only) attention consumer; it pulses via the `attention` keyframe.

Page-level enter animations on any In_Scope_Screen, stagger animations on data lists, scroll-triggered reveals, and parallax effects are all forbidden (Requirements 6.2, 6.3, 13.8).

### Allowed keyframes

Two only:

| Keyframe | Replaces | Behavior | Used by |
|---|---|---|---|
| `attention` | `pulse-red` | Opacity 0.7 ↔ 1, 2.4 s, `--ease-emphasized`, infinite | `<UrgencyBadge>` when `variant="danger"` AND `daysRemaining < 0` |
| `route-progress` | `loader-rail`, `shimmer` | `transform: translateX(-100% → 100%)`, 1.2 s, linear, infinite | `<RouteProgress>` only |

`framer-motion` remains in `package.json` but its **only retained consumer is `<Dialog>`** (open/close), via the `<Reveal>` primitive (`components/motion/motion-primitives.tsx`).

### Removed keyframes (Requirements 6.7, 14.4)

Deleted from `tailwind.config.ts` in Phase 4: `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red`. The matching `<ActionLoader>`, `<ButtonLoader>`, `<CardActionLoader>`, `<ScanGlyph>`, `<ProcessRail>`, `<ProcessSteps>`, `<FadeIn>`, `<Stagger>`, `<StaggerItem>`, `<HoverLift>` exports were removed from `components/motion/motion-primitives.tsx` and `components/ui/loaders.tsx`. See `COMPONENT_PATTERNS.md` § 13.

### Reduced-motion strategy (Requirements 6.6, 11.4, 12.7)

The global `prefers-reduced-motion: reduce` block in `app/globals.css` clamps `animation-duration` and `transition-duration` to `0.01 ms` and adds a `[data-reduced-motion="static"]` selector that hard-cancels animation and transition on opted-in nodes:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  [data-reduced-motion="static"],
  [data-reduced-motion="static"]::before,
  [data-reduced-motion="static"]::after {
    animation: none !important;
    transition: none !important;
  }
}
```

`<RouteProgress>` and the `attention` pulse carry `data-reduced-motion="static"` on the animated node, so reduced-motion users see a static accent fill / static dot in place of the loops. `<Loader>` is already static, so it requires no fallback. Property test §8 (`reduced-motion.property.test.ts`) enforces this contract.

### One indeterminate loop max (Requirements 6.8, 12.7)

`<RouteProgress>` is the only indeterminate animation allowed during a route transition. The `attention` pulse is conditional on a single critical urgency badge per screen. `<Loader>` is static. `<Skeleton>` is static. **No spinners, no shimmers, no breathing dots.**

---

## 10. Iconography

### Strategy (Requirement 7.1)

Option **(a)** chosen: keep `lucide-react`, single global stroke width, curated subset.

- **Stroke width: `1.75`.** Mixed stroke widths within a screen are forbidden (Requirement 7.2). Property test §17 (`icon-stroke-width.property.test.ts`) enforces this; `<MobileBottomNav>` demonstrates the explicit `strokeWidth={1.75}` pattern.
- **Allow-list of ~22 icons** lives in `REFERENCES.md`. Adding a new icon requires updating the list.

### Icon size tokens (Requirement 7.3)

| Token | Value | Usage |
|---|---|---|
| `icon-xs` | `12 px` | Inside a badge |
| `icon-sm` | `14 px` | Inline with body text |
| `icon-md` | `16 px` | Inside a button (`data-icon`), default |
| `icon-lg` | `20 px` | Standalone in card, nav |

### Decorative-tile ban (Requirement 7.4)

No icon is wrapped in a bordered, glowing, or conic-gradient tile. The single exception is the **Brand_Mark**, which is a custom typographic SVG, not a Lucide icon.

### Brand_Mark (Requirements 1.4, 1.5)

The brand mark is the typographic `R` SVG at `public/brand/mark.svg` (24×24 viewBox, slab `R` with a tab cut, no tile, no halo, no gradient). Rendered by `<BrandMark size="sm" | "md" | "lg" />` (`components/brand/brand-mark.tsx`). Sizes: 24 / 28 / 32 px.

The mark sits flush next to the wordmark — see `COMPONENT_PATTERNS.md` § 4.7 (Auth Shell) and § 3.13 (`<DashboardHeader>` consumer).

### Icon accessibility (Requirement 7.5)

Icons next to text get `aria-hidden="true"` on the icon and inherit `currentColor`. Icon-only buttons get `aria-label` on the button. Icons never introduce additional color beyond the parent's color token.

---

## 11. Global anti-patterns

The verbatim hard-fail catalogue lives in `VISUAL_IDENTITY.md` § "AI_Slop_Pattern rejected-pattern checklist." The reviewer-facing summary lives below. Each banned pattern maps to one or more enforcement layers (ESLint rule, property test, manual review).

### Visual

- ❌ Tailwind-default cobalt / indigo / violet accents (`#3B82F6`, `#5B8CFF`, `blue-500`, `indigo-500`, `violet-500`) — Requirement 13.1, property test §6.
- ❌ Multi-color or hue-shifting gradients (linear, radial, conic) on backgrounds, text, or borders — Requirements 2.7, 13.2, 13.3, property test §5.
- ❌ `bg-clip-text` gradient text on any heading or wordmark — Requirements 3.7, 13.3.
- ❌ Masked dotted / grid mesh backgrounds (`bg-grid-faint` + `mask-fade-*`) — Requirement 13.4, property test §4.
- ❌ Radial "aurora" / "spotlight" blob backgrounds inside cards — Requirement 13.5, property test §4.
- ❌ Conic-gradient halos around icon or logo tiles — Requirement 13.6, property test §4.
- ❌ Glassmorphism (translucent fill + backdrop-blur) outside the Toaster and the modal scrim — Requirement 13.7.
- ❌ Glow shadows on resting elements — Requirements 5.2, 5.3, property test §4.
- ❌ Inner-hair surface highlights (`shadow-inner-hair`) — Requirements 5.2, 5.3, property test §4.

### Motion

- ❌ Page-level enter animations (fade-in-up of the entire page or hero) — Requirement 6.2.
- ❌ Stagger-fade entrance animations on lists, hero sections, or proof grids — Requirements 6.3, 13.8.
- ❌ Animations on `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter`, `background-image` — Requirement 6.5.
- ❌ More than one indeterminate loop visible on a screen at the same time — Requirement 6.8.
- ❌ Spinner glyphs (rotating SVGs), `animate-spin`, `animate-shimmer`, `animate-ledger-scan`, `animate-loader-rail`, `animate-loader-step`, `animate-pulse` on user-facing chrome — Requirements 6.7, 8.6, 14.4.

### Layout

- ❌ Stacking more than one decorative element per composition (tile-bordered icon + gradient text + conic halo + aurora background + dotted grid + glow shadow) — Requirement 13.13.
- ❌ Landing hero with more than one of: ambient tonal background, structural rule line, single typographic mark — Requirement 13.14, property test §16.
- ❌ The combined "dark canvas + cobalt accent + radial gradient + grid + glow shadow" stack on the same screen — Requirement 13.10.
- ❌ Sidebar navigation (until 3+ authenticated pages exist).
- ❌ Multi-column forms.
- ❌ Carousels, sliders, horizontal-scroll sections.

### Code

- ❌ Raw hex / `rgb()` / `hsl()` / `oklch()` literals in `app/`, `components/`, `lib/` — Requirement 2.4, ESLint `no-raw-color`.
- ❌ Arbitrary spacing / sizing / type utilities (`p-[Npx]`, `gap-[Nrem]`, `text-[Npx]`) in user-facing components — Requirements 3.5, 4.2, 4.5, ESLint `no-arbitrary-spacing`.
- ❌ `bg-action/10`-style inline-opacity tints on the accent — Requirement 2.6 (use `bg-accent-tint`).
- ❌ Inline `style={{}}` for color or spacing.
- ❌ One-off `grid-cols-[Xfr_Yrem]` declarations outside the `<Grid>` primitive.

### Content

- ❌ Generic placeholder voice ("Quiet deadlines. Loud savings.", "Trusted by thousands", "How it works", "Get started in 60 seconds") used as decorative copy — Requirement 13.11.
- ❌ Lucide icons as the brand mark inside a rounded-square tile — Requirement 13.12.
- ❌ Marketing language in authenticated pages.
- ❌ "Coming soon" or disabled UI elements.

---

## 12. Token enforcement

Three guard rails make the token system structural, not advisory:

1. **`eslint-rules/no-raw-color.js`** — flags any `#[0-9a-fA-F]{3,8}`, `rgb(`, `rgba(`, `hsl(`, `hsla(`, `oklch(`, `oklab(` literal in `app/`, `components/`, `lib/`. Allow-list: `tailwind.config.ts`, `app/globals.css`, `public/**/*.svg`, lines tagged `// allow:color`. Severity: `error`. Implements Requirement 2.4.
2. **`eslint-rules/no-arbitrary-spacing.js`** — flags Tailwind arbitrary-value utilities matching `(p|m|gap|space-[xy]|top|left|right|bottom|inset|w|h|min-w|min-h|max-w|max-h|text|leading|tracking|grid-cols|grid-rows)-\[[^\]]+\]`. Allow-list: `components/ui/typography.tsx`, `components/ui/grid.tsx`, `tailwind.config.ts`. Severity: `error`. Implements Requirements 3.5, 4.2, 4.5.
3. **Token parity property test** — `design-system/__tests__/token-parity.property.test.ts` parses `app/globals.css` and `tailwind.config.ts`, asserts the color-token key sets are equal, and asserts the values agree (normalizing `oklch()` on both sides). Implements Requirement 2.3.

All three run in CI under the existing `lint`, `typecheck`, and `sadtest` jobs in `.github/workflows/ci.yml`. The `performance-budget` job (added by task 13.2) runs alongside.

---

## 13. Document governance

### When to update DESIGN.md

- A new color, spacing, radius, container, motion, or typography token is added or changed.
- A new In_Scope_Screen ships and introduces a token requirement.
- A new global anti-pattern is identified.
- A new guard rail (lint rule, property test) lands.

### When NOT to update DESIGN.md

- Page-level layout decisions (those go in `landing.md`, `dashboard.md`, etc.).
- Component-primitive prop contracts (those go in `COMPONENT_PATTERNS.md` § 3).
- Composition patterns (those go in `COMPONENT_PATTERNS.md` § 4).
- The long-form aesthetic prose, named reference products, and screenshot index (those go in `VISUAL_IDENTITY.md`).
- One-off `className` overrides.

### Conflict resolution

1. `DESIGN.md` overrides per-screen specs.
2. `tailwind.config.ts` + `app/globals.css` override `DESIGN.md` (tokens are defined there; this file is the human-readable index).
3. Component source overrides all docs (code is what ships).
4. If code and docs disagree, **fix the docs** unless the docs are themselves the bug — in which case fix both in the same change (Requirement 10.7).

### Cross-document map

| What you need | Where it lives |
|---|---|
| Token values, scales, motion rules, anti-patterns | This file (`DESIGN.md`) |
| Aesthetic prose, named references, contrast matrix, AI_Slop_Pattern catalogue | `VISUAL_IDENTITY.md` |
| Primitive prop contracts, composition patterns, migration notes | `COMPONENT_PATTERNS.md` |
| Per-screen layouts | `landing.md`, `login.md`, `signup.md`, `dashboard.md`, `profile.md`, `settings.md`, `test-extraction.md`, `navigation.md` |
| Accessibility deep dive | `ACCESSIBILITY.md` |
| Performance budgets, asset rules | `PERFORMANCE.md` |
| At-a-glance lookup tables | `REFERENCES.md` |
| Migration phases, lint setup, CI gates | `IMPLEMENTATION.md` |
| Review scoring rubric (with AI-slop hard-fail check) | `REVIEW.md` |

---

## 14. Inspiration references

The named reference products that informed the redesign — Linear, Vercel, Stripe (dashboard + Stripe Press), Apple Settings, Arc Browser, Notion, Raycast — are catalogued with per-product rationale in `VISUAL_IDENTITY.md` § "Named reference products." Captured screenshots and wireframes live under `design-system/references/` (see `references/INDEX.md`).

These products were studied for **spacing rhythm, restraint, and hierarchy** — not copied for color or shape. Their accent palettes are explicitly not adopted.
