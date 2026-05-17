# Landing Page Design Specification

## Purpose
The landing page (`/`) is the public-facing entry point for Receipt Guardian. It must instantly communicate the product's value proposition — "Never miss a return window again" — and convert visitors into signups. The user arrives with a specific pain point (managing return deadlines across purchases) and needs immediate reassurance that this tool solves it elegantly.

**User mindset:** Skeptical, time-pressed, evaluating whether the tool is worth creating yet another account. They need clarity, not marketing fluff.

---

## Layout Structure

### Section Order
1. **Navigation bar** — minimal, logo left, CTA buttons right
2. **Hero section** — headline, subtext, dual CTAs (primary: signup, secondary: login)
3. **Proof points grid** — 3 cards explaining the workflow in 3 steps

### Spacing
- Nav: `py-8` vertical, `px-6 md:px-8` horizontal
- Hero: `py-14 md:py-20` vertical padding, centered vertically with `flex-1`
- Proof grid: `mt-14` separation from hero
- Card internal: `p-5` padding

### Grids
- Proof points: single column on mobile, `md:grid-cols-3` on desktop
- Hero content: `max-w-3xl` constrained width, left-aligned

### Containers
- Root container: `max-w-6xl` with `mx-auto`, `px-6 md:px-8`
- No nested containers beyond the root — keeps layout flat and predictable

### Responsive Adaptations
- **Mobile (<768px):** Single column, stacked CTAs (`flex-col`), headline at `text-4xl`, proof cards stack vertically
- **Tablet (768-1024px):** `text-6xl` headline, side-by-side CTAs (`sm:flex-row`), 3-column grid for proof points
- **Desktop (1024px+):** Full layout with generous whitespace, `max-w-6xl` constraint prevents sprawl on ultrawide
- **Ultrawide:** Content stays centered within `max-w-6xl`, background remains solid `--color-bg`

---

## Visual Direction

### Aesthetic Tone
Dark, calm, confident. The page should feel like a premium SaaS tool — not a flashy consumer app. No gradients, no illustrations, no decorative elements. Trust is built through restraint.

### Visual Density
Low density. Generous whitespace between sections. The hero section uses vertical centering (`flex-1 justify-center`) to create breathing room. Each proof card has internal whitespace that lets the icon, title, and description breathe independently.

### Typography Emphasis
- **Headline:** `text-4xl md:text-6xl font-bold leading-[1.05]` — tight leading for impact, Inter variable font
- **Body:** `text-base md:text-lg leading-7` — comfortable reading line height
- **Card titles:** `text-base font-medium` — subordinate to headline
- **Card descriptions:** `text-sm leading-6` — secondary information
- **Nav logo:** `text-lg font-semibold` — understated brand presence

### Use of Whitespace
Whitespace is the primary luxury signal. The hero section floats in the vertical center of the viewport. Cards are separated by `gap-4`. No section feels cramped. The `max-w-3xl` constraint on hero copy prevents text from spanning too wide.

### Visual Focus Points
1. **Headline** — largest, boldest element, immediate value prop
2. **Primary CTA** — blue action button with arrow icon, strongest visual weight
3. **Proof icons** — small blue icons (`text-action`) provide subtle color accents without distraction

---

## Components

### shadcn/ui Components Used
- **Button** — `variant="default"` for primary CTA, `variant="secondary"` for secondary, `variant="ghost"` for nav login link
- **Card** — houses proof point content with `CardContent`
- **Icons** — `ArrowRight`, `MailCheck`, `ReceiptText`, `ShieldCheck` from Lucide

### Customization
- Buttons use `size="lg"` (`h-11 px-5`) for hero CTAs — larger than default but not oversized
- Cards retain default `rounded-card` border-radius and hover lift (`hover:-translate-y-0.5`)
- Ghost button in nav has no underline, relies on color shift on hover
- Icons in proof cards are `h-5 w-5` — intentionally small to avoid dominating the card

### Minimal vs Dense
This page uses **minimal layout** throughout. No dense data tables, no multi-column forms. Every element earns its place. The 3-card grid is the maximum information density allowed.

---

## Responsiveness

### Mobile (<768px)
- Single column throughout
- CTAs stack vertically (`flex-col gap-3`)
- Headline reduces to `text-4xl`
- Proof cards stack in single column
- Nav remains horizontal (logo left, buttons right) — no hamburger needed for 2 links

### Tablet (768-1024px)
- CTAs go side-by-side (`sm:flex-row`)
- Headline at `md:text-6xl`
- Proof cards at `md:grid-cols-3`

### Desktop (1024px+)
- Full layout with `max-w-6xl` centering
- Hero section has `md:py-20` for more vertical presence

### Ultrawide
- Content constrained to `max-w-6xl` — background extends infinitely as solid `--color-bg`
- No max-width background treatments or alternating stripes

### Touch Ergonomics
- CTA buttons are `h-11` (44px+) for comfortable tap targets
- Links in nav have sufficient padding via button component
- No hover-dependent interactions for critical paths

---

## Motion

### Hover Effects
- **Cards:** `hover:-translate-y-0.5` with `duration-200` — subtle lift, not bouncy
- **Buttons:** `hover:brightness-110` (primary), `hover:bg-surface-hover` (secondary), `hover:text-text-primary` (ghost)
- **Links:** Color transition via `transition` class

### Transitions
- All interactive elements use `duration-150` or `duration-200`
- No page-level transitions on this static page
- `active:scale-[0.98]` on buttons for tactile press feedback

### Page Animations
None. The landing page loads statically. No fade-in, no scroll-triggered reveals. This is intentional — the page should appear instantly, not animate into existence.

### Loading Interactions
Not applicable — this is a static server-rendered page with no async data dependencies.

### Modal Behavior
No modals on the landing page.

### Scroll Interactions
None. No parallax, no sticky elements, no scroll-jacking.

---

## Premium UX Rules

### Reduce Cognitive Load
- **Three proof points maximum** — the human brain easily processes triads
- **Icon + title + one-sentence description** pattern — scannable in under 5 seconds
- **No navigation complexity** — exactly two destinations (login, signup)
- **Single headline** — one message, no subheadline clutter

### Guide User Attention
- Visual hierarchy: headline → subtext → primary CTA → secondary CTA → proof points
- The primary CTA ("Start tracking") includes an arrow icon pointing right — directional cue toward action
- Proof icons use `text-action` (blue) — the only color accent, drawing eye to key information

### Luxury SaaS Feel
- Dark background (`#0a0a0f`) — feels serious, technical, trustworthy
- No gradients, no glassmorphism, no decorative blobs
- Typography-driven design — the font choices and spacing do the heavy lifting
- Restrained color palette — blue accent only, no rainbow

### Visual Calmness
- Consistent `gap-4` spacing rhythm
- Cards have identical internal padding (`p-5`)
- No animated background elements
- No auto-playing video or motion

### Polished Interactions
- Button press scale (`active:scale-[0.98]`) — subtle but noticeable
- Card hover lift — rewards exploration without demanding attention
- Copy text has comfortable `leading-7` — easy to read, not cramped

---

## Anti-Patterns

### DO NOT:
- ❌ Add a giant hero section with illustrations or Lottie animations
- ❌ Use gradient text or gradient backgrounds
- ❌ Add more than 3 proof point cards
- ❌ Include testimonials, logos, or social proof sections (premature for this stage)
- ❌ Add a pricing table on the landing page
- ❌ Use carousels or sliders
- ❌ Add "How it works" video or demo
- ❌ Include feature comparison tables
- ❌ Add footer with multiple link columns
- ❌ Use emoji or decorative icons
- ❌ Add background patterns, dots, or grids
- ❌ Implement scroll-based animations
- ❌ Use border-radius larger than `rounded-card` (consistency with design system)
- ❌ Add a "Learn more" link that scrolls down the page
- ❌ Use different card styles for different proof points

---

## Inspiration References

- **Linear** — Dark theme confidence, minimal landing page, single headline focus
- **Stripe** — Clean typography, restrained color, clear CTAs
- **Apple** — Generous whitespace, product-first messaging, no clutter
- **Vercel** — Dark background, geometric precision, developer-focused aesthetic
- **Raycast** — Dark UI, command palette inspiration, minimal marketing
