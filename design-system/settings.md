# Settings Page Design Specification

## Purpose
The settings page (planned: `/settings`) is where users configure their account preferences, notification settings, and integration connections. It must feel organized, trustworthy, and efficient — users come here to make changes and leave quickly. Settings should never feel overwhelming or expose unnecessary complexity.

**User mindset:** Task-focused. Came to change one specific thing (e.g., notification preferences, connected email). Wants to find the setting quickly, make the change, and return to the dashboard. Impatient with overly nested or categorized settings.

---

## Layout Structure

### Section Order
1. **Page header** — title "Settings" + brief description
2. **Settings navigation** — vertical tabs or grouped sections
3. **Settings content area** — the active section's form fields

### Recommended Sections
1. **General** — display name, default currency, timezone
2. **Notifications** — email notification preferences, reminder timing
3. **Forwarding** — forwarding email address display, Gmail connection status
4. **Account** — email address (read-only), change password, delete account
5. **API / Integrations** — (future) API keys, webhook URLs

### Spacing
- Root container: `max-w-4xl mx-auto px-6 py-8 md:px-8`
- Two-column layout: sidebar (240px) + content (remaining)
- Section gap: `gap-8` between sidebar and content
- Form field gap: `gap-4` within settings forms
- Section header gap: `mb-6` between section title and fields

### Grids
- **Desktop:** `grid-cols-[240px_1fr]` — fixed sidebar, fluid content
- **Mobile:** Single column, sidebar becomes horizontal scroll or accordion

### Containers
- Root: `max-w-4xl` — narrower than dashboard, appropriate for forms
- Content area: Card with `CardContent`
- Individual setting groups: separated by subtle dividers or spacing

### Responsive Adaptations
- **Mobile (<768px):** Single column, settings nav becomes horizontal tabs or stacked accordion
- **Tablet (768-1024px):** Two-column layout, sidebar at 200-220px
- **Desktop (1024px+):** Full two-column, sidebar at 240px
- **Ultrawide:** Content centered within `max-w-4xl`

---

## Visual Direction

### Aesthetic Tone
Organized, calm, professional. Settings should feel like a well-maintained control panel — everything labeled clearly, nothing hidden, no surprises. The dark theme should make form fields feel precise and technical.

### Visual Density
Medium-low. Settings are grouped logically but each group has breathing room. No wall of toggles — settings are spaced to prevent accidental changes.

### Typography Emphasis
- **Page title:** `text-2xl font-semibold` — clear purpose
- **Section titles:** `text-lg font-medium` — scannable categories
- **Setting labels:** `text-sm font-medium` — clear identification
- **Setting descriptions:** `text-xs text-text-secondary` — helpful context below labels
- **Sidebar items:** `text-sm` — active item in `text-action`

### Use of Whitespace
- Sidebar separated from content by `gap-8` or subtle border
- Setting groups separated by `pb-6 mb-6 border-b border-border` (last group no border)
- Individual settings have `gap-2` between label and input
- Save buttons positioned at bottom of each section or globally

### Visual Focus Points
1. **Active settings section** — highlighted in sidebar
2. **Form fields** — the interactive elements
3. **Save button** — positioned consistently (bottom-right of section or top-right of page)

---

## Components

### shadcn/ui Components to Use
- **Card** — container for settings sections
- **Button** — `variant="default"` for save, `variant="secondary"` for cancel, `variant="danger"` for destructive actions
- **Input** — text fields, email display
- **Select** (native or Radix) — dropdowns for currency, timezone
- **Switch/Toggle** (Radix) — boolean settings
- **Dialog** — delete account confirmation
- **Separator** — between setting groups

### Customization
- Sidebar items: no background on default, subtle `bg-surface` or left border on active
- Destructive actions grouped at bottom with clear visual separation
- Read-only fields use `bg-bg` with muted border — clearly non-editable
- Save button should show loading state during save
- Success toast on save, error toast on failure

### Minimal vs Dense
Settings use **medium density** — organized but not cramped. Each setting gets its own row with label, optional description, and input. No inline editing — explicit save actions prevent accidental changes.

---

## Responsiveness

### Mobile (<768px)
- Single column
- Settings nav: horizontal scrollable tabs or stacked accordion sections
- Form fields full-width
- Save button full-width at bottom
- `px-6` padding

### Tablet (768-1024px)
- Two-column layout
- Sidebar at 200-220px
- Content area with comfortable form width

### Desktop (1024px+)
- Full two-column, sidebar at 240px
- `max-w-4xl` constraint

### Ultrawide
- Content centered, background solid

### Touch Ergonomics
- Toggle switches need adequate touch area (min 44px)
- Form inputs at `h-10` or `h-11`
- Sidebar items need sufficient tap area (min 44px height)
- Destructive actions clearly separated to prevent accidental taps

---

## Motion

### Hover Effects
- **Sidebar items:** Subtle background shift on hover
- **Form inputs:** Standard focus border transition
- **Toggle switches:** Smooth thumb slide animation
- **Save button:** Standard button hover

### Transitions
- Section changes: instant (no page transition needed)
- Toggle: 150ms thumb transition
- Save confirmation: toast animation

### Page Animations
None. Settings page renders statically.

### Loading Interactions
- Save button shows spinner + "Saving..." during save
- Section content loads instantly (no async section loading)
- Delete account: two-step confirmation dialog

### Modal Behavior
- Delete account: Dialog with explicit typing confirmation ("Type DELETE to confirm")
- Disconnect integration: Confirmation dialog
- No other modals needed

---

## Premium UX Rules

### Reduce Cognitive Load
- **Grouped settings** — logical categories, not alphabetical dump
- **Descriptions below labels** — explains what each setting does without jargon
- **Sensible defaults** — no setting should be required on first visit
- **No advanced mode** — all settings visible, no "power user" hidden section
- **Immediate feedback** — toasts confirm every change

### Guide User Attention
- Sidebar highlights current section — never lost
- Destructive actions visually separated and grouped at bottom
- Primary save action consistently positioned
- Read-only fields visually distinct from editable ones

### Luxury SaaS Feel
- Settings that feel curated, not auto-generated
- Thoughtful defaults — the user shouldn't need to visit settings for basic usage
- Clean typography with helpful microcopy
- No "Coming soon" or disabled settings — either ship it or hide it

### Visual Calmness
- No real-time validation errors (validate on save)
- No "Changes unsaved" warnings (explicit save model)
- No settings counters ("3 settings changed")
- No import/export settings complexity

### Polished Interactions
- Save button shows success state briefly (checkmark + "Saved")
- Toggle switches animate smoothly
- Destructive actions require explicit confirmation
- Form fields don't lose focus on save

---

## Anti-Patterns

### DO NOT:
- ❌ Create deeply nested settings categories (max 1 level)
- ❌ Add a "Reset to defaults" button without confirmation
- ❌ Use real-time auto-save (explicit save is more trustworthy)
- ❌ Show "Changes unsaved" dialogs on navigation
- ❌ Include settings search (premature for <20 settings)
- ❌ Add an "Advanced" or "Developer" settings section
- ❌ Use accordions within settings sections
- ❌ Show settings that aren't implemented yet
- ❌ Add a "Export settings" / "Import settings" feature
- ❌ Include usage statistics or analytics in settings
- ❌ Use a wizard or multi-step form for settings
- ❌ Add tooltips that require hover to understand settings
- ❌ Show raw API error messages to users
- ❌ Group settings by technical implementation, not user mental model
- ❌ Add a "Restore purchase" or billing section in settings (belongs in billing page)

---

## Inspiration References

- **Linear** — Clean settings panels, minimal categories, clear labels
- **Apple** — System Settings app: clear grouping, helpful descriptions, no clutter
- **Stripe** — Dashboard settings: organized, professional, trustworthy
- **Notion** — Settings modal: compact, focused, no unnecessary options
- **Vercel** — Project settings: well-organized, clear hierarchy, dark theme
