# PERFORMANCE.md — Frontend Performance Budgets & Optimization Governance

> **Role:** This document defines performance budgets, loading strategies, rendering patterns, and optimization rules for Receipt Guardian. Premium UX is not just visual — it's temporal. A beautiful page that loads in 4 seconds is not premium.

> **Authority chain:** Performance rules override visual polish. A fast page with slightly less animation beats a slow page with perfect motion.

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

### Bundle Size Budgets

| Asset | Budget | Current Estimate |
|---|---|---|
| **First-load JS (shared)** | <80KB gzipped | Next.js runtime + React |
| **Per-page JS** | <30KB gzipped | Page-specific client components |
| **Total CSS** | <15KB gzipped | Tailwind (purged) + globals |
| **Font files** | <100KB total | Inter variable + JetBrains Mono variable |
| **Total first-load** | <250KB | All assets for initial page render |

### Interaction Budgets

| Interaction | Budget | Notes |
|---|---|---|
| **Button click → visual feedback** | <50ms | Active state must appear instantly |
| **Form submit → toast** | <500ms | Network + processing time |
| **Search filter → results update** | <100ms | Client-side filtering, no debounce |
| **Navigation → new page** | <200ms | Server Component render + streaming |
| **Dialog open → visible** | <50ms | No animation delay on open |

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
- `urgency-badge.tsx` — conditional animation class
- `auth-form.tsx` — form submission with `useTransition`
- `test-extraction-form.tsx` — form with state

**Rules:**
- Push `"use client"` as deep as possible — wrap only the interactive part, not the whole page.
- Never put `"use client"` on a layout file.
- If a component only renders data (no hooks, no handlers), it's a Server Component.

### Streaming & Suspense
**Strategy:** Use Suspense boundaries for async data that shouldn't block the page shell.

**Rules:**
- Auth pages use `<Suspense>` around the form (for `useSearchParams`)
- Dashboard renders synchronously (data fetched in the Server Component)
- No loading skeletons for the full page — the server renders complete HTML
- Suspense fallbacks should be minimal (empty div or null), not skeleton UIs

---

## 5. Asset Optimization

### Fonts
**Strategy:** Next.js `next/font` with variable fonts for optimal loading.

```typescript
// Correct: Variable fonts with next/font
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
```

**Rules:**
- Only two fonts: Inter (body) and JetBrains Mono (data/code)
- Use `next/font` — automatic optimization, no FOUT
- `subsets: ["latin"]` — don't load unnecessary character sets
- Variable fonts — one file covers all weights, smaller than multiple static files
- `font-display: swap` is handled by Next.js automatically

### Images
**Strategy:** Receipt Guardian is text-heavy with no images in the UI.

**Rules:**
- No hero images, no illustrations, no decorative graphics
- If images are ever needed: use `next/image` with explicit dimensions
- No SVG illustrations — icons come from Lucide (tree-shaken)
- No background images — solid colors only

### Icons
**Strategy:** Lucide React with tree-shaking.

**Rules:**
- Import individual icons: `import { ArrowRight } from "lucide-react"`
- Never import the entire library
- Icons are inline SVGs — no additional network requests
- Current icon count: ~15 unique icons (well within budget)

### CSS
**Strategy:** Tailwind CSS with aggressive purging.

**Rules:**
- Tailwind purges unused utilities at build time
- No custom CSS files beyond `globals.css`
- No CSS-in-JS libraries (styled-components, emotion, etc.)
- No CSS modules — Tailwind utilities are sufficient
- `globals.css` contains only: Tailwind directives, CSS variables, base resets, reduced-motion media query

---

## 6. Data Loading Patterns

### Server-Side Data Fetching (Preferred)
```typescript
// Correct: Data fetched in Server Component
export default async function DashboardPage() {
  const user = await requireUser();
  const { data } = await supabase.from("receipts").select("*").eq("user_id", user.id);
  return <ReceiptDashboard initialReceipts={mapReceipts(data)} />;
}
```

**Rules:**
- Fetch data in the page Server Component, pass as props to Client Components
- No `useEffect` for initial data loading — server handles it
- No loading spinners for page-level data — it arrives with the HTML
- Client Components receive `initialReceipts` (or similar) as props

### Client-Side Mutations
```typescript
// Correct: Mutations via fetch in Client Component
function submitReceipt() {
  startTransition(async () => {
    const response = await fetch("/api/receipts", { method: "POST", ... });
    // handle response
  });
}
```

**Rules:**
- Use `useTransition` for mutations — React manages pending state
- No SWR or React Query — the app is simple enough for manual fetch
- Optimistic updates are acceptable for status changes
- Always show toast on completion (success or error)
- Never refetch all data after a single mutation — update state locally

### API Route Performance
**Rules:**
- API routes should respond in <500ms for mutations
- Use Supabase client directly — no ORM overhead
- Validate input with Zod — fail fast on bad data
- Return minimal response — only the affected record, not the full list

---

## 7. Runtime Performance

### React Rendering Optimization
**Rules:**
- Use `useMemo` for expensive computations (filtering, sorting receipts)
- Use `useTransition` for non-urgent updates (form submissions)
- Don't memoize everything — only computations that are measurably expensive
- No `React.memo` on components unless profiling shows re-render problems
- Keep component trees shallow — deep nesting causes cascade re-renders

### DOM Performance
**Rules:**
- No layout thrashing — batch DOM reads and writes
- Animations use `transform` and `opacity` only — GPU-composited, no reflow
- No `will-change` unless profiling shows jank
- Scroll handlers (if any) must be passive
- No `requestAnimationFrame` loops — CSS handles all animations

### Memory Management
**Rules:**
- Clean up `setTimeout`/`setInterval` in useEffect cleanup
- No memory leaks from event listeners
- Receipt list is bounded (user's receipts, not infinite)
- No client-side caching beyond React state

---

## 8. Build Optimization

### Next.js Configuration
**Rules:**
- Use App Router (already configured)
- Enable static generation where possible (`export const dynamic = "force-static"`)
- Dashboard uses `force-dynamic` (requires auth) — this is correct
- No custom webpack configuration unless absolutely necessary
- Use built-in Next.js optimizations (code splitting, prefetching)

### Dependency Hygiene
**Rules:**
- Every dependency must justify its bundle cost
- Prefer native APIs over libraries (e.g., `Intl.NumberFormat` over `numeral.js`)
- No utility libraries for single functions (no lodash for one `debounce`)
- Audit bundle size after adding any dependency
- Current dependency philosophy: minimal, focused, well-maintained

### Current Dependency Audit
| Dependency | Size Impact | Justification | Verdict |
|---|---|---|---|
| `react` + `react-dom` | ~40KB gz | Framework | Required |
| `next` | ~80KB gz | Framework | Required |
| `sonner` | ~5KB gz | Toast notifications | Justified (no lighter alternative) |
| `lucide-react` | ~2KB gz (tree-shaken) | Icons | Justified |
| `class-variance-authority` | ~2KB gz | Component variants | Justified |
| `clsx` + `tailwind-merge` | ~3KB gz | Class merging | Justified |
| `@supabase/ssr` | ~10KB gz | Auth + DB | Required |
| `zod` | ~8KB gz | Validation | Justified |
| `date-fns` | ~3KB gz (tree-shaken) | Date formatting | Justified |

---

## 9. Monitoring & Verification

### How to Verify Performance
1. **Build analysis:** `next build` shows page sizes and static/dynamic status
2. **Lighthouse:** Run on each page, target 90+ Performance score
3. **Bundle analysis:** Use `@next/bundle-analyzer` if bundle grows unexpectedly
4. **Real-world testing:** Test on throttled connection (3G) to verify perceived speed

### Performance Regression Prevention
- Check `next build` output after every significant change
- If a page's JS bundle exceeds 30KB gzipped, investigate
- If a new `"use client"` directive is added, verify it's necessary
- If a new dependency is added, check its bundle impact

### Red Flags
- Page shows loading spinner before content → Server Component should render it
- Navigation causes a white flash → Layout isn't shared correctly
- Typing in search feels laggy → Filter computation needs `useMemo`
- Button click has visible delay → Missing `active:scale-[0.98]` instant feedback
- Page content shifts after load → CLS issue, likely font or async content

---

## 10. Performance Anti-Patterns

### DO NOT:
- ❌ Use `"use client"` on page-level components when only a child needs interactivity
- ❌ Fetch data in `useEffect` when it can be fetched on the server
- ❌ Import entire icon libraries (`import * as Icons from "lucide-react"`)
- ❌ Add CSS-in-JS libraries (runtime CSS generation is slow)
- ❌ Use `useEffect` for derived state (use `useMemo` instead)
- ❌ Add loading skeletons for server-rendered content
- ❌ Use `setTimeout` for animation timing (use CSS transitions)
- ❌ Add analytics/tracking scripts without lazy loading
- ❌ Use `dangerouslySetInnerHTML` for user content (XSS + no optimization)
- ❌ Add polyfills for modern browser APIs (target modern browsers only)
- ❌ Use `position: fixed` for elements that could be in flow
- ❌ Add third-party scripts in `<head>` (blocks rendering)
- ❌ Use synchronous `localStorage` reads during render
- ❌ Create new object/array references on every render (breaks memoization)

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
├── Is it <5KB gzipped? → Acceptable
├── Is it 5-20KB? → Justify carefully
└── Is it >20KB? → Almost certainly no
```

---

## Document Maintenance

### When to Update PERFORMANCE.md
- Performance budgets need adjustment based on real-world data
- New rendering patterns are introduced (e.g., streaming, partial prerendering)
- New dependencies are added that affect bundle size
- A performance regression is discovered and a new rule prevents recurrence

### When NOT to Update
- Minor bundle size fluctuations within budget
- Next.js version upgrades (unless they change rendering behavior)
- Individual page optimizations that don't establish new patterns
