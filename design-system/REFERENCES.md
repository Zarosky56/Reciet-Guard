# REFERENCES.md — Quick-Reference Lookup Tables & Decision Trees

> **Role:** This document is a rapid-access reference for implementation decisions. It consolidates the redesigned tokens, patterns, and rules from across the design system into scannable lookup tables. Use this when you know *what* you need but want to quickly confirm *which value* to use.

> **Authority:** This file is a mirror of rules defined elsewhere. If `REFERENCES.md` conflicts with `DESIGN.md`, `VISUAL_IDENTITY.md`, or `IMPLEMENTATION.md`, the source document wins. This file is updated to reflect changes in source documents.

> **Scope:** All values below mirror `app/globals.css` `:root` and `tailwind.config.ts` exactly. Both files are authoritative; this file restates them for quick lookup. If you spot a mismatch, update the source files first, then this table.

---

## 1. Token Quick-Reference

### Colors (Copy-Paste Ready)

All redesigned colors are defined in `oklch()` on `:root` in `app/globals.css` and mirrored as Tailwind theme colors via `var(--color-…)` in `tailwind.config.ts`. There is no raw-hex equivalent — the `oklch` value is the source of truth. Approximate hex columns are for visual reference only; **do not** paste them into source files (lint rule `no-raw-color` will reject them outside `app/globals.css`, `tailwind.config.ts`, and `public/**` SVGs).

| Purpose | Tailwind class | CSS variable | oklch | ≈ hex |
|---|---|---|---|---|
| Page background | `bg-canvas` | `--color-canvas` | `oklch(0.13 0.005 270)` | `#0B0B10` |
| Tonal band (hero / sticky header) | `bg-canvas-raised` | `--color-canvas-raised` | `oklch(0.16 0.006 270)` | `#13131A` |
| Card / dialog / header chrome | `bg-surface` | `--color-surface` | `oklch(0.19 0.007 270)` | `#1B1B22` |
| Card hover, button hover | `bg-surface-hover` | `--color-surface-hover` | `oklch(0.22 0.008 270)` | `#22222C` |
| Dialog content (above scrim) | `bg-surface-overlay` | `--color-surface-overlay` | `oklch(0.21 0.008 270)` | `#1F1F28` |
| Default 1px border | `border-border` | `--color-border` | `oklch(0.27 0.009 270)` | `#2C2C38` |
| Hover border / divider | `border-border-strong` | `--color-border-strong` | `oklch(0.34 0.010 270)` | `#3A3A48` |
| Focus ring (= accent) | `border-border-focus` | `--color-border-focus` | `oklch(0.78 0.13 78)` | `#D9A24C` |
| Body, headline, label | `text-text-primary` | `--color-text-primary` | `oklch(0.96 0.005 90)` | `#F1EFE9` |
| Description, metadata | `text-text-secondary` | `--color-text-secondary` | `oklch(0.74 0.012 90)` | `#B5B0A4` |
| Tertiary / placeholder | `text-text-muted` | `--color-text-muted` | `oklch(0.55 0.012 90)` | `#7E7A6F` |
| Primary CTA, link, focus, active nav | `bg-accent` / `text-accent` | `--color-accent` | `oklch(0.78 0.13 78)` | `#D9A24C` |
| Accent hover/active | `bg-accent-hover` | `--color-accent-hover` | `oklch(0.83 0.13 78)` | `#E5B05A` |
| Tinted-accent background (selected, badge) | `bg-accent-tint` | `--color-accent-tint` | `oklch(0.30 0.06 78)` | `#3F2F18` |
| Positive status | `text-success` | `--color-success` | `oklch(0.72 0.16 150)` | `#3FB97A` |
| Caution, "due soon" | `text-warning` | `--color-warning` | `oklch(0.78 0.15 70)` | `#D69544` |
| Destructive, expired | `text-danger` | `--color-danger` | `oklch(0.65 0.20 25)` | `#D95A4D` |
| Optional info (rarely used) | `text-info` | `--color-info` | `oklch(0.72 0.08 230)` | `#7AA0C2` |

**Banned:** `indigo-*`, `violet-*`, `blue-*`/`#3B82F6`, `#5B8CFF`, and any inline `bg-accent/10` opacity expression. Use `bg-accent-tint` for tinted accent fills (Requirement 2.6, 13.1).

### Typography (Copy-Paste Ready)

Two families only, both via `next/font`:

| Family | CSS variable | Tailwind | Source |
|---|---|---|---|
| UI sans-serif | `--font-ui` | `font-sans` | Geist Sans (Google) — Latin subset, regular preloaded |
| Mono / tabular | `--font-mono` | `font-mono` | JetBrains Mono — Latin subset, no preload |

OpenType features applied globally on `body`: `"cv11", "ss03", "tnum"` (Geist features re-mapped from the Inter set; documented in `DESIGN.md`).

The type scale is defined as nine `--text-*` CSS variables in `app/globals.css`. Compose UI text by reaching for the named scale step, **not** by hand-picking Tailwind size + leading utilities.

| Step | CSS variable (size / line / tracking / weight) | ≈ Tailwind composition | Usage |
|---|---|---|---|
| `--text-caption` | `0.75rem` / `1rem` / `0.04em` / `500` | `text-xs uppercase tracking-wide font-medium` | Stat labels, badges |
| `--text-meta` | `0.8125rem` / `1.125rem` / `0` / `400` | `text-[13px] leading-[18px]` *(scale layer only)* | Metadata, footnotes |
| `--text-body` | `0.875rem` / `1.5rem` / `0` / `400` | `text-sm leading-6` | Body, descriptions |
| `--text-body-lg` | `1rem` / `1.625rem` / `0` / `400` | `text-base leading-7` | Long-form body |
| `--text-label` | `0.875rem` / `1.25rem` / `0` / `500` | `text-sm leading-5 font-medium` | Form labels |
| `--text-title-sm` | `1rem` / `1.375rem` / `-0.005em` / `500` | `text-base font-medium` | Card titles |
| `--text-title-md` | `1.25rem` / `1.625rem` / `-0.01em` / `600` | `text-xl font-semibold` | Section titles |
| `--text-title-lg` | `1.5rem` / `1.875rem` / `-0.015em` / `600` | `text-2xl font-semibold` | Page titles (`<h1>`) |
| `--text-display` | `2.625rem` → `3.75rem` @ md+ / `1.05` / `-0.03em` / `600` | `text-[2.625rem] md:text-[3.75rem]` *(scale layer only)* | Landing hero only |

**Banned:** arbitrary `text-[NN]` / `leading-[NN]` outside `components/ui/typography.tsx` and `components/ui/grid.tsx` (lint rule `no-arbitrary-spacing`). `bg-clip-text` gradient text is forbidden on every In_Scope_Screen (Requirement 3.7, 13.3).

**Tabular numerals:** `font-mono` ships `"tnum"` globally; on `font-sans`, opt in via the `.tnum` utility for stat values (Requirement 3.6).

**Hero rule:** when rendered size > 32px, `--text-display` already applies `letter-spacing: -0.03em` and the heading SHALL set `text-wrap: balance` with a max-line count of 2 (Requirement 3.8).

### Spacing (Copy-Paste Ready)

Base unit 4px. Allowed steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 (= Tailwind `1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24`). Arbitrary values forbidden by `no-arbitrary-spacing`.

| Context | Tailwind | Pixels |
|---|---|---|
| Label-to-input gap | `gap-2` | 8 |
| Icon-to-text gap | `gap-2` | 8 |
| Form-row gap (between fields in a row) | `gap-4` | 16 |
| Card-internal gap | `gap-4` | 16 |
| Subsection gap (within a section) | `gap-6` | 24 |
| Section gap (between top-level sections) | `gap-8` | 32 |
| Card padding (standard) | `p-5` | 20 |
| Page horizontal padding | `px-6 md:px-8` | 24 / 32 |
| Page vertical padding | `py-8` | 32 |

`CardHeader` / `CardContent` / `CardFooter` are standardized at `p-5` everywhere. `p-4` and `p-6` Card variants from the legacy system are not part of the redesigned spec.

### Container Widths

Four named container tokens, each a width utility under `theme.extend.maxWidth`:

| Page type | Tailwind | Token | Pixels |
|---|---|---|---|
| Login, Signup | `max-w-auth` | `--container-auth` | 416 |
| Profile | `max-w-narrow` | `--container-narrow` | 672 |
| Settings, Test Extraction | `max-w-content` | `--container-content` | 896 |
| Landing, Dashboard | `max-w-wide` | `--container-wide` | 1152 |

Every In_Scope_Screen `<main>` SHALL use exactly one of these (Requirement 4.4).

### Border Radius

Five-step radius scale defined as `--radius-*` CSS variables and mirrored to Tailwind:

| Tailwind | CSS variable | Pixels | Used by |
|---|---|---|---|
| `rounded-xs` | `--radius-xs` | 4 | Badge |
| `rounded-sm` | `--radius-sm` | 6 | Input, Textarea, Button (sm) |
| `rounded-md` | `--radius-md` | 10 | Button (default / lg) |
| `rounded-lg` | `--radius-lg` | 14 | Card, Dialog, PageLoader scrim |
| `rounded-pill` | `--radius-pill` | 999 | Avatar, status indicator dot |

The legacy `rounded-card` / `rounded-card-lg` / `rounded-xl2` aliases are removed.

---

## 2. Component Decision Tree

### "Which Button variant do I use?"
```
Is it the primary action on the page?
├── Yes → variant="primary" (amber accent fill on canvas-dark text)
│    └── Hero / auth CTA → size="lg"
│    └── Standard action → size="default"
└── No →
     Is it a secondary / supporting action?
     ├── Yes → variant="secondary" (bordered, surface fill)
     │    └── Compact → size="sm"
     └── No →
          Is it a tertiary / nav action with no resting chrome?
          ├── Yes → variant="ghost" (text-only)
          │    └── In a nav → size="default"
          │    └── In a card → size="sm"
          └── No →
               Is it destructive (delete / sign-out)?
               └── Yes → variant="danger" (danger border + danger text)
                    └── Default size="sm"
```

The CVA `default` variant remains as a backward-compat alias for `primary` only during migration; new code SHALL use `primary` (deleted in task 11.3, see `COMPONENT_PATTERNS.md` migration notes).

### "Which Card padding do I use?"
```
All Card subparts (CardHeader / CardContent / CardFooter) → p-5
```
Padding is uniform. Density variations now flow through inner gap tokens (`gap-2`, `gap-4`, `gap-6`), not through outer padding.

### "Which container width do I use?"
```
Auth (login / signup)            → max-w-auth     (416px)
Profile                          → max-w-narrow   (672px)
Settings / Test Extraction       → max-w-content  (896px)
Dashboard / Landing              → max-w-wide     (1152px)
```

### "Which text color do I use?"
```
Headline, title, primary content        → text-text-primary
Description, metadata, secondary copy   → text-text-secondary
Placeholder, caption, tertiary info     → text-text-muted
Interactive accent (link, active nav)   → text-accent
Status indicator                        → text-success / text-warning / text-danger
```
There is no `text-info` consumer in production; the token is reserved for future opt-in surfaces.

### "Should this be a Server or Client Component?"
```
Uses hooks (useState, useEffect, useTransition)?  → "use client"
Has event handlers (onClick, onChange)?           → "use client"
Uses browser APIs (clipboard, window)?            → "use client"
Otherwise                                         → Server Component (default)
```

---

## 3. Page Architecture Reference

### Page → Container → Layout

| Page | Container | Layout | Sections |
|---|---|---|---|
| Landing (`/`) | `max-w-wide` | Flex column, hero centered | Nav, hero, 3-card proof grid |
| Login (`/login`) | `max-w-auth` | Centered AuthShell card | Brand row, heading, form, footer link |
| Signup (`/signup`) | `max-w-auth` | Centered AuthShell card | Brand row, heading, form, footer link |
| Dashboard (`/dashboard`) | `max-w-wide` | Grid `gap-8` | Header, hero card (summary + intake), search + filters, receipt grid |
| Test extraction (`/test-extraction`) | `max-w-content` | Grid `gap-6` | Header, input card, JSON output card |
| Settings (`/settings`) | `max-w-content` | Single-column stacked sections | Header, settings sections, logout |
| Profile (`/profile`) | `max-w-narrow` | Single-column stacked sections | Header, identity, activity |

### Responsive Breakpoint Behavior

| Element | Mobile (<640) | Tablet (640–1024) | Desktop (1024+) |
|---|---|---|---|
| Receipt grid | 1 col | 2 col | 3 col |
| Stats row | Stacked | Stacked | Side-by-side |
| Dashboard hero card | Stacked | Stacked | Two-column inside one card |
| Form fields | 1 col | 1 col | 2 col where the spec allows |
| Hero CTAs | Stacked | Inline | Inline |
| Dashboard header | Stacked | Horizontal | Horizontal |
| Proof points | 1 col | 3 col | 3 col |

Container widths are clamped via `max-w-*`; ultrawide viewports center content over a solid `bg-canvas`.

---

## 4. Interaction State Reference

### Button States (All Variants)

| State | `primary` | `secondary` | `ghost` | `danger` |
|---|---|---|---|---|
| Resting | `bg-accent text-canvas` | `bg-surface border-border text-text-primary` | `text-text-secondary` | `bg-surface border-danger/40 text-danger` |
| Hover | `bg-accent-hover` | `bg-surface-hover border-border-strong` | `bg-surface-hover text-text-primary` | `bg-danger/10 border-danger` |
| Focus-visible | `outline-2 outline-offset-2 outline-border-focus` | same | same | same |
| Active | `scale-[0.985]` (`duration-instant`) | same scale | same scale | same scale |
| Disabled | `opacity-50 cursor-not-allowed` | same | same | same |

The previous gradient `before:` overlay, `shadow-glow-action` halo, and `bg-[linear-gradient(...)]` fills are deleted (Requirement 8.3).

### Input / Textarea States

| State | Appearance |
|---|---|
| Resting | `bg-canvas border-border rounded-sm` |
| Hover | `border-border-strong` |
| Focus | `border-border-focus` + 1px outline at 1px offset (no 4px shadow halo) |
| Filled | Identical to resting |
| Disabled | `opacity-50 cursor-not-allowed` |
| Invalid | `border-danger` via `aria-invalid="true"` or `data-invalid="true"` |
| Placeholder | `text-text-muted` |

### Card States

| State | Appearance |
|---|---|
| Resting (all) | `bg-surface border-border rounded-lg` (no shadow) |
| Hover (interactive) | `border-border-strong -translate-y-0.5` (`duration-default ease-standard`) |
| Hover (non-interactive) | No change |
| Focused (interactive, keyboard) | `outline-2 outline-offset-2 outline-border-focus` |

Resting cards never carry shadows. Only overlays (Dialog, PageLoader scrim, Toaster) consume `shadow-overlay` (Requirement 5.2, 5.3).

---

## 5. Animation Reference

Motion tokens defined as CSS variables on `:root` and mirrored into `theme.extend.transitionDuration` / `transitionTimingFunction` / `keyframes`.

### Duration tokens

| Token | Tailwind | Value | Usage |
|---|---|---|---|
| `--motion-instant` | `duration-instant` | 80ms | Press feedback (`active:scale-[0.985]`) |
| `--motion-quick` | `duration-quick` | 150ms | Button hover, link color shift |
| `--motion-default` | `duration-default` | 220ms | Card hover lift, focus border, dialog open |
| `--motion-slow` | `duration-slow` | 360ms | Dialog content slide-in |

### Easing tokens

| Token | Tailwind | Value | Usage |
|---|---|---|---|
| `--ease-standard` | `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Default UI transitions |
| `--ease-emphasized` | `ease-emphasized` | `cubic-bezier(0.3, 0, 0.1, 1)` | Dialog open, attention pulse |
| `--ease-linear` | `ease-linear` | `linear` | Indeterminate progress only |

### Allowed keyframes

| Keyframe | Tailwind | Trigger | Limit |
|---|---|---|---|
| `attention` | `animate-attention` | Single critical urgency badge per screen, only on expired-red | One screen at a time |
| `route-progress` | `animate-route-progress` | Active during Next.js route transition | One global instance |

These two are the **only** keyframes defined under `theme.extend.keyframes`. The legacy `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, and `pulse-red` keyframes were deleted in task 11.2.

### Allowed transitions

Only `transform`, `opacity`, `border-color`, `color`, and `background-color` may be transitioned. Transitions on `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter`, or `background` are forbidden in user-facing components (Requirement 6.5).

### Forbidden animations
- Page-level enter / exit transitions
- Stagger / fade-up reveal on lists, hero, or proof grids (Requirement 6.3, 13.8)
- Scroll-triggered reveals
- Parallax / scroll-linked transforms
- Bounce / spring / overshoot easing
- Hover scale on cards or images (button `active:scale-[0.985]` is the only allowed scale)
- Counter / number tween animations
- Gradient or filter animations of any kind

Reduced-motion users see no active animation: indeterminate loops opt into a static variant via `data-reduced-motion="static"` (Requirement 6.6, 11.4).

---

## 6. Iconography Reference

**Strategy:** keep `lucide-react` for utility icons, with a single stroke width and a curated allow-list. The Brand_Mark is **not** a Lucide icon — it ships as a custom SVG at `public/brand/mark.svg` (Requirement 1.4, 1.5, 7.1).

### Icon Sizing

| Token | Tailwind | Pixels | Usage |
|---|---|---|---|
| `icon-xs` | `h-3 w-3` | 12 | Inside Badge |
| `icon-sm` | `h-3.5 w-3.5` | 14 | Inline with body text |
| `icon-md` | `h-4 w-4` | 16 | Inside Button (default) |
| `icon-lg` | `h-5 w-5` | 20 | Standalone in card or nav |

### Stroke width

A single value globally: **`strokeWidth={1.75}`**. Mixing stroke widths within a screen is forbidden (Requirement 7.2).

### Allow-listed icons

The redesign keeps a curated subset. New icon imports SHALL be added to this allow-list before use; the list is the source of truth for `<BrandMark>` and Lucide consumers.

| Icon | Used by |
|---|---|
| `ArrowRight` | Landing CTA cue, dashboard "open editor" |
| `Search` | Dashboard search input |
| `Inbox` | Dashboard intake address row |
| `MailSearch` | AI extraction action |
| `Plus` | Add receipt action |
| `Edit3` | Receipt-card edit |
| `Trash2` | Receipt-card delete, settings danger row |
| `Clock` | Receipt due-date metadata |
| `DollarSign` | Receipt amount metadata |
| `X` | Dialog close |
| `Copy` | Copy forwarding-address action |
| `Check` | Copy success feedback, success badges |
| `AlertTriangle` | Warning urgency badge |
| `AlertOctagon` | Expired urgency badge |
| `LogOut` | Settings logout row |
| `Mail` | Profile email row |
| `User` | Profile identity row |
| `Settings` | Mobile bottom nav |
| `LayoutGrid` | Mobile bottom nav (dashboard) |
| `UserCircle` | Mobile bottom nav (profile) |
| `Loader2` | Reserved — **do not import**; the redesigned `<Loader>` is the only loading vocabulary |
| `ReceiptText` | Reserved — **do not import**; the Brand_Mark SVG replaces it |

### Decorative-tile ban

Icons are not wrapped in conic-bordered, glow-ringed, or gradient tiles. The only exception is the Brand_Mark SVG, which itself ships without a tile (Requirement 7.4).

---

## 7. File Structure Reference

### Component Organization

```
components/
├── ui/                       # Atomic primitives (shadcn-style)
│   ├── button.tsx            # 4 variants × 4 sizes (CVA)
│   ├── card.tsx              # Card / Header / Content / Footer (uniform p-5)
│   ├── badge.tsx             # default / success / warning / danger
│   ├── input.tsx             # Input + Textarea
│   ├── dialog.tsx            # Radix dialog with framer-motion <Reveal>
│   ├── avatar.tsx            # rounded-pill, no decorative tile
│   ├── skeleton.tsx          # static fill, no shimmer
│   ├── grid.tsx              # <Grid cols={1|2|3} gap="card"|"section">
│   ├── loaders.tsx           # single <Loader label size> primitive
│   ├── page-loader.tsx       # centered Card overlay + Loader
│   └── route-progress.tsx    # 2px top-of-page bar (the one allowed indeterminate loop)
├── motion/
│   └── motion-primitives.tsx # <Reveal> only (transform/opacity)
├── brand/
│   └── brand-mark.tsx        # consumes public/brand/mark.svg
├── visual/
│   └── ambient-background.tsx # variant: "hero" | "off"
├── auth/
│   ├── auth-form.tsx
│   └── auth-shell.tsx
├── dashboard/
│   ├── dashboard-header.tsx
│   └── mobile-bottom-nav.tsx
├── receipts/
│   ├── receipt-dashboard.tsx
│   ├── receipt-card.tsx
│   ├── receipt-empty-state.tsx
│   ├── copy-forwarding-address.tsx
│   └── urgency-badge.tsx
├── settings/
│   └── logout-section.tsx
└── ai/
    └── test-extraction-form.tsx
```

### Route Organization

```
app/
├── page.tsx                   # Landing (/)
├── layout.tsx                 # Root layout (Geist + JetBrains Mono, Toaster)
├── globals.css                # Token authority (CSS variables)
├── (auth)/
│   ├── login/page.tsx         # /login
│   └── signup/page.tsx        # /signup
├── (dashboard)/
│   ├── dashboard/page.tsx     # /dashboard
│   ├── profile/page.tsx       # /profile
│   └── settings/page.tsx      # /settings
├── test-extraction/page.tsx   # /test-extraction
├── auth/callback/route.ts     # Supabase auth callback
└── api/                       # All routes preserved (Requirement 14.1)
    ├── receipts/
    ├── extract/
    ├── gmail/
    ├── dashboard/stats/
    ├── auth/logout/
    ├── cron/check-deadlines/
    └── health/
```

The route inventory is snapshot-locked at `design-system/__tests__/route-inventory.snapshot.json` and verified by `route-inventory.property.test.ts`.

---

## 8. Common Patterns Quick-Copy

### Page Shell (Data Page)
```tsx
<main className="mx-auto min-h-screen w-full max-w-wide px-6 md:px-8">
  {/* header */}
  {/* sections */}
</main>
```

### Page Shell (Auth Page)
```tsx
<main className="flex min-h-screen items-center justify-center px-6 py-12">
  <AuthShell>{/* form */}</AuthShell>
</main>
```

### Section with Title
```tsx
<section className="grid gap-6">
  <h2 className="text-xl font-semibold tracking-[-0.01em] text-text-primary">Title</h2>
  {/* content */}
</section>
```

### Responsive Grid (via Grid primitive)
```tsx
<Grid cols={3} gap="card">
  {items.map((item) => <Card key={item.id}>{/* ... */}</Card>)}
</Grid>
```
Direct `grid grid-cols-[Xfr_Yrem]` declarations are forbidden in page components (Requirement 4.5).

### Form Field
```tsx
<label className="grid gap-2 text-sm font-medium text-text-primary">
  Label
  <Input placeholder="Example..." />
</label>
```

### Action Row (Right-Aligned)
```tsx
<div className="flex justify-end gap-2">
  <Button variant="ghost">Cancel</Button>
  <Button variant="primary">Submit</Button>
</div>
```

### Loading Button
```tsx
<Button variant="primary" disabled={isPending}>
  {isPending ? <Loader size="sm" label="Saving" /> : "Save"}
</Button>
```
The Lucide `Loader2` spinner is forbidden; use the redesigned `<Loader>` (single static dot + label).

---

## 9. Checklist: Before You Ship

```
□ Container width matches the page type (auth / narrow / content / wide)
□ Every color resolves to a redesigned token; no raw hex / rgb / hsl / oklch literal
□ Every spacing value is on the spacing scale (no `p-7`, no `gap-[13px]`)
□ Every text element maps to exactly one type-scale step
□ Buttons use one of 4 variants × 4 sizes; no gradient fills
□ Cards use uniform p-5 with no resting shadow
□ Inputs/Textareas use border-color focus + 1px outline (no 4px shadow halo)
□ Icons are lucide-react, strokeWidth 1.75, from the allow-list
□ Brand_Mark uses the SVG asset, never a Lucide icon in a tile
□ At most one decorative element per screen (Requirement 13.13, 13.14)
□ At most one indeterminate animation visible (RouteProgress OR a single attention pulse)
□ Reduced-motion: every animation gracefully degrades (data-reduced-motion="static")
□ Focus-visible includes a non-color signal (thickness, offset, or shape change)
□ Touch targets ≥ 44×44 CSS pixels
□ Semantic HTML (<main>, <nav>, single <h1>, <section>)
□ Status / urgency / error indicators combine color with text or icon
□ No console errors, no TypeScript errors, lint passes with `--max-warnings=0`
□ Property tests: `npm run sadtest` green for the touched files
□ Bundle budget: `node scripts/check-bundle-size.mjs` green
```

---

## Document Maintenance

This file is a derived reference. Update it whenever the source files change:
- Color tokens change in `app/globals.css` / `tailwind.config.ts` → update §1 Colors.
- Type-scale steps change → update §1 Typography.
- A new component primitive appears → update §2 Decision Tree and §7 File Structure.
- A new In_Scope_Screen ships → update §3 Page Architecture.
- The Lucide allow-list changes → update §6 Iconography.
- A new motion duration / easing token lands → update §5 Animation.
