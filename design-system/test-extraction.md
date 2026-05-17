# Test Extraction Page Design Specification

## Purpose
The test extraction page (`/test-extraction`) is a developer/debugging tool for testing the AI email extraction pipeline. It allows authenticated users to paste raw email text and see the parsed JSON result. This page is for power users and developers — not the primary user flow. It should feel like a technical tool: clean, functional, no decoration.

**User mindset:** Technical user debugging extraction quality, testing edge cases, or verifying the AI pipeline is working correctly. Wants raw input → raw output with minimal ceremony.

---

## Layout Structure

### Section Order
1. **Page header** — title + description explaining the dual-AI pipeline
2. **Input card** — large textarea pre-filled with sample email, extract button
3. **Result card** — scrollable JSON pre block showing extraction output

### Spacing
- Root container: `mx-auto min-h-screen w-full max-w-4xl px-6 py-8 md:px-8`
- Header to form gap: `mb-8`
- Card gap: `gap-4`
- Textarea: `min-h-72` — tall enough to show substantial email content
- Result pre: `min-h-36` — compact but expandable

### Grids
- Single column `grid gap-4` — linear flow from input to output
- No multi-column layouts

### Containers
- Root: `max-w-4xl` — narrower than dashboard (6xl), appropriate for single-column form
- Cards: standard `Card` + `CardContent`
- No nested containers

### Responsive Adaptations
- **Mobile (<640px):** Single column, textarea at full width, pre block scrolls horizontally if needed
- **Tablet/Desktop (640px+):** Same single-column layout, `max-w-4xl` constraint
- **Ultrawide:** Content centered, background solid

---

## Visual Direction

### Aesthetic Tone
Technical, utilitarian, transparent. This page should feel like an internal tool — not a polished consumer feature. The pre-filled sample email and raw JSON output signal that this is for debugging, not daily use.

### Visual Density
Low. Two cards. One input. One output. No stats, no filters, no sidebars. The density is appropriate for a focused debugging task.

### Typography Emphasis
- **Title:** `text-3xl font-semibold` — "Test email extraction" — clear purpose
- **Description:** `text-sm leading-6 text-text-secondary` — explains the dual-AI pipeline
- **Label:** `text-sm font-medium` — "Email body"
- **Textarea content:** `text-sm leading-6` — readable email text
- **JSON output:** `font-mono text-xs leading-5` — JetBrains Mono, compact for data display
- **Result heading:** `text-base font-medium` — "Extraction result"

### Use of Whitespace
- `mb-8` between header and form — clear separation
- `gap-4` between cards — distinct input/output zones
- Internal card padding via `CardContent`
- Pre block has `p-4` — comfortable reading for JSON

### Visual Focus Points
1. **Textarea** — the primary interaction zone, pre-filled with sample data
2. **Extract button** — blue primary action
3. **Result pre** — the output, where the user's attention goes after extraction

---

## Components

### shadcn/ui Components Used
- **Card** — containers for input and output sections
- **Button** — `variant="default"` for extract action
- **Textarea** (native) — styled consistently with design system classes

### Customization
- Textarea uses `min-h-72` — significantly taller than default `min-h-32`
- Textarea pre-filled with `sampleEmail` constant — demonstrates expected format
- Pre block uses `overflow-auto` — handles long JSON without breaking layout
- Pre block background: `bg-bg` — slightly recessed from card surface
- Pre block border: `border-border` — subtle separation from card

### Minimal vs Dense
**Minimal.** Two cards, one action. The page does one thing and does it clearly. No tabs for different AI providers, no history of past extractions, no comparison view.

---

## Responsiveness

### Mobile (<640px)
- Single column
- Textarea at full width
- Pre block may require horizontal scroll for long JSON lines
- `px-6` padding

### Tablet (640-1024px)
- Same layout, `max-w-4xl` constraint
- `md:px-8` padding

### Desktop (1024px+)
- `max-w-4xl` — narrower than dashboard for focused task
- Comfortable reading width for JSON output

### Ultrawide
- Content centered, background solid

### Touch Ergonomics
- Textarea is tall (`min-h-72`) — easy to tap into and edit
- Extract button at `h-10` — standard touch target
- Pre block is scrollable — swipe to see overflow content

---

## Motion

### Hover Effects
- **Extract button:** `hover:brightness-110`
- **Cards:** Standard card hover (`hover:-translate-y-0.5`) — but these cards are not interactive, consider removing hover on result card

### Transitions
- Button: `duration-150`, `active:scale-[0.98]`
- Textarea focus: `transition` on border color

### Page Animations
None. Static render.

### Loading Interactions
- Extract button shows `Loader2` spinner with `animate-spin` during extraction
- Button text hidden during loading (only spinner visible)
- Result area shows "No result yet." before first extraction
- Toast confirms success or warns about review-needed status

### Modal Behavior
No modals.

### Scroll Interactions
None.

---

## Premium UX Rules

### Reduce Cognitive Load
- **Pre-filled sample** — user doesn't need to find or compose test data
- **Single action** — one button, one purpose
- **Clear result format** — raw JSON, no interpretation layer
- **Pipeline explanation in header** — "Gemini is tried first; Groq is used automatically when Gemini is unavailable"

### Guide User Attention
- Linear flow: read description → edit email → click extract → read result
- Result card appears below input — natural top-to-bottom reading
- JSON is pretty-printed with `JSON.stringify(result, null, 2)` — readable

### Luxury SaaS Feel
- Technical transparency builds trust — "here's exactly what the AI returns"
- Dark theme with monospace fonts — developer tool aesthetic
- No marketing language — pure functionality

### Visual Calmness
- Only two cards — no visual competition
- No real-time character count or validation
- No auto-extract on paste — user controls the action

### Polished Interactions
- Toast distinguishes between success and "needs review"
- Result updates instantly on new extraction
- Previous result cleared when new extraction starts (`setResult(null)`)
- Sample email is realistic — demonstrates expected format

---

## Anti-Patterns

### DO NOT:
- ❌ Add a "history" sidebar of past extractions
- ❌ Show a diff view between Gemini and Groq results
- ❌ Add confidence scores or visual indicators
- ❌ Include a "Copy result" button (user can select and copy from pre)
- ❌ Add tabs for different AI providers
- ❌ Show provider selection UI (it's automatic)
- ❌ Add a "Share result" or "Report issue" button
- ❌ Include a character counter on the textarea
- ❌ Auto-extract on paste
- ❌ Show loading progress or estimated time
- ❌ Add syntax highlighting to JSON output
- ❌ Include a "Clear" button (user can select-all + delete)
- ❌ Add a "Use this result to create receipt" action (that's the dashboard's job)
- ❌ Show the forwarding address on this page
- ❌ Add breadcrumb navigation

---

## Inspiration References

- **Raycast** — Developer tools aesthetic, dark theme, focused single-purpose views
- **Stripe** — API debugging tools, clean JSON display, technical transparency
- **Linear** — Minimal internal tools, no decoration, pure function
- **Vercel** — Developer-focused tools, dark theme, monospace output
