# Navigation Design Specification

## Purpose
Navigation in Receipt Guardian is intentionally minimal. The application currently has a flat structure with few pages, so navigation should not call attention to itself. It exists to serve the content, not to be a feature. The navigation system must feel invisible — users should move between pages without thinking about the navigation mechanism.

**User mindset:** Focused on their receipts, not on navigating the app. Navigation should be available when needed and invisible when not.

---

## Layout Structure

### Current Navigation Points
1. **Landing page nav** — logo (links to `/`) + "Log in" (ghost) + "Sign up" (filled)
2. **Dashboard header** — logo icon + app name + user email + "Log out" button
3. **Auth pages** — no nav, just the centered card with footer link to sibling page
4. **Test extraction** — no nav, authenticated page with just content

### Navigation Patterns

#### Unauthenticated State
- **Landing page:** Horizontal nav bar, `flex items-center justify-between`
  - Left: Logo/text link to `/`
  - Right: Two buttons — "Log in" (ghost variant) + "Sign up" (default variant)
  - Spacing: `gap-3` between buttons
  - No hamburger menu — two links don't justify it

#### Authenticated State
- **Dashboard header:** Horizontal bar with `border-b`
  - Left: Icon in bordered box + app name + user email
  - Right: "Log out" button (secondary variant) in a form
  - Mobile: stacks vertically (`flex-col` → `md:flex-row`)
  - No navigation links to other pages (currently only dashboard exists for auth users)

#### Auth Pages
- No navigation chrome
- Single footer link to switch between login/signup
- No "Back to home" link — reduces escape routes during conversion

### Spacing
- Landing nav: part of the `px-6 md:px-8 py-8` container
- Dashboard header: `py-5` with `border-b`
- Auth footer link: `mt-5` below form, `text-center`

### Responsive Adaptations
- **Mobile:** Dashboard header stacks vertically, landing nav stays horizontal (only 2 links)
- **Desktop:** All nav elements go horizontal with `md:flex-row`

---

## Visual Direction

### Aesthetic Tone
Invisible. The navigation should not be a design element — it should be a utility. No background color different from the page, no shadow, no blur effects. The dashboard header's `border-b` is the only visual separator, and it uses the standard `border-border` color.

### Visual Density
Minimal. Navigation contains only essential elements. No breadcrumbs, no tabs, no sidebar, no dropdown menus, no notification badges, no user avatar menu.

### Typography Emphasis
- **Logo:** `text-lg font-semibold` — understated
- **Nav links:** Button text sizing (inherits from Button component)
- **User email:** `text-sm text-text-secondary` — subordinate information
- **No nav labels** — buttons speak for themselves

### Use of Whitespace
- Nav elements use `gap-3` or `gap-4` — comfortable separation
- No crowding of navigation items
- The header's `border-b` spans full width — clear content boundary

---

## Components

### shadcn/ui Components Used
- **Button** — all navigation actions use Button component
  - Landing: `variant="ghost"` for login, `variant="default"` for signup
  - Dashboard: `variant="secondary"` for logout
- **Link** (Next.js) — wraps buttons with `asChild` prop

### Customization
- Logo icon uses a bordered box: `h-10 w-10 rounded-lg border border-border bg-surface`
- Icon inside uses `text-action` (blue) — subtle brand color
- No active state indicators needed (no nav links to highlight)

### What NOT to Build (Yet)
- No sidebar navigation
- No tab bar
- No breadcrumbs
- No dropdown user menu
- No command palette (future enhancement)
- No bottom navigation bar (mobile)
- No back button (browser handles this)

---

## Future Navigation Expansion

When the application grows, navigation should expand following these principles:

### When to Add Navigation
- **3+ authenticated pages** → add a minimal top-level nav or sidebar
- **User settings page** → add user menu dropdown in header
- **Multiple workspaces** → add workspace switcher
- **Help/docs** → add a "Help" link in footer or header

### Sidebar Navigation (Future)
If a sidebar becomes necessary:
- **Width:** 240-260px, collapsible to icon-only (56px)
- **Position:** Fixed left, full height
- **Items:** Icon + label, active state with subtle left border or background
- **Bottom section:** User info + settings + logout
- **Background:** `--color-surface` or transparent — never `--color-bg` (creates visual fracture)
- **No nested menus** — flat structure, maximum 5-7 items
- **Collapse transition:** Smooth width animation, 200ms

### Top Navigation (Future)
If top nav expands beyond current header:
- **Height:** 48-56px
- **Items:** Horizontal links with subtle underline active indicator
- **Right section:** User avatar menu
- **Background:** Transparent or `--color-surface` with `border-b`
- **No search bar in nav** — search belongs in page content

---

## Motion

### Hover Effects
- **Nav buttons:** Standard button hover states
- **Logo:** No hover effect (or subtle opacity shift)

### Transitions
- Button transitions inherited from Button component
- No nav-specific animations

### Page Transitions
- No page transition animations
- Navigation is instant — Next.js client-side routing

---

## Premium UX Rules

### Reduce Cognitive Load
- **No navigation decisions** — the user's path is linear
- **Consistent placement** — nav is always at the top, never moves
- **Minimal options** — 2 links max in any nav context
- **No navigation nesting** — no dropdowns, no expandable sections

### Guide User Attention
- Primary action (signup) uses filled button — stronger visual weight
- Secondary action (login) uses ghost button — available but not pushy
- Logout is secondary-styled — destructive enough to notice, not alarming

### Luxury SaaS Feel
- Navigation recedes — the content is the star
- No hamburger menu on mobile (for 2 links) — honest, direct
- The logo icon in a bordered box feels crafted, not generic
- No "sticky" nav that follows scroll — the page is short enough

### Visual Calmness
- No notification badges demanding attention
- No unread counts
- No "NEW" labels on nav items
- No animated hamburger menu icon

---

## Anti-Patterns

### DO NOT:
- ❌ Add a hamburger menu for 2 navigation links
- ❌ Use a sticky/fixed header that follows scroll
- ❌ Add a bottom tab bar for mobile
- ❌ Include breadcrumbs (premature for flat structure)
- ❌ Add a "Back" button in the UI (browser has one)
- ❌ Show notification badges in navigation
- ❌ Add a search bar in the header/nav
- ❌ Use a different background color for nav vs page
- ❌ Add drop shadows to the header
- ❌ Include a "What's new" or changelog link
- ❌ Show the user's avatar (not implemented yet)
- ❌ Add keyboard shortcut hints in nav
- ❌ Use underline animations on nav links
- ❌ Include a "Home" link when already on home

---

## Inspiration References

- **Linear** — Minimal top nav, content-first, no distractions
- **Arc Browser** — Chrome that disappears, content-first philosophy
- **Notion** — Minimal top bar, no sidebar when not needed
- **Stripe** — Clean header, clear CTAs, no nav clutter
- **Apple** — Navigation that serves content, never competes with it
