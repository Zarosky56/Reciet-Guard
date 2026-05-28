# Profile Page Design Specification

> Premium UI Redesign — task 8.5 (`app/(dashboard)/profile/page.tsx`).
> Validates Requirements 9.1, 9.6, 4.5, 4.6.

## Purpose
The profile page (`/profile`) is a lightweight page where users can view their identity, account metadata, and current activity totals. Unlike settings (which covers account configuration), the profile page focuses on identity: avatar fallback, display name, email, member-since date, and a compact activity summary. It should feel personal and warm while maintaining the professional dark-canvas aesthetic.

**User mindset:** May want to verify their identity, check account creation details, or scan their current activity totals before jumping back to the dashboard. This is a low-frequency page — keep it simple and satisfying.

---

## Redesigned composition (wireframe-level)

The redesigned profile page is a **single-column stack of cards** inside `<main className="max-w-narrow">` (`--container-narrow`, `42rem`). The page shares the redesigned `<DashboardHeader>` (which renders the desktop top-nav and the `<MobileBottomNav>`) at the top of `<main>`. Below the header, the content grid is `grid gap-8` — one section gap between cards — with each card using `gap-4` internally and each row using `gap-2` between label and value (Requirement 4.6).

```
┌────────────────────────────────────────────────────────────────────┐
│ <main> max-w-narrow, no <AmbientBackground>                        │
│                                                                    │
│  <DashboardHeader current="profile">                               │
│    BrandMark + wordmark   [Dashboard|Settings|Profile*]  [Log out] │
│                                                                    │
│  ┌─ grid gap-8 (32px section gap) ────────────────────────────────┐│
│  │                                                                ││
│  │  HEADER ── <Reveal>                                            ││
│  │    eyebrow "Profile"                                           ││
│  │    H1      "Your account"                                      ││
│  │    p       "A compact view of your identity and receipt        ││
│  │             activity."                                         ││
│  │                                                                ││
│  │  IDENTITY HEADER CARD ── <Reveal delay=0.06>                   ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ ┌── flex-col @ < sm, flex-row @ ≥ sm, gap-5 ────────┐  │    ││
│  │  │ │ <Avatar size-20>                                  │  │    ││
│  │  │ │   [initials]                                      │  │    ││
│  │  │ │                                                   │  │    ││
│  │  │ │ <div grid gap-2>                                  │  │    ││
│  │  │ │   H2 "{display name}"                             │  │    ││
│  │  │ │   p  "{email}"                                    │  │    ││
│  │  │ │   [Badge "Active account" success] [Badge "Member│  │    ││
│  │  │ │   since {date}"]                                  │  │    ││
│  │  │ │ </div>                                            │  │    ││
│  │  │ └────────────────────────────────────────────────── ┘  │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  │                                                                ││
│  │  IDENTITY CARD ── <Reveal delay=0.12>                          ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ H2 "Identity"                                          │    ││
│  │  │ p  "Your email is the account identity used for        │    ││
│  │  │     receipt forwarding."                               │    ││
│  │  │ ─── dl, gap-4, each row `border-t border-border pt-4`  │    ││
│  │  │   <ProfileRow label="Email"            value=…>        │    ││
│  │  │   <ProfileRow label="Forwarding addr"  value=…>        │    ││
│  │  │   <ProfileRow label="Account created"  value=…>        │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  │                                                                ││
│  │  ACTIVITY CARD ── <Reveal delay=0.18>                          ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ H2 "Activity summary"                                  │    ││
│  │  │ p  "Counts reflect your current dashboard data."       │    ││
│  │  │ ─── dl, gap-4                                          │    ││
│  │  │   <ActivityRow icon=ReceiptText label="Receipts"  X>   │    ││
│  │  │   <ActivityRow icon=CalendarDays label="Active"   X>   │    ││
│  │  │   <ActivityRow icon=ShieldCheck  label="Due soon" X>   │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  │                                                                ││
│  │  LOGOUT CARD ── <Reveal delay=0.24>                            ││
│  │    <LogoutSection bordered={false} />                          ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│  <MobileBottomNav current="profile"> ── md:hidden, fixed bottom    │
└────────────────────────────────────────────────────────────────────┘
```

### Hero / main block prose

The profile page does not have a "hero" in the dashboard sense. Its primary block is the **identity header card** — the first card after the page header, containing the user's avatar (with initials fallback), display name, email, and two status badges ("Active account" + "Member since {date}"). The avatar and the identity column stack vertically below `sm` and switch to a side-by-side row at `sm` and above. The avatar uses the `<Avatar>` primitive at `size-20` with the redesigned `--radius-pill` and a `text-accent` initials fallback (Requirement 5.2, 8.1).

Below the identity header, three sibling cards stack with `gap-8` between them:

1. **Identity card** — repeats the email, the forwarding address, and the account-created date in a `<dl>` with row separators (`border-t border-border pt-4`)
2. **Activity card** — renders three `<ActivityRow>` items (Receipts / Active / Due soon) with leading `text-accent` icons at the documented stroke width (Requirement 7.2) and trailing `font-mono tabular-nums` counts
3. **Logout card** — wraps the shared `<LogoutSection bordered={false} />`

**No `<AmbientBackground>`.** The hero band is reserved for the landing route; app screens render on the bare canvas (Requirement 5.6, 13.10).

**Single-column only.** No multi-column grids inside the profile page (Requirement 4.5). The avatar/identity flex row is a flex layout, not a grid — that is the intended exception.

---

## Layout Structure

### Section Order
1. **`<DashboardHeader current="profile">`** — sticky chrome shared with `/dashboard` and `/settings`
2. **Page header** — eyebrow + H1 + lede
3. **Identity header card** — avatar + name + email + badges
4. **Identity card** — `<dl>` with email, forwarding address, account created
5. **Activity summary card** — `<dl>` with Receipts / Active / Due soon counts
6. **Logout card** — `<LogoutSection>` wrapped in a card
7. **`<MobileBottomNav current="profile">`** — fixed bottom on `md:hidden`

### Spacing
- Root container: `mx-auto min-h-screen w-full max-w-narrow px-4 sm:px-6 md:px-8`
- Page content: `grid gap-8 py-8 md:py-10`
- Section gap (between cards): `gap-8` (32px)
- Card-internal gap: `gap-4` (16px)
- Label-to-input / label-to-value gap: `gap-2` (8px)
- Badge cluster gap: `gap-2`
- All values come from the spacing scale (Requirement 4.1, 4.6)

### Containers
- `<main>` is `max-w-narrow` (`--container-narrow`, `42rem`) per Requirement 4.4 / 9.6
- Each section is wrapped in its own `<Card>` for clean compartmentalization

### Responsive Adaptations
- **Mobile (< `sm`):** Identity header stacks vertically, avatar centered, name + email centered, badges centered (`flex-wrap items-center justify-center`)
- **Tablet/Desktop (≥ `sm`):** Identity header switches to flex-row (`sm:flex-row`), avatar + identity column side-by-side, badges left-aligned
- **Desktop (`md` ≥ 768px):** `<DashboardHeader>` segmented top-nav becomes visible; `<MobileBottomNav>` hidden
- **Ultrawide:** Content stays within `max-w-narrow`

---

## Visual Direction

### Aesthetic Tone
Personal, warm, minimal. The narrow container makes the page feel like a personal space. Spacing is more generous than the dashboard (`gap-8` between cards vs `gap-6`) to convey that this page is about the person, not the data.

### Visual Density
Very low. Profile information is sparse by nature. The empty space around each card conveys calm.

### Typography Emphasis
- **Eyebrow:** `text-xs uppercase tracking-wider text-text-muted`
- **H1:** `text-2xl font-semibold tracking-tight text-text-primary md:text-3xl`
- **Card H2:** `text-xl font-semibold tracking-tight`
- **Identity name (in header card):** `text-xl font-semibold tracking-tight`
- **Email + descriptions:** `text-sm leading-6 text-text-secondary`
- **`<dl>` labels:** `text-xs uppercase tracking-wider text-text-muted`
- **`<dl>` values (Identity card):** `font-mono text-sm leading-6 text-text-primary` — monospace conveys precision for technical data (forwarding address, dates)
- **Activity counts:** `font-mono text-base font-semibold tabular-nums` — tabular numerals (Requirement 3.6)

### Use of Whitespace
- `gap-8` between cards (32px) is one step looser than the dashboard's `gap-6`
- Card-internal `gap-4` is the standard
- Inline `border-t border-border pt-4` separators inside the `<dl>` create row rhythm without additional margins

### Visual Focus Points
1. **Avatar** — largest visual element in the identity header card
2. **Display name** — `text-xl font-semibold` heading right of the avatar
3. **Activity counts** — `font-mono` numerals on the right of each activity row, drawing the eye for scanning

---

## Components

### Components Used
- `<DashboardHeader current="profile">` (`components/dashboard/dashboard-header.tsx`)
- `<MobileBottomNav current="profile">` (rendered inside the header)
- `<Card>` + `<CardContent>` (`components/ui/card.tsx`)
- `<Avatar>` + `<AvatarFallback>` (`components/ui/avatar.tsx`) — `--radius-pill`, `bg-surface`, `border-border`, no decorative tile (Requirement 5.2, 8.1)
- `<Badge variant="success" | "default">` (`components/ui/badge.tsx`)
- `<Reveal>` (`components/motion/motion-primitives.tsx`) — single motion primitive, transform + opacity only, with staggered `delay` per card to keep paint order legible without using `<Stagger>` (Requirement 6.7)
- `<LogoutSection bordered={false} />` (`components/settings/logout-section.tsx`)
- Lucide icons: `CalendarDays`, `ReceiptText`, `ShieldCheck` — `text-accent`, single `strokeWidth={1.75}` (Requirement 7.2)

### Customization
- The avatar fallback uses `text-accent` for the initials — the only place accent text appears on this page besides the activity icons
- Each `<ActivityRow>` icon uses `size-4 text-accent strokeWidth={1.75}` — the documented stroke width
- `<ProfileRow>` and `<ActivityRow>` first child gets `first:border-t-0 first:pt-0` to suppress the leading separator
- The `<Reveal>` `delay` values stagger the cards (0.06, 0.12, 0.18, 0.24) — each card animates independently, no list-stagger (Requirement 6.3 forbids stagger on **lists** that are part of the user's primary task; the profile cards are sibling sections, not a list)

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ `<AmbientBackground>` on this route
- ❌ Multi-column grid layouts
- ❌ Decorative tile around the avatar
- ❌ Glow shadow on the badges
- ❌ `<Stagger>` on the activity rows
- ❌ Tabbed sections (settings has a single page; profile must too)

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- Single column
- Identity header: avatar centered above name (flex-col items-center text-center)
- Badges centered (`justify-center`)
- `px-4` page padding
- `<MobileBottomNav>` visible

### Tablet (`sm` – `md`, 640–768px)
- Identity header: side-by-side (`sm:flex-row sm:items-center sm:gap-5 sm:text-left`)
- Badges left-aligned (`sm:justify-start`)
- `<MobileBottomNav>` still visible

### Desktop (`md` ≥ 768px)
- `<DashboardHeader>` segmented top-nav visible
- `<MobileBottomNav>` hidden
- `py-10` page padding

### Ultrawide
- Content stays within `max-w-narrow`

### Touch Ergonomics
- All interactive elements meet the 44×44 CSS-pixel minimum
- `<MobileBottomNav>` items render at `min-h-12 min-w-12` inside an `h-16` bar
- Logout button inside the logout card uses Button primitive at default size
- Avatar is non-interactive

---

## Motion

### Hover Effects
- Cards on the profile page are non-interactive (no `data-interactive="true"`) — they do not lift on hover
- `<Badge>` does not animate
- `<LogoutSection>` button uses the standard danger-variant hover

### Transitions
- All interactive elements use `--motion-default` or `--motion-quick` with `--ease-standard`
- Reduced-motion users see no transition

### Page Animations
- `<Reveal>` enters each card with a small translate + fade — single primitive, transform/opacity only, `--motion-default` duration, `--ease-standard` easing (Requirement 6.5, 6.7)
- The cards are sibling sections (not a list of receipts/settings) so they do not violate Requirement 6.3
- Reduced-motion users see the cards in their final state instantly

### Loading Interactions
- `<LogoutSection>` shows the standard `<Loader size="sm" />` inline when logout is pending
- No skeleton loading on this page — the data is loaded server-side via `requireUser` + `ensureProfile` + receipts query

### Modal Behavior
None.

### Scroll Interactions
None. No sticky elements other than the `<DashboardHeader>`.

---

## Premium UX Rules

### Reduce Cognitive Load
- Three cards beneath the identity header — Identity, Activity, Logout
- No bio / about-me field, no social links, no profile completion meter
- Email is read-only — clearly distinct from editable fields
- No "Edit Profile" mode toggle

### Guide User Attention
- Avatar is the visual anchor of the identity header
- Activity counts use `font-mono` to draw the eye for scanning
- Logout card sits at the bottom — the "exit" is clearly the last available action

### Luxury SaaS Feel
- The narrow container (42rem) makes the page feel curated, not stretched
- The avatar's accent-tinted initials supply a personal touch without a real photo
- `font-mono` for technical data (email, forwarding address, dates) supplies developer-tool credibility

### Visual Calmness
- No real-time validation
- No "Changes unsaved" anxiety — the page is read-only
- No activity feed or recent actions

### Polished Interactions
- Cards reveal with a small motion entrance — gentle without being decorative
- Logout uses `<PageLoader>` overlay (inherited from `<DashboardHeader>`) so the user knows the session is being terminated

---

## Anti-Patterns

### DO NOT:
- ❌ Add a "Bio" or "About me" textarea
- ❌ Include social media links
- ❌ Show a "Profile viewed X times" counter
- ❌ Add a "Public profile" toggle
- ❌ Include a "Recent activity" feed
- ❌ Add a "Badges" or "Achievements" section
- ❌ Show "Account level" or "Tier"
- ❌ Add a profile completion progress bar
- ❌ Use a cover image / banner
- ❌ Show "Last active" or online status
- ❌ Reintroduce `<AmbientBackground>` on this route
- ❌ Use a multi-column grid layout
- ❌ Wrap the avatar in `border-conic-soft` or any decorative tile
- ❌ Add a theme picker (app is dark-only)

---

## Inspiration References

- **Linear** — Clean profile, minimal fields, avatar-focused
- **Apple** — Apple ID profile: simple, personal, trustworthy
- **Stripe** — User profile: professional, minimal, clear
- **Notion** — Account settings: compact, focused, no fluff
- **GitHub** — Public profile inspiration for layout (but much simpler)
