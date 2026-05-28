# Login Page Design Specification

> Premium UI Redesign — task 8.2 (`app/(auth)/login/page.tsx`).
> Validates Requirements 9.1, 9.3, 13.13.

## Purpose
The login page (`/login`) is the authentication gateway for returning users. It must feel secure, frictionless, and reassuring. The user has already committed to the product — this page should not introduce doubt or complexity. A single focused task: enter credentials and access the dashboard.

**User mindset:** Returning user who wants to check their return deadlines. Impatient, possibly on mobile, wants to get in quickly. Any friction here risks abandonment.

---

## Redesigned composition (wireframe-level)

The login route is a thin wrapper around the shared `<AuthShell>` composition (`components/auth/auth-shell.tsx`). The shell renders a centered Card at `max-w-auth` with the `<BrandMark>` and wordmark stacked above. The `<AuthForm mode="login">` (`components/auth/auth-form.tsx`) renders inside the card and supplies the only login-specific copy.

```
┌────────────────────────────────────────────────────────────────────┐
│ <main> flex min-h-screen items-center justify-center px-6 py-12    │
│                                                                    │
│   ┌─ flex-col items-center, w-full max-w-auth ──────────────────┐ │
│   │                                                              │ │
│   │   <BrandMark size="md"> + "Receipt Guardian"                 │ │
│   │     ── inline-flex gap-2, no tile, no halo, no border        │ │
│   │     ── linked to "/", focus-visible outline only             │ │
│   │                                                              │ │
│   │   <Card className="w-full">                                  │ │
│   │     <CardContent>                                            │ │
│   │       ┌──────────────────────────────────────────────────┐   │ │
│   │       │ H1  ── "Welcome back"                            │   │ │
│   │       │ p   ── "Sign in to open your dashboard."         │   │ │
│   │       │                                                  │   │ │
│   │       │ <form grid gap-4>                                │   │ │
│   │       │   ┌── Email     ──────────────────────────────┐  │   │ │
│   │       │   │ <Input type="email" autocomplete="email">│  │   │ │
│   │       │   └────────────────────────────────────────────┘  │   │ │
│   │       │   ┌── Password  ──────────────────────────────┐  │   │ │
│   │       │   │ <Input type="password">                  │  │   │ │
│   │       │   └────────────────────────────────────────────┘  │   │ │
│   │       │   <Button size="lg" w-full> "Sign in" + → ◯  │   │ │
│   │       └──────────────────────────────────────────────────┘   │ │
│   │     </CardContent>                                            │ │
│   │   </Card>                                                     │ │
│   │                                                               │ │
│   │   p ── "New here?  Create an account →"                       │ │
│   │                                                               │ │
│   └────────────────────────────────────────────────────────────────┘
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Hero / main block prose

The login screen is a single illuminated card on the bare canvas. There is no `<AmbientBackground>` and no decorative element beyond the BrandMark + wordmark stacked above the card. Inside the card, the form opens with an H1 ("Welcome back") at the title-md step, followed by a one-sentence lede ("Sign in to open your dashboard."). The form is a `grid gap-4` of two labeled `<Input>` fields (email, password) and a full-width `<Button size="lg">` whose label reads "Sign in" idle and "Signing in" pending. The submit button renders an inline `<Loader size="sm" />` when `isSubmitting === true` — there is no `<ActionLoader>` scan glyph, no halo, no shadow. A footer paragraph beneath the card carries the inverse-action link to `/signup`.

**Shared with `/signup`.** The `<AuthShell>` composition is identical between `/login` and `/signup`. The two routes differ **only** in heading copy, body copy, submit button label (idle + pending), and footer link target — all of which are carried by the `<AuthForm>` component via the `mode` prop (Requirement 9.3).

**No ambient layer.** Authentication routes render on the bare canvas (Requirement 5.6, 13.10). The ambient band is reserved for the landing route's hero.

**No entrance animation.** The shell renders statically (Requirement 6.2).

---

## Layout Structure

### Section Order
1. **`<BrandMark>` + wordmark** — stacked above the card
2. **Centered card** — heading + form + inline footer-link paragraph
3. **No nav, no header chrome** — auth routes do not render `<DashboardHeader>` or `<MobileBottomNav>`

### Spacing
- Page wrapper: `flex min-h-screen items-center justify-center px-6 py-12`
- BrandMark → Card: `mb-6`
- Card internal: `<CardContent>` standard `p-5`
- Heading → form: `mb-6`
- Form fields: `grid gap-4`
- Form → footer link: `mt-6`
- All values come from the spacing scale (Requirement 4.1, 4.2)

### Containers
- `<main>` is full-viewport flex centered; no max-width applied directly
- Inner column: `max-w-auth` (= `--container-auth`, the documented auth container width per Requirement 4.4)
- Card is `w-full` inside the column

### Responsive Adaptations
- **Mobile (< `sm`):** Card fills the column width minus `px-6` page padding; fields stack at full width
- **Tablet/Desktop (≥ `sm`):** Column constrained to `max-w-auth`, centered with generous surrounding canvas
- **Ultrawide:** Column stays centered; canvas remains solid `bg-canvas`

---

## Visual Direction

### Aesthetic Tone
Secure, minimal, focused. The centered card on a dark canvas creates a "portal" feeling — the user is entering a secure space. The BrandMark above the card supplies brand identity without requiring a header bar.

### Visual Density
Extremely low. One BrandMark, one card, one heading, one lede, two fields, one button, one footer link. The surrounding darkness isolates the card.

### Typography Emphasis
- **H1:** `text-2xl font-semibold tracking-tight` (title step), `text-text-primary`
- **Lede:** `text-sm leading-6 text-text-secondary`
- **Field labels:** `text-sm font-medium text-text-primary`
- **Input text:** inherits from `<Input>` primitive
- **Submit button:** Button primitive at size `lg`
- **Footer paragraph:** `text-sm text-text-secondary` with inline accent link (`text-accent`, hover → `text-accent-hover`)

### Use of Whitespace
The dark canvas surrounding the card is the primary whitespace element. Internal card spacing comes from `<CardContent>` `p-5`. The form gap is `gap-4`. The footer link sits `mt-6` below the form.

### Visual Focus Points
1. **Card** — the only illuminated element on the page
2. **H1 "Welcome back"** — confirms the user is in the right place
3. **Submit button** — full-width, accent-filled, strongest visual weight
4. **Email field** — first input, browser autofocuses for many users

---

## Components

### Components Used
- `<AuthShell>` (`components/auth/auth-shell.tsx`)
- `<BrandMark size="md" />` (`components/brand/brand-mark.tsx`) — typographic SVG mark, no tile, no halo (Requirements 1.4, 1.5, 7.4)
- `<Card>` + `<CardContent>` (`components/ui/card.tsx`) — single solid surface, no `bg-card-elevated` overlay, no resting shadow (Requirement 8.4)
- `<Input>` (`components/ui/input.tsx`) — single border-color focus, no `shadow-[0_0_0_4px_rgba(...)]` halo (Requirement 8.5)
- `<Button variant="primary" size="lg" className="w-full">` (`components/ui/button.tsx`) — no gradient fill, no glow (Requirement 8.3)
- `<Loader size="sm" />` (`components/ui/loaders.tsx`) — inline pending indicator, single static dot + label
- `<Suspense>` (Next.js) — wraps `<AuthForm>` to satisfy `useSearchParams`

### Customization
- The submit button shows `<Loader size="sm" label="" />` adjacent to the pending label "Signing in"
- The footer "Create an account" link uses `text-accent` and the `--motion-quick` duration for color hover
- Email input has `autoComplete="email"`; password input has `autoComplete="current-password"`
- `aria-busy={isSubmitting}` is set on the form during submission

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ `bg-scene-auth` ambient background
- ❌ `border-conic-soft` halo around any element
- ❌ `<ReceiptText>`-in-a-tile mark — replaced by typographic `<BrandMark>`
- ❌ `<ActionLoader>` scan glyph during submit — replaced by inline `<Loader size="sm" />`
- ❌ `backdrop-blur-[1px]` on the card chrome
- ❌ `<FadeIn>` page-level entrance animation

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- Card fills available width minus `px-6` page padding
- `min-h-screen` ensures vertical centering
- Inputs at the standard primitive height (≥ 44px touch target per Requirement 11.6)
- No horizontal scroll risk — column is `max-w-auth` and `w-full`

### Tablet (`sm` – `lg`, 640–1024px)
- Column constrained to `max-w-auth`
- Generous surrounding canvas

### Desktop (`lg`, 1024px+)
- Same as tablet — the design does not scale up, it stays focused
- Centered card with `min-h-screen` vertical centering

### Ultrawide
- Card remains centered, canvas extends infinitely as solid `bg-canvas`

### Touch Ergonomics
- All interactive elements meet the 44×44 CSS-pixel minimum (Requirement 11.6)
- Submit button at `size="lg"` (≥ 44px)
- `px-6` ensures the card never touches the screen edges
- Footer link is a full inline target inside a `text-sm` paragraph; the surrounding `text-secondary` text supplies the leading

---

## Motion

### Hover Effects
- **Submit button:** primary variant hover (no glow, no gradient)
- **Footer link:** color shift from `text-accent` → `text-accent-hover` over `--motion-quick`
- **Inputs:** border-color transition from `border-border` → `border-border-strong` on hover, `border-border-focus` on focus

### Transitions
- All interactive elements use `duration-quick` or `duration-default` with `ease-standard`
- No page-level transitions
- Reduced-motion users see no transition (global rule)

### Page Animations
None. The shell renders statically. The `<Suspense>` boundary wraps `<AuthForm>` only for `useSearchParams` — no loading spinners visible.

### Loading Interactions
- During submit, the button text shifts to "Signing in" and an inline `<Loader size="sm" label="" />` appears
- The button becomes `disabled`; the form sets `aria-busy={true}`
- No spinner overlay, no scrim
- Toast (`sonner`) surfaces success ("Welcome back") and error states

### Modal Behavior
None. Errors display via toast at the bottom-right.

### Scroll Interactions
None. Page content fits within the viewport on every supported width.

---

## Premium UX Rules

### Reduce Cognitive Load
- Two fields only — email and password
- Single clear H1 ("Welcome back")
- No "remember me" checkbox
- No social login buttons
- No CAPTCHA on initial render

### Guide User Attention
- Vertical flow: BrandMark → H1 → lede → email → password → button → footer link
- Full-width button creates a clear termination point
- Footer link is the only escape route — directs to `/signup`

### Luxury SaaS Feel
- Dark canvas surrounding a single illuminated card
- BrandMark above the card supplies brand without a chrome bar
- Card border (`border-border`) is subtle — barely visible against the canvas
- Typography-driven, not decoration-driven

### Visual Calmness
- One interactive element at a time demands attention
- No password strength meter on login
- No "caps lock" warning (browser handles this)

### Polished Interactions
- Toast notifications for errors — non-blocking, auto-dismiss
- Button text + disabled state during submission
- Smooth focus transitions on inputs
- Redirect is instant on success

---

## Anti-Patterns

### DO NOT:
- ❌ Add a logo tile or large branding above the card
- ❌ Reintroduce the `<ReceiptText>`-in-a-tile mark
- ❌ Use `bg-scene-auth` or any other ambient background on the auth route
- ❌ Wrap the BrandMark in `border-conic-soft`
- ❌ Render an `<ActionLoader>` scan glyph during submit
- ❌ Include a "Forgot password?" link until the reset flow ships
- ❌ Add social login buttons (Google, GitHub, etc.)
- ❌ Show password requirements on login
- ❌ Add a "Remember me" checkbox
- ❌ Include testimonials or quotes near the form
- ❌ Use a split layout (form left, image right)
- ❌ Add decorative dots, grids, or gradients in the background
- ❌ Show error messages inline above the form (toasts handle errors)

---

## Inspiration References

- **Linear** — Dark auth pages, single card, no distractions
- **Stripe** — Clean form design, minimal fields, secure feel
- **Apple** — Centered card on dark background, no clutter
- **Notion** — Simple email/password form, no social auth clutter
- **Vercel** — Dark theme auth, minimal fields, focused design
