# Login Page Design Specification

## Purpose
The login page (`/login`) is the authentication gateway for returning users. It must feel secure, frictionless, and reassuring. The user has already committed to the product — this page should not introduce doubt or complexity. A single focused task: enter credentials and access the dashboard.

**User mindset:** Returning user who wants to check their return deadlines. Impatient, possibly on mobile, wants to get in quickly. Any friction here risks abandonment.

---

## Layout Structure

### Section Order
1. **Centered card** — the only visible element, vertically and horizontally centered
2. **Card header** — title ("Log in") + contextual subtext
3. **Form fields** — email, password
4. **Submit button** — full-width primary action
5. **Footer link** — "New here? Create an account" → `/signup`

### Spacing
- Page wrapper: `flex min-h-screen items-center justify-center px-6 py-12`
- Card: `w-full max-w-md` — constrained to 448px max
- Card internal: `p-6`
- Header to form gap: `mb-6`
- Form field gap: `gap-4` grid
- Form to footer link: `mt-5`

### Grids
- Form uses single-column `grid gap-4`
- No multi-column layouts — single task focus

### Containers
- Root: full viewport height, centered with flexbox
- Card: `max-w-md` — prevents form from stretching too wide on desktop
- No other containers — the card is the entire page content

### Responsive Adaptations
- **Mobile (<640px):** Card fills width minus `px-6` padding, form fields stack naturally
- **Tablet/Desktop (640px+):** Card constrained to `max-w-md`, centered with generous surrounding whitespace
- **Ultrawide:** Card stays centered, background remains solid `--color-bg`

---

## Visual Direction

### Aesthetic Tone
Secure, minimal, focused. The centered card on a dark void creates a "portal" feeling — the user is entering a secure space. No distractions, no branding beyond the card itself.

### Visual Density
Extremely low. One card. Two fields. One button. One link. The surrounding darkness (`--color-bg`) creates a sense of focus and security.

### Typography Emphasis
- **Title:** `text-2xl font-semibold` — clear but not shouty
- **Subtext:** `text-sm leading-6 text-text-secondary` — contextual, helpful
- **Labels:** `text-sm font-medium` — clear field identification
- **Input text:** `text-sm` — consistent with body size
- **Footer link:** `text-sm text-text-secondary` with `text-action` link

### Use of Whitespace
The dark background surrounding the card is the primary whitespace element. It isolates the card, creating tunnel vision toward the task. Internal card spacing is comfortable but not wasteful — `p-6` with `gap-4` between fields.

### Visual Focus Points
1. **Card** — the only illuminated element on the page
2. **Title** — confirms the user is in the right place
3. **Submit button** — full-width blue, strongest visual weight
4. **Email field** — first input, auto-focused by browser

---

## Components

### shadcn/ui Components Used
- **Card** — the container for the entire form
- **Button** — `variant="default"` for submit, full-width
- **Input** (native) — styled with consistent border/background classes
- **Link** (Next.js) — for navigation to signup

### Customization
- Card uses `max-w-md` to constrain width
- Inputs use `h-11` (44px) — slightly taller than default for better touch targets and visual presence
- Input focus state: `focus:border-border-focus` — subtle blue-ish border highlight
- Submit button is full-width within the form grid
- Link uses `text-action hover:text-blue-300` — subtle brightness shift on hover

### Minimal vs Dense
This page uses **absolute minimal layout**. Every element is essential. No logos, no hero, no side content, no "remember me" checkbox, no social login buttons. Purity of purpose.

---

## Responsiveness

### Mobile (<640px)
- Card fills available width (minus `px-6`)
- `min-h-screen` ensures vertical centering even on small viewports
- Inputs at `h-11` provide comfortable tap targets (>44px)
- No horizontal scroll risk — `max-w-md` with `w-full`

### Tablet (640-1024px)
- Card at `max-w-md` (448px) — comfortable form width
- Generous surrounding dark space creates focus

### Desktop (1024px+)
- Same as tablet — the design does not scale up, it stays focused
- Centered card with `min-h-screen` vertical centering

### Ultrawide
- Card remains centered, background extends infinitely
- No max-width background treatments

### Touch Ergonomics
- All interactive elements exceed 44px minimum touch target
- Input fields at `h-11` (44px)
- Submit button at `h-11` (44px)
- No closely spaced tappable elements
- `px-6` ensures card doesn't touch screen edges

---

## Motion

### Hover Effects
- **Submit button:** `hover:brightness-110` — subtle glow
- **Link:** `hover:text-blue-300` — color shift
- **Inputs:** Border color transition on focus — `transition` class

### Transitions
- All interactive elements use CSS `transition` for smooth state changes
- No page-level transitions
- `active:scale-[0.98]` on submit button for press feedback

### Page Animations
None. The page renders statically. The `Suspense` boundary wraps the form only for `useSearchParams` — no loading spinners visible.

### Loading Interactions
- Submit button shows "Logging in..." text during `useTransition` pending state
- Button becomes `disabled` during submission — prevents double-submit
- No spinner — text change is sufficient for this short operation

### Modal Behavior
No modals. Errors display via `toast` (Sonner) at bottom-right.

### Scroll Interactions
None. Page content fits within viewport on all screen sizes.

---

## Premium UX Rules

### Reduce Cognitive Load
- **Two fields only** — email and password, nothing else
- **Single clear title** — "Log in" is unambiguous
- **No "remember me"** — reduces decision fatigue, browser handles this natively
- **No social login** — single authentication method, no paradox of choice
- **No CAPTCHA on initial render** — trust the user until proven otherwise

### Guide User Attention
- Vertical flow: title → subtext → email → password → button → alternate action
- Full-width button creates a clear termination point
- Subtext provides context without adding fields

### Luxury SaaS Feel
- Dark void surrounding a single illuminated card — feels secure and premium
- No branding on the card itself — the user knows where they are
- Typography-driven, not decoration-driven
- The card's border (`border-border`) is subtle — barely visible against the dark background

### Visual Calmness
- Only one interactive element at a time demands attention
- No blinking cursors beyond the focused input
- No password strength meter (for login)
- No "caps lock" warning (browser handles this)

### Polished Interactions
- Toast notifications for errors — non-blocking, auto-dismiss
- Button state changes (text + disabled) during submission
- Smooth focus transitions on inputs
- Redirect is instant on success — no "redirecting..." interstitial

---

## Anti-Patterns

### DO NOT:
- ❌ Add a logo or large branding above the card
- ❌ Include "Forgot password?" link (not yet implemented — add when reset flow exists)
- ❌ Add social login buttons (Google, GitHub, etc.)
- ❌ Show password requirements on login (only relevant for signup)
- ❌ Add a "Remember me" checkbox
- ❌ Include testimonials or quotes near the form
- ❌ Show the dashboard preview or screenshot beside the form
- ❌ Add a "Back to home" link that competes with the form
- ❌ Use a split layout (form left, image right)
- ❌ Add decorative elements like dots, grids, or gradients in the background
- ❌ Show error messages inline above the form — use toasts
- ❌ Add email validation beyond `type="email"` browser default
- ❌ Include a "Resend verification" link on the login page

---

## Inspiration References

- **Linear** — Dark auth pages, single card, no distractions
- **Stripe** — Clean form design, minimal fields, secure feel
- **Apple** — Centered card on dark background, no clutter
- **Notion** — Simple email/password form, no social auth clutter
- **Vercel** — Dark theme auth, minimal fields, focused design
