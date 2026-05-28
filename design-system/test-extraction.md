# Test Extraction Page Design Specification

> Premium UI Redesign — task 8.7 (`app/test-extraction/page.tsx`, `components/ai/test-extraction-form.tsx`).
> Validates Requirements 9.1, 9.7.

## Purpose
The test extraction page (`/test-extraction`) is a developer/debugging tool for testing the AI email extraction pipeline. It allows authenticated users to paste raw email text and see the parsed JSON result. This page is for power users and developers — not the primary user flow. It should feel like a technical tool: clean, functional, transparent.

**User mindset:** Technical user debugging extraction quality, testing edge cases, or verifying the AI pipeline is working correctly. Wants raw input → raw output with minimal ceremony.

---

## Redesigned composition (wireframe-level)

The redesigned page is a **single-column stack of two cards** (input → output) inside `<main className="max-w-content">` (`--container-content`, `56rem`). Every color, font, and surface routes through the redesigned tokens (Requirement 9.7). The developer-tool tone is preserved through the use of `font-mono` on the textarea, the JSON output, and the eyebrow caption.

```
┌────────────────────────────────────────────────────────────────────┐
│ <main> max-w-content, no <AmbientBackground>, no DashboardHeader   │
│                                                                    │
│  HEADER                                                            │
│    eyebrow "Developer tools"                                       │
│    H1      "Test email extraction"                                 │
│    p       "Paste an anonymized order email. Gemini is tried       │
│             first; Groq is used automatically when Gemini is       │
│             unavailable or low confidence."                        │
│                                                                    │
│  ┌─ grid gap-8 (header → form) ──────────────────────────────────┐│
│  │                                                                ││
│  │  ┌─ grid gap-4 (form cards) ─────────────────────────────────┐││
│  │  │                                                            │││
│  │  │  INPUT CARD                                                │││
│  │  │  ┌────────────────────────────────────────────────────┐    │││
│  │  │  │ <form grid gap-4>                                  │    │││
│  │  │  │   H2 <Sparkles size-5 text-accent /> "Order email  │    │││
│  │  │  │       input"                                       │    │││
│  │  │  │   p  "Paste any plain-text order confirmation to   │    │││
│  │  │  │       watch the pipeline parse it."                │    │││
│  │  │  │                                                    │    │││
│  │  │  │   <Textarea min-h-72 font-mono> {sampleEmail}      │    │││
│  │  │  │                                                    │    │││
│  │  │  │   ┌── flex justify-end ────────────────────────┐   │    │││
│  │  │  │   │ [Extract receipt → Loader during pending]  │   │    │││
│  │  │  │   └────────────────────────────────────────────┘   │    │││
│  │  │  └────────────────────────────────────────────────────┘    │││
│  │  │                                                            │││
│  │  │  OUTPUT CARD                                               │││
│  │  │  ┌────────────────────────────────────────────────────┐    │││
│  │  │  │ flex justify-between                               │    │││
│  │  │  │   H2 "Extraction result"        font-mono "JSON"   │    │││
│  │  │  │                                                    │    │││
│  │  │  │ <pre> JSON.stringify(result, null, 2)              │    │││
│  │  │  │   bg-canvas border-border min-h-36 font-mono       │    │││
│  │  │  │   tabIndex=0 aria-live="polite"                    │    │││
│  │  │  │                                                    │    │││
│  │  │  │   "No result yet."  ── default until first extract │    │││
│  │  │  └────────────────────────────────────────────────────┘    │││
│  │  └────────────────────────────────────────────────────────────┘││
│  └────────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

### Hero / main block prose

The page has no dashboard hero; its primary block is the **input card**. The input card opens with an H2 heading containing a leading `<Sparkles size-5 text-accent>` icon and the label "Order email input", followed by a one-sentence description ("Paste any plain-text order confirmation to watch the pipeline parse it."). Below the heading sits a `<Textarea>` pre-filled with `sampleEmail` — a realistic dummy order confirmation that demonstrates the expected format. The textarea uses `min-h-72 font-mono text-sm leading-6` so the email reads as code, not prose.

A `flex justify-end` row at the bottom of the form contains the single `<Button>` whose label reads "Extract receipt" idle and "Extracting receipt" pending. While pending, the button renders an inline `<Loader size="sm" />` adjacent to the label — the redesigned single coherent loading vocabulary (Requirement 6.8, 8.6). There is no `<ActionLoader variant="extract" compact />` panel below the form; the inline button loader is the only pending indicator on the page.

The **output card** below contains an H2 ("Extraction result") with a trailing `font-mono uppercase` "JSON" caption right-aligned. Beneath the heading sits a `<pre>` block with `bg-canvas border-border min-h-36 font-mono text-xs leading-5 text-text-secondary`, `tabIndex={0}`, and `aria-live="polite"` so assistive tech announces results when they arrive. The default body is the literal string "No result yet." until the user runs an extraction; success replaces it with `JSON.stringify(result, null, 2)`.

**No ambient layer.** The dev-tool route renders on the bare canvas (Requirement 5.6, 13.10).

**No entrance animation.** The page renders statically (Requirement 6.2).

**Single-column only.** No multi-column grids (Requirement 4.5).

---

## Layout Structure

### Section Order
1. **Page header** — eyebrow + H1 + lede
2. **Input card** — `<Sparkles>` heading + description + `<Textarea>` + extract button
3. **Output card** — heading + JSON caption + `<pre>` output

### Spacing
- Root container: `mx-auto min-h-screen w-full max-w-content px-4 py-8 sm:px-6 md:px-8 md:py-10`
- Top-level grid: `grid gap-8`
- Form card grid: `grid gap-4` (input + output)
- Form internal: `grid gap-4`
- Heading internal: `grid gap-1` (heading row + description)
- Label-to-input gap: `gap-2`
- All values come from the spacing scale (Requirement 4.1)

### Containers
- `<main>` is `max-w-content` (`--container-content`, `56rem`) per Requirement 4.4 / 9.7
- Two `<Card>` instances stack vertically with `gap-4` between them

### Responsive Adaptations
- **Mobile (< `sm`):** Single column; `px-4`; textarea full width; `<pre>` may horizontal-scroll for long JSON lines
- **Tablet/Desktop (≥ `sm`):** Same single-column layout; `px-6` / `md:px-8`; `py-10` at `md`
- **Ultrawide:** Content stays within `max-w-content`

---

## Visual Direction

### Aesthetic Tone
Technical, utilitarian, transparent. The pre-filled sample email and raw JSON output signal that this is a debugging tool, not a polished consumer feature. The mono font on the textarea, the JSON caption, and the output `<pre>` reinforces the developer-tool affordance.

### Visual Density
Low. Two cards, one input, one output. The density is appropriate for a focused debugging task.

### Typography Emphasis
- **Eyebrow:** `text-xs uppercase tracking-wider text-text-muted`
- **H1:** `text-2xl font-semibold tracking-tight md:text-3xl`
- **Lede:** `text-sm leading-6 text-text-secondary`
- **Card H2:** `text-base font-semibold tracking-tight` with leading icon (input) or trailing JSON caption (output)
- **Textarea content:** `font-mono text-sm leading-6` — code-like
- **Output `<pre>`:** `font-mono text-xs leading-5 text-text-secondary`
- **JSON caption:** `font-mono text-xs uppercase tracking-wider text-text-muted`

### Use of Whitespace
- `gap-8` between header and form
- `gap-4` between input and output cards
- `gap-4` inside the form (heading → textarea → button row)
- `<pre>` has its own `p-4` padding for comfortable JSON reading

### Visual Focus Points
1. **Textarea** — primary interaction zone, pre-filled with sample data
2. **Extract button** — accent-filled primary action
3. **Output `<pre>`** — where attention shifts after extraction (announced via `aria-live="polite"`)

---

## Components

### Components Used
- `<Card>` + `<CardContent>` (`components/ui/card.tsx`)
- `<Button variant="primary">` (`components/ui/button.tsx`)
- `<Textarea>` (`components/ui/input.tsx`)
- `<Loader size="sm">` (`components/ui/loaders.tsx`) — inline pending indicator (Requirement 6.8, 8.6)
- Lucide icons: `<Sparkles>` rendered at `size-5 text-accent` with the documented stroke width (Requirement 7.2)
- `requireUser` (`lib/auth/session.ts`) — server-side guard

### Customization
- The `<Textarea>` is pre-filled via `useState(sampleEmail)` so the page works on first paint without copy-pasting
- The `<pre>` block uses `bg-canvas border-border` to render one step recessed from the surface card — the redesigned token equivalent of the deprecated `bg-bg-elevated` recessed tone
- The `<pre>` is focusable (`tabIndex={0}`) and announces updates (`aria-live="polite"`) so keyboard / screen-reader users can navigate to and hear the result
- Toast (`sonner`) surfaces "Receipt fields extracted" on success and "Extraction needs review" on a non-OK response

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ `<Sparkles>` inside a bordered `bg-bg-elevated` tile with `text-action shadow-inner-hair` (Requirement 7.4 forbids decorative icon tiles; `text-action` and `shadow-inner-hair` are deprecated tokens)
- ❌ `<ActionLoader variant="extract" compact />` panel beneath the form (collapsed onto the inline button loader)
- ❌ `bg-bg-elevated` recessed tone on the JSON pre block (replaced by `bg-canvas`)
- ❌ Syntax highlighting on the JSON output (premature, adds dependency)
- ❌ Tabs for different AI providers (the pipeline is automatic)
- ❌ History sidebar of past extractions
- ❌ Confidence-score visualization

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- Single column
- Textarea full width
- `<pre>` may horizontal-scroll for long JSON lines (`overflow-auto`)
- `px-4` page padding

### Tablet (`sm` – `md`, 640–768px)
- Same single-column layout
- `px-6` page padding

### Desktop (`md` ≥ 768px)
- `max-w-content` constraint
- `md:px-8`, `md:py-10`

### Ultrawide
- Content stays within `max-w-content`

### Touch Ergonomics
- Textarea is tall (`min-h-72`) — easy to tap into and edit
- Extract button uses Button primitive at default size (≥ 44px touch target)
- `<pre>` is scrollable — swipe to see overflow

---

## Motion

### Hover Effects
- **Extract button:** primary variant hover (no glow, no gradient)
- **Cards:** non-interactive (no `data-interactive="true"`) — no resting hover
- **`<pre>` block:** no hover affordance (it's read-only output)

### Transitions
- Button transitions inherited from Button primitive (`--motion-default`, `--ease-standard`)
- Textarea focus border transition

### Page Animations
None. Static render. No `<Reveal>`, no entrance animation (Requirement 6.2).

### Loading Interactions
- Extract button: text shifts to "Extracting receipt", inline `<Loader size="sm" />` renders adjacent to the label, button becomes `disabled`
- `<pre>` body is cleared (`setResult(null)`) when a new extraction starts — the literal "No result yet." string returns until the response lands
- Toast distinguishes between success ("Receipt fields extracted") and review-needed ("Extraction needs review")
- The button is the **only** loading indicator on the page (Requirement 6.8 — no other indeterminate loop)

### Modal Behavior
None.

### Scroll Interactions
None. The `<pre>` block has its own `overflow-auto` for long JSON.

---

## Premium UX Rules

### Reduce Cognitive Load
- Pre-filled sample — user doesn't need to find or compose test data
- Single action — one button, one purpose
- Clear result format — pretty-printed JSON, no interpretation layer
- Pipeline explanation in the page header — "Gemini is tried first; Groq is used automatically when Gemini is unavailable or low confidence."

### Guide User Attention
- Linear flow: read description → edit email → click extract → read result
- Result card sits below input — natural top-to-bottom reading
- JSON is pretty-printed with 2-space indent

### Luxury SaaS Feel
- Technical transparency builds trust — "here's exactly what the AI returns"
- Dark canvas + monospace fonts + accent on a single icon → developer tool aesthetic
- No marketing language

### Visual Calmness
- Two cards — no visual competition
- No real-time character count or validation
- No auto-extract on paste — user controls the action

### Polished Interactions
- Toast distinguishes success vs review-needed
- Result updates instantly on new extraction
- Previous result cleared when a new extraction starts
- Sample email is realistic — demonstrates expected format

---

## Anti-Patterns

### DO NOT:
- ❌ Add a "history" sidebar of past extractions
- ❌ Show a diff view between Gemini and Groq results
- ❌ Add confidence scores or visual indicators
- ❌ Include a "Copy result" button (user can select and copy from `<pre>`)
- ❌ Add tabs for different AI providers
- ❌ Show provider selection UI (it's automatic)
- ❌ Add a "Share result" or "Report issue" button
- ❌ Include a character counter on the textarea
- ❌ Auto-extract on paste
- ❌ Show loading progress or estimated time
- ❌ Add syntax highlighting to JSON output
- ❌ Reintroduce the `<Sparkles>`-in-a-tile mark
- ❌ Render `<ActionLoader>` beneath the form
- ❌ Reintroduce `bg-bg-elevated` on the `<pre>` block
- ❌ Add a "Use this result to create receipt" action (that's the dashboard's job)
- ❌ Add breadcrumb navigation

---

## Inspiration References

- **Raycast** — Developer tools aesthetic, dark theme, focused single-purpose views
- **Stripe** — API debugging tools, clean JSON display, technical transparency
- **Linear** — Minimal internal tools, no decoration, pure function
- **Vercel** — Developer-focused tools, dark theme, monospace output
