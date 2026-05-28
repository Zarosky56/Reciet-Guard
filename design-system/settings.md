# Settings Page Design Specification

> Premium UI Redesign — task 8.6 (`app/(dashboard)/settings/page.tsx`).
> Validates Requirements 9.1, 9.6, 4.5, 4.6.

## Purpose
The settings page (`/settings`) is where users find the controls that ship today: receipt intake (forwarding address + manual import), notifications (deadline reminder), and account (read-only email + logout). It must feel organized, trustworthy, and efficient — users come here to verify how things work, then return to the dashboard.

**User mindset:** Task-focused. Came to verify the forwarding address, confirm reminder behavior, or sign out. Wants to find the relevant card quickly without navigating sub-pages.

---

## Redesigned composition (wireframe-level)

The redesigned settings page is a **single-column stack of cards** inside `<main className="max-w-content">` (`--container-content`, `56rem`). The page shares the redesigned `<DashboardHeader>` (which renders the desktop top-nav and the `<MobileBottomNav>`) at the top of `<main>`. Each card represents one logical settings group; sub-rows inside each card use a label + description + control pattern with `border-t border-border pt-4` separators.

```
┌────────────────────────────────────────────────────────────────────┐
│ <main> max-w-content, no <AmbientBackground>                       │
│                                                                    │
│  <DashboardHeader current="settings">                              │
│    BrandMark + wordmark   [Dashboard|Settings*|Profile]  [Log out] │
│                                                                    │
│  ┌─ grid gap-8 (32px section gap) ────────────────────────────────┐│
│  │                                                                ││
│  │  HEADER ── <Reveal>                                            ││
│  │    eyebrow "Settings"                                          ││
│  │    H1      "Keep things predictable"                           ││
│  │    p       "Only controls that work today appear here.         ││
│  │             Account access and receipt intake stay             ││
│  │             intentionally sparse."                             ││
│  │                                                                ││
│  │  RECEIPT INTAKE CARD ── <Reveal delay=0.06>                    ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ <SectionHeading icon=Inbox> "Receipt intake"           │    ││
│  │  │   p "Forward order emails from your signed-in address, │    ││
│  │  │      then import them from the dashboard."             │    ││
│  │  │                                                        │    ││
│  │  │ <SettingRow label="Forwarding address" desc=…>         │    ││
│  │  │   <CopyForwardingAddress address={…} />                │    ││
│  │  │                                                        │    ││
│  │  │ <SettingRow label="Inbox import" desc=…>               │    ││
│  │  │   [Badge "Manual"]                                     │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  │                                                                ││
│  │  NOTIFICATIONS CARD ── <Reveal delay=0.12>                     ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ <SectionHeading icon=Bell> "Notifications"             │    ││
│  │  │   p "Deadline reminders stay sparse by design, so      │    ││
│  │  │      alerts remain useful."                            │    ││
│  │  │                                                        │    ││
│  │  │ <SettingRow label="Return deadline reminder" desc=…>   │    ││
│  │  │   [Badge "Active" success]                             │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  │                                                                ││
│  │  ACCOUNT CARD ── <Reveal delay=0.18>                           ││
│  │  ┌────────────────────────────────────────────────────────┐    ││
│  │  │ <SectionHeading icon=LockKeyhole> "Account"            │    ││
│  │  │   p "Your login email is managed by the auth system."  │    ││
│  │  │                                                        │    ││
│  │  │ <label>Email                                           │    ││
│  │  │   <Input value={user.email} readOnly aria-readonly>    │    ││
│  │  │ </label>                                               │    ││
│  │  │                                                        │    ││
│  │  │ <LogoutSection />                                      │    ││
│  │  └────────────────────────────────────────────────────────┘    ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│  <MobileBottomNav current="settings"> ── md:hidden, fixed bottom   │
└────────────────────────────────────────────────────────────────────┘
```

### Hero / main block prose

The settings page does not have a dashboard-style hero. Its primary block is the **page header** — a single `<Reveal>`-wrapped vertical stack containing an uppercase eyebrow ("Settings"), an H1 ("Keep things predictable"), and a one-paragraph lede that justifies the deliberate sparseness ("Only controls that work today appear here. Account access and receipt intake stay intentionally sparse."). Below the header, three cards stack with `gap-8` between them. Each card opens with a `<SectionHeading>` (icon at `size-5 text-accent` + H2 + description), followed by one or more `<SettingRow>` rows separated by `border-t border-border pt-4`.

The first card (**Receipt intake**) carries the most operationally important content: the `<CopyForwardingAddress>` strip, which lets the user copy their intake email in one click.

The second card (**Notifications**) confirms the single notification behavior that ships today (the daily deadline reminder).

The third card (**Account**) shows the read-only email and embeds the shared `<LogoutSection>` (without the optional border, since the parent card already supplies the border).

**No `<AmbientBackground>`.** Settings, like every authenticated app screen, renders on the bare canvas (Requirement 5.6, 13.10).

**Single-column only.** No multi-column grids inside settings (Requirement 4.5).

---

## Layout Structure

### Section Order
1. **`<DashboardHeader current="settings">`** — sticky chrome shared with `/dashboard` and `/profile`
2. **Page header** — eyebrow + H1 + lede
3. **Receipt intake card** — forwarding address + inbox import row
4. **Notifications card** — return deadline reminder row
5. **Account card** — read-only email + `<LogoutSection>`
6. **`<MobileBottomNav current="settings">`** — fixed bottom on `md:hidden`

### Spacing
- Root container: `mx-auto min-h-screen w-full max-w-content px-4 sm:px-6 md:px-8`
- Page content: `grid gap-8 py-8 md:py-10`
- Section gap (between cards): `gap-8` (32px)
- Card-internal gap: `gap-4` (16px)
- Label-to-input gap: `gap-2` (8px)
- Setting rows separated by `border-t border-border pt-4` with `first:border-t-0 first:pt-0`
- All values come from the spacing scale (Requirement 4.1, 4.6)

### Containers
- `<main>` is `max-w-content` (`--container-content`, `56rem`) per Requirement 4.4 / 9.6
- Each settings group is wrapped in its own `<Card>` with `id` anchors (`#receipt-intake`, `#notifications`, `#account`) for future deep-link support

### Responsive Adaptations
- **Mobile (< `sm`):** Single column; `px-4`; `<MobileBottomNav>` visible
- **Tablet (`sm` – `md`):** Same single-column layout with `px-6`
- **Desktop (`md` ≥ 768px):** `<DashboardHeader>` segmented top-nav visible; `<MobileBottomNav>` hidden; `py-10`
- **Ultrawide:** Content stays within `max-w-content`

---

## Visual Direction

### Aesthetic Tone
Organized, calm, professional. Settings should feel like a well-maintained control panel — every row labeled, nothing hidden. The dark canvas makes form fields and badges feel precise.

### Visual Density
Medium-low. Three cards, each carrying one to three rows. No accordions, no tabs, no advanced sections.

### Typography Emphasis
- **Eyebrow:** `text-xs uppercase tracking-wider text-text-muted`
- **H1:** `text-2xl font-semibold tracking-tight md:text-3xl`
- **Card H2:** `text-xl font-semibold tracking-tight` with leading icon (`size-5 text-accent`)
- **Card description:** `text-sm leading-6 text-text-secondary`
- **Setting row label:** `text-sm font-medium text-text-primary`
- **Setting row description:** `text-sm leading-6 text-text-secondary`
- **Read-only Email input:** inherits from `<Input>` primitive
- All numerals use `tabular-nums` (Requirement 3.6) — no numerals appear on this page today, but the tokens still apply

### Use of Whitespace
- `gap-8` between cards
- Card-internal `gap-4`
- Setting rows separated by 16px (`pt-4`) with a `border-t` rule
- The leading row in each card has `first:border-t-0 first:pt-0` to suppress the redundant separator under the section heading

### Visual Focus Points
1. **Section heading** — accent icon + H2, anchors each card
2. **Forwarding address** — inside `<CopyForwardingAddress>`, the most operationally important control
3. **Logout button** — only destructive action on the page, scoped inside the Account card

---

## Components

### Components Used
- `<DashboardHeader current="settings">` (`components/dashboard/dashboard-header.tsx`)
- `<MobileBottomNav current="settings">` (rendered inside the header)
- `<Card>` + `<CardContent>` (`components/ui/card.tsx`)
- `<Input readOnly aria-readonly>` (`components/ui/input.tsx`) — read-only email field
- `<Badge variant="success" | "default">` (`components/ui/badge.tsx`)
- `<CopyForwardingAddress>` (`components/receipts/copy-forwarding-address.tsx`)
- `<LogoutSection>` (`components/settings/logout-section.tsx`) — uses redesigned `<Button variant="danger">` and `<Loader size="sm" />` patterns (Requirement 8.1)
- `<Reveal>` (`components/motion/motion-primitives.tsx`) — single motion primitive, transform + opacity only
- Lucide icons: `Bell`, `Inbox`, `LockKeyhole` — `text-accent`, single `strokeWidth` per Requirement 7.2

### Customization
- Section headings use a leading icon + H2 inline via `flex items-center gap-2`
- The read-only Email `<Input>` is rendered with `readOnly aria-readonly` so screen readers and visually sighted users both get the signal
- `<LogoutSection>` is the only place a `danger`-variant button appears on the page

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ Sidebar navigation — settings is a flat, single-column stack
- ❌ Tabs / accordions inside the page
- ❌ Multi-column grid layouts
- ❌ "Advanced settings" section
- ❌ Settings search bar (premature for < 20 settings)
- ❌ Real-time auto-save — there are no editable fields today
- ❌ `<AmbientBackground>` on this route

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- Single column
- `px-4` page padding
- `<MobileBottomNav>` visible

### Tablet (`sm` – `md`, 640–768px)
- Same single-column layout
- `<MobileBottomNav>` still visible

### Desktop (`md` ≥ 768px)
- `<DashboardHeader>` segmented top-nav visible
- `<MobileBottomNav>` hidden
- `py-10` page padding

### Ultrawide
- Content stays within `max-w-content`

### Touch Ergonomics
- All interactive elements meet the 44×44 CSS-pixel minimum
- `<CopyForwardingAddress>` button sized for comfortable tap
- Logout button uses Button primitive at default size

---

## Motion

### Hover Effects
- Cards on the settings page are non-interactive (no `data-interactive="true"`) — they do not lift on hover
- `<Badge>` does not animate
- `<LogoutSection>` button uses the standard danger-variant hover

### Transitions
- All interactive elements use `--motion-default` or `--motion-quick` with `--ease-standard`
- Reduced-motion users see no transition

### Page Animations
- `<Reveal>` enters each card with a small translate + fade — single primitive, transform/opacity only (Requirement 6.5, 6.7)
- The cards are sibling sections (not a list) so they do not violate Requirement 6.3

### Loading Interactions
- `<LogoutSection>` button shows inline `<Loader size="sm" />` while pending
- No other async operations on this page

### Modal Behavior
None today. (When delete-account ships, it must be a `<Dialog>` with explicit type-to-confirm.)

### Scroll Interactions
None other than the sticky `<DashboardHeader>`.

---

## Premium UX Rules

### Reduce Cognitive Load
- Three cards, each carrying one logical group
- Descriptions appear directly below each section heading, never as tooltips
- Read-only fields are clearly distinct from editable ones (`readOnly aria-readonly`)
- No advanced mode, no "power user" hidden section

### Guide User Attention
- Section heading icons use the accent color — quick visual category cue
- Destructive action (logout) lives inside the Account card at the bottom

### Luxury SaaS Feel
- Settings feel curated, not auto-generated
- No "Coming soon" placeholders — only what ships today appears
- Clean typography with helpful microcopy in card descriptions

### Visual Calmness
- No real-time validation
- No "Changes unsaved" warnings
- No settings counters
- No import/export complexity

### Polished Interactions
- `<CopyForwardingAddress>` shows a checkmark + "Copied!" for ~2 seconds
- Logout pushes the user to `/login` after a brief `<PageLoader>` overlay (handled by `<DashboardHeader>`)

---

## Anti-Patterns

### DO NOT:
- ❌ Create deeply nested settings categories
- ❌ Add a "Reset to defaults" button without confirmation
- ❌ Use real-time auto-save
- ❌ Show "Changes unsaved" dialogs on navigation
- ❌ Include settings search
- ❌ Add an "Advanced" or "Developer" settings section
- ❌ Use accordions within settings sections
- ❌ Show settings that aren't implemented yet
- ❌ Add export / import settings
- ❌ Include usage statistics in settings
- ❌ Use a wizard or multi-step form
- ❌ Show raw API error messages
- ❌ Reintroduce `<AmbientBackground>` on this route
- ❌ Use a sidebar layout

---

## Inspiration References

- **Linear** — Clean settings panels, minimal categories, clear labels
- **Apple** — System Settings: clear grouping, helpful descriptions, no clutter
- **Stripe** — Dashboard settings: organized, professional, trustworthy
- **Notion** — Settings modal: compact, focused, no unnecessary options
- **Vercel** — Project settings: well-organized, clear hierarchy, dark theme
