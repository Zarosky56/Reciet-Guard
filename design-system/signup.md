# Signup Page Design Specification

> Premium UI Redesign — task 8.2 (`app/(auth)/signup/page.tsx`).
> Validates Requirements 9.1, 9.3, 13.13.

## Purpose
The signup page (`/signup`) is the conversion point where visitors become users. It must feel welcoming, trustworthy, and lightweight. The user is taking a chance on a new tool — the signup experience should reward that trust with simplicity and clarity. A single piece of critical context: "Use the same email you plan to forward receipts from."

**User mindset:** New user, slightly hesitant, wants to understand what they're committing to before creating an account. Needs reassurance that this is low-friction and worth their email address.

---

## Redesigned composition (wireframe-level)

The signup route is a thin wrapper around the shared `<AuthShell>` composition (`components/auth/auth-shell.tsx`). The shell renders a centered Card at `max-w-auth` with the `<BrandMark>` and wordmark stacked above. The `<AuthForm mode="signup">` (`components/auth/auth-form.tsx`) renders inside the card and supplies the only signup-specific copy.

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
│   │       │ H1  ── "Create your account"                     │   │ │
│   │       │ p   ── "Use the same email you plan to forward   │   │ │
│   │       │         receipts from."                           │   │ │
│   │       │                                                  │   │ │
│   │       │ <form grid gap-4>                                │   │ │
│   │       │   ┌── Email     ──────────────────────────────┐  │   │ │
│   │       │   │ <Input type="email" autocomplete="email">│  │   │ │
│   │       │   └────────────────────────────────────────────┘  │   │ │
│   │       │   ┌── Password  ──────────────────────────────┐  │   │ │
│   │       │   │ <Input type="password"                   │  │   │ │
│   │       │   │   autocomplete="new-password" minLength=6│  │   │ │
│   │       │   └────────────────────────────────────────────┘  │   │ │
│   │       │   <Button size="lg" w-full> "Create account" + → │   │ │
│   │       └──────────────────────────────────────────────────┘   │ │
│   │     </CardContent>                                            │ │
│   │   </Card>                                                     │ │
│   │                                                               │ │
│   │   p ── "Already have an account?  Sign in →"                  │ │
│   │                                                               │ │
│   └────────────────────────────────────────────────────────────────┘
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Hero / main block prose

The signup screen is the sibling of the login screen — same shell, same card geometry, same vertical rhythm. It opens with an H1 ("Create your account") at the title-md step, followed by the **critical** lede sentence: "Use the same email you plan to forward receipts from." The lede carries the most important guidance on the page; it pre-empts the #1 support issue (signing up with the wrong email). The form is a `grid gap-4` of two labeled `<Input>` fields (email, password with `autoComplete="new-password"` and `minLength={6}`) and a full-width `<Button size="lg">` whose label reads "Create account" idle and "Creating account" pending. The submit button renders an inline `<Loader size="sm" />` when pending. A footer paragraph beneath the card links to `/login`.

**Shared with `/login`.** The `<AuthShell>` composition is identical between `/login` and `/signup`. The two routes differ **only** in heading copy, body copy, submit button label (idle + pending), and footer link target — all of which are carried by the `<AuthForm>` component via the `mode` prop (Requirement 9.3).

**No ambient layer.** Authentication routes render on the bare canvas (Requirement 5.6, 13.10).

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
- **Mobile (< `sm`):** Card fills the column width minus `px-6` page padding; fields stack
- **Tablet/Desktop (≥ `sm`):** Column constrained to `max-w-auth`, centered
- **Ultrawide:** Column stays centered; canvas remains solid `bg-canvas`

---

## Visual Direction

### Aesthetic Tone
Welcoming but professional. Same dark canvas + centered card pattern as `/login` — the consistency between auth pages signals reliability and reduces cognitive overhead when switching between them.

### Visual Density
Extremely low. Identical structure to login.

### Typography Emphasis
- **H1:** `text-2xl font-semibold tracking-tight` (title step), `text-text-primary`
- **Lede:** `text-sm leading-6 text-text-secondary` — carries the critical email-matching guidance
- **Field labels:** `text-sm font-medium text-text-primary`
- **Input text:** inherits from `<Input>` primitive
- **Submit button:** Button primitive at size `lg`
- **Footer paragraph:** `text-sm text-text-secondary` with inline accent link (`text-accent`, hover → `text-accent-hover`)

### Use of Whitespace
Identical to the login page. The consistency between auth pages is intentional.

### Visual Focus Points
1. **Card** — the only illuminated element
2. **H1 "Create your account"** — confirms the action
3. **Lede** — critical guidance about email matching
4. **Submit button** — full-width "Create account"
5. **Email field** — first input, browser autosuggests saved emails

---

## Components

### Components Used
- `<AuthShell>` (`components/auth/auth-shell.tsx`)
- `<BrandMark size="md" />` (`components/brand/brand-mark.tsx`)
- `<Card>` + `<CardContent>` (`components/ui/card.tsx`)
- `<Input>` (`components/ui/input.tsx`)
- `<Button variant="primary" size="lg" className="w-full">`
- `<Loader size="sm" />` (inline pending indicator)
- `<Suspense>` — wraps `<AuthForm>` for `useSearchParams`

### Customization
- The submit button shows `<Loader size="sm" label="" />` adjacent to "Creating account" when pending
- Email input: `autoComplete="email"`
- Password input: `autoComplete="new-password"`, `minLength={6}` (browser will offer to generate a password)
- `aria-busy={isSubmitting}` is set on the form during submission
- Footer link uses `text-accent` and `--motion-quick` color hover

### Anti-pattern guardrails (do **not** reintroduce)
- ❌ `bg-scene-auth` ambient background
- ❌ `border-conic-soft` halo around any element
- ❌ `<ReceiptText>`-in-a-tile mark
- ❌ `<ActionLoader>` scan glyph during submit
- ❌ `backdrop-blur-[1px]` on the card chrome
- ❌ `<FadeIn>` page-level entrance animation
- ❌ Password confirmation field
- ❌ Password strength meter
- ❌ Terms of Service checkbox

---

## Responsiveness

### Mobile (< `sm`, < 640px)
- Card fills available width
- `min-h-screen` ensures vertical centering
- Inputs at the standard primitive height (≥ 44px touch target per Requirement 11.6)
- No horizontal scroll risk

### Tablet (`sm` – `lg`, 640–1024px)
- Column constrained to `max-w-auth`
- Generous surrounding canvas

### Desktop (`lg`, 1024px+)
- Same as tablet — design stays focused

### Ultrawide
- Card centered, canvas extends infinitely

### Touch Ergonomics
- All interactive elements meet the 44×44 CSS-pixel minimum
- Submit button at `size="lg"`
- `px-6` prevents edge contact
- Password field triggers the appropriate mobile keyboard

---

## Motion

### Hover Effects
- **Submit button:** primary variant hover (no glow, no gradient)
- **Footer link:** color shift from `text-accent` → `text-accent-hover` over `--motion-quick`
- **Inputs:** border-color transition on hover/focus

### Transitions
- All interactive elements use `duration-quick` or `duration-default` with `ease-standard`
- No page-level transitions
- Reduced-motion users see no transition (global rule)

### Page Animations
None. Static render with `<Suspense>` boundary for `useSearchParams`.

### Loading Interactions
- Submit button shows "Creating account" text + inline `<Loader size="sm" />`
- Button becomes `disabled`; form sets `aria-busy={true}`
- Toast surfaces "Account created" success and error states
- Successful signup pushes the user to `/dashboard` via `router.push(next)` and `router.refresh()`

### Modal Behavior
None.

### Scroll Interactions
None.

---

## Premium UX Rules

### Reduce Cognitive Load
- Two fields only — email and password (no confirmation)
- Single clear H1
- No name field — captured later in `/profile` if needed
- No terms / privacy checkbox — implied by signup action
- No CAPTCHA on initial render

### Guide User Attention
- Vertical flow: BrandMark → H1 → critical lede → email → password → button → footer link
- The lede is the most important element after the H1 — it prevents the #1 support issue
- Full-width button creates a clear action endpoint

### Luxury SaaS Feel
- Consistent with login — sibling pages
- Dark canvas + single card pattern signals security and focus
- The lede shows product thinking — "we've anticipated your question"

### Visual Calmness
- No password strength meter
- No password requirements list visually rendered (browser enforces `minLength={6}`)
- No email verification status indicator on the form

### Polished Interactions
- Toast notifications for errors and success
- Email confirmation redirect to `/auth/callback` is handled by Supabase
- Redirect to `/dashboard` on success — immediate value delivery

---

## Anti-Patterns

### DO NOT:
- ❌ Add a password confirmation field
- ❌ Include a "Full name" field
- ❌ Add a "Terms of Service" checkbox
- ❌ Show a password strength meter
- ❌ List password requirements visually
- ❌ Add social signup buttons
- ❌ Reintroduce the `<ReceiptText>`-in-a-tile mark
- ❌ Use `bg-scene-auth` or any ambient background on the auth route
- ❌ Render an `<ActionLoader>` scan glyph during submit
- ❌ Use a multi-step signup wizard
- ❌ Add an "I'm not a robot" CAPTCHA
- ❌ Show email verification instructions on the signup page itself
- ❌ Use different card styling from the login page

---

## Inspiration References

- **Linear** — Minimal signup, no name field, dark theme
- **Stripe** — Clean form, contextual guidance, no clutter
- **Apple** — Simple account creation, trust through simplicity
- **Notion** — Email-only signup, minimal friction
- **Vercel** — Dark theme, focused form, no distractions
