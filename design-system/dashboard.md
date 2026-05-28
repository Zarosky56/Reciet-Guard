# Dashboard Page Design Specification

> Premium UI Redesign — task 8.3 (`app/(dashboard)/dashboard/page.tsx`, `components/receipts/receipt-dashboard.tsx`).
> Validates Requirements 9.1, 9.4, 9.5, 6.3, 13.13.

## Purpose
The dashboard (`/dashboard`) is the core application experience. It is where users manage their receipt deadlines, extract data from emails, and monitor their return windows. This page must balance information density with calmness — users need to see their deadlines clearly without feeling overwhelmed. It is the "calm deadline dashboard" promised on the landing page.

**User mindset:** Task-oriented. Wants to quickly see: what's expiring soon, how much money is at risk, and what actions are needed. May be checking daily or weekly. Needs the dashboard to be scannable in under 10 seconds.

---

## Redesigned composition (wireframe-level)

The redesigned dashboard collapses the previous two-column hero (overview card + stats sidebar + dual input row) into a **single hero card** that carries the title, the money-at-risk summary, the intake address, and the primary actions. Below the hero sits an optional collapsible AI extraction panel, then the search/filter row, then the receipt grid (or empty state). All content lives inside `<main className="max-w-wide">` (Requirement 4.4).

```
┌────────────────────────────────────────────────────────────────────┐
│ <main> max-w-wide, no <AmbientBackground>                          │
│                                                                    │
│  ┌─ <DashboardHeader> sticky, opaque bg-canvas-raised, border-b ─┐│
│  │ BrandMark + "Receipt Guardian"  [Dashboard|Settings|Profile] [Log out]
│  └─────────────────────────────────────────────────────────────── ┘│
│                                                                    │
│  HERO CARD ── single <Card>, no aurora, no grid, no mask-fade      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ ┌── lg flex-row layout ─────────────────────────────────────┐│  │
│  │ │  H1  "Your return dashboard"                              ││  │
│  │ │  ┌── flex-baseline gap-x-3 gap-y-2 ─────────────────────┐ ││  │
│  │ │  │  font-mono $XXXX  ── money-at-risk (text-3xl/4xl)    │ ││  │
│  │ │  │  [Badge "X due soon" warning] | [Badge "All calm"]   │ ││  │
│  │ │  └──────────────────────────────────────────────────────┘ ││  │
│  │ │  p  "X active · Y total"                                  ││  │
│  │ │                                                           ││  │
│  │ │                  ┌── action row (right at lg) ──────────┐ ││  │
│  │ │                  │ [Check inbox] [Add] [Paste email]    │ ││  │
│  │ │                  └────────────────────────────────────── ┘ ││  │
│  │ └─────────────────────────────────────────────────────────── ┘│  │
│  │ ─────────────────── border-t ────────────────────────────────│  │
│  │ <CopyForwardingAddress address={…} />                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  AI EXTRACTION PANEL ── collapsible, opens via "Paste email"       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ <Sparkles> "Paste an order email"                       [✕]  │  │
│  │ <Textarea min-h-32 />                                         │  │
│  │           ┌───────────── flex justify-between ─────────┐      │  │
│  │           │ <Loader label="Reading receipt text" /> ── │      │  │
│  │           │ ─────────────────────── [Extract → loader] │      │  │
│  │           └────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  SEARCH ROW                                                        │
│  ┌─ relative input with leading <Search> + trailing kbd "/" ────┐  │
│  │  "Search receipts"                                       [/] │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  SEGMENTED FILTER CHIPS  (role="group" aria-label="Filter receipts")
│  [All]  [Active]  [Due soon]  [Expired]  [Closed]                  │
│   ↑ active uses bg-accent-tint text-text-primary (no glow)         │
│                                                                    │
│  RECEIPT GRID  ── grid sm:grid-cols-2 lg:grid-cols-3 gap-4         │
│  ┌─ <ReceiptCard> ─┐ ┌─ <ReceiptCard> ─┐ ┌─ <ReceiptCard> ─┐       │
│  │ store / item    │ │                 │ │                 │       │
│  │ <UrgencyBadge>  │ │                 │ │                 │       │
│  │ status toggles  │ │                 │ │                 │       │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘       │
│                                                                    │
│  (or <ReceiptEmptyState> when no receipts exist)                   │
│                                                                    │
│  EDITOR SHEET  ── overlay <Reveal>, scrim bg-canvas/70 + ≤8px blur │
│                                                                    │
│  <MobileBottomNav> ── fixed bottom-0, only md:hidden               │
└────────────────────────────────────────────────────────────────────┘
```

### Hero block prose

The redesigned hero is a single `<Card>` (no aurora overlay, no grid mesh, no `mask-fade-bottom`) containing four pieces of information stacked into a flexible row:

1. **H1 "Your return dashboard"** at the title-md step (`text-2xl font-semibold tracking-tight`)
2. **Money-at-risk** rendered as a large `font-mono` numeral with `tabular-nums` (`text-3xl sm:text-4xl`), accompanied by a single `<Badge>` indicating either "X due soon" (warning variant) or "All calm" (success variant) — never both
3. **Active / total caption** beneath the money line ("X active · Y total")
4. **Action row** with three buttons — primary "Check inbox" (with `<Inbox>` icon, swaps to `<Loader size="sm" />` while pending), secondary "Add" (with `<Plus>`), secondary "Paste email" (with `<Sparkles>`, toggles the AI extraction panel)

A `border-t border-border` separator runs across the card, beneath which `<CopyForwardingAddress>` renders the user's intake email with an inline copy affordance.

The hero deliberately uses **one** decorative element (the accent-tinted icons in the action buttons) — never aurora, never grid, never mask-fade (Requirements 9.4, 13.5, 13.13).

### AI extraction panel

Opens via the "Paste email" button in the hero. Renders a single `<Card id="ai-extract-panel">` with `aria-expanded` state on the trigger button. Contains a heading row (`<Sparkles>` + "Paste an order email" + close `[✕]`), a `<Textarea>` with `min-h-32`, and a footer row containing the inline pending indicator (`<Loader label="Reading receipt text" />`) on the left and the "Extract" button (with `<MailSearch>` icon, swaps to `<Loader size="sm" />` while pending) on the right.

### Search row

A relative-positioned `<Input>` with a leading `<Search>` icon (absolute, `left-3`, `text-text-muted`) and a trailing `<kbd>` showing the `/` shortcut (hidden on mobile). The input listens for the global `/` shortcut (registered on `window` via `useEffect`) and focuses itself when the user is not already in an editable field. Below `sm`, a `text-text-muted` paragraph reports the visible count ("X shown").

### Segmented filter chips

A `role="group"` row of `<Button variant="ghost" size="sm">` items. The currently-active filter renders with `data-active="true"` and the className override `bg-accent-tint text-text-primary` (Requirements 6.4, 8.7 — no glow shadow, no scale change). `aria-pressed` mirrors the active state for assistive tech.

### Receipt grid

`<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">` of `<ReceiptCard>` items. Each card uses `data-interactive="true"` so hover applies the standard card-lift transform (`-translate-y-0.5`, `border-border-strong`). Status changes optimistically update the list and surface a toast.

### Editor sheet

An overlay sheet with a `bg-canvas/70` scrim and ≤ 8px backdrop blur (Requirement 5.4 — the modal scrim is the only place blur is allowed, alongside the global Toaster). The sheet uses `<Reveal>` for open/close, transform/opacity-only. A two-column form (`grid sm:grid-cols-2`) collects store, item, price, currency, dates, and status. Submitting calls the receipts API and pushes the result back into the list.

---

## Layout Structure

### Section Order
1. **`<DashboardHeader>` (sticky)** — opaque `bg-canvas-raised`, no `backdrop-blur-xl`, BrandMark + wordmark, segmented top-nav (`md:flex`), Log out button, mobile bottom nav rendered alongside
2. **Hero card** — title + money-at-risk + active/total + action row + border-t + CopyForwardingAddress
3. **AI extraction panel (collapsible)** — opens via the "Paste email" action
4. **Search row** — `<Input>` + visible-count caption (mobile)
5. **Segmented filter chips** — `[All] [Active] [Due soon] [Expired] [Closed]`
6. **Receipt grid** — responsive 1 / 2 / 3 columns; replaced by `<ReceiptEmptyState>` when no receipts exist; replaced by an empty-state card with reset-filters action when search yields no matches
7. **Editor sheet (overlay)** — opens for create / edit; closes on overlay click, Escape, or "Cancel"
8. **`<MobileBottomNav>`** — fixed bottom on `md:hidden` viewports

### Spacing
- Root container: `mx-auto min-h-screen w-full max-w-wide px-4 sm:px-6 md:px-8`
- Top-level grid: `grid gap-6 pb-24 pt-6 md:gap-8 md:pb-10 md:pt-8`
- Hero card content: `grid gap-5 p-5 md:p-7`
- Action button gaps: `gap-2`
- Receipt grid: `gap-4`
- Filter chip row: `gap-2`
- Mobile bottom padding (`pb-24`) reserves room for `<MobileBottomNav>`

### Containers
- `<main>` is `max-w-wide` (`--container-wide`, `72rem`) per Requirement 4.4 / 9.5
- All cards are individual `<Card>` instances — no nested layout containers beyond cards

### Responsive Adaptations
- **Mobile (< `sm`):** All sections stack to single column; receipt grid is single column; action row wraps within the hero card; mobile bottom nav appears
- **Tablet (`sm` – `lg`, 640–1024px):** Receipt grid expands to 2 columns; segmented top nav still hidden until `md`
- **Desktop (`lg`, 1024px+):** Receipt grid expands to 3 columns; hero card switches to `flex-row` (title block left, action row right); `<DashboardHeader>` shows segmented top nav
- **Ultrawide:** Content stays within `max-w-wide`

---

## Visual Direction

### Aesthetic Tone
Calm, organized, data-focused. Each surface is a single `<Card>` with `bg-surface border border-border` — no aurora overlays, no grid meshes, no glow shadows. The accent color appears only on the primary CTA, on icons inside primary buttons, and as the `bg-accent-tint` fill of the active filter chip and active top-nav item.

### Visual Density
Medium. The dashboard contains multiple data points but each lives in its own card. Density is managed through card-based compartmentalization.

### Typography Emphasis
- **Page H1:** `text-2xl font-semibold tracking-tight text-text-primary`
- **Money-at-risk:** `font-mono text-3xl sm:text-4xl font-semibold leading-none tracking-tight tabular-nums`
- **Hero caption:** `text-sm text-text-secondary`
- **Section headers (AI panel, etc.):** `text-base font-semibold tracking-tight`
- **Filter chip labels:** Button primitive at size `sm`
- **Receipt card item names:** `<ReceiptCard>` carries its own typography
- **Body text:** `text-sm leading-6 text-text-secondary`
- All numerals use `tabular-nums` (Requirement 3.6)

### Use of Whitespace
- Top-level sections separated by `gap-6` (mobile) / `gap-8` (desktop) — both on the spacing scale
- Hero card internal `gap-5` between title block, separator, and forwarding address
- The border-t inside the hero card creates a quiet separator without adding a shadow

### Visual Focus Points
1. **Money-at-risk numeral** — largest typographic element, anchors the scan
2. **Urgency badge** — semantic color (success/warning/danger) provides immediate signal
3. **Primary action button** — accent-filled "Check inbox"
4. **Active filter chip** — `bg-accent-tint` background, the only chip that's filled

---

## Components

### Components Used
- `<DashboardHeader>` (`components/dashboard/dashboard-header.tsx`)
- `<MobileBottomNav>` (`components/dashboard/mobile-bottom-nav.tsx`) — rendered inside the header
- `<Card>` + `<CardContent>` (`components/ui/card.tsx`)
- `<Button variant="primary" | "secondary" | "ghost" size="sm" | "default" | "icon">`
- `<Input>` and `<Textarea>` (`components/ui/input.tsx`)
- `<Badge variant="success" | "warning" | "default">` (`components/ui/badge.tsx`)
- `<Loader size="sm" | "md">` (`components/ui/loaders.tsx`) — single coherent loading vocabulary (Requirement 8.6)
- `<ReceiptCard>`, `<UrgencyBadge>`, `<ReceiptEmptyState>`, `<CopyForwardingAddress>` (`components/receipts/*`)
- `<Reveal>` (`components/motion/motion-primitives.tsx`) — used inside the editor sheet; transform/opacity only
- Lucide icons: `AlertTriangle`, `CheckCircle2`, `Inbox`, `MailSearch`, `Plus`, `Search`, `Sparkles`, `X`. All rendered at the documented stroke width (Requirement 7.2)

### Customization
- The hero card uses `<CardContent className="p-5 md:p-7">` for slightly more breathing room than the default `p-5`
- The active filter chip uses `bg-accent-tint text-text-primary` (no glow, no scale change)
- `aria-pressed` mirrors filter active state
- `aria-expanded` and `aria-controls` are wired between the "Paste email" toggle and the AI extraction panel
- The editor sheet uses `role="dialog" aria-modal="true" aria-labelledby="receipt-editor-title"`

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ `bg-aurora-action` overlay on the hero card
- ❌ `bg-grid-faint` mesh on the hero card
- ❌ `mask-fade-bottom` mask on the hero card
- ❌ `border-conic-soft` halo around any icon mark
- ❌ `shadow-glow-action` glow on hover or active state
- ❌ `<ScanGlyph>`, `<ProcessRail>`, `<ProcessSteps>`, `<ActionLoader>`, `<CardActionLoader>`
- ❌ Stagger entrance on the receipt grid
- ❌ More than one indeterminate loop visible at a time (`<RouteProgress>` is the only allowed indeterminate loop)

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- All sections stack to single column
- Hero card: title block stacks above action row
- Receipt grid: single column
- Mobile bottom nav appears (fixed); reserve `pb-24` on the dashboard grid
- Search input full width with leading icon; trailing `/` kbd hidden
- `<DashboardHeader>` segmented top-nav hidden; user email hidden; only the BrandMark + wordmark visible

### Tablet (`sm` – `lg`, 640–1024px)
- Receipt grid: 2 columns
- Hero card still stacks vertically
- Mobile bottom nav still visible (until `md`)

### Desktop (`md` ≥ 768px and `lg` ≥ 1024px)
- `<DashboardHeader>` segmented top-nav visible (`md:flex`)
- `<MobileBottomNav>` hidden (`md:hidden`)
- Hero card switches to `flex-row` (title block left, action row right) at `lg`
- Receipt grid: 3 columns at `lg`

### Ultrawide
- Content stays within `max-w-wide`
- Header chrome stretches with the canvas; inner content stays at `max-w-wide`

### Touch Ergonomics
- All interactive elements meet the 44×44 CSS-pixel minimum (Requirement 11.6)
- `<MobileBottomNav>` items render at `min-h-12 min-w-12` inside an `h-16` bar
- Receipt-card status toggles spaced with `gap-2` to prevent mis-taps
- Editor sheet trigger area scoped via `onMouseDown={onClose}` on the scrim and `stopPropagation` on the panel — taps on the panel do not dismiss

---

## Motion

### Hover Effects
- **Cards (`data-interactive="true"`):** `-translate-y-0.5` and `border-border-strong` swap, transform-only, `--motion-default` duration
- **Buttons:** variant-specific hover (no glow)
- **Filter chips:** background swap from transparent → `bg-surface-hover` on inactive items
- **Top-nav items:** color shift from `text-text-secondary` → `text-text-primary` on inactive items

### Transitions
- All interactive elements use `--motion-default` or `--motion-quick` durations with `--ease-standard`
- Reduced-motion users see no transform changes
- Editor sheet: `<Reveal>` handles enter/exit (transform + opacity only)

### Page Animations
- **`<UrgencyBadge>` red `attention` pulse:** fires only when a receipt is past its return deadline (`days_remaining < 0`) — the single allowed attention signal per screen (Requirement 6.4, 6.8)
- **`<RouteProgress>`:** the single allowed indeterminate loop, fires only during route transitions
- No page-level enter animation (Requirement 6.2)
- No stagger on the receipt grid (Requirement 6.3)

### Loading Interactions
- "Check inbox" button: text shifts to "Scanning", icon swaps to `<Loader size="sm" />`
- AI extract: button text shifts to "Extracting", icon swaps to `<Loader size="sm" />`, plus an inline `<Loader label="Reading receipt text" />` in the AI panel footer
- Save / update: editor sheet shows inline `<Loader size="sm" />` adjacent to the submit button label
- Status changes: `pendingAction.type === "status"` is passed to `<ReceiptCard>` so it shows its own inline loader
- Toast (`sonner`) confirms or surfaces errors after every async operation

### Modal Behavior
- Editor sheet: scrim `bg-black/60` with ≤8px backdrop blur, sheet `<Reveal>` opacity + small translate
- Click outside or Escape closes the sheet
- The sheet is the only blur surface besides the Toaster (Requirement 5.4)

### Scroll Interactions
- Smooth scroll on edit (the editor opens as an overlay so the underlying scroll position is preserved)
- No sticky elements other than the `<DashboardHeader>`
- No infinite scroll — all receipts loaded on the server and re-fetched on inbox check

---

## Premium UX Rules

### Reduce Cognitive Load
- Hero gives immediate situational awareness: money-at-risk + status badge + active/total
- Color-coded urgency on receipts (success/warning/danger) — text and icon always accompany color (Requirement 11.7)
- Search is real-time
- Status toggles inside `<ReceiptCard>` are visible — current status highlighted via the active treatment
- Forwarding address is one click to copy
- The AI panel pre-fills the editor sheet on success — no manual data entry required

### Guide User Attention
- Top-to-bottom flow: hero → AI (when expanded) → search → filter chips → receipt grid
- Money-at-risk anchors the scan
- The `<UrgencyBadge>` red pulse fires only on expired receipts — meaningful, not decorative
- Primary actions are accent-filled; secondary actions are bordered

### Luxury SaaS Feel
- `font-mono` for numerals — feels precise, technical, trustworthy
- Single accent color used sparingly — primary CTA, active filter chip, active top-nav item, key icons
- No decorative element on the dashboard hero (Requirement 9.4 — single documented surface treatment)
- The `<CopyForwardingAddress>` strip feels like a developer tool — technical credibility

### Visual Calmness
- Cards compartmentalize information
- Consistent spacing rhythm (`gap-4`, `gap-5`, `gap-6`, `gap-8`)
- Single attention-loop animation (`<UrgencyBadge>` red pulse on expired)
- Single indeterminate loop (`<RouteProgress>`)
- No auto-refreshing data — user controls inbox checks

### Polished Interactions
- Copy button shows a checkmark + "Copied!" for ~2 seconds
- Status changes are optimistic with toast confirmation
- Editor sheet enters with a small translate + fade; closes on overlay click, Escape, or "Cancel"
- Search updates instantly with no visible debounce

---

## Anti-Patterns

### DO NOT:
- ❌ Add a sidebar navigation
- ❌ Replace receipt cards with a data table
- ❌ Add charts or graphs (premature)
- ❌ Auto-refresh or poll for new receipts
- ❌ Add a floating action button
- ❌ Use infinite scroll or pagination
- ❌ Reintroduce `bg-aurora-action`, `bg-grid-faint`, `mask-fade-bottom` on the hero card
- ❌ Reintroduce `<ScanGlyph>`, `<ProcessRail>`, `<ProcessSteps>`, `<ActionLoader>`
- ❌ Reintroduce `shadow-glow-action`, `shadow-card-sm`, `shadow-card-lift`
- ❌ Use stagger entrance on the receipt grid
- ❌ Add a "bulk actions" toolbar
- ❌ Use drag-and-drop for receipt ordering
- ❌ Add a "Welcome back, [name]" greeting
- ❌ Show a loading skeleton for the entire page
- ❌ Add notification badges in the header
- ❌ Show "last updated" timestamps

---

## Inspiration References

- **Linear** — Clean list views, minimal chrome, keyboard-first design
- **Stripe** — Data-dense dashboards that feel calm, not cluttered
- **Apple** — Card-based layouts, clear hierarchy, restrained color
- **Notion** — Flexible data views, clean typography, minimal decoration
- **Raycast** — Command palette efficiency, dark theme, quick actions
- **Arc Browser** — Minimal chrome, content-first design, dark theme
