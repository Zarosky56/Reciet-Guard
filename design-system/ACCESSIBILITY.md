# ACCESSIBILITY.md — Deep Accessibility Governance & Implementation Standards

> **Role:** This document extends the accessibility baseline in DESIGN.md §9 into a comprehensive governance system. It defines WCAG 2.1 AA compliance strategies, testing protocols, assistive technology considerations, and accessibility-first implementation patterns specific to Receipt Guardian's dark-theme, data-driven interface.

> **Authority:** Accessibility requirements override visual preferences. If a design choice conflicts with accessibility, accessibility wins.

---

## 1. Purpose

Accessibility governance exists because:
- WCAG 2.1 AA compliance is the minimum legal and ethical standard
- Dark themes introduce unique contrast challenges that require explicit management
- AI agents default to visual-first implementation — accessibility must be explicitly enforced
- Receipt Guardian handles financial data — users with disabilities need equal access to their money
- Accessibility is not a feature to add later — it's a structural requirement from day one

This document answers: "How do we ensure every user can access their receipt data?"

---

## 2. Accessibility Philosophy

### Core Beliefs
1. **Accessibility is invisible when done right** — Users shouldn't notice accessibility features; they should just work.
2. **Semantic HTML is the foundation** — 80% of accessibility comes from correct element choices.
3. **Dark theme is not an excuse** — Contrast ratios must meet WCAG AA regardless of color scheme.
4. **Keyboard is the universal interface** — If it works with a keyboard, it works with most assistive tech.
5. **Test with real constraints** — Tab through every page. Use a screen reader. Zoom to 200%.

---

## 3. Color Contrast Compliance

### Contrast Ratios (WCAG 2.1 AA)

| Text Type | Minimum Ratio | Our Implementation | Status |
|---|---|---|---|
| Normal text (≤18px) | 4.5:1 | `text-primary` (#E8E8ED) on `bg` (#0A0A0F) = 15.2:1 | ✅ Pass |
| Normal text on surface | 4.5:1 | `text-primary` (#E8E8ED) on `surface` (#14141B) = 12.8:1 | ✅ Pass |
| Secondary text | 4.5:1 | `text-secondary` (#A0A0B8) on `bg` (#0A0A0F) = 7.1:1 | ✅ Pass |
| Secondary text on surface | 4.5:1 | `text-secondary` (#A0A0B8) on `surface` (#14141B) = 5.9:1 | ✅ Pass |
| Muted text | 4.5:1 | `text-muted` (#6B6B80) on `bg` (#0A0A0F) = 3.8:1 | ⚠️ Decorative only |
| Large text (≥18px bold) | 3:1 | All large text uses `text-primary` = 15.2:1 | ✅ Pass |
| UI components (borders) | 3:1 | `border` (#2A2A3A) on `bg` (#0A0A0F) = 1.8:1 | ⚠️ Enhanced by hover |
| Action color on bg | 4.5:1 | `action` (#3B82F6) on `bg` (#0A0A0F) = 4.7:1 | ✅ Pass |
| Action color on surface | 4.5:1 | `action` (#3B82F6) on `surface` (#14141B) = 3.9:1 | ⚠️ Large text only |

### Contrast Rules
- **`text-muted` is for decorative/supplementary text only** — never for actionable content
- **Borders don't need 3:1 contrast** when they're decorative (cards) — but interactive borders (inputs) must meet 3:1 on focus
- **`border-focus` (#3B3B50) on `bg` = 2.5:1** — acceptable because focus is indicated by outline, not border alone
- **Focus outlines use `outline-border-focus`** — visible against both `bg` and `surface`
- **Never rely on color alone** — urgency badges include text labels alongside color

### Dark Theme Specific Considerations
- White text on dark backgrounds naturally has high contrast — our primary concern is *secondary* and *muted* text
- Blue (`#3B82F6`) on dark backgrounds has lower contrast than on white — use only for large text or interactive elements with additional indicators
- Success green (`#10B981`) on dark = 5.4:1 — passes for normal text
- Warning amber (`#F59E0B`) on dark = 8.2:1 — passes comfortably
- Danger red (`#EF4444`) on dark = 4.6:1 — passes for normal text

---

## 4. Semantic HTML Requirements

### Page Structure
Every page must have:
```html
<html lang="en">
  <body>
    <main> <!-- exactly one per page -->
      <nav> <!-- if navigation exists -->
      <header> <!-- if page header exists -->
      <section> <!-- for logical content groups -->
      <h1> <!-- exactly one per page -->
    </main>
  </body>
</html>
```

### Heading Hierarchy
**Rules:**
- Exactly one `<h1>` per page — the page title
- Headings never skip levels (`<h1>` → `<h3>` is invalid)
- Headings reflect content structure, not visual size
- Use CSS classes for visual sizing, HTML elements for semantics

| Page | H1 | H2 Examples |
|---|---|---|
| Landing | "Never miss a return window again." | Proof point titles (implicit, could be h2) |
| Login | "Log in" | None needed |
| Signup | "Create your account" | None needed |
| Dashboard | "Your return dashboard" | "Paste email extraction", "Add receipt", "Receipts" |
| Test extraction | "Test email extraction" | "Extraction result" |

### Landmark Regions
| Landmark | Element | Usage |
|---|---|---|
| Main | `<main>` | Primary page content (one per page) |
| Navigation | `<nav>` | Landing page nav, dashboard header nav |
| Banner | `<header>` | Dashboard header (within main) |
| Region | `<section>` | Named content sections (with aria-label if no visible heading) |

### Form Accessibility
```html
<!-- Correct: Label wraps input (implicit association) -->
<label className="grid gap-2 text-sm font-medium">
  Email
  <input type="email" required />
</label>

<!-- Correct: Explicit association when label can't wrap -->
<label htmlFor="search-input">Search</label>
<input id="search-input" type="search" />

<!-- Incorrect: No label association -->
<input placeholder="Search..." /> <!-- Screen reader says "edit text" -->
```

**Rules:**
- Every input must have an associated label (implicit wrapping preferred)
- Placeholder is not a label — it disappears on focus
- Required fields use HTML `required` attribute — screen readers announce it
- Error messages use `aria-describedby` to associate with the input
- Form groups use `<fieldset>` + `<legend>` when multiple inputs share a label

---

## 5. Keyboard Navigation

### Focus Order
Focus must follow visual reading order (top-left to bottom-right, top to bottom):

| Page | Focus Order |
|---|---|
| Landing | Logo link → Login button → Signup button → Hero CTA → Secondary CTA → Proof cards (if interactive) |
| Login | Email input → Password input → Submit button → Signup link |
| Signup | Email input → Password input → Submit button → Login link |
| Dashboard | Logout button → Check Inbox → Email textarea → Extract button → Receipt form fields → Receipt cards |

### Focus Visibility
**Rules:**
- All interactive elements must have `focus-visible` styles
- Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus`
- Focus ring must be visible against both `bg` and `surface` backgrounds
- Never use `outline: none` without providing an alternative focus indicator
- `focus-visible` (not `focus`) — prevents focus ring on mouse click

### Keyboard Interactions
| Component | Keys | Behavior |
|---|---|---|
| Button | Enter, Space | Activates the button |
| Link | Enter | Navigates to href |
| Input | Tab | Moves focus to next element |
| Dialog | Escape | Closes the dialog |
| Dialog | Tab | Cycles focus within dialog (focus trap) |
| Select | Arrow keys | Navigates options |
| Status buttons | Tab between, Enter/Space to activate | Changes receipt status |

### Skip Navigation
For pages with navigation (landing, dashboard):
```html
<!-- First focusable element, visually hidden until focused -->
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface focus:text-text-primary">
  Skip to main content
</a>
```
**Note:** Currently not implemented — should be added when navigation becomes more complex (3+ links).

---

## 6. Screen Reader Considerations

### Announcements
| Action | Announcement Strategy |
|---|---|
| Toast notification | Sonner uses `role="status"` — announced automatically |
| Form error | Toast announces error — no inline error messages |
| Receipt created | Toast: "Receipt created" — `role="status"` |
| Receipt deleted | Toast: "Receipt deleted" — `role="status"` |
| Copy success | Button text changes to "Copied!" — announced if focused |
| Loading state | Button text changes to "Saving..." — announced if focused |

### Hidden Content
| Element | Visibility | Reason |
|---|---|---|
| Decorative icons | `aria-hidden="true"` | Adjacent text provides meaning |
| Icon-only buttons | Icon hidden, button has `aria-label` | Label provides meaning |
| Loading spinners | `aria-hidden="true"` | Button text change announces state |
| Urgency badge icon | `aria-hidden="true"` | Badge text provides meaning |

### Live Regions
- Toast notifications use Sonner's built-in `role="status"` (polite)
- No `aria-live="assertive"` regions — nothing in the app requires immediate interruption
- Search results update without announcement — the visual change is sufficient, and announcing every keystroke would be disruptive

### Content Descriptions
| Element | Description Strategy |
|---|---|
| Stat cards | Label + value read naturally: "Total 5" |
| Urgency badge | Text content: "3d" or "expired" — meaningful without color |
| Receipt card | Item name + store + price + dates — all text content |
| Empty state | Icon hidden, title + description read naturally |

---

## 7. Motion & Animation Accessibility

### `prefers-reduced-motion` Implementation
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Rules:**
- This media query is in `globals.css` — applies globally
- All animations are disabled: pulse-red, spin, hover transitions
- Scroll behavior becomes instant (no smooth scrolling)
- No JavaScript-based animation that bypasses CSS
- The page must be fully functional with all motion disabled

### Animation Safety
| Animation | Risk Level | Mitigation |
|---|---|---|
| `animate-pulse-red` | Low (slow, subtle) | Disabled by reduced-motion |
| `animate-spin` | Low (small element) | Disabled by reduced-motion |
| `hover:-translate-y-0.5` | None (user-initiated) | Disabled by reduced-motion |
| `active:scale-[0.98]` | None (user-initiated) | Disabled by reduced-motion |

**Rules:**
- No flashing content (>3 flashes per second) — WCAG 2.3.1
- No auto-playing animations that can't be paused — our only auto-animation is the red pulse
- No parallax or scroll-jacking — already forbidden by DESIGN.md
- No content that moves unexpectedly — all motion is user-triggered or status-indicating

---

## 8. Touch & Pointer Accessibility

### Touch Target Sizes
| Element | Minimum Size | Our Implementation |
|---|---|---|
| Primary buttons | 44x44px | `h-11` (44px) ✅ |
| Secondary buttons | 44x44px | `h-10` (40px) + padding ≈ 44px ✅ |
| Small buttons | 44x44px | `h-8` (32px) ⚠️ Needs `gap-2` spacing |
| Inputs | 44x44px | `h-10` or `h-11` ✅ |
| Links in text | 44x44px | Inline links need sufficient line-height ✅ |
| Icon buttons | 44x44px | `size="icon"` = `h-10 w-10` (40px) ⚠️ Borderline |

### Spacing Between Targets
- Minimum `gap-2` (8px) between adjacent tappable elements
- Receipt card action buttons use `gap-2` — adequate
- No overlapping touch targets
- No targets that require precision tapping

### Pointer Considerations
- No hover-dependent critical functionality — hover enhances, doesn't enable
- All hover effects have equivalent focus-visible states
- Right-click context menus not used — standard browser behavior preserved
- No drag-and-drop interactions (explicitly forbidden in dashboard spec)

---

## 9. Zoom & Reflow

### Zoom Support (WCAG 1.4.4)
**Requirement:** Content must be usable at 200% zoom without horizontal scrolling.

**Rules:**
- All layouts use relative units (Tailwind's rem-based scale)
- No fixed-width containers that would cause overflow at 200%
- Text reflows naturally — no `overflow: hidden` on text containers
- `max-w-*` constraints use rem — scale with zoom
- No `text-overflow: ellipsis` on critical content (only on `line-clamp-2` for long item names)

### Text Spacing (WCAG 1.4.12)
**Requirement:** Content must remain readable with increased text spacing.

**Rules:**
- No fixed-height containers that would clip text with increased line-height
- `leading-6` and `leading-7` provide generous default line-height
- No `overflow: hidden` on text containers (except code blocks with `overflow-auto`)
- Card padding accommodates text expansion

### Viewport Independence
- No content requires a specific viewport width to be usable
- Mobile layout (single column) works at any width ≥320px
- No horizontal scrolling at any viewport width (except code/JSON blocks)

---

## 10. Testing Protocol

### Manual Testing Checklist
```
□ Tab through entire page — focus order logical?
□ All interactive elements reachable by keyboard?
□ Focus ring visible on every interactive element?
□ Escape closes dialogs?
□ Screen reader announces all content meaningfully?
□ Page usable at 200% zoom without horizontal scroll?
□ All images/icons have appropriate alt text or aria-hidden?
□ Color is never the sole indicator of meaning?
□ Touch targets ≥44px on mobile?
□ prefers-reduced-motion disables all animation?
□ Form errors announced to screen readers?
□ No content trapped in a focus loop?
```

### Automated Testing
- **axe-core:** Run on every page during development
- **Lighthouse Accessibility:** Target 95+ score
- **ESLint jsx-a11y:** Catches common JSX accessibility issues

### Screen Reader Testing
| Screen Reader | Browser | Priority |
|---|---|---|
| VoiceOver | Safari (macOS) | High |
| NVDA | Firefox (Windows) | High |
| JAWS | Chrome (Windows) | Medium |
| TalkBack | Chrome (Android) | Medium |

### Testing Scenarios
1. **Blind user:** Navigate entire dashboard with screen reader only
2. **Motor impairment:** Complete all actions using keyboard only
3. **Low vision:** Use page at 200% zoom, verify no content loss
4. **Cognitive:** Verify error messages are clear and non-technical
5. **Reduced motion:** Verify page is fully functional with animations disabled

---

## 11. Accessibility Anti-Patterns

### DO NOT:
- ❌ Use `div` or `span` for interactive elements — use `button`, `a`, `input`
- ❌ Remove focus outlines without providing alternatives
- ❌ Use `tabindex` values > 0 — disrupts natural focus order
- ❌ Hide content with `display: none` that screen readers should access — use `sr-only`
- ❌ Use `aria-label` when visible text already describes the element
- ❌ Add `role="button"` to a `div` — use a real `<button>`
- ❌ Use color as the only indicator of state (urgency, errors, success)
- ❌ Create custom focus indicators that are less visible than the default
- ❌ Use `autofocus` on page load — disorienting for screen reader users
- ❌ Announce every state change with `aria-live` — only meaningful changes
- ❌ Use `title` attribute for important information — inconsistent AT support
- ❌ Disable zoom with `user-scalable=no` — violates WCAG
- ❌ Use ARIA when native HTML semantics suffice — ARIA is a last resort

---

## 12. Implementation Checklist by Component

### Button
```
□ Uses <button> element (or Slot for asChild)
□ Has visible text or aria-label
□ focus-visible outline present
□ disabled state announced (disabled attribute, not aria-disabled)
□ Loading state: text changes, spinner has aria-hidden
```

### Input
```
□ Associated label (wrapping or htmlFor)
□ Placeholder supplements, doesn't replace label
□ focus border transition visible
□ required attribute for mandatory fields
□ type attribute correct (email, password, date, etc.)
□ autocomplete attribute for common fields
```

### Card
```
□ Not interactive unless it contains interactive children
□ If interactive: has role and keyboard handler
□ Content readable in linear order
□ No critical info hidden in hover-only states
```

### Dialog
```
□ role="dialog" and aria-modal="true"
□ aria-labelledby points to title
□ Focus trapped inside when open
□ Escape key closes
□ Focus returns to trigger on close
□ Backdrop click closes
```

### Badge
```
□ Text content is meaningful without color
□ Icon (if present) has aria-hidden="true"
□ Not interactive (no click handler)
□ Sufficient contrast for text
```

---

## Document Maintenance

### When to Update ACCESSIBILITY.md
- New component type added to the library
- Contrast ratio changes due to color token updates
- New interaction pattern introduced
- Accessibility audit reveals systemic issues
- WCAG guidelines update (currently targeting 2.1 AA)

### When NOT to Update
- Page-specific accessibility notes (go in page spec)
- One-off aria-label additions
- Minor contrast adjustments within passing range
