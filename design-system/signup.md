# Signup Page Design Specification

## Purpose
The signup page (`/signup`) is the conversion point where visitors become users. It must feel welcoming, trustworthy, and lightweight. The user is taking a chance on a new tool — the signup experience should reward that trust with simplicity and clarity. A single piece of critical context: "Use the same email you will forward receipts from."

**User mindset:** New user, slightly hesitant, wants to understand what they're committing to before creating an account. Needs reassurance that this is low-friction and worth their email address.

---

## Layout Structure

### Section Order
1. **Centered card** — the only visible element, vertically and horizontally centered
2. **Card header** — title ("Create your account") + contextual guidance subtext
3. **Form fields** — email, password
4. **Submit button** — full-width primary action
5. **Footer link** — "Already have an account? Log in" → `/login`

### Spacing
- Page wrapper: `flex min-h-screen items-center justify-center px-6 py-12`
- Card: `w-full max-w-md`
- Card internal: `p-6`
- Header to form gap: `mb-6`
- Form field gap: `gap-4` grid
- Form to footer link: `mt-5`

### Grids
- Form uses single-column `grid gap-4`
- No multi-column layouts

### Containers
- Root: full viewport height, centered with flexbox
- Card: `max-w-md` — prevents form from stretching too wide
- No other containers

### Responsive Adaptations
- **Mobile (<640px):** Card fills width minus `px-6`, fields stack naturally
- **Tablet/Desktop (640px+):** Card constrained to `max-w-md`, centered
- **Ultrawide:** Card stays centered, background remains solid

---

## Visual Direction

### Aesthetic Tone
Welcoming but professional. Same dark void + centered card pattern as login for consistency, but the copy is warmer and more instructive. The subtext carries the weight of guidance: "Use the same email you will forward receipts from."

### Visual Density
Extremely low. Identical structure to login page for cognitive consistency. Users who navigate between login/signup should feel the pages are siblings, not strangers.

### Typography Emphasis
- **Title:** `text-2xl font-semibold` — "Create your account" is action-oriented
- **Subtext:** `text-sm leading-6 text-text-secondary` — carries critical instruction about email usage
- **Labels:** `text-sm font-medium`
- **Input text:** `text-sm`
- **Footer link:** `text-sm text-text-secondary` with `text-action` link

### Use of Whitespace
Identical to login page. The consistency between auth pages is intentional — it signals reliability and reduces cognitive overhead when switching between them.

### Visual Focus Points
1. **Card** — the only illuminated element
2. **Title** — confirms action
3. **Subtext** — critical: "Use the same email you will forward receipts from"
4. **Submit button** — "Sign up" call to action
5. **Email field** — first input

---

## Components

### shadcn/ui Components Used
- **Card** — form container
- **Button** — `variant="default"` for submit, full-width
- **Input** (native) — styled consistently with design system
- **Link** (Next.js) — navigation to login

### Customization
- Card uses `max-w-md`
- Inputs use `h-11` (44px)
- Password input: `minLength={6}`, `autoComplete="new-password"` — browser triggers password generation
- Email input: `autoComplete="email"` — browser suggests saved emails
- Submit button full-width
- Link: `text-action hover:text-blue-300`

### Minimal vs Dense
**Absolute minimal.** Same philosophy as login. No password confirmation field (reduces friction — user can reset if they make a typo). No name field. No terms checkbox (implied by signup action).

---

## Responsiveness

### Mobile (<640px)
- Card fills available width
- `min-h-screen` ensures vertical centering
- Inputs at `h-11` for touch targets
- No horizontal scroll risk

### Tablet (640-1024px)
- Card at `max-w-md` (448px)
- Generous surrounding dark space

### Desktop (1024px+)
- Same as tablet — design stays focused, does not scale up

### Ultrawide
- Card centered, background extends infinitely

### Touch Ergonomics
- All interactive elements >44px
- `px-6` prevents edge contact
- No closely spaced tappable elements
- Password field triggers mobile keyboard with appropriate autocomplete

---

## Motion

### Hover Effects
- **Submit button:** `hover:brightness-110`
- **Link:** `hover:text-blue-300`
- **Inputs:** Border color transition on focus

### Transitions
- CSS `transition` on interactive elements
- No page-level transitions
- `active:scale-[0.98]` on submit button

### Page Animations
None. Static render with `Suspense` boundary for `useSearchParams`.

### Loading Interactions
- Submit button shows "Creating..." text during pending state
- Button becomes `disabled` — prevents double-submit
- No spinner for this short operation

### Modal Behavior
No modals. Errors via `toast` (Sonner).

### Scroll Interactions
None. Content fits within viewport.

---

## Premium UX Rules

### Reduce Cognitive Load
- **Two fields only** — email and password, no confirmation
- **Single clear title** — unambiguous action
- **No name field** — not needed for core functionality, can be added later in settings
- **No terms/privacy checkbox** — reduces friction, legal implied by action
- **No CAPTCHA** — trust-first approach

### Guide User Attention
- Vertical flow: title → critical subtext → email → password → button → alternate action
- Subtext is the most important element after the title — it prevents the #1 support issue (wrong email)
- Full-width button creates clear action endpoint

### Luxury SaaS Feel
- Consistent with login page — sibling pages, not distant relatives
- Dark void + single card pattern signals security and focus
- The instruction in subtext shows product thinking — "we've anticipated your question"

### Visual Calmness
- No password strength meter (reduces visual noise, avoids judgment)
- No "password requirements" list (minLength is enforced by browser validation)
- No email verification status indicator

### Polished Interactions
- Toast notifications for errors and success
- "Account created" success toast before redirect
- Email redirect to `/auth/callback` for verification (Supabase magic)
- Redirect to dashboard on success — immediate value delivery

---

## Anti-Patterns

### DO NOT:
- ❌ Add a password confirmation field
- ❌ Include a "Full name" field
- ❌ Add a "Terms of Service" checkbox
- ❌ Show password strength meter
- ❌ List password requirements visually
- ❌ Add social signup buttons
- ❌ Include a "Sign up with Google" option
- ❌ Show a "Why create an account?" explainer section
- ❌ Add testimonials near the form
- ❌ Use a multi-step signup wizard
- ❌ Add an "I'm not a robot" CAPTCHA
- ❌ Show email verification instructions on the signup page itself
- ❌ Add a "Back to home" link that competes with the form
- ❌ Use different card styling from login page
- ❌ Add decorative background elements

---

## Inspiration References

- **Linear** — Minimal signup, no name field, dark theme
- **Stripe** — Clean form, contextual guidance, no clutter
- **Apple** — Simple account creation, trust through simplicity
- **Notion** — Email-only signup, minimal friction
- **Vercel** — Dark theme, focused form, no distractions
