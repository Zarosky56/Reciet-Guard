# Navigation Design Specification

> Premium UI Redesign — task 5.12 / 5.13 (`components/dashboard/mobile-bottom-nav.tsx`, `components/dashboard/dashboard-header.tsx`).
> Validates Requirements 8.7, 11.6, 6.5, 5.4, 13.7.

## Purpose
Navigation in Receipt Guardian is intentionally minimal. The application has a flat structure with three authenticated routes (`/dashboard`, `/settings`, `/profile`) plus the developer `/test-extraction` tool, so navigation should not call attention to itself. It exists to serve content, not to be a feature. The navigation system must feel invisible — users should move between pages without thinking about the navigation mechanism.

**User mindset:** Focused on their receipts, not on navigating the app. Navigation should be available when needed and invisible when not.

---

## Redesigned navigation surfaces

The redesign defines three distinct navigation surfaces. Each is documented below with a wireframe-level prose description.

### 1. Landing-page header (unauthenticated)

```
┌─ flex items-center justify-between ───────────────────────────────┐
│  <BrandMark size="md" /> "Receipt Guardian"   [Log in (sm:hidden)]│
│                                              [Sign up →]          │
└────────────────────────────────────────────────────────────────────┘
```

**Prose:** A simple horizontal bar at the top of the landing `<main>`. The left cluster is a Next.js `<Link href="/">` containing the typographic `<BrandMark>` and the wordmark "Receipt Guardian". The right cluster contains two buttons rendered at `size="sm"`: a `variant="ghost"` "Log in" link (hidden below `sm` to reduce mobile clutter) and a `variant="primary"` "Sign up" CTA with a trailing `<ArrowRight>` icon. There is no hamburger menu (two links don't justify it). There is no border-bottom — the landing header sits on the same canvas as the hero.

### 2. Dashboard header (authenticated, `md`+)

```
┌─ sticky top-0 z-30, bg-canvas-raised, border-b border-border ────────┐
│  ┌─ flex h-16 items-center justify-between max-w-6xl ──────────────┐ │
│  │ <BrandMark> + "Receipt Guardian" + email (md:block)              │ │
│  │                                                                  │ │
│  │              ┌─ <nav> rounded-md border border-border-strong ──┐│ │
│  │              │ bg-surface p-1                                  ││ │
│  │              │ [Dashboard] [Settings] [Profile]                ││ │
│  │              │   ↑ active uses bg-accent-tint text-text-primary││ │
│  │              └────────────────────────────────────────────────  ┘│ │
│  │                                                                  │ │
│  │                                       [Log out] (Button secondary)│ │
│  │                                       (Loader during pending)    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Prose:** A sticky bar pinned to the top of every authenticated route. The chrome is **opaque** `bg-canvas-raised` with a `border-b border-border` — there is no `backdrop-blur-xl` glassmorphism (Requirement 5.4, 13.7). The left cluster is a `<Link href="/dashboard">` containing the typographic `<BrandMark>` and the wordmark, with the user email rendered as a truncated subtitle (`text-xs text-text-muted`) on `md`+. The center cluster (visible on `md`+) is a horizontal segmented `<nav aria-label="Main">` containing three `<Link>` items wrapped in a single bordered surface (`rounded-md border border-border-strong bg-surface p-1`). The active item uses `bg-accent-tint text-text-primary`; inactive items use `text-text-secondary` with a hover shift to `text-text-primary`. The right cluster is a single `<Button variant="secondary" size="sm">` "Log out" with a leading `<LogOut>` icon, swapping to `<Loader size="sm" />` and the label "Signing out" while pending.

### 3. Mobile bottom navigation (authenticated, `< md`)

```
┌─ fixed inset-x-0 bottom-0 z-40, md:hidden ───────────────────────────┐
│ border-t border-border bg-canvas-raised, pb-[env(safe-area-inset-bot)]│
│                                                                       │
│  ┌─ h-16 max-w-lg, justify-around ──────────────────────────────────┐│
│  │                                                                  ││
│  │  [LayoutDashboard]   [Settings]   [User]                         ││
│  │   icon (size-5)        ...          ...                          ││
│  │   "Dashboard"          "Settings"   "Profile"                    ││
│  │                                                                  ││
│  │   ↑ active item:                                                 ││
│  │     • icon color → text-accent                                   ││
│  │     • label color → text-accent                                  ││
│  │     • 2px solid bg-accent bar at top of item (::before, w-8)    ││
│  │     • NO glow shadow                                             ││
│  └──────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

**Prose (Requirement 8.7):** A fixed bar at the bottom of the viewport, hidden on `md`+. The chrome is **opaque** `bg-canvas-raised` with a `border-t border-border` (no glassmorphism per Requirement 5.4). Inside, three nav items distribute across `max-w-lg justify-around`. Each item is a `<Link>` with stacked `<Icon>` (`size-5`, `strokeWidth={1.75}`) and label (`text-xs font-medium`).

**Active state spec:** When the current route matches an item's `href`, three things change simultaneously:

1. **Icon color** shifts from `text-text-muted` → `text-accent`
2. **Label color** shifts from `text-text-muted` → `text-accent`
3. **A 2px solid `bg-accent` bar** renders at the top edge of the active item via a `::before` pseudo-element (`before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:h-0.5 before:w-8 before:bg-accent before:content-['']`)

The active state has **no glow shadow** (the deprecated `shadow-[0_0_8px_rgba(91,140,255,0.5)]` is forbidden), no scale change, and no animation (Requirement 8.7). Inactive items use `text-text-muted` with a hover shift to `text-text-secondary`.

**Touch target spec (Requirement 11.6):** Each item is at least 44×44 CSS pixels. The bar is `h-16` (64px) tall and each item enforces `min-h-12 min-w-12` (48px), comfortably exceeding the minimum. The `pb-[env(safe-area-inset-bottom)]` padding accounts for iOS home-indicator safe area without inflating the visible touch target.

**Focus-visible spec (Requirement 11.3, 11.4):** Each item adds a 2-token-thick outline at 2-token offset on `:focus-visible` (`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus`) — a non-color attribute change so keyboard users can identify focused items at a glance.

### 4. Auth-page navigation (unauthenticated `/login` and `/signup`)

```
┌─ no chrome ─────────────────────────────────────────────────────┐
│   <BrandMark> + "Receipt Guardian"  ── linked to "/", above card │
│   <Card> ... </Card>                                             │
│   "New here? Create an account"  ── footer link                 │
└──────────────────────────────────────────────────────────────────┘
```

**Prose:** The auth pages do not render a nav bar. The only navigation affordances are:

1. The `<BrandMark>` + wordmark stacked above the card, linked to `/`
2. The footer paragraph beneath the card containing the inverse-action link (`/signup` ↔ `/login`)

There is no "Back to home" link — the BrandMark serves that role. There is no "Forgot password?" link until the reset flow ships.

---

## Layout Structure

### Current Navigation Points
1. **Landing header** — minimal, BrandMark left, "Log in" + "Sign up" right
2. **Dashboard header** — opaque sticky chrome, segmented top-nav (`md`+), Log out
3. **Mobile bottom nav** — fixed bottom on `< md`, three items with the redesigned active indicator
4. **Auth pages** — BrandMark above the card, footer link to sibling page

### Spacing
- Landing header: part of `<main>`'s `px-6 md:px-8 py-8`
- Dashboard header: `h-16` (64px) with `border-b`
- Mobile bottom nav: `h-16` with `border-t`
- Auth footer link: `mt-6` below the card form

### Containers
- Dashboard header inner content uses `max-w-6xl` so the chrome stretches edge-to-edge while content stays bounded
- Mobile bottom nav uses `max-w-lg` so the three items don't sprawl on tablets

### Responsive Adaptations
- **Mobile (< `md`):** Dashboard header hides the segmented top-nav (`md:flex`); `<MobileBottomNav>` becomes visible
- **Desktop (`md`+):** Segmented top-nav inside the dashboard header is visible; `<MobileBottomNav>` is hidden (`md:hidden`)

---

## Visual Direction

### Aesthetic Tone
Invisible. Navigation is utility, not decoration. There is no background fill different from the page chrome (the dashboard header uses `bg-canvas-raised`, one tonal step above `bg-canvas`). The dashboard header's `border-b` is the only visual separator. Mobile bottom nav uses the same `bg-canvas-raised` + `border-t` treatment.

### Visual Density
Minimal. Navigation contains only essential elements. No breadcrumbs, no tabs inside pages, no sidebar, no dropdown menus, no notification badges, no user avatar menu beyond the optional email subtitle.

### Typography Emphasis
- **Wordmark:** `text-[15px] font-semibold tracking-tight text-text-primary` (dashboard header)
- **Email subtitle:** `text-xs text-text-muted` (md:block only)
- **Top-nav item:** `text-[13px] font-medium`
- **Mobile bottom nav label:** `text-xs font-medium leading-none tracking-wide`

### Use of Whitespace
- Nav elements use `gap-2`, `gap-3`, or `gap-4` from the spacing scale
- The dashboard header's `border-b` spans the full viewport width — clear content boundary
- Mobile bottom nav distributes items via `justify-around` — equal whitespace between

---

## Components

### Components Used
- `<BrandMark>` (`components/brand/brand-mark.tsx`) — typographic SVG mark, no Lucide icon, no tile, no halo (Requirements 1.4, 1.5, 7.4)
- `<Button>` (`components/ui/button.tsx`) — all navigation actions
  - Landing: `variant="ghost"` (Log in), `variant="primary"` (Sign up)
  - Dashboard: `variant="secondary"` (Log out)
- `<Loader size="sm" />` — inline pending indicator inside the Log out button
- `<PageLoader>` — full-screen overlay during logout transition
- `<MobileBottomNav>` (`components/dashboard/mobile-bottom-nav.tsx`)
- Lucide icons: `LayoutDashboard`, `Settings`, `User`, `LogOut` — all rendered at `size-5` with `strokeWidth={1.75}` (Requirement 7.2)

### Customization
- The `<BrandMark>` is rendered with `className="text-accent"` so the SVG inherits the accent color
- The dashboard top-nav uses an inner `bg-surface` rounded container with `border border-border-strong p-1`, and active items use `bg-accent-tint text-text-primary`
- Mobile bottom nav active items use the `::before` pseudo-element to render the 2px accent bar — keeps the active indicator a single non-color-only attribute (Requirement 8.7)

### What NOT to Build (Yet)
- No sidebar navigation
- No breadcrumbs (premature for a flat structure)
- No dropdown user menu
- No command palette (future enhancement)
- No back button in the UI (the browser provides one)

---

## Future Navigation Expansion

When the application grows, navigation should expand following these principles:

### When to Add Navigation
- **5+ authenticated pages** → consider a sidebar
- **Multiple workspaces** → workspace switcher in the dashboard header
- **Help/docs** → "Help" link in the footer or header

### Sidebar Navigation (Future)
If a sidebar becomes necessary:
- **Width:** 240–260px, collapsible to icon-only (56px)
- **Position:** Fixed left, full height
- **Items:** Icon + label, active state matches the top-nav active treatment (`bg-accent-tint text-text-primary`)
- **Background:** `--color-surface` or transparent — never `--color-canvas` (creates visual fracture)
- **Collapse transition:** Smooth width animation, `--motion-default` duration

### Top Navigation Expansion (Future)
If top nav grows beyond three items:
- **Items:** Stay inside the bordered segmented container (`bg-surface p-1`)
- **Active treatment:** Remains `bg-accent-tint text-text-primary`
- **Right section:** User avatar menu (typographic mark or initials, no decorative tile)

---

## Motion

### Hover Effects
- **Top-nav inactive items:** `text-text-secondary` → `text-text-primary` color shift, `--motion-default` duration
- **Mobile bottom nav inactive items:** `text-text-muted` → `text-text-secondary` color shift
- **Buttons:** variant-specific hover (no glow)
- **BrandMark link:** focus-visible outline only

### Transitions
- All nav transitions use `--motion-default` duration with `--ease-standard`
- No nav-specific animations beyond color shifts
- Reduced-motion users see no transition (global rule)

### Page Transitions
- No page transition animations
- Navigation is instant — Next.js client-side routing
- Logout shows a `<PageLoader>` overlay with `<Loader size="md" />` during the brief sign-out + redirect window
- `<RouteProgress>` (the single allowed indeterminate loop, fired by Next.js navigation) renders a 2px accent bar at the top of the page during route transitions

---

## Premium UX Rules

### Reduce Cognitive Load
- No navigation decisions — the user's path is essentially linear
- Consistent placement: header always at the top, mobile bottom nav always at the bottom
- Three items max in the authenticated nav; two in the landing header

### Guide User Attention
- Primary action (Sign up) uses the `primary` variant — strongest visual weight on the landing header
- Secondary action (Log in) uses `ghost` — available but not pushy
- Active page in the segmented top-nav uses `bg-accent-tint` — clearly indicates location
- Mobile bottom nav active item uses the 2px accent bar — clear indicator without glow

### Luxury SaaS Feel
- Navigation recedes — content is the star
- No hamburger menu (the landing header has only two links)
- The typographic `<BrandMark>` feels crafted, not generic Lucide-icon-in-a-tile
- No notification badges demanding attention

### Visual Calmness
- No notification badges
- No unread counts
- No "NEW" labels on nav items
- No animated hamburger menu icon

---

## Anti-Patterns

### DO NOT:
- ❌ Add a hamburger menu for two navigation links
- ❌ Use `backdrop-blur-xl` on the dashboard header (Requirement 5.4)
- ❌ Reintroduce `shadow-[0_0_8px_rgba(91,140,255,0.5)]` glow on the mobile bottom nav active state (Requirement 8.7)
- ❌ Reintroduce the `<ReceiptText>`-in-a-tile mark (Requirements 1.4, 1.5, 7.4)
- ❌ Use a different background color for nav vs page chrome
- ❌ Add drop shadows to the header
- ❌ Show notification badges in navigation
- ❌ Add a search bar in the header
- ❌ Include a "What's new" or changelog link
- ❌ Show the user's avatar (not implemented yet)
- ❌ Add keyboard shortcut hints in nav
- ❌ Use underline animations on nav links
- ❌ Include a "Home" link when already on home
- ❌ Add a bottom tab bar that uses an animated active indicator
- ❌ Add a "Back" button (the browser already has one)

---

## Inspiration References

- **Linear** — Minimal top nav, content-first, no distractions
- **Arc Browser** — Chrome that disappears, content-first philosophy
- **Notion** — Minimal top bar, no sidebar when not needed
- **Stripe** — Clean header, clear CTAs, no nav clutter
- **Apple** — Navigation that serves content, never competes with it
