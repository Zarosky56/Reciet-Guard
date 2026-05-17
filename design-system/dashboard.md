# Dashboard Page Design Specification

## Purpose
The dashboard (`/dashboard`) is the core application experience. It is where users manage their receipt deadlines, extract data from emails, and monitor their return windows. This page must balance information density with calmness — users need to see their deadlines clearly without feeling overwhelmed. It is the "calm deadline dashboard" promised on the landing page.

**User mindset:** Task-oriented. Wants to quickly see: what's expiring soon, how much money is at risk, and what actions are needed. May be checking daily or weekly. Needs the dashboard to be scannable in under 10 seconds.

---

## Layout Structure

### Section Order
1. **Dashboard header** — logo, user email, logout button, separated by bottom border
2. **Stats + overview row** — two-column layout: main overview card + stat cards grid
3. **Input section** — two-column: email extraction (left) + manual receipt editor (right)
4. **Receipt list** — search bar + responsive card grid of receipts
5. **Empty state** — shown when no receipts exist, replaces receipt list

### Spacing
- Root container: `mx-auto min-h-screen w-full max-w-6xl px-6 md:px-8`
- Header: `py-5` with `border-b border-border`
- Section gap: `gap-6` between major sections
- Stats grid: `gap-3` between stat cards
- Receipt grid: `gap-4` between receipt cards
- Overall vertical rhythm: `py-8` on the main grid container

### Grids
- **Stats row:** `lg:grid-cols-[1fr_22rem]` — overview card takes remaining space, stats sidebar at 352px
- **Stats sub-grid:** `grid-cols-2` — 2x2 grid of stat cards
- **Input row:** `lg:grid-cols-2` — email extraction + receipt editor side by side
- **Receipt grid:** `sm:grid-cols-2 lg:grid-cols-3` — responsive card grid

### Containers
- Root: `max-w-6xl` with `mx-auto`
- Cards: individual `Card` components with `CardContent`
- No nested layout containers beyond cards

### Responsive Adaptations
- **Mobile (<640px):** Single column throughout, stats grid stays 2x2, receipt cards single column
- **Tablet (640-1024px):** Receipt cards at 2 columns, stats row stacks, input row stacks
- **Desktop (1024px+):** Full multi-column layout, 3-column receipt grid
- **Ultrawide:** Content constrained to `max-w-6xl`

---

## Visual Direction

### Aesthetic Tone
Calm, organized, data-focused. The dashboard should feel like a well-organized desk — everything has its place, nothing is shouting for attention. The dark background creates a "command center" feel without being aggressive.

### Visual Density
Medium. The dashboard contains multiple data points (stats, receipts, forms) but each is contained within its own card. Density is managed through card-based compartmentalization — each card is a self-contained unit of information.

### Typography Emphasis
- **Page title:** `text-2xl font-semibold` — "Your return dashboard"
- **Section headers:** `text-xl font-semibold` (Receipts), `text-base font-medium` (form sections)
- **Stat values:** `font-mono text-xl font-semibold` — JetBrains Mono for numbers, conveys precision
- **Stat labels:** `text-xs uppercase text-text-muted` — subordinate, scannable
- **Receipt item names:** `text-base font-medium` — primary identifier
- **Body text:** `text-sm leading-6 text-text-secondary` — descriptions and metadata

### Use of Whitespace
- Cards are separated by consistent `gap-4` or `gap-6`
- Internal card padding varies: `p-5` for content-rich cards, `p-4` for stat cards
- The header's `border-b` creates a clear separation between chrome and content
- Empty state has `py-14` vertical padding — generous, calm, not punishing

### Visual Focus Points
1. **Stats row** — top of page, immediate situational awareness
2. **Urgency badges** — color-coded (green/yellow/red), the only saturated colors on the page
3. **Action buttons** — blue primary buttons for key actions
4. **Search bar** — positioned above receipt list, with search icon

---

## Components

### shadcn/ui Components Used
- **Card** — primary container for all content sections
- **Button** — multiple variants: `default`, `secondary`, `ghost`, `danger`, sizes: `default`, `sm`
- **Input** — search field, form fields
- **Textarea** — email extraction input
- **Badge** — urgency indicators
- **Dialog** — (available for future use: receipt detail, delete confirmation)

### Custom Components
- **DashboardHeader** — logo icon in bordered box, app name, user email, logout form
- **ReceiptDashboard** — orchestrates all dashboard sections
- **ReceiptCard** — individual receipt with urgency badge, metadata, action buttons
- **UrgencyBadge** — color-coded pill with icon + days remaining
- **ReceiptEmptyState** — dashed-border card with icon, message, forwarding address
- **CopyForwardingAddress** — inline copyable address with copy button
- **StatCard** — compact card with label + monospace value

### Customization
- **UrgencyBadge** uses semantic color tokens: `text-success` (green), `text-warning` (amber), `text-danger` (red)
- Red urgency badge has `animate-pulse-red` — the only animation on the page, reserved for critical deadlines
- Empty state card uses `border-dashed` — visually distinct from populated cards
- Stat cards use `font-mono` for values — JetBrains Mono, reinforces data precision
- Receipt cards have `pr-24` to accommodate the absolute-positioned urgency badge

### Minimal vs Dense
The dashboard uses **contextual density**:
- Stats section: dense (4 compact cards in 2x2 grid)
- Input section: medium (2 side-by-side forms)
- Receipt list: variable (dense when many receipts, sparse when few)
- Empty state: minimal (single centered message)

---

## Responsiveness

### Mobile (<640px)
- All sections stack to single column
- Stats grid remains 2x2 — compact enough for mobile
- Receipt cards single column
- Search bar full-width
- Header stacks vertically (logo + email above, logout below)
- Form fields in receipt editor go single column
- `px-6` horizontal padding

### Tablet (640-1024px)
- Receipt cards at 2 columns (`sm:grid-cols-2`)
- Stats row and input row still stacked
- Header goes horizontal (`md:flex-row`)
- Search bar constrained to `md:max-w-sm`

### Desktop (1024px+)
- Full multi-column layout
- Stats row: overview + sidebar
- Input row: side-by-side forms
- Receipt grid: 3 columns
- `max-w-6xl` constraint

### Ultrawide
- Content centered within `max-w-6xl`
- Background remains solid `--color-bg`

### Touch Ergonomics
- Receipt card action buttons use `size="sm"` (`h-8`) — adequate for touch with spacing
- Form inputs at `h-10` — standard touch target
- Status toggle buttons are individual tappable targets
- Copy button is `size="sm"` with clear active state
- `gap-2` between action buttons prevents mis-taps

---

## Motion

### Hover Effects
- **Cards:** `hover:-translate-y-0.5 hover:border-border-focus` — subtle lift
- **Buttons:** variant-specific hover states
- **Status toggle buttons:** active state indicated by `variant="default"` (filled) vs `variant="ghost"` (transparent)

### Transitions
- Card hover: `duration-200`
- Button interactions: `duration-150`
- Input focus: `transition` on border color
- Status changes: instant re-render with toast confirmation

### Page Animations
- **Urgency badge pulse:** `animate-pulse-red` on red (expiring) badges — reserved for critical attention
- No page-level enter/exit animations
- Scroll-to-top on edit: `window.scrollTo({ top: 0, behavior: "smooth" })` — smooth, not jarring

### Loading Interactions
- **Check Inbox Now:** Button shows `Loader2` spinner with `animate-spin` during Gmail check
- **Extract fields:** Button shows spinner during AI extraction
- **Save receipt:** Button shows spinner during save operation
- All async operations use `useTransition` — React handles pending state
- Toast confirms completion of all operations

### Modal Behavior
- Dialog component available for future: delete confirmation, receipt details
- Currently: inline editing (form pre-fills, scrolls to top) instead of modals
- Backdrop: `bg-black/60` with click-outside-to-close

### Scroll Interactions
- Smooth scroll to top when editing a receipt
- No sticky elements
- No infinite scroll — all receipts loaded upfront
- No scroll-jacking

---

## Premium UX Rules

### Reduce Cognitive Load
- **Stats at the top** — immediate situational awareness without scrolling
- **Color-coded urgency** — green/yellow/red system is universally understood
- **Search filters in real-time** — no submit button, instant feedback
- **Status toggles are visible** — all 4 statuses shown as buttons, current state highlighted
- **Forwarding address is copyable** — one click, no manual selection
- **AI pre-fills the form** — reduces manual data entry

### Guide User Attention
- Top-to-bottom flow: stats → input → receipts
- Urgency badges use color to draw eye to expiring items
- Red pulse animation reserved for critical deadlines — cannot be ignored
- Primary actions use filled blue buttons, secondary use bordered/ghost
- Empty state guides to next action: copy forwarding address

### Luxury SaaS Feel
- Monospace font for numbers — feels precise, technical, trustworthy
- Consistent card-based layout — everything has a home
- Dark theme with subtle borders — information floats on the surface
- No decorative elements — every pixel serves the data
- The forwarding address display feels like a developer tool — technical credibility

### Visual Calmness
- Cards compartmentalize information — no visual bleed between sections
- Consistent spacing rhythm (`gap-4`, `gap-6`)
- Only one animated element (red pulse) — restraint makes it meaningful
- No auto-refreshing data — user controls when to check for new receipts
- Toast notifications are non-blocking, auto-dismiss

### Polished Interactions
- Copy button shows checkmark + "Copied!" for 2 seconds — clear feedback
- Status changes are instant with toast confirmation
- Edit scrolls smoothly to form — spatial continuity
- Delete is immediate with toast — no confirmation dialog (undo-able via re-add)
- Search is instant — no loading state, no debounce delay visible

---

## Anti-Patterns

### DO NOT:
- ❌ Add a sidebar navigation (not needed for single-page dashboard)
- ❌ Use data tables instead of cards for receipts
- ❌ Add charts or graphs (premature — stats are simple counts)
- ❌ Auto-refresh or poll for new receipts
- ❌ Add a "quick add" FAB (floating action button)
- ❌ Use infinite scroll or pagination for receipts
- ❌ Add filtering beyond search (status filter tabs would add complexity)
- ❌ Show receipt count badges on status buttons
- ❌ Add a "bulk actions" toolbar
- ❌ Use drag-and-drop for receipt ordering
- ❌ Add keyboard shortcuts overlay
- ❌ Show "last updated" timestamp (data is fresh on load)
- ❌ Add a "Welcome back, [name]" greeting (email is sufficient)
- ❌ Use different card styles for different receipt statuses
- ❌ Add a "Mark all as read" or batch operation
- ❌ Include a "Export to CSV" button (premature)
- ❌ Show a loading skeleton for the entire page
- ❌ Add notification badges on the header

---

## Inspiration References

- **Linear** — Clean list views, minimal chrome, keyboard-first design
- **Stripe** — Data-dense dashboards that feel calm, not cluttered
- **Apple** — Card-based layouts, clear hierarchy, restrained color
- **Notion** — Flexible data views, clean typography, minimal decoration
- **Raycast** — Command palette efficiency, dark theme, quick actions
- **Arc Browser** — Minimal chrome, content-first design, dark theme
