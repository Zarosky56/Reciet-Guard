# PERFORMANCE.md — Frontend Performance Budgets & Optimization Governance

> **Role:** This document defines performance budgets, loading strategies, rendering patterns, and optimization rules for Receipt Guardian. Premium UX is not just visual — it's temporal. A beautiful page that loads in 4 seconds is not premium.

> **Authority chain:** Performance rules override visual polish. A fast page with slightly less animation beats a slow page with perfect motion.

> **Redesign sync (premium-ui-redesign).** Bundle, font, animation, and asset budgets below have been re-grounded in the redesigned token + primitive set. The numeric ceilings come from Requirement 12 and from the snapshot in `design-system/__tests__/bundle-baseline.json`. The animation property restriction comes from Requirement 6.5 and the indeterminate-loop cap from Requirement 6.8.

---

## 1. Purpose

Performance governance exists because:
- Perceived quality degrades with every 100ms of delay
- AI agents default to heavy implementations unless constrained
- Next.js provides powerful optimization primitives that must be used correctly
- Dark theme + minimal UI should result in exceptionally fast pages
- Premium SaaS products load instantly — that's part of the luxury

This document answers: "How fast should this be, and how do we keep it fast?"

---

## 2. Performance Philosophy

### Core Beliefs
1. **Speed is a feature** — Users perceive fast apps as higher quality, regardless of visual design.
2. **Server-first rendering** — Default to Server Components. Client Components are opt-in, not default.
3. **Minimal JavaScript** — Every `"use client"` directive adds to the bundle. Justify each one.
4. **No loading spinners for navigation** — Pages render on the server. Navigation is instant.
5. **Progressive enhancement** — The page works without JavaScript. Interactivity enhances, not enables.

### The Performance-Quality Relationship
```
Fast + Beautiful = Premium (target)
Fast + Ugly = Functional (acceptable temporarily)
Slow + Beautiful = Template (unacceptable)
Slow + Ugly = Broken (critical failure)
```

---

## 3. Performance Budgets

### Page Load Budgets

| Metric | Budget | Measurement |
|---|---|---|
| **First Contentful Paint (FCP)** | <1.0s | Time to first meaningful pixel |
| **Largest Contentful Paint (LCP)** | <1.5s | Time to largest visible element |
| **Time to Interactive (TTI)** | <2.0s | Time until page responds to input |
| **Cumulative Layout Shift (CLS)** | <0.05 | Visual stability during load |
| **First Input Delay (FID)** | <50ms | Responsiveness to first interaction |
| **Route transition** | <200ms | On Lighthouse mobile profile (Requirement 12.5) |

### Redesign bundle budgets (Requirement 12.1, 12.2)

The redesign ships against a frozen pre-redesign snapshot in `design-system/__tests__/bundle-baseline.json`. The CI job in `.github/workflows/ci.yml` (`performance-budget`) runs `next build` and fails if either ceiling is exceeded.

| Asset | Pre-redesign baseline (gzipped) | Redesign ceiling (gzipped) | Delta cap |
|---|---|---|---|
| `/dashboard` first-load JS | 174,858 B (≈170.8 KB) | baseline + **10 KB** | +10 KB |
| Total CSS | 8,431 B (≈8.2 KB) | baseline + **5 KB** | +5 KB |

**Enforcement.** `scripts/check-bundle-size.mjs` (task 13.1) reads `.next/build-manifest.json` and the emitted `static/css/*` files after `next build`, compares against `bundle-baseline.json`, and exits non-zero if either delta is exceeded. The check runs in CI as the `performance-budget` job alongside `lint`, `typecheck`, `sadtest`.

**Re-baselining.** If a future change *intentionally* shifts the baseline (e.g. a major framework upgrade), regenerate `bundle-baseline.json` in the same PR and document the rationale in the PR description.

### Static framework budgets (informational)

| Asset | Budget | Notes |
|---|---|---|
| **First-load JS (shared)** | <80 KB gzipped | Next.js runtime + React |
| **Per-page JS** | <30 KB gzipped | Page-specific client components |
| **Font files** | <100 KB total | UI sans regular weight + JetBrains Mono variable |
| **Total first-load** | <250 KB | All assets for initial page render |

### Interaction Budgets

| Interaction | Budget | Notes |
|---|---|---|
| **Button click → visual feedback** | <50 ms | `active:scale-[0.985]` on `--motion-instant` (80ms) appears instantly |
| **Form submit → toast** | <500 ms | Network + processing time |
| **Search filter → results update** | <100 ms | Client-side filtering, no debounce |
| **Navigation → new page** | <200 ms | Server Component render + streaming, plus the single allowed `<RouteProgress>` 2px bar |
| **Dialog open → visible** | <50 ms first frame | `--motion-default` (220ms) total, transform/opacity only |

---

## 4. Rendering Strategy

### Server Components (Default)
**Use for:** All pages, layouts, and components that don't need interactivity.

| Page | Rendering | Reason |
|---|---|---|
| Landing (`/`) | Static (SSG) | No dynamic data, no auth |
| Login (`/login`) | Static shell + client form | Form needs `useTransition` |
| Signup (`/signup`) | Static shell + client form | Form needs `useTransition` |
| Dashboard (`/dashboard`) | Dynamic (SSR) | Requires auth + fresh data |
| Test extraction | Static shell + client form | Form needs state |

**Rules:**
- Default to Server Component. Add `"use client"` only when the component uses hooks, event handlers, or browser APIs.
- Server Components can `await` data directly — no `useEffect` + loading states.
- Server Components produce zero client-side JavaScript.

### Client Components (Opt-in)
**Use for:** Interactive forms, real-time filtering, state management.

**Current client components:**
- `receipt-dashboard.tsx` — manages receipt state, forms, search
- `receipt-card.tsx` — has click handlers for edit/delete/status
- `copy-forwarding-address.tsx` — clipboard API
- `urgency-badge.tsx` — conditional `attention` class on expired-red only
- `auth-form.tsx` — form submission with `useTransition`
- `test-extraction-form.tsx` — form with state
- `route-progress.tsx` — single `<RouteProgress>` indeterminate bar (the one allowed loop)

**Rules:**
- Push `"use client"` as deep as possible — wrap only the interactive part, not the whole page.
- Never put `"use client"` on a layout file.
- If a component only renders data (no hooks, no handlers), it's a Server Component.

### Streaming & Suspense
**Strategy:** Use Suspense boundaries for async data that shouldn't block the page shell.

**Rules:**
- Auth pages use `<Suspense>` around the form (for `useSearchParams`).
- Dashboard renders synchronously (data fetched in the Server Component).
- No loading skeletons for the full page — the server renders complete HTML.
- Suspense fallbacks should be minimal (empty div or null), not skeleton UIs.

---

## 5. Asset Optimization

### Fonts (Requirement 12.3)

**Strategy:** Two web-font families maximum, loaded via `next/font` with strict preload discipline.

| Family | Source | Subsets | Weights loaded | Preload |
|---|---|---|---|---|
| **UI sans (`--font-ui`)** — Geist Sans | `next/font/google` | `["latin"]` | Variable (regular weight is the only preloaded weight) | ✅ regular only |
| **Mono (`--font-mono`)** — JetBrains Mono | `next/font/google` | `["latin"]` | Variable | ❌ no preload |

```typescript
// app/layout.tsx (canonical)
const geist = Geist({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: "400",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});
```

**Rules:**
- **Two families maximum** (Requirement 12.3). Adding a third font requires a design-review exception.
- **Preload only the UI sans regular weight.** Bold and other weights are pulled on demand by the variable axis at zero additional network cost.
- **Latin subset only.** Don't ship Cyrillic, Greek, or Vietnamese unless the product expands into those locales.
- `display: "swap"` is the default — no FOIT.
- The OpenType feature set (`cv11`, `ss03`, `tnum` on Inter; re-mapped to `cv01`, `cv02`, `cv11` on Geist) is set globally on `body` in `globals.css`.

### Images (Requirement 12.4)

**Strategy:** Receipt Guardian is text-heavy with one decorative SVG (`public/brand/mark.svg`) and zero raster images on user-facing screens.

**Rules:**
- **No image asset under `public/` may exceed 16 KB** on a user-facing screen. The brand mark is a 24×24 SVG well under 1 KB.
- **No `<canvas>`, no WebGL, no `<video>` on any In_Scope_Screen.** This is a hard ban (Requirement 12.4).
- If raster images are ever needed: use `next/image` with explicit dimensions.
- No background images — solid tokens only. The hero "ambient band" in `<AmbientBackground variant="hero">` is a CSS `bg-canvas-raised` fill plus a single-color `mask-image: linear-gradient(...)` fade, not a raster.

**Property 16** (`design-system/__tests__/decorative-budget.property.test.ts`) caps decorative elements at one per screen. **`asset-budget.example.test.ts`** (task 13.3) asserts no asset under `public/` exceeds 16 KB and no user-facing component imports `<canvas>`, WebGL, or `<video>`.

### Icons
**Strategy:** Lucide React with tree-shaking and a single documented stroke width (`1.75`).

**Rules:**
- Import individual icons: `import { ArrowRight } from "lucide-react"`.
- Never import the entire library.
- Icons are inline SVGs — no additional network requests.
- The redesign curates the icon allow-list (~22 icons) in `design-system/REFERENCES.md`.

### CSS
**Strategy:** Tailwind CSS with aggressive purging.

**Rules:**
- Tailwind purges unused utilities at build time.
- No custom CSS files beyond `globals.css`.
- No CSS-in-JS libraries (styled-components, emotion, etc.).
- No CSS modules — Tailwind utilities are sufficient.
- `globals.css` contains only: Tailwind directives, redesigned CSS variables (color / spacing / radius / motion / typography), base resets, the global reduced-motion media query, and the `[data-reduced-motion="static"]` static-swap selector.

---

## 6. Data Loading Patterns

### Server-Side Data Fetching (Preferred)
```typescript
export default async function DashboardPage() {
  const user = await requireUser();
  const { data } = await supabase.from("receipts").select("*").eq("user_id", user.id);
  return <ReceiptDashboard initialReceipts={mapReceipts(data)} />;
}
```

**Rules:**
- Fetch data in the page Server Component, pass as props to Client Components.
- No `useEffect` for initial data loading — server handles it.
- No loading spinners for page-level data — it arrives with the HTML.

### Client-Side Mutations
```typescript
function submitReceipt() {
  startTransition(async () => {
    const response = await fetch("/api/receipts", { method: "POST", ... });
    // handle response
  });
}
```

**Rules:**
- Use `useTransition` for mutations.
- No SWR or React Query — the app is simple enough for manual fetch.
- Optimistic updates are acceptable for status changes.
- Always show toast on completion (success or error).
- Never refetch all data after a single mutation — update state locally.

### API Route Performance
- API routes should respond in <500 ms for mutations.
- Use Supabase client directly — no ORM overhead.
- Validate input with Zod — fail fast on bad data.
- Return minimal response — only the affected record, not the full list.

---

## 7. Runtime Performance

### Animation property restriction (Requirement 6.5)

**Only `transform` and `opacity` may participate in keyframes or transitions on user-facing components.** This restriction is non-negotiable: it is the difference between GPU-composited motion (cheap, off the main thread) and main-thread layout/paint cascades (expensive, jank-inducing).

| Property | Allowed in keyframes? | Allowed in transitions? | Notes |
|---|---|---|---|
| `transform` | ✅ | ✅ | All hover lifts, dialog slide-ins, route progress, attention pulse |
| `opacity` | ✅ | ✅ | Fade-in / fade-out, attention pulse |
| `width`, `height` | ❌ | ❌ | Causes layout |
| `top`, `left`, `right`, `bottom` | ❌ | ❌ | Causes layout |
| `margin`, `padding` | ❌ | ❌ | Causes layout |
| `box-shadow` | ❌ | ❌ | Causes paint cascades, also no glow shadows in the redesign |
| `filter` | ❌ | ❌ | Causes paint, expensive |
| `background` (image / position / size) | ❌ | ❌ | Causes paint |
| `background-color`, `border-color`, `color` | n/a | ✅ | Pragmatic exception: required for hover state-color shifts; cheap on compositor on modern engines |

The animation surface is exercised by the redesigned keyframes only:

| Keyframe | Property | Used by |
|---|---|---|
| `attention` | `opacity` | `<UrgencyBadge variant="danger">` on expired-red only |
| `route-progress` | `transform: translateX(...)` | `<RouteProgress>` |
| Dialog open/close | `transform`, `opacity` (framer-motion) | `<Dialog>` (the only retained framer-motion consumer) |

The deprecated `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`, `fade-in-up`, `pulse-red` keyframes are deleted in task 11.2 — none of them shipped on `transform`/`opacity` alone, and several drove `box-shadow` or `background` cascades.

### Indeterminate-loop cap (Requirement 6.8, 12.7)

**At most one indeterminate-loop animation may be visible on a screen at any time.**

The single allowed loop is `<RouteProgress>` — a 2 px top-of-page accent bar that runs only during route transitions. The `attention` pulse on expired-red urgency is *conditional* on a single critical badge per screen (not a continuous loop in the same sense), and is never present simultaneously with `<RouteProgress>` on the same frame.

The redesigned `<Loader>` family is **non-indeterminate by design**: it shows a static labeled state ("Saving…", "Extracting…") with a single static accent dot, replacing the legacy scan / rail / step vocabulary. This is the structural enforcement of Requirement 6.8.

### React Rendering Optimization
**Rules:**
- Use `useMemo` for expensive computations (filtering, sorting receipts).
- Use `useTransition` for non-urgent updates (form submissions).
- Don't memoize everything — only computations that are measurably expensive.
- No `React.memo` on components unless profiling shows re-render problems.
- Keep component trees shallow — deep nesting causes cascade re-renders.

### DOM Performance
**Rules:**
- No layout thrashing — batch DOM reads and writes.
- Animations use `transform` and `opacity` only — GPU-composited, no reflow (see table above).
- No `will-change` unless profiling shows jank.
- Scroll handlers (if any) must be passive.
- No `requestAnimationFrame` loops — CSS handles all animations.
- The reduced-motion clamp + `[data-reduced-motion="static"]` static-swap selectors keep main-thread cost at zero for users who opt out of motion.

### Memory Management
- Clean up `setTimeout` / `setInterval` in useEffect cleanup.
- No memory leaks from event listeners.
- Receipt list is bounded.
- No client-side caching beyond React state.

---

## 8. Build Optimization

### Next.js Configuration
- App Router is configured.
- Static generation where possible (`export const dynamic = "force-static"`).
- Dashboard uses `force-dynamic` (requires auth).
- No custom webpack configuration unless absolutely necessary.

### Dependency Hygiene
- Every dependency must justify its bundle cost.
- Prefer native APIs over libraries.
- No utility libraries for single functions.
- Audit bundle size after adding any dependency.

### Current Dependency Audit
| Dependency | Size impact | Justification | Verdict |
|---|---|---|---|
| `react` + `react-dom` | ~40 KB gz | Framework | Required |
| `next` | ~80 KB gz | Framework | Required |
| `framer-motion` | ~30 KB gz (tree-shaken) | Retained for `<Dialog>` open/close only — the only retained consumer after task 5.1 collapses motion primitives to `<Reveal>` | Justified, scoped |
| `sonner` | ~5 KB gz | Toast notifications, `role="status"` | Justified |
| `lucide-react` | ~2 KB gz (tree-shaken, ~22 icons) | Icons, single 1.75 stroke width | Justified |
| `class-variance-authority` | ~2 KB gz | Component variants | Justified |
| `clsx` + `tailwind-merge` | ~3 KB gz | Class merging | Justified |
| `@supabase/ssr` | ~10 KB gz | Auth + DB | Required |
| `zod` | ~8 KB gz | Validation | Justified |
| `date-fns` | ~3 KB gz (tree-shaken) | Date formatting | Justified |
| `fast-check` | dev only | Property-based testing harness | Required, dev-only |

---

## 9. Monitoring & Verification

### Verifying performance
1. **Build analysis:** `next build` shows page sizes and static/dynamic status.
2. **Bundle-budget gate:** `scripts/check-bundle-size.mjs` is wired into CI as the `performance-budget` job.
3. **Lighthouse:** Run on each page, target 90+ Performance score.
4. **Bundle analysis:** Use `@next/bundle-analyzer` if bundle grows unexpectedly.
5. **Real-world testing:** Throttled connection (3G) to verify perceived speed.

### Performance regression prevention
- Check `next build` output after every significant change.
- If `/dashboard` first-load JS exceeds baseline + 10 KB or total CSS exceeds baseline + 5 KB, the CI job fails the PR.
- If a new `"use client"` directive is added, verify it's necessary.
- If a new dependency is added, check its bundle impact and update the dependency audit table.

### Red flags
- Page shows loading spinner before content → Server Component should render it.
- Navigation causes a white flash → Layout isn't shared correctly.
- Typing in search feels laggy → Filter computation needs `useMemo`.
- Button click has visible delay → Missing `active:scale-[0.985]` instant feedback.
- Page content shifts after load → CLS issue, likely font or async content.
- More than one indeterminate loop visible at once → Requirement 6.8 violation.
- A keyframe transitions `width`, `height`, `box-shadow`, `filter`, or `background` → Requirement 6.5 violation.

---

## 10. Performance Anti-Patterns

### DO NOT:
- ❌ Use `"use client"` on page-level components when only a child needs interactivity.
- ❌ Fetch data in `useEffect` when it can be fetched on the server.
- ❌ Import entire icon libraries (`import * as Icons from "lucide-react"`).
- ❌ Add CSS-in-JS libraries (runtime CSS generation is slow).
- ❌ Use `useEffect` for derived state (use `useMemo` instead).
- ❌ Add loading skeletons for server-rendered content.
- ❌ Use `setTimeout` for animation timing (use CSS transitions).
- ❌ Add analytics/tracking scripts without lazy loading.
- ❌ Use `dangerouslySetInnerHTML` for user content (XSS + no optimization).
- ❌ Add polyfills for modern browser APIs.
- ❌ Use `position: fixed` for elements that could be in flow.
- ❌ Add third-party scripts in `<head>` (blocks rendering).
- ❌ Use synchronous `localStorage` reads during render.
- ❌ Create new object/array references on every render (breaks memoization).
- ❌ **Animate `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter`, or `background`** — Requirement 6.5.
- ❌ **Render more than one indeterminate-loop animation per screen** — Requirement 6.8.
- ❌ **Preload more than the UI sans regular weight** — Requirement 12.3.
- ❌ **Ship a decorative asset >16 KB or use `<canvas>`/WebGL/`<video>` on a user-facing screen** — Requirement 12.4.

---

## 11. Performance Decision Tree

When making implementation decisions that affect performance:

```
Q: Does this component need hooks or event handlers?
├── No → Server Component (zero JS)
└── Yes → Client Component
     └── Q: Can the interactive part be isolated?
          ├── Yes → Wrap only the interactive part in "use client"
          └── No → Make the whole component client-side

Q: Does this data change between requests?
├── No → Static generation (build time)
└── Yes →
     └── Q: Does it need auth?
          ├── Yes → Dynamic SSR (force-dynamic)
          └── No → ISR or static with client-side refresh

Q: Should I add this dependency?
├── Is there a native API? → Use native
├── Is it <5 KB gzipped? → Acceptable
├── Is it 5–20 KB? → Justify carefully, update the dependency audit
└── Is it >20 KB? → Almost certainly no

Q: I want to animate this property.
├── Is it transform or opacity? → ✅ Allowed
├── Is it background-color / border-color / color (transition only, hover state)? → ✅ Pragmatic exception
└── Anything else (width/height/top/left/margin/padding/box-shadow/filter/background)? → ❌ Forbidden (Requirement 6.5)

Q: I want to add a loading indicator.
├── Is there already an indeterminate loop visible on this screen? → ❌ Use a static <Loader> instead (Requirement 6.8)
└── Is this <RouteProgress>? → ✅ The one allowed loop
```

---

## Document Maintenance

### When to update PERFORMANCE.md
- Bundle baseline regenerated (re-run `bundle-baseline.json`, update the budget table here).
- New rendering patterns are introduced (e.g. streaming, partial prerendering).
- New dependencies are added that affect bundle size.
- A performance regression is discovered and a new rule prevents recurrence.
- The animation property restriction or indeterminate-loop cap changes (requires Requirement amendment).

### When NOT to update
- Minor bundle size fluctuations within the +10 KB JS / +5 KB CSS deltas.
- Next.js version upgrades (unless they change rendering behavior).
- Individual page optimizations that don't establish new patterns.
