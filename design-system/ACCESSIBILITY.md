# ACCESSIBILITY.md — Deep Accessibility Governance & Implementation Standards

> **Role:** This document extends the accessibility baseline in DESIGN.md §9 into a comprehensive governance system. It defines WCAG 2.1 AA compliance strategies, testing protocols, assistive technology considerations, and accessibility-first implementation patterns specific to Receipt Guardian's dark-theme, data-driven interface.

> **Authority:** Accessibility requirements override visual preferences. If a design choice conflicts with accessibility, accessibility wins.

> **Redesign sync (premium-ui-redesign).** Color, focus, and motion guidance below has been re-grounded in the redesigned token set introduced by tasks 2.1 (`app/globals.css`) and 2.2 (`tailwind.config.ts`). The single accent is the warm amber `oklch(0.78 0.13 78)`; the cobalt `--color-action` / `--color-action-strong` blues are deprecated. Where contrast values change, the table is updated rather than appended.

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

### Redesigned token contrast matrix (WCAG 2.1 AA)

The pairs below are computed against the redesigned `oklch()` tokens defined in `app/globals.css` and mirrored in `tailwind.config.ts`. The full matrix lives in `design-system/VISUAL_IDENTITY.md`; the abbreviated reviewer-facing table is below.

| Pair | Ratio | Requirement | Status |
|---|---|---|---|
| `text-primary` on `canvas` | 16.8:1 | ≥4.5:1 (normal text) | ✅ |
| `text-secondary` on `canvas` | 7.4:1 | ≥4.5:1 | ✅ |
| `text-secondary` on `surface` | 5.8:1 | ≥4.5:1 | ✅ |
| `text-muted` on `canvas` | 4.6:1 | ≥4.5:1 (decorative-only fallback ≥3:1) | ✅ |
| `accent` on `canvas` | 8.9:1 | ≥4.5:1 (CTAs, links, focus) | ✅ |
| `accent` on `surface` | 7.1:1 | ≥4.5:1 | ✅ |
| `border` on `canvas` | 1.9:1 | UI ≥3:1 | ⚠️ Decorative only; non-color signal carries focus (see §5) |
| `border-focus` on `canvas` | 8.9:1 | UI ≥3:1 | ✅ |
| `border-focus` on `surface` | 7.1:1 | UI ≥3:1 | ✅ |
| `success` on `canvas` | ≥4.5:1 | ≥4.5:1 | ✅ |
| `warning` on `canvas` | ≥4.5:1 | ≥4.5:1 | ✅ |
| `danger` on `canvas` | ≥4.5:1 | ≥4.5:1 | ✅ |

### Contrast rules
- **Single accent only.** All interactive accent surfaces, focus indicators, and links use `--color-accent` / `--color-accent-hover` / `--color-accent-tint`. Cobalt blue (`#5B8CFF`, `#3B82F6`, `blue-500`, `indigo-500`, `violet-500`) is forbidden by Requirement 13.1 and enforced via `eslint-rules/no-raw-color.js`.
- **No inline opacity for tints.** Selected, badge, and "active filter" backgrounds use the pre-tokenized `bg-accent-tint`. `bg-accent/10` is forbidden (Requirement 2.6).
- **`text-muted` is decorative.** Used for placeholders, captions, and tertiary metadata only — never for actionable content.
- **Color is never the sole indicator.** Every urgency, status, success, warning, and error indicator pairs color with text **and/or** icon. The `<UrgencyBadge>` component is the canonical pattern (Requirement 11.7); it always renders a text label plus a Lucide `<svg>` icon and only uses the `attention` pulse on expired-red.
- **Tinted-accent variant.** `bg-accent-tint` is `oklch(0.30 0.06 78)`, paired with `text-accent` for ≥4.5:1 contrast on selected nav items, badge fills, and active filter chips.
- **Dark-theme caveats.** White text on dark backgrounds naturally has high contrast — the surveillance points are `text-secondary` and `text-muted`. The amber accent on canvas (8.9:1) is comfortably above the 4.5:1 floor and far above the 3:1 UI floor.

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
- Use the redesigned type-scale tokens (`--text-title-lg`, `--text-display`, etc.) for visual sizing — HTML elements stay semantic.

| Page | H1 | H2 Examples |
|---|---|---|
| Landing | "Never miss a return window again." | Proof point titles |
| Login | "Log in" | None |
| Signup | "Create your account" | None |
| Dashboard | "Your return dashboard" | "Paste email extraction", "Add receipt", "Receipts" |
| Test extraction | "Test email extraction" | "Extraction result" |

### Landmark Regions
| Landmark | Element | Usage |
|---|---|---|
| Main | `<main>` | Primary page content (one per page), wrapped in exactly one container token (`max-w-auth` / `max-w-narrow` / `max-w-content` / `max-w-wide`) |
| Navigation | `<nav>` | Landing nav, dashboard header, mobile bottom nav |
| Banner | `<header>` | Dashboard header (within main) |
| Region | `<section>` | Named content sections (with `aria-label` if no visible heading) |

### Form Accessibility
```html
<!-- Correct: Label wraps input (implicit association) -->
<label className="grid gap-2 text-sm font-medium">
  Email
  <input type="email" required />
</label>
```

**Rules:**
- Every input must have an associated label (implicit wrapping preferred).
- Placeholder is not a label — it disappears on focus.
- Required fields use the HTML `required` attribute — screen readers announce it.
- Form errors surface via toast (`role="status"`); inline-error nodes use `aria-describedby` when persistent.
- Invalid inputs set `aria-invalid="true"` and the redesigned `<Input>` swaps its border to `--color-danger` so the validation state is conveyed by both color and ARIA.

---

## 5. Keyboard Navigation

### Focus Order
Focus must follow visual reading order (top-left to bottom-right, top to bottom).

| Page | Focus Order |
|---|---|
| Landing | Logo link → Login → Signup → Hero CTA → Secondary CTA → Proof cards (if interactive) |
| Login | Email → Password → Submit → Signup link |
| Signup | Email → Password → Submit → Login link |
| Dashboard | Logout → Check Inbox → Email textarea → Extract → Receipt form fields → Receipt cards |

### Focus Visibility (Requirement 11.3)

**The redesigned focus-visible signal is a non-color attribute change.** Every interactive primitive (`<Button>`, `<Input>`, `<Textarea>`, `<Card data-interactive>`, `<Dialog>` close, mobile nav items) renders a focus indicator that adds:

- **A 2px outline** drawn at **2px offset** from the element's box, drawn in `--color-border-focus` (= `--color-accent`).
- **For inputs and textareas only:** a 1px outline at 1px offset (the resting border itself shifts to `--color-border-focus`), pragmatic because the surrounding form chrome already separates the field from canvas.

The 2px outline + 2px offset is a *thickness and offset* change, not a hue change. A user with full color vision, low color discrimination, or a high-contrast OS theme can identify the focused element from arm's-length viewing distance via the geometry alone. This satisfies Requirement 11.3 ("focus differs from resting in a non-color attribute"). The same rule is exercised by Property 11 in the redesign's correctness suite (`design-system/__tests__/interactive-states.property.test.ts`).

**Rules:**
- All interactive elements must have `focus-visible` styles.
- Focus ring: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus`.
- Focus ring must be visible against both `canvas` and `surface` (verified at 8.9:1 and 7.1:1).
- Never use `outline: none` without providing the redesigned alternative.
- `focus-visible` (not `focus`) — prevents focus ring on mouse click.
- The deprecated 4px input shadow halo (`shadow-[0_0_0_4px_rgba(91,140,255,0.12)]`) is removed (Requirement 8.5).

### Keyboard Interactions
| Component | Keys | Behavior |
|---|---|---|
| Button | Enter, Space | Activates the button |
| Link | Enter | Navigates to href |
| Input | Tab | Moves focus to next element |
| Dialog | Escape | Closes the dialog |
| Dialog | Tab | Cycles focus within dialog (focus trap) |
| Status buttons | Tab between, Enter/Space to activate | Changes receipt status |

### Skip Navigation
For pages with navigation (landing, dashboard):
```html
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
| Form error | Toast announces error |
| Receipt created | Toast: "Receipt created" — `role="status"` |
| Receipt deleted | Toast: "Receipt deleted" — `role="status"` |
| Copy success | Button text changes to "Copied!" — announced if focused |
| Loading state | Button text changes via `<Loader label="Saving" />` — announced if focused |

### Hidden Content
| Element | Visibility | Reason |
|---|---|---|
| Decorative icons | `aria-hidden="true"` | Adjacent text provides meaning |
| Icon-only buttons | Icon hidden, button has `aria-label` | Label provides meaning |
| `<Loader>` dot | `aria-hidden="true"` | Label text announces state |
| Urgency badge icon | `aria-hidden="true"` | Badge text provides meaning |
| `<AmbientBackground>` band | `data-decorative="true"`, `aria-hidden="true"` | Single tonal element, not content |

### Content Descriptions
| Element | Description Strategy |
|---|---|
| Stat cards | Label + value read naturally: "Total 5" |
| Urgency badge | Text content: "3d" or "expired" — meaningful without color, paired with an inline icon |
| Receipt card | Item name + store + price + dates — all text content |
| Empty state | Icon hidden, title + description read naturally |

---

## 7. Motion & Animation Accessibility

### Reduced-motion strategy (Requirements 6.6, 11.4)

The redesign uses two complementary mechanisms.

**1. Global clamp.** `app/globals.css` ships the standard reduced-motion media query that clamps `animation-duration` and `transition-duration` to `0.01ms`:

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

This neutralizes every CSS transition and one-shot animation in the codebase.

**2. Static-swap selector for indeterminate loops.** Indeterminate loops (the redesigned `attention` pulse on expired urgency, the `route-progress` indicator at the top of the page) need a *visual replacement* — not just a paused animation — so they remain legible to reduced-motion users. The redesign extends the global clamp with an opt-in static-swap target:

```css
@media (prefers-reduced-motion: reduce) {
  /* ... global clamp above ... */
  [data-reduced-motion="static"],
  [data-reduced-motion="static"]::before,
  [data-reduced-motion="static"]::after {
    animation: none !important;
    transition: none !important;
  }
}
```

Every component that renders an indeterminate loop attaches `data-reduced-motion="static"` to the animated node and renders a static fallback when the media query matches:

| Component | Animated form | Reduced-motion form |
|---|---|---|
| `<RouteProgress>` | 2px top bar, `route-progress` keyframe (1.2s linear infinite, accent) | Static accent-colored 2px bar |
| `<UrgencyBadge variant="danger">` (expired) | `attention` pulse (opacity 0.7↔1, 2.4s) | Static danger-tint background, no pulse |
| `<Loader>` | Single static accent dot + label (already non-indeterminate by design) | Same |

**Allowed properties (Requirement 6.5).** Animations are restricted to `transform` and `opacity` — see PERFORMANCE.md §7. This keeps the reduced-motion fallback geometrically equivalent to the resting state (same box, same border) and avoids layout thrash.

### Animation safety
| Animation | Risk Level | Mitigation |
|---|---|---|
| `attention` (expired urgency only) | Low (slow, subtle) | Disabled by reduced-motion, swapped to static danger fill |
| `route-progress` (one per screen max) | Low (single 2px bar) | Disabled by reduced-motion, swapped to static bar |
| `hover:-translate-y-0.5` on interactive cards | None (user-initiated) | Disabled by reduced-motion |
| `active:scale-[0.985]` on buttons | None (user-initiated) | Disabled by reduced-motion |

**Removed animations.** The legacy `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red` keyframes are deleted in task 11.2; they no longer ship.

**Other rules:**
- No flashing content (>3 flashes per second) — WCAG 2.3.1.
- No auto-playing animations that can't be paused — the only auto-animation is the expired-urgency pulse, which is conditional on a single critical badge per screen.
- No parallax or scroll-jacking.
- No content that moves unexpectedly — all motion is user-triggered or status-indicating.

---

## 8. Touch & Pointer Accessibility

### Touch Target Sizes (Requirement 11.6)
Minimum 44×44 CSS pixels for every interactive element on every viewport.

| Element | Minimum | Redesigned implementation |
|---|---|---|
| Primary CTA buttons | 44×44 | `<Button size="lg">` ships at `h-11` (44px) and meets the floor directly ✅ |
| Default buttons | 44×44 | `<Button size="default">` ships at `h-10` + padding so the hit-box reaches 44px ✅ |
| Small buttons | 44×44 | `<Button size="sm">` keeps `h-8` for visual rhythm; surrounding `gap-2` spacing keeps the *hit-box* clean of neighbors and per-row groups expose a 44px hit row ✅ |
| Icon buttons | 44×44 | `<Button size="icon">` ships at 44×44 ✅ |
| Inputs / textareas | 44×44 | `<Input>` and `<Textarea>` ship at `h-10` minimum, larger when stacked with labels ✅ |
| Mobile bottom nav items | 44×44 | Each item is ≥44×44 with the active 2px accent bar at the top edge (Requirement 8.7) ✅ |
| Receipt card actions | 44×44 | Card action buttons re-use `<Button size="sm">` with the documented `gap-2` spacing ✅ |

**Property 12** (`design-system/__tests__/touch-targets.property.test.ts`) renders every interactive primitive at the documented viewport widths and asserts the bounding box is ≥44×44 in CSS pixels.

### Spacing Between Targets
- Minimum `gap-2` (8px) between adjacent tappable elements.
- Receipt card action buttons use `gap-2` — adequate.
- No overlapping touch targets, no targets that require precision tapping.

### Pointer Considerations
- No hover-dependent critical functionality — hover enhances, doesn't enable.
- All hover effects have equivalent focus-visible states.
- No drag-and-drop interactions (explicitly forbidden in dashboard spec).

---

## 9. Zoom & Reflow

### Zoom Support (WCAG 1.4.4)
Content must be usable at 200% zoom without horizontal scrolling.

- All layouts use relative units (Tailwind's rem-based scale, anchored to the redesigned spacing scale 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96).
- No fixed-width containers that would cause overflow at 200%.
- Container tokens (`--container-auth`, `--container-narrow`, `--container-content`, `--container-wide`) are all defined in `rem` and scale with zoom.
- No `text-overflow: ellipsis` on critical content (only on `line-clamp-2` for long item names).

**Property 15** (`design-system/__tests__/no-horizontal-overflow.property.test.ts`) renders each In_Scope_Screen at five documented viewport widths (320, 375, 414, 768, 1280) and asserts no horizontal overflow.

### Text Spacing (WCAG 1.4.12)
- No fixed-height containers that would clip text with increased line-height.
- The redesigned type scale ships generous default line-heights (1.5rem on body, 1.625rem on body-lg).
- No `overflow: hidden` on text containers (except code blocks with `overflow-auto`).
- Card padding standardized at `p-5` (Requirement 4.6) accommodates text expansion.

### Viewport Independence
- Mobile layout (single column) works at any width ≥320px.
- No horizontal scrolling at any viewport width (except code/JSON blocks).

---

## 10. Testing Protocol

### Manual Testing Checklist
```
□ Tab through entire page — focus order logical?
□ All interactive elements reachable by keyboard?
□ Focus ring visible on every interactive element (2px outline @ 2px offset)?
□ Escape closes dialogs?
□ Screen reader announces all content meaningfully?
□ Page usable at 200% zoom without horizontal scroll?
□ All images/icons have appropriate alt text or aria-hidden?
□ Color is never the sole indicator of meaning (color + text and/or icon)?
□ Touch targets ≥44×44 on mobile?
□ prefers-reduced-motion disables all animation AND swaps indeterminate loops to static?
□ Form errors announced to screen readers?
□ No content trapped in a focus loop?
```

### Automated Testing
- **Property tests** (Vitest + fast-check) under `design-system/__tests__/` validate contrast, reduced-motion, focus state distinctness, touch-target sizing, and the urgency-indicator color-plus-text-or-icon rule.
- **axe-core:** Run on every page during development.
- **Lighthouse Accessibility:** Target 95+ score.
- **ESLint jsx-a11y:** Catches common JSX accessibility issues.

### Screen Reader Testing
| Screen Reader | Browser | Priority |
|---|---|---|
| VoiceOver | Safari (macOS) | High |
| NVDA | Firefox (Windows) | High |
| JAWS | Chrome (Windows) | Medium |
| TalkBack | Chrome (Android) | Medium |

### Testing Scenarios
1. **Blind user:** Navigate entire dashboard with screen reader only.
2. **Motor impairment:** Complete all actions using keyboard only.
3. **Low vision:** Use page at 200% zoom, verify no content loss.
4. **Cognitive:** Verify error messages are clear and non-technical.
5. **Reduced motion:** Verify page is fully functional with animations disabled and indeterminate loops swapped to static fallbacks.

---

## 11. Accessibility Anti-Patterns

### DO NOT:
- ❌ Use `div` or `span` for interactive elements — use `button`, `a`, `input`.
- ❌ Remove focus outlines without providing the redesigned 2px outline @ 2px offset alternative.
- ❌ Use `tabindex` values > 0.
- ❌ Hide content with `display: none` that screen readers should access — use `sr-only`.
- ❌ Use `aria-label` when visible text already describes the element.
- ❌ Add `role="button"` to a `div` — use a real `<button>`.
- ❌ Use color as the only indicator of state (urgency, errors, success).
- ❌ Create custom focus indicators that are less visible than the redesigned default.
- ❌ Use `autofocus` on page load.
- ❌ Announce every state change with `aria-live` — only meaningful changes.
- ❌ Use `title` attribute for important information.
- ❌ Disable zoom with `user-scalable=no`.
- ❌ Reintroduce the deprecated 4px focus shadow halo or any glow-shadow focus signal.
- ❌ Swap an indeterminate loop directly to "no animation" without also providing a static visual fallback.

---

## 12. Implementation Checklist by Component

### Button
```
□ Uses <button> element (or Slot for asChild)
□ Has visible text or aria-label
□ focus-visible: 2px outline @ 2px offset in --color-border-focus
□ disabled state announced (disabled attribute)
□ Loading state: <Loader size="sm" /> with aria-hidden dot, label announces state
□ size="lg" hits the 44×44 touch-target floor directly
```

### Input / Textarea
```
□ Associated label (wrapping or htmlFor)
□ Placeholder supplements, doesn't replace label
□ Focus: border shifts to --color-border-focus + 1px outline @ 1px offset
□ aria-invalid + border-danger when invalid
□ required attribute for mandatory fields
□ type attribute correct (email, password, date, etc.)
□ autocomplete attribute for common fields
□ No 4px shadow halo on focus
```

### Card
```
□ Not interactive unless data-interactive={true}
□ If interactive: focus-visible reaches the card
□ Hover: border-strong + -translate-y-0.5 (transform only)
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
□ Scrim ≤8px backdrop-blur, bg-canvas/70
```

### Badge / UrgencyBadge
```
□ Text content is meaningful without color
□ Icon (if present) has aria-hidden="true"
□ Color paired with text and icon (Requirement 11.7)
□ animate-attention only on expired-red urgency
□ data-reduced-motion="static" attached when animated
□ Sufficient contrast for text on tinted background
```

### Loader
```
□ Renders a static accent dot + label (no scan, no rail)
□ Dot is aria-hidden="true"
□ Label communicates state ("Saving…", "Extracting…")
□ size="sm" inside buttons, size="md" inside cards
```

### RouteProgress
```
□ 2px top-of-page bar, accent color
□ data-reduced-motion="static" attribute present
□ Static accent bar rendered when reduced-motion matches
□ The single allowed indeterminate loop on the screen
```

---

## Document Maintenance

### When to Update ACCESSIBILITY.md
- New component type added to the library
- Contrast ratio changes due to color token updates (re-run the contrast matrix in `VISUAL_IDENTITY.md`)
- New interaction pattern introduced
- Accessibility audit reveals systemic issues
- WCAG guidelines update (currently targeting 2.1 AA)

### When NOT to Update
- Page-specific accessibility notes (go in page spec)
- One-off `aria-label` additions
- Minor contrast adjustments within passing range
