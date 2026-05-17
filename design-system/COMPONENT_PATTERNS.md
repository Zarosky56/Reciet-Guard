# COMPONENT_PATTERNS.md — Reusable Composition & Compound Component Governance

> **Role:** This document defines the canonical patterns for composing UI components in Receipt Guardian. It governs how components combine, nest, and interact — preventing the proliferation of one-off compositions that fragment the design language.

> **Authority chain:** `DESIGN.md` (tokens) → `COMPONENT_PATTERNS.md` (composition) → Page specs (usage context)

---

## 1. Purpose

Individual components (Button, Card, Input) are defined in `components/ui/`. But premium UI emerges from how components *compose* — how a Card contains a form, how a Button pairs with an icon, how a stat display combines typography and layout. Without documented composition patterns, every page invents its own arrangements, and consistency dies.

This document answers: "How do I combine components correctly?"

---

## 2. Composition Philosophy

### Core Beliefs
1. **Patterns over one-offs** — If a composition appears twice, it's a pattern. Document it.
2. **Flat over nested** — Avoid deep component nesting. Two levels max (page → section → element).
3. **Props over children** — When a pattern is rigid, use props. When flexible, use children.
4. **Composition over inheritance** — Components combine; they don't extend each other.
5. **Explicit over implicit** — Every composition decision should be traceable to a rule.

### The Composition Hierarchy
```
Page Layout
  └── Section (semantic grouping)
       └── Card (visual container)
            └── Content Pattern (documented composition)
                 └── Atomic Component (Button, Input, Badge, etc.)
```

---

## 3. Card Content Patterns

Cards are the primary container in Receipt Guardian. Every card follows one of these documented content patterns.

### Pattern: Stat Card
**Usage:** Dashboard stats (total, active, expiring soon, money at risk)
**Structure:**
```
Card
  └── CardContent (p-4)
       ├── Label (text-xs uppercase text-text-muted)
       └── Value (font-mono text-xl font-semibold text-text-primary, mt-2)
```
**Rules:**
- Label is always uppercase, always `text-xs`, always `text-text-muted`
- Value is always `font-mono` — numbers deserve monospace
- Padding is `p-4` — compact, not generous
- No icons in stat cards — the number speaks for itself
- Grid: always `grid-cols-2` when multiple stat cards appear together

### Pattern: Overview Card
**Usage:** Dashboard overview section with title, description, and actions
**Structure:**
```
Card
  └── CardContent (p-5)
       ├── Title (text-2xl font-semibold text-text-primary)
       ├── Description (mt-2, text-sm leading-6 text-text-secondary, max-w-2xl)
       ├── Inline Component (mt-5, e.g., CopyForwardingAddress)
       └── Action Row (mt-4, flex justify-end)
            └── Button (variant="secondary")
```
**Rules:**
- Title is the page-level heading (`<h1>`)
- Description provides context, constrained to `max-w-2xl` for readability
- Actions align right (`justify-end`)
- Maximum one primary action per overview card

### Pattern: Form Card
**Usage:** Email extraction, receipt editor, settings forms
**Structure:**
```
Card
  └── CardContent (grid gap-4 p-5)
       ├── Header Group
       │    ├── Title (text-base font-medium text-text-primary)
       │    └── Description (mt-1, text-sm text-text-secondary)
       ├── Form Fields (grid gap-3 sm:grid-cols-2)
       │    └── Field (label > input pattern)
       └── Action Row (flex justify-end gap-2)
            ├── Cancel Button (variant="ghost", conditional)
            └── Submit Button (variant="default")
```
**Rules:**
- Form cards always use `grid gap-4` for internal layout
- Fields use `grid gap-3 sm:grid-cols-2` — single column mobile, two columns desktop
- Submit button is always rightmost in the action row
- Cancel button only appears when editing (not creating)
- Loading state: spinner replaces button icon, text may change

### Pattern: Data Card (Receipt)
**Usage:** Individual receipt display in the receipt grid
**Structure:**
```
Card
  └── CardContent (relative p-4)
       ├── Badge (absolute right-4 top-4)
       ├── Title Group (pr-24)
       │    ├── Item Name (text-base font-medium text-text-primary, line-clamp-2)
       │    └── Store Name (mt-1, text-sm text-text-secondary)
       ├── Metadata List (mt-5, grid gap-2 text-sm)
       │    └── Metadata Row (flex items-center gap-2)
       │         ├── Icon (h-4 w-4)
       │         └── Text
       └── Action Row (mt-5, flex flex-wrap items-center gap-2)
            └── Buttons (variant="secondary"/"ghost"/"danger", size="sm")
```
**Rules:**
- Badge is absolutely positioned — content flows independently
- `pr-24` on title group prevents overlap with badge
- Metadata uses icon + text pattern consistently
- Action row wraps on mobile (`flex-wrap`)
- All action buttons use `size="sm"`
- Status buttons use `variant="default"` for active, `variant="ghost"` for inactive

### Pattern: Empty State Card
**Usage:** When a list has no items
**Structure:**
```
Card (border-dashed)
  └── CardContent (py-14 text-center)
       ├── Icon (mx-auto h-10 w-10 text-text-muted)
       ├── Title (mt-4, text-base font-medium text-text-primary)
       ├── Description (mt-2, text-sm text-text-secondary, max-w-sm mx-auto)
       └── Action (mt-5)
            └── Inline Component or Button
```
**Rules:**
- Card uses `border-dashed` — visually distinct from populated cards
- Content is centered (`text-center`)
- Icon is larger than normal (`h-10 w-10`) — fills the empty space
- Description is constrained (`max-w-sm`) — prevents wide single lines
- Tone is helpful, never punishing ("No receipts yet" not "You have no data")

### Pattern: Proof Point Card
**Usage:** Landing page feature highlights
**Structure:**
```
Card
  └── CardContent (p-5)
       ├── Icon (h-5 w-5 text-action)
       ├── Title (mt-5, text-base font-medium text-text-primary)
       └── Description (mt-2, text-sm leading-6 text-text-secondary)
```
**Rules:**
- Icon is small (`h-5 w-5`) — accent, not focal point
- Icon uses `text-action` — the only color accent in the card
- `mt-5` between icon and title — generous breathing room
- Maximum 3 proof point cards in a row
- All cards in a set must have identical structure

---

## 4. Form Field Patterns

### Pattern: Labeled Input
**Usage:** All form fields throughout the application
**Structure:**
```
<label className="grid gap-2 text-sm font-medium text-text-primary">
  {label}
  <Input ... />
</label>
```
**Rules:**
- Always use `<label>` wrapping — implicit association, no `htmlFor` needed
- Gap between label text and input: `gap-2` (8px)
- Label text: `text-sm font-medium text-text-primary`
- Never use placeholder as label substitute
- Placeholder provides example value, not field name

### Pattern: Search Input with Icon
**Usage:** Receipt search, future filter inputs
**Structure:**
```
<label className="relative w-full md:max-w-sm">
  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
  <Input className="pl-9" placeholder="Search..." />
</label>
```
**Rules:**
- Icon is absolutely positioned inside the input
- `pointer-events-none` on icon — clicks pass through to input
- Input has `pl-9` to accommodate icon width
- Icon uses `text-text-muted` — subordinate to input text
- Constrained width on desktop (`md:max-w-sm`), full-width on mobile

### Pattern: Date Input
**Usage:** Purchase date, return deadline, warranty deadline
**Structure:**
```
<label className="grid gap-2 text-sm font-medium text-text-primary">
  {label}
  <Input type="date" ... />
</label>
```
**Rules:**
- Uses native `type="date"` — browser provides date picker
- No custom date picker component (unnecessary complexity)
- Value format: `YYYY-MM-DD` (ISO 8601)
- Empty value is valid — not all dates are known

### Pattern: Select Input
**Usage:** Status selection, currency selection
**Structure:**
```
<select className="h-10 rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none transition focus:border-border-focus">
  <option value="...">...</option>
</select>
```
**Rules:**
- Uses native `<select>` — no custom dropdown component yet
- Styled to match Input component visually
- Same height (`h-10`), same border, same background
- If a custom Select component is added, it must match this visual baseline

---

## 5. Layout Patterns

### Pattern: Page Container
**Usage:** Every page's root layout
**Structure:**
```
<main className="mx-auto min-h-screen w-full max-w-{n} px-6 md:px-8">
  {/* page content */}
</main>
```
**Rules:**
- Always `<main>` element — semantic landmark
- Always `min-h-screen` — prevents short pages from looking broken
- Always `mx-auto` — centers content
- Always `px-6 md:px-8` — consistent horizontal padding
- `max-w-*` varies by page type (see DESIGN.md §4)

### Pattern: Centered Auth Layout
**Usage:** Login, signup pages
**Structure:**
```
<main className="flex min-h-screen items-center justify-center px-6 py-12">
  <Card className="w-full max-w-md">
    {/* form content */}
  </Card>
</main>
```
**Rules:**
- Flexbox centering — card floats in the viewport center
- `py-12` prevents card from touching top/bottom on short viewports
- Card at `max-w-md` (448px) — optimal form width
- No other elements on the page — pure focus

### Pattern: Section with Header and Grid
**Usage:** Dashboard receipt list, future list views
**Structure:**
```
<section className="grid gap-4">
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
    {/* optional: search, filters, actions */}
  </div>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/* grid items */}
  </div>
</section>
```
**Rules:**
- Section header and content separated by the section's `gap-4`
- Header uses `flex-col` on mobile, `md:flex-row` on desktop
- Title left-aligned, actions right-aligned on desktop
- Grid uses responsive columns: 1 → 2 → 3

### Pattern: Two-Column Split
**Usage:** Dashboard stats row, input section
**Structure:**
```
<section className="grid gap-4 lg:grid-cols-2">
  <Card>{/* left content */}</Card>
  <Card>{/* right content */}</Card>
</section>
```
**Rules:**
- Stacks on mobile and tablet, splits on desktop (`lg:`)
- Both columns have equal visual weight unless specified otherwise
- For unequal splits: `lg:grid-cols-[1fr_22rem]` (content + sidebar)

---

## 6. Icon Patterns

### Icon Sizing Rules
| Context | Size | Example |
|---|---|---|
| Inside button text | `h-4 w-4` | Button with icon + label |
| Standalone in card | `h-5 w-5` | Proof point card icon |
| Inside badge | `h-3.5 w-3.5` | Urgency badge icon |
| Empty state focal | `h-10 w-10` | Empty state illustration |
| Navigation logo | `h-5 w-5` | Header logo icon |

### Icon Color Rules
| Context | Color | Token |
|---|---|---|
| Action/brand accent | Blue | `text-action` |
| Metadata/secondary | Muted | `text-text-muted` |
| Inside primary button | White | `text-white` (inherited) |
| Urgency indicator | Semantic | `text-success`/`text-warning`/`text-danger` |

### Icon Accessibility Rules
- Icons with adjacent text: `aria-hidden="true"` on the icon
- Icon-only buttons: `aria-label` on the button, `aria-hidden="true"` on icon
- Decorative icons: always `aria-hidden="true"`
- Never use icons as the sole indicator of meaning — pair with text or color

---

## 7. Button Composition Patterns

### Pattern: Button with Icon
**Usage:** Most action buttons
**Structure:**
```
<Button>
  <Icon className="h-4 w-4" aria-hidden="true" />
  Label Text
</Button>
```
**Rules:**
- Icon before text (left side) — standard reading order
- Exception: directional icons (ArrowRight) go after text
- `gap-2` between icon and text (inherited from Button base)
- Icon is `h-4 w-4` — never larger inside a button

### Pattern: Loading Button
**Usage:** During async operations
**Structure:**
```
<Button disabled={isPending}>
  {isPending ? (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  ) : (
    <Icon className="h-4 w-4" aria-hidden="true" />
  )}
  {isPending ? "Loading..." : "Action"}
</Button>
```
**Rules:**
- Button becomes `disabled` during loading — prevents double-submit
- Spinner replaces the normal icon — same position, same size
- Text may change to indicate progress ("Saving...", "Creating...")
- Never hide the button entirely during loading

### Pattern: Icon-Only Button
**Usage:** Close dialog, compact actions
**Structure:**
```
<Button variant="ghost" size="icon" aria-label="Close">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>
```
**Rules:**
- Always `size="icon"` — square aspect ratio (`h-10 w-10`)
- Always has `aria-label` — no visible text means screen readers need help
- Typically `variant="ghost"` — minimal visual weight
- Icon is `h-4 w-4` — centered in the button

### Pattern: Button Group
**Usage:** Status toggles, action rows
**Structure:**
```
<div className="flex flex-wrap items-center gap-2">
  <Button variant="default" size="sm">Active</Button>
  <Button variant="ghost" size="sm">Inactive</Button>
  <Button variant="ghost" size="sm">Inactive</Button>
</div>
```
**Rules:**
- `flex-wrap` allows buttons to wrap on mobile
- `gap-2` between buttons — minimum for touch safety
- Active state uses `variant="default"` (filled)
- Inactive state uses `variant="ghost"` (transparent)
- All buttons in a group use the same `size`

---

## 8. Feedback Patterns

### Pattern: Toast Notification
**Usage:** All mutation confirmations and errors
**Implementation:** Sonner library, configured in `layout.tsx`
**Rules:**
- Position: `bottom-right` — consistent, non-blocking
- Success: `toast.success("Message")` — green accent
- Error: `toast.error("Message")` — red accent
- Warning: `toast.warning("Message")` — amber accent
- Auto-dismiss: default Sonner timing (~4 seconds)
- No custom toast components — use Sonner's built-in styling

### Pattern: Copy Feedback
**Usage:** Copy forwarding address, future copy actions
**Structure:**
```
Button text: "Copy" → (click) → "Copied!" + checkmark icon → (2s) → "Copy"
```
**Rules:**
- Feedback is inline — button text changes temporarily
- Duration: 2 seconds before reverting
- Icon changes: Copy icon → Check icon
- No toast for copy — inline feedback is sufficient
- State managed with `useState` + `setTimeout`

### Pattern: Form Submission Feedback
**Usage:** All form submissions
**Flow:**
```
1. User clicks submit
2. Button shows spinner + "Saving..."
3. Button becomes disabled
4. On success: toast.success() + form resets
5. On error: toast.error() + form retains values
```
**Rules:**
- Never clear form on error — user shouldn't re-enter data
- Always show toast — user needs confirmation the action completed
- Redirect only after success toast is visible (if applicable)

---

## 9. Responsive Composition Rules

### How Patterns Adapt
| Pattern | Mobile | Tablet | Desktop |
|---|---|---|---|
| Two-column split | Stacked | Stacked | Side-by-side |
| Form fields grid | Single column | Single column | Two columns |
| Card grid | 1 column | 2 columns | 3 columns |
| Section header | Stacked | Horizontal | Horizontal |
| Button group | Wrapped | Inline | Inline |
| Stat cards | 2x2 grid | 2x2 grid | 2x2 grid |

### Rules for Responsive Composition
1. **Never hide content** at smaller breakpoints — reflow, don't remove
2. **Never change component variants** based on breakpoint — a primary button stays primary
3. **Never change spacing tokens** based on breakpoint — `gap-4` is `gap-4` everywhere
4. **Only change layout direction** — column ↔ row, grid columns count
5. **Only change container constraints** — `max-w-*` may not apply on mobile

---

## 10. Pattern Creation Rules

### When to Create a New Pattern
- A composition appears on 2+ pages with identical structure
- A composition has 3+ elements that always appear together
- A composition has specific spacing/sizing rules that could drift

### How to Document a New Pattern
1. Name it clearly (Pattern: [Name])
2. Define its usage context
3. Show its structure (indented tree)
4. List its rules (spacing, sizing, variants)
5. Note any responsive adaptations
6. Add to this document in the appropriate section

### When NOT to Create a Pattern
- A composition appears only once (it's page-specific)
- A composition is just a single component with className overrides
- A composition is still evolving (wait until it stabilizes)

---

## 11. Anti-Patterns in Composition

### DO NOT:
- ❌ Nest cards inside cards — one level of containment only
- ❌ Put forms inside dialogs inside cards — max 2 levels of nesting
- ❌ Mix card padding values on the same page — pick one (`p-4`, `p-5`, or `p-6`)
- ❌ Use different icon sizes in the same context — consistency within a section
- ❌ Create "wrapper" components that just add a className — use className directly
- ❌ Put action buttons in card headers — actions go in card content or footer
- ❌ Use CardHeader + CardContent + CardFooter when CardContent alone suffices
- ❌ Create component variants for single-use cases — use className
- ❌ Mix flex and grid in the same container — pick one layout mode
- ❌ Use absolute positioning except for badges/overlays — prefer flow layout

---

## Document Maintenance

### When to Update COMPONENT_PATTERNS.md
- A new composition pattern stabilizes across 2+ pages
- An existing pattern gains a new variant
- A pattern's rules need clarification after review findings
- A new component is added to `components/ui/`

### When NOT to Update
- A page uses a pattern with minor className customization
- A one-off composition that won't repeat
- Component internal implementation changes (that's component source territory)
