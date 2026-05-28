# COMPONENT_PATTERNS.md — Reusable Composition & Compound Component Governance

> **Role:** This document defines the canonical patterns for composing UI components in Receipt Guardian. It governs how components combine, nest, and interact — preventing the proliferation of one-off compositions that fragment the design language.

> **Authority chain:** `DESIGN.md` (tokens) → `COMPONENT_PATTERNS.md` (composition) → page specs (usage context)

> **Status:** Updated for the Premium UI Redesign. Every primitive listed below has been rebuilt against the redesigned token system. Removed / renamed props and exports are catalogued in §13 — Migration notes.

---

## 1. Purpose

Individual components live in `components/ui/` and `components/`. But premium UI emerges from how they *compose* — how a Card contains a form, how a Button pairs with a static loader, how a stat display combines typography and layout. Without documented composition patterns, every page invents its own arrangements, and consistency dies.

This document answers two questions:

1. "What is the canonical implementation of each primitive?" — §3 catalogues every Component_Primitive.
2. "How do I combine those primitives correctly?" — §§4–10 catalogue every Composition_Pattern.

Migration notes for the redesign live in §13.

---

## 2. Composition Philosophy

### Core beliefs
1. **Patterns over one-offs** — If a composition appears twice, it's a pattern. Document it.
2. **Flat over nested** — Avoid deep component nesting. Two levels max (page → section → element).
3. **Props over children** — When a pattern is rigid, use props. When flexible, use children.
4. **Composition over inheritance** — Components combine; they don't extend each other.
5. **Explicit over implicit** — Every composition decision should be traceable to a token or rule.

### Composition hierarchy
```
Page Layout
  └── Section (semantic grouping)
       └── Card (visual container)
            └── Composition Pattern (documented in §4)
                 └── Component Primitive (documented in §3)
```

A screen never reaches past its immediate layer. Screens compose patterns; patterns compose primitives; primitives consume tokens. A screen that needs an unauthorized value asks for a new token in `DESIGN.md`, not a one-off override.

---

## 3. Component primitives

This catalogue is the canonical reference for every primitive in `components/ui/` and `components/{brand,motion,visual}/`. Each entry documents the prop contract, the visual contract, and any motion or accessibility commitments. Implementations live in the files referenced by each subsection; this document is the visual/structural source of truth.

### 3.1 `<Button>` — `components/ui/button.tsx`

**Variants** (`primary` | `secondary` | `ghost` | `danger`) × **sizes** (`sm` | `default` | `lg` | `icon`).

| Variant | Resting | Hover | Focus-visible | Active | Disabled |
|---|---|---|---|---|---|
| `primary` | `bg-accent text-canvas` | `bg-accent-hover` | 2px outline at 2px offset (`outline-border-focus`) | `scale-[0.985]` | `opacity-50 cursor-not-allowed` |
| `secondary` | `bg-surface border-border text-text-primary` | `bg-surface-hover border-border-strong` | same outline | same scale | same opacity |
| `ghost` | transparent, `text-text-secondary` | `bg-surface-hover text-text-primary` | same outline | same scale | same opacity |
| `danger` | `bg-surface border-danger/40 text-danger` | `bg-danger/10 border-danger` | same outline | same scale | same opacity |

| Size | Height | Notes |
|---|---|---|
| `sm` | 32px | Inline use next to body text. Pad the parent for 44×44 touch safety. |
| `default` | 40px | Toolbar and card actions. |
| `lg` | 48px | Hero CTAs and form submits. Meets 44×44 directly. |
| `icon` | 40×40 | Square chrome buttons. `aria-label` is required. |

**Rules**
- Focus-visible is a non-color attribute change (outline + offset) to satisfy Requirement 11.3.
- No `before:` gradient overlay, no `shadow-glow-action`, no `bg-[linear-gradient(...)]` fill.
- Inline icons use `<svg data-icon ... />` so the base ruleset can apply `h-4 w-4 shrink-0`.
- Loading uses `data-loading="true"`, which keeps the disabled visual but holds opacity at 100% so the in-button `<Loader size="sm" />` is readable.

**See:** §10.2 (loading button), §13.3 (removed `default` CVA alias).

### 3.2 `<Card>` / `<CardHeader>` / `<CardContent>` / `<CardFooter>` — `components/ui/card.tsx`

Single solid surface fill (`bg-surface`), single 1px border (`border-border`), `rounded-lg`. **No shadow at rest. No gradient overlay.**

```tsx
<Card data-interactive={true | undefined}>
  <CardContent>...</CardContent>
</Card>
```

**Rules**
- Resting cards do not animate. Only cards with `data-interactive="true"` opt into a hover state: `border-border-strong` plus `-translate-y-0.5` (transform-only, `--motion-default`, `--ease-standard`).
- `CardHeader`, `CardContent`, `CardFooter` standardize on `p-5` (20px). Override via `className` only when a pattern explicitly calls for `p-4` or `p-6`.
- No `bg-card-elevated` linear-gradient overlay. The class was deleted in Phase 4 (see §13).
- No inner-hair shadow. No glow on hover.

### 3.3 `<Input>` and `<Textarea>` — `components/ui/input.tsx`

Both share one base ruleset. `<Input>` is `h-10 px-3`; `<Textarea>` is `min-h-32 p-3 leading-6`.

| State | Style |
|---|---|
| Resting | `bg-canvas border border-border rounded-sm` |
| Hover | `border-border-strong` |
| Focus / focus-visible | `border-border-focus` plus 1px outline at 1px offset |
| Disabled | `opacity-50`, no pointer events |
| Invalid | `border-danger` via `aria-invalid="true"` or `data-invalid="true"` |

**Rules**
- No 4px shadow halo on focus. No inner-hair shadow. No glow.
- Focus signal is a non-color attribute change (outline + offset).
- Both elements forward `ref` so consumers can wire imperative focus (e.g. dashboard `/` shortcut).

### 3.4 `<Dialog>` — `components/ui/dialog.tsx`

Overlay primitive. Panel uses the overlay elevation; scrim uses canvas at 70% alpha plus a 4px backdrop blur.

| Element | Style |
|---|---|
| Scrim | `bg-canvas/70 backdrop-blur-sm`, click closes |
| Panel | `bg-surface-overlay border-border rounded-lg shadow-overlay`, `max-w-lg` |
| Header | `border-b border-border`, title at `text-[15px] font-semibold` |
| Close button | `<Button variant="ghost" size="icon" aria-label="Close dialog">` |

**Rules**
- Open/close uses `<Reveal>` (the only retained framer-motion consumer in `components/ui/*`).
- Backdrop blur is capped at 8px globally; `backdrop-blur-sm` is 4px and stays well under the cap.
- Focus is trapped inside the panel; first focusable element gets focus on open; previous focus is restored on close. `Escape` closes.
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby` is wired to the title.

### 3.5 `<Badge>` — `components/ui/badge.tsx`

Single solid fill, single border, no glow, **no animation by default**. Variants:

| Variant | Background | Border | Text |
|---|---|---|---|
| `default` | `bg-accent-tint` | `border-border` | `text-accent` |
| `success` | `bg-surface` | `border-success` | `text-success` |
| `warning` | `bg-surface` | `border-warning` | `text-warning` |
| `danger` | `bg-surface` | `border-danger` | `text-danger` |

**Rules**
- Geometry: `rounded-xs px-2 py-0.5 h-6 text-xs font-medium`.
- The `attention` keyframe (defined in `tailwind.config.ts`) fires only when `variant="danger"` AND the internal `pulse` flag is set. The flag is internal — only `<UrgencyBadge>` is permitted to set it (see §13.5).
- Reduced-motion users skip the pulse via the global `prefers-reduced-motion: reduce` clamp plus the `[data-reduced-motion="static"]` selector that the pulsing node carries.

### 3.6 `<UrgencyBadge>` — `components/receipts/urgency-badge.tsx`

Wraps `<Badge>` for receipt urgency. Always combines color WITH a text label AND an `<svg>` icon (Requirement 11.7).

| Receipt state | Badge variant | Icon | Pulse |
|---|---|---|---|
| Non-active (`returned`/`kept`/`expired`) | `default` | `CheckCircle2` | never |
| Active + green urgency | `success` | `Clock` | never |
| Active + yellow urgency | `warning` | `Clock` | never |
| Active + red urgency, future-dated | `danger` | `AlertTriangle` | never |
| Active + red urgency, expired (`daysRemaining < 0`) | `danger` | `AlertTriangle` | **on** |

The `attention` pulse is the one documented attention signal per Requirement 6.4. It fires on expired-red automatically — there is no parent-controlled override (see §13.5 for the migration note that removed it).

### 3.7 `<Avatar>` / `<AvatarImage>` / `<AvatarFallback>` — `components/ui/avatar.tsx`

Pill-radius circular surface with a single border.

```tsx
<Avatar>
  <AvatarImage src="..." alt="..." />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**Rules**
- `rounded-pill` (999px). `border-border`. `bg-surface`.
- No decorative tile, no conic accent, no glow shadow.
- `AvatarFallback` uses `font-mono text-xl font-semibold` so initials read as a stat-style glyph.
- `AvatarImage` uses `next/image` with `fill`; consumers pass `sizes` (defaults to `96px`).

### 3.8 `<Skeleton>` — `components/ui/skeleton.tsx`

Static single-color fill. **No shimmer animation, no indeterminate loop.**

```tsx
<Skeleton className="h-4 w-32" />
```

**Rules**
- `bg-surface-hover rounded-sm`. Always `aria-hidden="true"`.
- Sizing is the consumer's responsibility — pass `h-*` and `w-*` utilities. The primitive itself has no intrinsic size.
- Per Requirement 8.6, the previous shimmer keyframe is gone. The skeleton is a pure placeholder; pending state is communicated via the surrounding `<Loader>` label.

### 3.9 `<Loader>` — `components/ui/loaders.tsx`

The single coherent loading vocabulary (see §9 for the full rationale).

```tsx
<Loader label="Saving" size="sm" | "md" />
```

**Rules**
- Renders a 6px static accent dot (`bg-accent rounded-pill size-1.5`) followed by the label.
- The dot does not animate. The "in progress" signal lives in the label state change ("Save" → "Saving…"), not in a keyframe.
- `size="sm"` (text-xs) is for inline-in-button use; `size="md"` (text-sm) is for standalone placement.
- An empty `label=""` renders only the dot — used when the consumer renders the label as a sibling text node inside a button.
- `role="status"` + `aria-live="polite"` are wired automatically.

### 3.10 `<PageLoader>` — `components/ui/page-loader.tsx`

Centered overlay used for full-page operations (sign-out today).

| Element | Style |
|---|---|
| Scrim | `bg-canvas/70 backdrop-blur-sm`, `z-50` |
| Card | `bg-surface-overlay border-border rounded-lg shadow-overlay`, `max-w-auth` |
| Indicator | `<Loader size="md" label={title} />` |
| Description | `text-xs text-text-muted`, optional |

**Rules**
- Prop signature preserved for `dashboard-header.tsx` and `logout-section.tsx`: `show`, `title`, `description`.
- The previous animated `ledger-scan` glyph and `ProcessRail` are gone. Only `<RouteProgress>` is permitted to render an indeterminate loop.
- The card carries `pb-16 md:pb-0` so it visually clears the mobile bottom nav.

### 3.11 `<RouteProgress>` — `components/ui/route-progress.tsx`

A 2px top-of-page indeterminate bar shown during route transitions.

**Rules**
- Container is `fixed inset-x-0 top-0 h-0.5 z-50`, `pointer-events-none`. Sits above the sticky `<DashboardHeader>` (`z-30`) and the mobile bottom nav (`z-40`).
- Bar is `bg-accent` driven by the `route-progress` keyframe (1.2s, linear, infinite, transform-only).
- The animated node carries `data-reduced-motion="static"`. In reduced-motion mode, `app/globals.css` cancels the animation and the bar collapses to a static accent fill — the reduced-motion fallback per Requirements 6.6 and 11.4.
- Per Requirement 6.8, this is the **only** indeterminate loop allowed in the redesigned Motion_Language. Every other pending UI uses `<Loader>` instead.

### 3.12 `<BrandMark>` — `components/brand/brand-mark.tsx`

Receipt Guardian's typographic brand mark, rendered as inline SVG so it inherits `currentColor`.

```tsx
<BrandMark size="sm" | "md" | "lg" aria-label="Receipt Guardian home" />
```

**Rules**
- Sizes: `sm` 24px, `md` 28px, `lg` 32px (the documented brand-mark sizes).
- **No tile, no halo, no border, no gradient, no shadow.** The mark sits flush next to the wordmark (see §4.7 Auth Shell, §4.8 Dashboard Hero).
- When `aria-label` is omitted (the typical case — the mark sits next to a visible "Receipt Guardian" wordmark), the SVG is marked `aria-hidden="true"` automatically. When the mark stands alone, pass `aria-label`.
- The mark replaces the previous Lucide `<ReceiptText>`-in-a-conic-tile pattern (see §13).

### 3.13 `<Reveal>` — `components/motion/motion-primitives.tsx`

The single motion primitive of the redesign.

```tsx
<Reveal delay={0}>
  {children}
</Reveal>
```

**Rules**
- Animates `opacity` 0→1 and a small upward y-translate (8px) on mount. Transform/opacity only.
- Uses `--motion-default` (220ms) and `--ease-standard` (`cubic-bezier(0.2, 0, 0, 1)`), inlined as `[0.2, 0, 0, 1]` for framer-motion's tuple ease.
- `useReducedMotion()` short-circuits to a no-animation render — reduced-motion users see children appear immediately.
- The `<Dialog>` panel is the canonical consumer; other primitives drive motion via pure CSS transitions or static state (`<Loader>`, `<Badge>` `attention`, `<RouteProgress>`).
- Legacy re-exports (`<FadeIn>`, `<Stagger>`, `<StaggerItem>`, `<HoverLift>`) and the `premiumEase` constant were deleted in Phase 4. See §13.1 / §13.2.

### 3.14 `<Grid>` — `components/ui/grid.tsx`

The only sanctioned multi-column grid primitive for user-facing screens.

```tsx
<Grid cols={1 | 2 | 3} gap="card" | "section">
  {items}
</Grid>
```

**Rules**
- `cols={2}` collapses to one column below `md`; `cols={3}` collapses to one then two columns below `lg`.
- `gap="card"` is `gap-4` (16px); `gap="section"` is `gap-8` (32px). Both are spacing-scale values — no arbitrary `gap-[Xrem]`.
- One-off `grid-cols-[Xfr_Yrem]` declarations in page or composition code are forbidden by the `local/no-arbitrary-spacing` ESLint rule. This file is on the rule's allow-list so canonical track definitions live here and only here.

### 3.15 `<AmbientBackground>` — `components/visual/ambient-background.tsx`

The one tonal element per page (or nothing).

```tsx
<AmbientBackground variant="hero" | "off" />
```

**Rules**
- `variant="hero"` renders one fixed band: `bg-canvas-raised`, `h-80` (≤320px), masked by `linear-gradient(to bottom, black 0%, transparent 100%)` so the band fades to canvas at the bottom. The mask drives opacity only — there is no perceptible gradient stop in the painted color (Requirement 13.5 / 13.9).
- `variant="off"` returns `null`.
- The pre-redesign `"auth"` and `"app"` variants are still accepted by the type for backwards compatibility but are treated as `"off"` (see §13.6).
- The band node carries `data-decorative="true"` so the per-screen decorative-element budget can be audited.

---

## 4. Composition patterns

Every Card on every screen follows one of the patterns below. New compositions either fit an existing pattern or earn a new entry per §11 (Pattern creation rules).

### 4.1 Pattern: Stat Card
**Usage:** Compact summary numbers (totals, counts, money-at-risk inline cells).

```
Card
  └── CardContent (p-4)
       ├── Label  (text-xs uppercase tracking-wide text-text-muted)
       └── Value  (mt-2 font-mono text-xl font-semibold tabular-nums text-text-primary)
```

**Rules**
- Label is always uppercase, always `text-xs`, always `text-text-muted`.
- Value is always `font-mono` with `tabular-nums` — numbers deserve monospace; tabular figures keep stacked stats aligned.
- Padding is `p-4` (compact), not the standard `p-5`.
- No icon, no animation, no glow. The number speaks for itself.
- Grouping: use `<Grid cols={2} gap="card">` when multiple stat cards appear together.

### 4.2 Pattern: Overview Card
**Usage:** Section overview with a heading, lede, optional inline component, and right-aligned actions.

```
Card
  └── CardContent (p-5)
       ├── Title         (text-2xl font-semibold tracking-tight text-text-primary)
       ├── Description   (mt-2 text-sm leading-6 text-text-secondary, max-w-2xl)
       ├── Inline block  (mt-5, optional — e.g. <CopyForwardingAddress />)
       └── Action row    (mt-4, flex justify-end gap-2)
            └── Button (variant="secondary")
```

**Rules**
- Title is the page-level `<h1>`.
- Description is constrained to `max-w-2xl` for readability.
- Maximum one primary action per overview card.

### 4.3 Pattern: Form Card
**Usage:** Email extraction, receipt editor, settings forms.

```
Card
  └── CardContent (grid gap-4 p-5)
       ├── Header group
       │    ├── Title       (text-base font-medium text-text-primary)
       │    └── Description (mt-1 text-sm text-text-secondary)
       ├── Loader strip     (optional, <Loader size="sm" /> while pending)
       ├── Form fields      (grid gap-3 sm:grid-cols-2)
       │    └── <label className="grid gap-2 text-sm font-medium text-text-primary">
       │           Field label
       │           <Input | Textarea | select />
       │        </label>
       └── Action row       (border-t border-border pt-4 flex justify-end gap-2)
            ├── Cancel  (<Button variant="ghost">, conditional)
            └── Submit  (<Button variant="primary">, data-loading while pending)
```

**Rules**
- Form cards use `grid gap-4` for internal layout.
- Field rows use `grid gap-3 sm:grid-cols-2` — single column on mobile, two columns on desktop.
- Label text uses the labeled-input pattern (§5.1). Never use placeholder as a label substitute.
- Submit button is always rightmost.
- Cancel button only appears when editing (not creating).
- Loading state: the redesigned `<Loader size="sm" />` renders inside the submit button (see §9). The button text may change to indicate progress ("Save" → "Saving changes"). Never hide the button entirely.

### 4.4 Pattern: Data Card (Receipt)
**Usage:** Individual receipt display in the receipt grid (`<ReceiptCard>`).

```
Card data-interactive={true}
  └── CardContent (relative flex h-full flex-col)
       ├── <UrgencyBadge>           (absolute right-5 top-5, pointer-events-none)
       ├── Store row                (flex items-center gap-2 pr-24, text-xs text-text-muted)
       │    ├── Store icon (size-3.5)
       │    └── Store name (truncate)
       ├── Item title               (mt-2 line-clamp-1 pr-24, text-base font-medium)
       ├── Price                    (mt-2 font-mono tabular-nums text-base font-semibold)
       ├── Date row                 (mt-3 flex gap-4, text-xs text-text-muted tabular-nums)
       ├── Status chip + toggle     (mt-4 flex gap-2)
       │    ├── <Badge> (status label)
       │    └── <Button variant="ghost" size="sm"> (chevron toggle)
       ├── Status options           (mt-2 flex flex-wrap gap-2, conditional)
       │    └── <Button variant="secondary" size="sm">×N
       ├── Pending indicator        (<Loader size="sm" />, conditional)
       └── Action row               (mt-auto flex gap-2 border-t border-border pt-4)
            ├── Edit   (<Button variant="secondary" size="sm">)
            └── Delete (<Button variant="danger" size="sm" aria-label="Delete receipt">)
```

**Rules**
- Card opts into hover lift via `data-interactive={true}`. No glow, no shadow.
- The urgency badge is absolutely positioned; the title group reserves `pr-24` to clear it.
- Status chip uses `<Badge variant="default">` — no `bg-action/10`-style inline opacity.
- All action buttons are `size="sm"`. The action row is anchored to the card bottom via `mt-auto` so cards in a `<Grid cols={3}>` stay vertically aligned.

### 4.5 Pattern: Empty State Card
**Usage:** When a list has no items (`<ReceiptEmptyState>` is the canonical implementation).

```
Card className="border-dashed"
  └── CardContent (p-5, flex flex-col items-center text-center)
       ├── Icon          (size-10 text-text-muted)
       ├── Title         (mt-4 text-base font-medium text-text-primary)
       ├── Description   (mt-2 max-w-sm text-sm text-text-secondary)
       ├── Inline block  (mt-5, optional — e.g. <CopyForwardingAddress />)
       └── Educational strip (mt-8, optional)
            └── <Grid cols={3} gap="card">
                 └── 3× step tile (rounded-md border border-border bg-canvas p-4)
```

**Rules**
- Card uses `border-dashed` — visually distinct from populated cards.
- Content is centered.
- Icon is larger than normal (`size-10`), uses `text-text-muted`, **never sits in a decorative tile** (Requirement 7.4).
- Description is constrained to `max-w-sm`.
- Tone is helpful, never punishing ("No receipts yet" not "You have no data").
- Educational strip — when shown — uses `<Grid cols={3} gap="card">`. No one-off `grid-cols-[…]` declarations.
- No `bg-aurora-soft` overlay, no `border-conic-soft` halo, no inner-hair shadow, no `bg-card-elevated` fill — all deleted in Phase 4 (§13).

### 4.6 Pattern: Proof Point Card
**Usage:** Landing page feature highlights.

```
Card
  └── CardContent (p-5)
       ├── Icon         (size-5 text-accent)
       ├── Title        (mt-5 text-base font-medium text-text-primary)
       └── Description  (mt-2 text-sm leading-6 text-text-secondary)
```

**Rules**
- Icon is small (`size-5`) — accent, not focal point.
- Icon uses `text-accent` — the only color accent in the card.
- `mt-5` between icon and title — generous breathing room.
- Maximum 3 proof point cards in a row, composed inside `<Grid cols={3} gap="card">`.
- All cards in a set have identical structure — never mix proof-point variants in one row.

### 4.7 Pattern: Auth Shell
**Usage:** `/login` and `/signup`. Implementation: `components/auth/auth-shell.tsx`.

```
<main className="flex min-h-screen items-center justify-center px-6 py-12">
  <div className="flex w-full max-w-auth flex-col items-center">
    <Link href="/" aria-label="Receipt Guardian home" className="mb-6 inline-flex items-center gap-2 ...">
      <BrandMark size="md" className="text-accent" />
      <span>Receipt Guardian</span>   (text-base font-semibold tracking-tight)
    </Link>
    <Card className="w-full">
      <CardContent>
        {/* <AuthForm mode="login" | "signup" /> */}
      </CardContent>
    </Card>
  </div>
</main>
```

**Rules**
- Container is `max-w-auth` (26rem / 416px) — the optimal form width per Requirement 4.4.
- `<BrandMark>` + wordmark stack above the card. **No tile, no halo, no border around the mark.** No `<ReceiptText>`-in-a-rounded-square; that pattern was removed in Phase 4 (§13.7).
- The link's focus ring is the standard 2px outline at 2px offset (`outline-border-focus`).
- No `bg-scene-auth` ambient, no `border-conic-soft` halo, no `<FadeIn>` page entrance, no `backdrop-blur` on the card chrome.
- The two screens differ only in: heading copy, body copy, submit button label (idle + pending), and footer link target. All four variants live inside `<AuthForm mode="login" | "signup" />`.
- Pending submit renders `<Loader size="sm" label="" />` inside the button followed by progress text ("Signing in", "Creating account") — see §9.

### 4.8 Pattern: Dashboard Hero
**Usage:** The top block of the dashboard. Implementation: `components/receipts/receipt-dashboard.tsx` → first `<Card>`.

```
Card
  └── CardContent (grid gap-5 p-5 md:p-7)
       ├── Top row (flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between)
       │    ├── Title group (flex flex-col gap-2)
       │    │    ├── Title          (text-2xl font-semibold tracking-tight)
       │    │    ├── Money-at-risk  (font-mono tabular-nums text-3xl font-semibold sm:text-4xl)
       │    │    │   + status <Badge> (success | warning, with icon)
       │    │    └── Counts          (text-sm text-text-secondary — "N active · M total")
       │    └── Action row (flex flex-wrap items-center gap-2)
       │         ├── Check inbox   (<Button variant="primary">, data-loading while pending)
       │         ├── Add           (<Button variant="secondary">)
       │         └── Paste email   (<Button variant="secondary">, aria-expanded toggle)
       └── Intake address row (border-t border-border pt-4)
            └── <CopyForwardingAddress />
```

**Rules**
- Single `<Card>` container — no nested cards, no aurora, no grid mesh, no mask-fade.
- Money-at-risk uses `font-mono tabular-nums` so the figure stays optically aligned across renders.
- Status chip pairs the figure with text + icon: `success` "All calm" with `CheckCircle2`, `warning` "N due soon" with `AlertTriangle`. Never color-only (Requirement 11.7).
- Action buttons use the redesigned variants only — no glow, no `before:` overlay. Pending buttons render the in-button `<Loader size="sm" label="" />` per §9.
- Page container is `max-w-wide` (72rem) on `<main>` (Requirement 4.4).

---

## 5. Form field patterns

### 5.1 Pattern: Labeled Input
```tsx
<label className="grid gap-2 text-sm font-medium text-text-primary">
  {label}
  <Input ... />
</label>
```

**Rules**
- Always `<label>` wrapping — implicit association, no `htmlFor` needed.
- Gap between label text and input: `gap-2` (8px).
- Label text: `text-sm font-medium text-text-primary`.
- Never use placeholder as label substitute. Placeholder provides example value, not field name.

### 5.2 Pattern: Search Input with Icon
```tsx
<label className="relative w-full sm:max-w-sm">
  <span className="sr-only">Search</span>
  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
  <Input className="pl-9 pr-12" placeholder="Search receipts" />
  <span aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center sm:flex">
    <kbd className="rounded-xs border border-border bg-canvas px-2 py-0.5 font-mono text-xs text-text-muted">/</kbd>
  </span>
</label>
```

**Rules**
- Icon is absolutely positioned inside the input. `pointer-events-none` so clicks pass to the input.
- Input has `pl-9` (and `pr-12` if a `kbd` hint is shown).
- Optional `kbd` hint shows the focus shortcut (`/`).
- Constrained width on desktop (`sm:max-w-sm`), full-width on mobile.

### 5.3 Pattern: Date Input
```tsx
<label className="grid gap-2 text-sm font-medium text-text-primary">
  {label}
  <Input type="date" value={...} onChange={...} />
</label>
```

**Rules**
- Native `type="date"` — browser provides the picker.
- Value format: `YYYY-MM-DD` (ISO 8601).
- Empty value is valid — not all dates are known.

### 5.4 Pattern: Select Input
```tsx
<select className="h-10 rounded-sm border border-border bg-canvas px-3 text-sm text-text-primary outline-none transition-colors duration-default ease-standard hover:border-border-strong focus:border-border-focus focus:outline focus:outline-1 focus:outline-offset-1 focus:outline-border-focus">
  <option value="...">...</option>
</select>
```

**Rules**
- Native `<select>` — no custom dropdown.
- Visual baseline matches `<Input>`: same height (`h-10`), same border, same canvas background, same focus outline (1px at 1px offset, no halo).
- If a custom Select component is added, it must match this baseline.

### 5.5 Pattern: Segmented filter chips
**Usage:** Receipt filter row.

```tsx
<div role="group" aria-label="Filter receipts" className="-mx-1 flex flex-wrap items-center gap-2 px-1">
  {FILTERS.map((f) => (
    <Button
      key={f.key}
      variant="ghost"
      size="sm"
      data-active={isActive(f.key) ? "true" : undefined}
      aria-pressed={isActive(f.key)}
      onClick={() => setFilter(f.key)}
      className={cn(isActive(f.key) && "bg-accent-tint text-text-primary")}
    >
      {f.label}
    </Button>
  ))}
</div>
```

**Rules**
- Buttons use `variant="ghost"` `size="sm"`.
- Active chip gets `bg-accent-tint text-text-primary` plus `data-active="true"` and `aria-pressed="true"` — no glow, no shadow, no scale.
- Wraps on mobile (`flex-wrap`).


---

## 6. Layout patterns

### 6.1 Pattern: Page Container
```tsx
<main className="mx-auto min-h-screen w-full max-w-{auth|narrow|content|wide} px-6 md:px-8">
  {/* page content */}
</main>
```

**Rules**
- Always `<main>` — semantic landmark.
- Always `min-h-screen` — prevents short pages from looking broken.
- Always `mx-auto` — centers content.
- Always `px-6 md:px-8` — consistent horizontal padding.
- `max-w-*` is one of the four container width tokens (Requirement 4.4):

  | Token | Used by |
  |---|---|
  | `max-w-auth` (26rem) | Login, Signup |
  | `max-w-narrow` (42rem) | Profile |
  | `max-w-content` (56rem) | Settings, Test Extraction |
  | `max-w-wide` (72rem) | Landing, Dashboard |

### 6.2 Pattern: Centered Auth Layout
See §4.7 (Auth Shell). The composition pairs the page-container rules with `flex min-h-screen items-center justify-center`.

### 6.3 Pattern: Section with Header and Grid
```tsx
<section className="grid gap-4">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
    {/* optional: search, filters, actions */}
  </div>
  <Grid cols={3} gap="card">
    {/* grid items */}
  </Grid>
</section>
```

**Rules**
- Section header and content separated by `gap-4`.
- Header uses `flex-col` on mobile, `md:flex-row` on desktop.
- Content rows use `<Grid>` (§3.14), not bespoke `grid-cols-[…]`.

### 6.4 Pattern: Two-Column Split
```tsx
<Grid cols={2} gap="card">
  <Card>{/* left */}</Card>
  <Card>{/* right */}</Card>
</Grid>
```

**Rules**
- Stacks on mobile and tablet, splits on `md`+ (`<Grid cols={2}>` collapses to 1 column below `md`).
- Both columns have equal visual weight.
- For an unequal split (e.g. content + sidebar), the canonical primitive is still `<Grid>`. If a track ratio is required, add a new variant to `<Grid>` rather than emitting a one-off `grid-cols-[Xfr_Yrem]`.

---

## 7. Icon patterns

### 7.1 Icon sizing
| Context | Size | Example |
|---|---|---|
| Inside a button (`data-icon`) | `h-4 w-4` | `<Plus data-icon />` |
| Inline with body text | `size-4` | Action row metadata |
| Inside a badge | `size-3` to `size-3.5` | `<UrgencyBadge>` Clock / AlertTriangle |
| Standalone in card | `size-5` | Proof point card icon |
| Empty state focal | `size-10` | `<Inbox>` in `<ReceiptEmptyState>` |
| Brand mark | 24 / 28 / 32 px | `<BrandMark size="sm|md|lg" />` |

### 7.2 Icon color
| Context | Color token |
|---|---|
| Action / brand accent | `text-accent` |
| Metadata / secondary | `text-text-muted` |
| Inside primary button | inherits `text-canvas` |
| Urgency / status | `text-success` / `text-warning` / `text-danger` |

### 7.3 Icon stroke width
- Single global stroke width: `1.75`. Lucide icons that ship with a different default get `strokeWidth={1.75}` explicitly (mobile bottom nav icons demonstrate this).
- **Mixing stroke widths in the same screen is forbidden** (Requirement 7.2).

### 7.4 Icon decorative-tile ban
- No icon is wrapped in a bordered, glowing, or conic-bordered tile (Requirement 7.4).
- The single exception is `<BrandMark>`, which is not a Lucide icon — it is a custom typographic SVG and renders without a tile.

### 7.5 Icon accessibility
- Icons next to text: `aria-hidden="true"` on the icon. The text already conveys the meaning.
- Icon-only buttons: `aria-label` on the button, `aria-hidden="true"` on the icon.
- Decorative icons: always `aria-hidden="true"`.
- Never use icons as the sole indicator of meaning — pair with text or color (Requirement 11.7).

---

## 8. Button composition patterns

### 8.1 Pattern: Button with Icon
```tsx
<Button>
  <Icon data-icon aria-hidden="true" />
  Label Text
</Button>
```

**Rules**
- Icon before text by default (left side) — standard reading order.
- Exception: directional icons (`ArrowRight`) go after text.
- The base ruleset applies `h-4 w-4 shrink-0` to elements with `data-icon`. The `gap-2` between icon and text is inherited from the button base.

### 8.2 Pattern: Loading Button
See §10.2 — this is the canonical loading vocabulary.

### 8.3 Pattern: Icon-Only Button
```tsx
<Button variant="ghost" size="icon" aria-label="Close dialog">
  <X data-icon aria-hidden="true" />
</Button>
```

**Rules**
- Always `size="icon"` — square aspect ratio (40×40).
- Always has `aria-label` — no visible text means screen readers need help.
- Typically `variant="ghost"`.

### 8.4 Pattern: Button Group (status toggle, action row)
```tsx
<div className="flex flex-wrap items-center gap-2">
  <Button variant="primary" size="sm" data-active="true">Active</Button>
  <Button variant="ghost"   size="sm">Inactive</Button>
  <Button variant="ghost"   size="sm">Inactive</Button>
</div>
```

**Rules**
- `flex-wrap` allows buttons to wrap on mobile.
- `gap-2` (8px) between buttons — minimum for touch safety.
- Active state uses `variant="primary"` (filled) or the ghost-with-`bg-accent-tint` segmented pattern (§5.5).
- All buttons in a group share the same `size`.

---

## 9. Loading vocabulary — single coherent system

The redesign collapses the previous loading vocabulary (`ActionLoader`, `ButtonLoader`, `CardActionLoader`, `ScanGlyph`, `ProcessRail`, `ProcessSteps`, plus the `ledger-scan` / `loader-rail` / `loader-step` / `shimmer` keyframes) into **one** primitive — `<Loader>` — plus **one** allowed indeterminate loop — `<RouteProgress>`.

This satisfies Requirements 6.8, 8.6, and 14.4.

### 9.1 The vocabulary

| Surface | What renders | Animation |
|---|---|---|
| Button while submitting | `<Loader size="sm" label="" />` inline + the button text changes ("Save" → "Saving changes") | none — the dot is static |
| Card / form pending strip | `<Loader size="sm" label="…" />` or `<Loader size="md" label="…" />` | none |
| Receipt card (in-flight status / delete) | `<Loader size="sm" label="Updating status \| Removing receipt" />` | none |
| Page-level overlay (e.g. sign-out) | `<PageLoader show title description />` (centered card containing `<Loader size="md">`) | none |
| Route transition (top-of-page) | `<RouteProgress />` (2px accent bar) | `route-progress` keyframe — the **only** indeterminate loop allowed |

### 9.2 Rules

- The "in progress" signal lives in the **label state change** — the verb ("Save" / "Saving changes") — not in a complex animation.
- Buttons that show a `<Loader size="sm" label="" />` plus progress text set `data-loading="true"` and `disabled`. The base button ruleset keeps opacity at 100% in that case so the loader stays readable.
- Page-level loaders carry `role="status" aria-live="polite|assertive"` so screen readers announce the operation. The dot is `aria-hidden`.
- `<Skeleton>` is the placeholder primitive. It is **static** — no shimmer, no breathing animation. Pending state on a skeleton-laden surface is communicated by an adjacent `<Loader>` if needed.
- Reduced-motion users see no change to `<Loader>` (it is already static), no shimmer (deleted), and a static accent bar instead of the moving `<RouteProgress>` track (the animated node carries `data-reduced-motion="static"`).

### 9.3 Forbidden

- ❌ Spinner glyphs (any rotating SVG).
- ❌ `animate-spin`, `animate-shimmer`, `animate-ledger-scan`, `animate-loader-rail`, `animate-loader-step`, `animate-pulse` on user-facing chrome.
- ❌ Bespoke "scanning" or "processing" rails inside cards.
- ❌ Multiple indeterminate loops on the same screen. Only `<RouteProgress>` is permitted, and only during a route transition.

---

## 10. Feedback patterns

### 10.1 Pattern: Toast Notification
Sonner library, configured once in `app/layout.tsx`.

| Type | Call | Used for |
|---|---|---|
| Success | `toast.success("Receipt created")` | Successful mutations |
| Warning | `toast.warning("Extraction needs review")` | Soft failures / human-in-the-loop |
| Error | `toast.error("Receipt could not be saved.")` | Hard failures |

**Rules**
- Position: `bottom-right`. Theme: `dark`. Auto-dismiss uses Sonner's default timing (~4s).
- No custom toast component — use Sonner's built-in styling.
- The Toaster props (position, theme) are preserved as part of Requirement 14.6.

### 10.2 Pattern: Loading Button
```tsx
<Button
  type="submit"
  disabled={isSubmitting}
  data-loading={isSubmitting ? "true" : undefined}
>
  {isSubmitting ? (
    <>
      <Loader size="sm" label="" />
      Saving changes
    </>
  ) : (
    <>
      Save
      <ArrowRight data-icon aria-hidden="true" />
    </>
  )}
</Button>
```

**Rules**
- Button becomes `disabled` during loading — prevents double-submit.
- The redesigned `<Loader size="sm" label="" />` replaces the spinner. Static dot, no rotation.
- Text changes to indicate progress ("Save" → "Saving changes", "Sign in" → "Signing in").
- Never hide the button entirely.
- This is the canonical pending-button pattern — reused by `<AuthForm>`, `<ReceiptDashboard>` (Check inbox / Extract / Submit), `<DashboardHeader>` (Log out), and `<LogoutSection>` (Settings page).

### 10.3 Pattern: Copy Feedback
**Usage:** Copy forwarding address, future copy actions (`<CopyForwardingAddress>`).

```
Button text: "Copy" → click → "Copied!" + check icon → 2s → "Copy"
```

**Rules**
- Feedback is inline — the button's text and icon change temporarily. Duration: 2s before reverting.
- No toast for copy — inline feedback is sufficient.
- State is managed with `useState` + `setTimeout`.

### 10.4 Pattern: Form Submission
1. User clicks submit.
2. Button shows `<Loader size="sm" label="" />` + verb ("Saving…").
3. Button becomes `disabled`; `data-loading="true"`.
4. On success: `toast.success(...)` + form resets / closes.
5. On error: `toast.error(...)` + form retains values.

**Rules**
- Never clear the form on error — the user shouldn't re-enter data.
- Always show a toast — the user needs confirmation the action completed.
- Redirect only after the success toast is visible.

---

## 11. Pattern creation rules

### When to create a new pattern
- A composition appears on 2+ screens with identical structure.
- A composition has 3+ elements that always appear together.
- A composition has specific spacing/sizing rules that could drift.

### How to document a new pattern
1. Name it clearly (`Pattern: [Name]`).
2. Define its usage context (which screen, what role).
3. Show its structure (indented tree of primitives + tokens).
4. List its rules (spacing, sizing, variants, motion).
5. Note any responsive adaptations.
6. Add it to the appropriate section of this document.

### When NOT to create a pattern
- A composition appears only once (it's page-specific).
- A composition is just a single primitive with className overrides.
- A composition is still evolving (wait until it stabilizes).

---

## 12. Anti-patterns

### Composition anti-patterns
- ❌ Nesting cards inside cards. One level of containment only.
- ❌ Placing forms inside dialogs inside cards. Two levels of nesting maximum.
- ❌ Mixing card padding values on the same screen. Pick one (`p-4`, `p-5`, or `p-6`).
- ❌ Using different icon sizes in the same context. Stay consistent within a section.
- ❌ "Wrapper" components that just add a className. Use the className directly.
- ❌ Putting action buttons in card headers. Actions go in card content or footer.
- ❌ Mixing flex and grid in the same container. Pick one layout mode.
- ❌ Using absolute positioning except for badges/overlays. Prefer flow layout.

### Visual anti-patterns (deleted by the redesign — see §13)
- ❌ Tile-wrapped Lucide icons (`<ReceiptText>` inside a `border-conic-soft` rounded square).
- ❌ Aurora radial blobs (`bg-aurora-action`, `bg-aurora-soft`).
- ❌ Masked grid meshes (`bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`).
- ❌ Multi-stop gradient text (`text-gradient-primary`, `text-gradient-action`).
- ❌ Multi-stop gradient surfaces (`bg-scene-hero`, `bg-scene-auth`, `bg-card-elevated`).
- ❌ Glow shadows on chrome (`shadow-glow-action`, `shadow-glow-soft`).
- ❌ Inner-hair surface highlights (`shadow-inner-hair`).
- ❌ Stagger / fade-in entrance animations on cards and lists.
- ❌ Shimmer / scan / rail / step keyframed loaders.

---

## 13. Migration notes

The Premium UI Redesign removed several primitive props, exports, and CSS classes. Each removal is logged below with a one-line rationale. Pre-existing call sites were migrated screen-by-screen in Phases 2–3, and the legacy shims were deleted in Phase 4 (task 11.3).

### 13.1 Removed: `<FadeIn>`, `<Stagger>`, `<StaggerItem>`, `<HoverLift>` exports
**File:** `components/motion/motion-primitives.tsx`
**Replaced by:** `<Reveal>` — see §3.13.
**Reason:** The previous motion vocabulary applied entrance animations to every card and list, producing the AI-generated "everything fades in" tell. The redesign restricts motion to one canonical primitive used only where motion communicates state (dialog open/close), not where it dresses up arrival. (Requirements 6.7, 13.8.)

### 13.2 Removed: `premiumEase` constant
**File:** `components/motion/motion-primitives.tsx`
**Replaced by:** the CSS variable `var(--ease-standard)` for stylesheet consumers, or the inline tuple `[0.2, 0, 0, 1]` for framer-motion `transition.ease` consumers.
**Reason:** The exported constant became a magnet for bespoke framer-motion usage outside the sanctioned `<Reveal>` and `<Dialog>` consumers. Inlining the tuple at each (rare) call site keeps the easing curve traceable and prevents the ease from becoming a third motion-system entry point. (Requirement 6.7.)

### 13.3 Removed: `<Button>` `default` CVA variant alias
**File:** `components/ui/button.tsx`
**Replaced by:** `variant="primary"` (which is now the CVA default).
**Reason:** The `default` alias was a temporary compatibility shim during Phase 2 so existing `<Button>` JSX continued to type-check while screens migrated. The variant rename to `primary` is part of the redesigned button contract, which spells out the four-variant set (`primary`, `secondary`, `ghost`, `danger`) instead of the previous `default`/`ghost`/`destructive` triple. (Requirement 8.3.)

### 13.4 Removed: `<ButtonLoader>` shim
**File:** `components/ui/loaders.tsx`
**Replaced by:** `<Loader size="sm" />` (or `<Loader size="md" />` for standalone placement).
**Reason:** The previous `<ButtonLoader variant="auth|inbox|extract|save|update|delete|logout" />` API encoded a different visual per operation (scanning rail, animated dots, ledger sweep). The redesigned vocabulary is one static primitive with a free-text label — the operation is communicated in the verb ("Saving changes", "Signing in"), not in a separate animated glyph. The shim was kept through Phases 2–3 so consumer files compiled mid-migration; it was deleted in Phase 4. (Requirements 6.8, 8.6, 14.4.)

### 13.5 Removed: `<UrgencyBadge>.pulse` parent-controlled prop
**File:** `components/receipts/urgency-badge.tsx` (and the `pulseUrgency` prop on `<ReceiptCard>` / the `firstPulsedReceiptId` selection in `<ReceiptDashboard>`).
**Replaced by:** internal expired-red gate alone. The badge now pulses iff `variant === "danger"` AND `daysRemaining !== null && daysRemaining < 0`.
**Reason:** Requirement 6.4 allows one documented attention signal per screen. The dashboard previously asked the parent to scope the pulse to "the first expired receipt" — but every expired-red receipt is by definition the critical attention target on the screen, and pulsing all of them is the correct behaviour. Removing the parent-controlled override eliminates a coordination point that no longer earns its keep and tightens the contract: the pulse is the property of the data state, not the layout context. (Requirements 6.4, 8.9, 14.7.)

### 13.6 Removed: `<AmbientBackground>.variant="auth" | "app"`
**File:** `components/visual/ambient-background.tsx`
**Replaced by:** `variant="off"` (which renders `null`). Both legacy values are still accepted by the type and treated as `"off"` internally, so existing call sites continue to type-check; new call sites use `"hero"` or `"off"` exclusively.
**Reason:** The pre-redesign `auth` and `app` variants stacked aurora radial blobs, masked grid meshes, and additional gradient overlays — exactly the AI_Slop_Pattern catalogue Requirement 13 forbids. The redesign collapses ambient atmosphere to one tonal element per page maximum (the `hero` band) or nothing. The prop API is preserved so consumer pages don't need to change their JSX while the migration completes. (Requirements 5.6, 13.5, 13.9, 13.10.)

### 13.7 Removed: `<ReceiptText>`-in-tile brand mark
**Files:** `components/auth/auth-form.tsx`, `components/dashboard/dashboard-header.tsx` (the previous tile-wrapped Lucide icon).
**Replaced by:** `<BrandMark>` — see §3.12.
**Reason:** The Lucide `<ReceiptText>` icon inside a `border-conic-soft` rounded square with `shadow-inner-hair` was the most legible AI-slop tell in the pre-redesign build. The replacement is a custom typographic SVG that sits flush next to the wordmark with no tile, halo, or gradient. (Requirements 1.4, 1.5, 7.4.)

### 13.8 Removed: `<ActionLoader>` / `<CardActionLoader>` / `<ProcessRail>` / `<ProcessSteps>` exports
**File:** `components/ui/loaders.tsx`
**Status:** These names remain as **deprecated thin shims** that delegate to `<Loader>` and will be deleted once their final consumers migrate. New code MUST use `<Loader>` directly.
**Reason:** Same as §13.4 — the redesigned vocabulary is one primitive, not a family of operation-coded animated glyphs. The shims preserve compile-time compatibility for consumers that still pass the legacy `variant="…"` / `compact` props; the `description` prop on `<ActionLoader>` is dropped because the redesigned vocabulary carries one label per loader. (Requirements 6.8, 8.6.)

### 13.9 Removed: deprecated CSS classes
**Files:** `app/globals.css`, `tailwind.config.ts`
**Removed classes:** `border-conic-soft`, `bg-scene-hero`, `bg-scene-auth`, `bg-aurora-action`, `bg-aurora-soft`, `bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`, `text-gradient-primary`, `text-gradient-action`, `bg-card-elevated`.
**Reason:** Each class implemented a banned AI_Slop_Pattern (multi-stop gradients, aurora blobs, masked grid meshes, gradient text, gradient card overlays). All consumers were migrated in Phase 2/3 and the classes were deleted in Phase 4. (Requirements 5.5, 5.6, 5.7, 13.4, 13.5, 13.6, 14.3.)

### 13.10 Removed: deprecated Tailwind keyframes and shadow tokens
**File:** `tailwind.config.ts`
**Removed keyframes:** `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red`.
**Removed shadow tokens:** `shadow-card-sm`, `shadow-card-lift`, `shadow-glow-action`, `shadow-glow-soft`, `inner-hair`.
**Replaced by:** `attention` (single keyframe gated to expired-red urgency), `route-progress` (single keyframe gated to `<RouteProgress>`), and `shadow-overlay` (the only retained shadow, used by `<Dialog>`, `<PageLoader>`, and the toaster).
**Reason:** The previous keyframe set produced multiple indeterminate loops on every screen and the shadow tokens applied glow chrome to resting buttons and cards. The redesigned Motion_Language allows exactly one indeterminate loop (`<RouteProgress>`) plus one conditional attention pulse (expired-red urgency); the redesigned elevation system uses borders, not shadows. (Requirements 5.2, 5.3, 6.7, 6.8, 8.6, 14.4.)

---

## Document maintenance

### When to update this document
- A new composition pattern stabilizes across 2+ screens (add to §4 or §5).
- A new primitive ships in `components/ui/` or `components/{brand,motion,visual}/` (add to §3).
- A primitive's prop contract changes (update the relevant §3 entry; add a §13 migration note for any removed prop or export).
- An anti-pattern is added to the rejected-pattern checklist (add to §12).
- The loading or motion vocabulary changes (update §9).

### When NOT to update
- A screen uses a documented pattern with minor className customization.
- A one-off composition that won't repeat.
- Component internal implementation changes that don't alter the prop contract or the visual contract.
