# Landing Page Design Specification

> Premium UI Redesign — task 8.1 (`app/page.tsx`).
> Validates Requirements 9.1, 9.2, 13.13, 13.14.

## Purpose
The landing page (`/`) is the public-facing entry point for Receipt Guardian. It must instantly communicate the product's value proposition — "Never miss a return window again" — and convert visitors into signups. The user arrives with a specific pain point (managing return deadlines across purchases) and needs immediate reassurance that this tool solves it elegantly.

**User mindset:** Skeptical, time-pressed, evaluating whether the tool is worth creating yet another account. They need clarity, not marketing fluff.

---

## Redesigned composition (wireframe-level)

The redesigned landing page is the **only** In_Scope_Screen that renders an ambient atmospheric layer. It is composed of exactly three blocks stacked vertically inside a single `max-w-wide` container, with no entrance animation and no decorative element other than the ambient band.

```
┌────────────────────────────────────────────────────────────────────┐
│ <AmbientBackground variant="hero" />                               │   ← fixed, -z-10, top-band only,
│                                                                    │     320px tall, single-color mask,
│                                                                    │     no grid, no aurora, no animation
│                                                                    │
│ ┌─ <main> max-w-wide, flex-col, min-h-screen ─────────────────┐  │
│ │                                                              │  │
│ │ <header>                                                     │  │
│ │  ┌── BrandMark + "Receipt Guardian"        [Log in][Sign up]│  │
│ │  └─ no tile around the mark, no halo, no border              │  │
│ │                                                              │  │
│ │ <section> flex-1, justify-center, py-16 md:py-20             │  │
│ │                                                              │  │
│ │   eyebrow caption  ── "Receipts. Returns. Deadlines."        │  │
│ │                                                              │  │
│ │   H1 (display)     ── "Never miss a return window again."    │  │
│ │                       text-balance, max-w-3xl, text-display  │  │
│ │                                                              │  │
│ │   lede paragraph   ── one-sentence value prop                │  │
│ │                       text-body-lg, text-text-secondary      │  │
│ │                                                              │  │
│ │   CTA row          ── [primary "Sign up →"] [secondary "Log in"]
│ │                       stacked on mobile, side-by-side ≥ sm    │  │
│ │                                                              │  │
│ │   <Grid cols={3} gap="card" className="mt-16">               │  │
│ │     ┌─ proof 1 ─┐  ┌─ proof 2 ─┐  ┌─ proof 3 ─┐              │  │
│ │     │ 01        │  │ 02        │  │ 03        │              │  │
│ │     │ Title     │  │ Title     │  │ Title     │              │  │
│ │     │ Body copy │  │ Body copy │  │ Body copy │              │  │
│ │     └───────────┘  └───────────┘  └───────────┘              │  │
│ │                                                              │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Hero block prose

The hero block is a single column of typographic content. It opens with a small uppercase eyebrow caption ("Receipts. Returns. Deadlines.") rendered at `--text-caption` with `font-mono font-medium uppercase text-text-muted`. Below it sits the H1 — a display-scale heading at `--text-display` with negative tracking and `text-wrap: balance`, capped at `max-w-3xl`. A lede paragraph at `--text-body-lg` sits below the heading with `text-text-secondary` and a max width of `max-w-2xl`. A CTA row of two buttons (primary "Sign up" with trailing `<ArrowRight>` and secondary "Log in") follows, stacking on mobile and going side-by-side at `sm` and above. The proof-points grid is offset from the CTA row by `mt-16` (32px scaled) so the eye lands on the heading and CTAs first.

**No entrance animation.** The hero renders statically. There is no `FadeIn`, no `Stagger`, no scroll-triggered reveal (Requirement 6.2).

**Single decorative element.** The ambient band is the **only** decorative element on the page. There is no grid mesh, no aurora gradient, no conic halo, no glow shadow, no gradient text (Requirement 13.13, 13.14).

---

## Layout Structure

### Section Order
1. **Header bar** — `<BrandMark>` + wordmark left, "Log in" (ghost, hidden < `sm`) + "Sign up" (primary) right
2. **Hero section** — eyebrow → H1 → lede → CTA row → 3-card proof-points grid
3. **No footer** — the page ends with the proof-points grid; the browser handles back/refresh affordances

### Spacing
- Root padding: `px-6 md:px-8 py-8`
- Hero section: `flex-1 justify-center py-16 md:py-20` — hero floats vertically centered in the viewport
- Eyebrow → H1: `mt-5`
- H1 → lede: `mt-6`
- Lede → CTA row: `mt-8`
- CTA row → proof grid: `mt-16`
- All values come from the spacing scale (Requirement 4.1, 4.2)

### Containers
- `<main>` is constrained to `max-w-wide` (= `--container-wide`, `72rem`) per Requirement 4.4 / 9.2 / 15.7
- No nested containers — the proof grid sits directly inside `<section>` via the `<Grid>` primitive

### Responsive Adaptations
- **Mobile (< `sm`):** CTA buttons stack vertically (`flex-col`), proof grid collapses to single column, `<header>` "Log in" link is hidden (signup CTA carries the conversion)
- **Tablet/Desktop (≥ `sm`):** CTA buttons go side-by-side (`sm:flex-row`), proof grid expands per `<Grid cols={3}>` (single column on mobile, 3 columns at `lg`)
- **Ultrawide:** Content stays centered within `max-w-wide`; the ambient band extends across the viewport but caps at 320px tall

---

## Visual Direction

### Aesthetic Tone
Calm, deliberate, type-led. The page reads as a single editorial composition: one eyebrow, one headline, one paragraph, two actions, three proof points. The ambient band at the top of the viewport adds a faint vertical gradient of luminance only — no color shift, no gradient stop you can point at — so the page feels grounded without feeling decorated.

### Visual Density
Low. The hero floats in the vertical center of the viewport, then yields to the proof grid. There is significant whitespace above the H1 and below the proof grid; that emptiness is the luxury signal.

### Typography Emphasis
- **Eyebrow:** `--text-caption`, `font-mono`, `font-medium`, `uppercase`, `text-text-muted`
- **H1:** `--text-display`, `font-semibold`, balanced wrap, `text-text-primary`
- **Lede:** `--text-body-lg`, `text-text-secondary`
- **CTAs:** Button component handles its own type-scale step (size `lg`)
- **Proof index ("01"…"03"):** `--text-caption`, `font-mono`, `text-text-muted`
- **Proof title:** `--text-title-sm`, `font-medium`
- **Proof body:** `--text-body`, `text-text-secondary`
- No `bg-clip-text` gradient text on any element (Requirement 3.7, 13.3)

### Use of Whitespace
The vertical rhythm of the hero is dictated by the spacing-scale tokens (`mt-5`, `mt-6`, `mt-8`, `mt-16`). Internal proof-card padding is the standardized `p-5` of `<CardContent>`. The ambient band fades to transparent before the proof grid starts, so the cards always sit on the bare canvas.

### Visual Focus Points
1. **H1** — largest element, anchors the page
2. **Primary "Sign up" CTA** — solid accent fill, trailing arrow icon, draws the eye to action
3. **Proof titles** — `font-medium` headers in each card, scannable in under 5 seconds

---

## Components

### Components Used
- `<AmbientBackground variant="hero" />` (`components/visual/ambient-background.tsx`)
- `<BrandMark size="md" />` (`components/brand/brand-mark.tsx`) — typographic SVG mark, no Lucide icon, no tile, no halo (Requirements 1.4, 1.5, 7.4)
- `<Button variant="primary" | "secondary" | "ghost" size="sm" | "lg">` (`components/ui/button.tsx`)
- `<Grid cols={3} gap="card">` (`components/ui/grid.tsx`)
- `<Card data-interactive="true">` + `<CardContent>` (`components/ui/card.tsx`) for the proof points
- `<ArrowRight>` from `lucide-react`, used only as a trailing affordance inside the primary CTA at the documented stroke width (Requirement 7.2)

### Customization
- The proof-point card uses the standardized `<CardContent>` `p-5` padding.
- The proof index ("01"…"03") is a `<span>` rendered in `font-mono` at `--text-caption`.
- The proof card uses `data-interactive="true"`, which makes the card lift by `-translate-y-0.5` and shift to `border-border-strong` on hover. The lift uses transform-only animation per Requirement 6.5.
- The "Log in" button at the top is hidden below `sm` to reduce header clutter on mobile; the primary CTA carries the conversion.

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ `bg-grid-faint` / `mask-fade-radial` / `mask-fade-bottom`
- ❌ `bg-scene-hero` / `bg-aurora-action`
- ❌ `text-gradient-primary` / `bg-clip-text` headings
- ❌ `border-conic-soft` halo around the brand mark
- ❌ Stagger / fade-in entrance animations
- ❌ More than one decorative element on the screen

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- `<main>` is `px-6`, single column
- Header "Log in" hidden; primary "Sign up" remains
- Hero section is vertically centered with `flex-1 justify-center py-16`
- CTAs stack vertically (`flex-col gap-3`)
- Proof grid collapses to a single column

### Tablet (`sm` – `lg`, 640–1024px)
- CTAs go side-by-side (`sm:flex-row`)
- Proof grid stays at one column until `lg`

### Desktop (`lg`, 1024px+)
- Proof grid expands to 3 columns (`<Grid cols={3}>`)
- Hero `py-20`
- `max-w-wide` constraint

### Ultrawide
- `<main>` stays at `max-w-wide`
- Ambient band extends across the viewport but stays capped at 320px tall

### Touch Ergonomics
- Both CTAs render at `size="lg"` (≥ 44px tall)
- Proof cards have generous internal padding; their entire surface is non-tappable (no link-as-card to avoid accidental nav)
- Header CTAs render at `size="sm"` (≥ 36px) with `gap-2` between them

---

## Motion

### Hover Effects
- **Proof cards:** `data-interactive="true"` triggers `-translate-y-0.5` and `border-border-strong` swap on hover (transform-only, `--motion-default` duration)
- **Buttons:** variant-specific hover (primary → `bg-accent-hover`, secondary → `bg-surface-hover`, ghost → `bg-surface-hover`)
- **BrandMark link:** focus-visible outline only; no hover effect

### Transitions
- All interactive elements transition with `duration-default` and `ease-standard`
- No page-level enter animation
- Reduced-motion users see no transform changes — the cards swap border tone only via the global `prefers-reduced-motion` rule

### Page Animations
None. The landing page renders statically. There is no `FadeIn`, no `Stagger`, no scroll-triggered reveal (Requirement 6.2, 13.8).

### Loading Interactions
Not applicable — server-rendered, no async data on this route.

### Modal Behavior
None.

### Scroll Interactions
None. No parallax, no sticky elements, no scroll-jacking.

---

## Premium UX Rules

### Reduce Cognitive Load
- Three proof points only (`<Grid cols={3}>`)
- Two CTAs only — primary "Sign up", secondary "Log in"
- Single eyebrow, single H1, single lede
- No nav menu, no breadcrumbs, no footer link sprawl

### Guide User Attention
- Vertical hierarchy: eyebrow → H1 → lede → CTA → proof points
- The primary CTA includes a trailing `<ArrowRight>` — directional cue toward action
- Proof indices ("01" / "02" / "03") in `font-mono` provide rhythm without competing with the proof titles

### Luxury SaaS Feel
- The ambient band is the only decorative layer — no gradients, no grids, no glow
- Typography-driven: the type scale and the OpenType features documented in `DESIGN.md` carry the identity
- The accent color is used twice: in the primary CTA fill and in the BrandMark stroke

### Visual Calmness
- Spacing rhythm: `mt-5` → `mt-6` → `mt-8` → `mt-16` — multiples of the spacing scale
- No animated decorations
- No autoplaying media

### Polished Interactions
- Button press scale (`active:scale-[0.98]`) on the CTAs — defined in the Button primitive
- Focus-visible outline on every link/button for keyboard users
- `<ArrowRight>` is `aria-hidden="true"` and inherits text color (no extra color)

---

## Anti-Patterns

### DO NOT:
- ❌ Add a Lottie or video hero
- ❌ Use gradient text or gradient backgrounds
- ❌ Add more than 3 proof point cards
- ❌ Stack two decorative elements on the screen (Requirement 13.13)
- ❌ Reintroduce `bg-scene-hero`, `bg-grid-faint`, `bg-aurora-action`, `text-gradient-primary`, `border-conic-soft`
- ❌ Add a stagger or fade entrance animation
- ❌ Add testimonials, logos, or social proof sections
- ❌ Add pricing, FAQ, or "How it works" section
- ❌ Add a footer with multiple link columns
- ❌ Add a hamburger menu (two header links don't justify it)
- ❌ Use the banned voice copy ("Quiet deadlines. Loud savings.", "Trusted by thousands", "How it works", "Get started in 60 seconds") (Requirement 13.11)
- ❌ Wrap the proof grid in a section with its own background fill

---

## Inspiration References

- **Linear** — Dark theme confidence, minimal landing page, single headline focus
- **Stripe** — Clean typography, restrained color, clear CTAs
- **Apple** — Generous whitespace, product-first messaging, no clutter
- **Vercel** — Dark background, geometric precision, developer-focused aesthetic
- **Raycast** — Dark UI, command palette inspiration, minimal marketing
