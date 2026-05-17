# DESIGN.md — Global Design System

> **Authority:** This document is the single source of truth for all visual, interaction, and structural decisions in Receipt Guardian. Page-level specs derive from and defer to this file. When in conflict, DESIGN.md wins.

---

## 1. Design Philosophy

**"Calm precision."** Every pixel must earn its place. The interface should feel like a well-organized desk — everything has a home, nothing shouts. Dark, restrained, typography-driven. Trust is built through consistency, not decoration.

### Core Principles
1. **Content first, chrome last** — Navigation and framing recede; data and actions dominate.
2. **One accent color** — Blue (`#3B82F6`). No rainbow. No gradient text. No decorative color.
3. **Whitespace is the luxury** — Generous spacing signals quality more than any ornament.
4. **Motion is meaning** — Animate only to provide feedback or draw critical attention.
5. **Dark-only** — No light mode. The app is a dark-first product. `color-scheme: dark` is set at `:root`.

---

## 2. Design Tokens

### Color Palette

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| Background | `#0A0A0F` | `bg-bg` | Page background, input backgrounds |
| Surface | `#14141B` | `bg-surface` | Cards, elevated containers |
| Surface Hover | `#1E1E28` | `bg-surface-hover` | Card/button hover states |
| Border | `#2A2A3A` | `border-border` | Default borders, dividers |
| Border Focus | `#3B3B50` | `border-border-focus` | Focus rings, hover borders |
| Text Primary | `#E8E8ED` | `text-text-primary` | Headlines, body text, labels |
| Text Secondary | `#A0A0B8` | `text-text-secondary` | Descriptions, metadata, subtext |
| Text Muted | `#6B6B80` | `text-text-muted` | Placeholders, tertiary info, stat labels |
| Success | `#10B981` | `text-success` | Green urgency badge, positive states |
| Warning | `#F59E0B` | `text-warning` | Amber urgency badge, caution states |
| Danger | `#EF4444` | `text-danger` | Red urgency badge, destructive actions |
| Action | `#3B82F6` | `bg-action` / `text-action` | Primary buttons, links, icons, selection |

### Color Rules
- **Never use raw hex values** in components. Always reference Tailwind tokens.
- **Action (blue) is the only accent.** Success/warning/danger are semantic, not decorative.
- **Text on bg:** `text-primary` for content, `text-secondary` for support, `text-muted` for tertiary.
- **Opacity variants** (e.g., `bg-red-500/10`) are acceptable for subtle backgrounds on badges and danger buttons.
- **No gradients.** No `bg-gradient-*`. No gradient text via `bg-clip-text`.

### Border Radius
| Token | Value | Usage |
|---|---|---|
| `rounded-card` | `12px` | Cards, dialogs, modals |
| `rounded-lg` | `8px` | Buttons, inputs, select elements |
| `rounded-md` | `6px` | Badges, small pills |

### Shadows
| Token | Value | Usage |
|---|---|---|
| `shadow-toast` | `0 4px 12px rgba(0,0,0,0.3)` | Toast notifications, dialogs |

**No other shadows.** Cards do not use `shadow-*`. Depth is conveyed through border contrast and hover lift, not drop shadows.

---

## 3. Typography System

### Font Families
| Role | Font | Tailwind | CSS Variable |
|---|---|---|---|
| Body / UI | Inter | `font-sans` | `var(--font-inter)` |
| Data / Code | JetBrains Mono | `font-mono` | `var(--font-jetbrains)` |

### Type Scale

| Level | Classes | Usage |
|---|---|---|
| **Hero** | `text-4xl md:text-6xl font-bold leading-[1.05]` | Landing headline only |
| **Page Title** | `text-2xl md:text-3xl font-semibold` | Page-level H1 |
| **Section Title** | `text-xl font-semibold` | Major section headers |
| **Subsection Title** | `text-base font-medium` | Card titles, form section headers |
| **Body** | `text-sm leading-6` | Descriptions, paragraph text |
| **Body Large** | `text-base md:text-lg leading-7` | Landing subtext only |
| **Label** | `text-sm font-medium` | Form labels, field identifiers |
| **Caption** | `text-xs` | Badge text, stat labels (uppercase), metadata |
| **Mono Data** | `font-mono text-xl font-semibold` | Stat values, numbers |
| **Mono Code** | `font-mono text-xs leading-5` | JSON output, code blocks |

### Typography Rules
- **No font weights below 400 or above 700.** Inter variable handles the range.
- **`letter-spacing: 0`** is set on body. Do not add `tracking-*` unless for uppercase captions.
- **Line heights:** `leading-[1.05]` for hero, `leading-6` (24px) for body, `leading-7` (28px) for large body.
- **No italic** for UI text. Reserved for editorial content only (which the app doesn't have).
- **No underline** except for links. Links use `text-action` color, not underline.
- **Monospace is for numbers and code only.** Never use JetBrains Mono for prose or labels.

---

## 4. Spacing System

### Container Widths
| Width | Tailwind | Usage |
|---|---|---|
| Narrow | `max-w-2xl` (672px) | Profile page |
| Medium | `max-w-4xl` (896px) | Settings, test extraction |
| Wide | `max-w-6xl` (1152px) | Dashboard, landing |
| Form | `max-w-md` (448px) | Auth cards |

### Spacing Scale
| Token | Value | Usage |
|---|---|---|
| `gap-2` | 8px | Between icon and text, tight button groups |
| `gap-3` | 12px | Between nav buttons, stat card grid |
| `gap-4` | 16px | Between cards, form fields, receipt grid |
| `gap-6` | 24px | Between major sections |
| `gap-8` | 32px | Between page-level sections (settings, profile) |

### Padding Scale
| Token | Usage |
|---|---|
| `p-3` | Compact inputs, textareas |
| `p-4` | Stat cards, default CardContent |
| `p-5` | Content-rich cards, receipt cards |
| `p-6` | Auth cards, profile sections |

### Page Padding
- **Horizontal:** `px-6` mobile, `md:px-8` tablet+
- **Vertical:** `py-8` default, `py-14 md:py-20` for landing hero
- **Auth pages:** No page padding — card is centered via flexbox

### Spacing Rules
- **Always use the spacing scale above.** No arbitrary `p-7` or `gap-5` unless explicitly justified.
- **Section separation:** Use `gap-6` between sections, `border-b border-border` only for the dashboard header.
- **Card internals:** Use `p-4`, `p-5`, or `p-6` consistently. Don't mix within the same page.
- **Vertical rhythm:** Stack sections with `gap-6`. Within sections, use `gap-4`.

---

## 5. Component Library

### Available Components (`components/ui/`)
| Component | Base | Variants |
|---|---|---|
| **Button** | Radix Slot + CVA | `default`, `secondary`, `ghost`, `danger` / `default`, `sm`, `lg`, `icon` |
| **Card** | Native div | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| **Badge** | Native span | Customizable via `className` |
| **Input** | Native input | — |
| **Textarea** | Native textarea | — |
| **Dialog** | Custom (Radix-free) | `open`, `title`, `onClose` |

### Component Rules
- **Always use these components.** Never style raw `<button>` or `<div>` when a component exists.
- **Extend via `className`**, not by modifying component source (unless adding a new variant).
- **New variants** must be added to the component's CVA definition, not hacked in with arbitrary classes.
- **Icons** come from `lucide-react`. Size: `h-4 w-4` default, `h-5 w-5` for standalone icons, `h-3.5 w-3.5` inside badges.

### Button Variant Usage Matrix
| Context | Variant | Size |
|---|---|---|
| Primary action (submit, CTA) | `default` | `default` or `lg` |
| Secondary action (cancel, check inbox) | `secondary` | `default` or `sm` |
| Tertiary action (nav link, edit) | `ghost` | `default` or `sm` |
| Destructive action (delete) | `danger` | `sm` |
| Icon-only (close dialog) | `ghost` | `icon` |

---

## 6. Responsiveness Philosophy

### Breakpoints (Tailwind defaults)
| Prefix | Width | Target |
|---|---|---|
| (none) | <640px | Mobile portrait |
| `sm` | ≥640px | Mobile landscape / small tablet |
| `md` | ≥768px | Tablet |
| `lg` | ≥1024px | Desktop |
| `xl` | ≥1280px | Large desktop (rarely used) |

### Mobile-First Rules
1. **All layouts start single-column.** Multi-column is added via `md:` or `lg:` prefixes.
2. **Touch targets ≥44px.** Buttons are `h-10` (40px) minimum, `h-11` (44px) for auth. `gap-2` minimum between tappable elements.
3. **No hover-dependent interactions** for critical paths. Hover is an enhancement, not a requirement.
4. **`px-6` on mobile** (24px side padding), `md:px-8` on tablet+.
5. **Forms go full-width** on mobile. Constrained widths (`max-w-md`, etc.) apply on desktop.

### Container Strategy
- **Fluid with max-width.** Containers use `w-full max-w-{n} mx-auto`. No fixed widths.
- **No full-bleed sections** with different backgrounds. The page background is always `bg-bg`.
- **Ultrawide:** Content stays centered. Background extends as solid `bg-bg`. No alternating stripes.

---

## 7. Motion System

### Duration Tokens
| Duration | Usage |
|---|---|
| `duration-150` | Button presses, focus transitions |
| `duration-200` | Card hover lift, dialog open/close |

### Animation Catalog
| Animation | Trigger | Implementation |
|---|---|---|
| Button press | `:active` | `active:scale-[0.98]` |
| Card hover lift | `:hover` | `hover:-translate-y-0.5` |
| Focus ring | `:focus-visible` | `focus-visible:outline-2 focus-visible:outline-border-focus` |
| Red pulse | Critical deadline | `animate-pulse-red` (3s ease-in-out infinite, opacity 0.72↔1) |
| Spinner | Async operations | `Loader2` icon + `animate-spin` |
| Toast enter/exit | Sonner library | Default Sonner animation |

### Motion Rules
- **No page-level enter animations.** Pages render instantly. No fade-in, no slide-up.
- **No scroll-triggered animations.** No parallax, no reveal-on-scroll, no sticky effects.
- **No hover transitions on non-interactive elements.** Cards that aren't clickable should not lift.
- **`prefers-reduced-motion` is respected.** All animations disabled when user preference is set.
- **One animated element max per page.** Currently: red pulse on urgency badges. Do not add more.

---

## 8. Interaction Patterns

### Forms
- **Explicit submit model.** No auto-save. User clicks save → toast confirms.
- **Validate on submit**, not on blur. Don't show errors until the user attempts to save.
- **Disabled state during submission.** Button shows spinner + text change. Prevents double-submit.
- **Native HTML validation first** (`required`, `type="email"`, `minLength`). Supplement with server errors via toast.

### Feedback
- **All mutations produce a toast.** Success, error, or warning via `sonner`.
- **Toast position:** `bottom-right`. Consistent across the app.
- **Copy actions:** Button changes to "Copied!" with checkmark icon for 2 seconds, then reverts.
- **Deletion:** Immediate removal + toast. No confirmation dialog for receipts (undo-able via re-add). Confirmation dialog for account deletion.

### Navigation
- **Client-side routing** via Next.js `<Link>` and `useRouter`. No full-page reloads.
- **No navigation transitions.** Pages swap instantly.
- **Redirect after auth:** Login/signup redirects to `/dashboard` (or `?next=` param).

### Empty States
- **Dashed border card** (`border-dashed`) to distinguish from populated cards.
- **Icon + title + description + action.** Guide the user to the next step.
- **Never punishing.** "No receipts yet" is calm, not accusatory.

---

## 9. Accessibility Baseline

- **Semantic HTML:** Use `<main>`, `<nav>`, `<header>`, `<section>`, `<h1>`-`<h3>` appropriately.
- **Focus visible:** All interactive elements have `focus-visible:outline` styles.
- **Aria labels:** Icons that aren't accompanied by text must have `aria-hidden="true"` on the icon and `aria-label` on the interactive parent.
- **Dialog:** Uses `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- **Color is not the only indicator.** Urgency badges include text labels (e.g., "3d", "expired") alongside color.
- **`prefers-reduced-motion`** disables all animations and smooth scrolls.
- **Touch targets ≥44px** for all interactive elements.

---

## 10. Global Anti-Patterns

These apply across **all** pages. Page-level anti-patterns are additive, not substitutive.

### Visual
- ❌ Gradients (background, text, border — none, anywhere)
- ❌ Glassmorphism / backdrop-blur
- ❌ Decorative background patterns, dots, grids
- ❌ Box shadows on cards (only `shadow-toast` for overlays)
- ❌ Multiple accent colors (blue only)
- ❌ Emoji in UI
- ❌ Border radius > `12px` (no fully rounded pills or circles except avatars)
- ❌ Different card styles on the same page

### Layout
- ❌ Fixed/sticky headers that follow scroll
- ❌ Sidebar navigation (until 3+ authenticated pages exist)
- ❌ Full-bleed sections with alternate backgrounds
- ❌ Carousels, sliders, or horizontal scroll sections
- ❌ Multi-column forms (single column only)

### Motion
- ❌ Page enter/exit animations
- ❌ Scroll-triggered reveals
- ❌ Parallax effects
- ❌ Hover animations that convey no information
- ❌ More than one simultaneous animation

### Content
- ❌ "Lorem ipsum" in shipped code
- ❌ Marketing language in authenticated pages
- ❌ Jargon or technical terms in user-facing copy
- ❌ "Coming soon" or disabled UI elements
- ❌ Placeholder text that isn't helpful (use real examples)

### Code
- ❌ Raw hex colors in components (use Tailwind tokens)
- ❌ Inline styles (`style={{}}`)
- ❌ Arbitrary spacing values outside the scale
- ❌ Custom CSS when Tailwind utilities exist
- ❌ Duplicating component logic instead of reusing UI components

---

## 11. Governance

### How to Use This System
1. **Start here.** Before designing any new page or component, read DESIGN.md.
2. **Check the page spec.** If a page-level `.md` exists, it adds context-specific rules.
3. **Use existing components.** Check `components/ui/` before creating new ones.
4. **Follow the token system.** Colors, spacing, typography all have defined tokens. Use them.

### When to Update DESIGN.md
- Adding a new global design token (color, spacing, radius)
- Changing the typography scale
- Adding a new UI component to the library
- Changing a global interaction pattern
- Discovering a new anti-pattern worth codifying

### When NOT to Update DESIGN.md
- Page-specific layout decisions (go in the page `.md`)
- One-off component customizations (use `className`)
- Content changes (copy, labels)

### Conflict Resolution
1. DESIGN.md overrides page specs.
2. Tailwind config overrides DESIGN.md (tokens are defined there).
3. Component source overrides all docs (code is truth).
4. If code and docs disagree, fix the docs — the code is what ships.

---

## 12. Inspiration References

These products inform the design philosophy. Study them, don't copy them.

| Product | What We Learn |
|---|---|
| **Linear** | Dark theme confidence, minimal chrome, keyboard-first, calm urgency |
| **Stripe** | Data density without clutter, clean forms, professional trust |
| **Apple** | Generous whitespace, typography-driven, no decoration |
| **Notion** | Flexible yet clean, minimal chrome, content-first |
| **Raycast** | Developer tool polish, dark theme, quick actions |
| **Arc Browser** | Chrome that disappears, content-first, minimalism |
| **Vercel** | Dark theme precision, geometric clarity, developer focus |
