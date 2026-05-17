# REFERENCES.md — Quick-Reference Lookup Tables & Decision Trees

> **Role:** This document is a rapid-access reference for implementation decisions. It consolidates tokens, patterns, and rules from across the design system into scannable lookup tables. Use this when you know *what* you need but want to quickly confirm *which value* to use.

> **Authority:** This file is a mirror of rules defined elsewhere. If REFERENCES.md conflicts with DESIGN.md or IMPLEMENTATION.md, the source document wins. This file is updated to reflect changes in source documents.

---

## 1. Token Quick-Reference

### Colors (Copy-Paste Ready)

| Purpose | Tailwind Class | Hex |
|---|---|---|
| Page background | `bg-bg` | #0A0A0F |
| Card/container background | `bg-surface` | #14141B |
| Hover background | `bg-surface-hover` | #1E1E28 |
| Default border | `border-border` | #2A2A3A |
| Focus/hover border | `border-border-focus` | #3B3B50 |
| Primary text | `text-text-primary` | #E8E8ED |
| Secondary text | `text-text-secondary` | #A0A0B8 |
| Muted/tertiary text | `text-text-muted` | #6B6B80 |
| Action/accent (blue) | `bg-action` / `text-action` | #3B82F6 |
| Success (green) | `text-success` | #10B981 |
| Warning (amber) | `text-warning` | #F59E0B |
| Danger (red) | `text-danger` | #EF4444 |

### Typography (Copy-Paste Ready)

| Level | Classes |
|---|---|
| Hero headline | `text-4xl md:text-6xl font-bold leading-[1.05]` |
| Page title | `text-2xl md:text-3xl font-semibold` |
| Section title | `text-xl font-semibold` |
| Subsection/card title | `text-base font-medium` |
| Body text | `text-sm leading-6` |
| Body large (landing) | `text-base md:text-lg leading-7` |
| Label | `text-sm font-medium` |
| Caption/metadata | `text-xs` |
| Stat value | `font-mono text-xl font-semibold` |
| Code/JSON | `font-mono text-xs leading-5` |
| Stat label (uppercase) | `text-xs uppercase text-text-muted` |

### Spacing (Copy-Paste Ready)

| Context | Value |
|---|---|
| Between icon and text | `gap-2` |
| Between nav buttons | `gap-3` |
| Between cards in grid | `gap-4` |
| Between form fields | `gap-4` |
| Between major sections | `gap-6` |
| Between page-level sections | `gap-8` |
| Page horizontal padding | `px-6 md:px-8` |
| Page vertical padding | `py-8` |
| Hero vertical padding | `py-14 md:py-20` |
| Compact card padding | `p-4` |
| Standard card padding | `p-5` |
| Generous card padding | `p-6` |

### Container Widths

| Page Type | Width | Tailwind |
|---|---|---|
| Auth forms | 448px | `max-w-md` |
| Profile | 672px | `max-w-2xl` |
| Settings, test extraction | 896px | `max-w-4xl` |
| Dashboard, landing | 1152px | `max-w-6xl` |

### Border Radius

| Element | Value | Tailwind |
|---|---|---|
| Cards, dialogs, modals | 12px | `rounded-card` |
| Buttons, inputs, selects | 8px | `rounded-lg` |
| Badges, small pills | 6px | `rounded-md` |

---

## 2. Component Decision Tree

### "Which Button variant do I use?"
```
Is it the primary action on the page?
├── Yes → variant="default" (blue, filled)
│    └── Is it a hero/auth CTA? → size="lg"
│    └── Is it a standard action? → size="default"
└── No →
     Is it a secondary/supporting action?
     ├── Yes → variant="secondary" (bordered)
     │    └── Is it compact? → size="sm"
     └── No →
          Is it a tertiary/navigation action?
          ├── Yes → variant="ghost" (text only)
          │    └── Is it in a nav? → size="default"
          │    └── Is it in a card? → size="sm"
          └── No →
               Is it destructive?
               └── Yes → variant="danger" (red bordered)
                    └── Always size="sm"
```

### "Which Card padding do I use?"
```
Is it a stat card (label + number)?
├── Yes → p-4
└── No →
     Is it a content-rich card (form, description, actions)?
     ├── Yes → p-5
     └── No →
          Is it an auth card or profile section?
          └── Yes → p-6
```

### "Which container width do I use?"
```
Is it an auth page (login/signup)?
├── Yes → max-w-md (centered card)
└── No →
     Is it a profile/personal page?
     ├── Yes → max-w-2xl
     └── No →
          Is it a form-focused page (settings, test extraction)?
          ├── Yes → max-w-4xl
          └── No →
               Is it a data-dense page (dashboard, landing)?
               └── Yes → max-w-6xl
```

### "Which text color do I use?"
```
Is it a headline, title, or primary content?
├── Yes → text-text-primary
└── No →
     Is it a description, subtitle, or supporting text?
     ├── Yes → text-text-secondary
     └── No →
          Is it a placeholder, label caption, or tertiary info?
          ├── Yes → text-text-muted
          └── No →
               Is it an interactive/action element?
               ├── Yes → text-action (blue)
               └── No →
                    Is it a status indicator?
                    └── Yes → text-success / text-warning / text-danger
```

### "Should this be a Server or Client Component?"
```
Does it use hooks (useState, useEffect, useTransition)?
├── Yes → Client Component ("use client")
└── No →
     Does it have event handlers (onClick, onChange)?
     ├── Yes → Client Component
     └── No →
          Does it use browser APIs (clipboard, window)?
          ├── Yes → Client Component
          └── No → Server Component (default, no directive needed)
```

---

## 3. Page Architecture Reference

### Page → Container → Layout

| Page | Container | Layout | Sections |
|---|---|---|---|
| Landing | `max-w-6xl` | Flex column, hero centered | Nav, Hero, Proof grid |
| Login | Full viewport | Flex center | Single card |
| Signup | Full viewport | Flex center | Single card |
| Dashboard | `max-w-6xl` | Grid gap-6 | Header, Stats, Input, Receipts |
| Test extraction | `max-w-4xl` | Grid gap-4 | Header, Input card, Result card |
| Settings | `max-w-4xl` | Grid (sidebar + content) | Nav sidebar, Settings sections |
| Profile | `max-w-2xl` | Grid gap-8 | Avatar, Identity, Activity |

### Responsive Breakpoint Behavior

| Element | Mobile (<640) | Tablet (640-1024) | Desktop (1024+) |
|---|---|---|---|
| Receipt grid | 1 col | 2 col | 3 col |
| Stats row | Stacked | Stacked | Side-by-side |
| Input section | Stacked | Stacked | Side-by-side |
| Form fields | 1 col | 1 col | 2 col |
| Hero CTAs | Stacked | Inline | Inline |
| Dashboard header | Stacked | Horizontal | Horizontal |
| Proof points | 1 col | 3 col | 3 col |
| Section headers | Stacked | Horizontal | Horizontal |

---

## 4. Interaction State Reference

### Button States (All Variants)

| State | Default (Blue) | Secondary | Ghost | Danger |
|---|---|---|---|---|
| Default | `bg-action text-white` | `border bg-surface` | `text-text-secondary` | `border-red bg-red/10` |
| Hover | `brightness-110` | `bg-surface-hover` | `text-text-primary` | `bg-red/15` |
| Focus | `outline-border-focus` | `outline-border-focus` | `outline-border-focus` | `outline-border-focus` |
| Active | `scale-[0.98]` | `scale-[0.98]` | `scale-[0.98]` | `scale-[0.98]` |
| Disabled | `opacity-50` | `opacity-50` | `opacity-50` | `opacity-50` |

### Input States

| State | Appearance |
|---|---|
| Default | `border-border bg-bg` |
| Focus | `border-border-focus` (transition) |
| Filled | Same as default (no visual change) |
| Disabled | `opacity-50 pointer-events-none` |
| Placeholder | `text-text-muted` |

### Card States

| State | Appearance |
|---|---|
| Default | `border-border bg-surface` |
| Hover | `-translate-y-0.5 border-border-focus` (200ms) |
| Non-interactive | Remove hover classes |

---

## 5. Animation Reference

### Allowed Animations

| Animation | Trigger | Duration | Properties | Limit |
|---|---|---|---|---|
| Button press | `:active` | Instant | `scale(0.98)` | All buttons |
| Card hover lift | `:hover` | 200ms | `translateY(-2px)` | Interactive cards only |
| Focus ring | `:focus-visible` | 150ms | `outline` | All interactive elements |
| Red pulse | Always (critical) | 3000ms | `opacity 0.72↔1` | ONE per page |
| Spinner | During async | Continuous | `rotate` | During loading only |
| Border transition | `:focus` | 150ms | `border-color` | All inputs |

### Forbidden Animations
- Page enter/exit transitions
- Scroll-triggered reveals
- Parallax effects
- Stagger animations
- Bounce/spring easing
- Scale on hover (except button active)
- Fade-in on mount
- Slide-in from sides
- Counter/number animations

---

## 6. Icon Reference

### Icon Sizing

| Context | Size Class |
|---|---|
| Inside button (with text) | `h-4 w-4` |
| Standalone in card | `h-5 w-5` |
| Inside badge | `h-3.5 w-3.5` |
| Empty state focal | `h-10 w-10` |
| Logo in nav | `h-5 w-5` |

### Common Icons Used

| Icon | Import | Usage |
|---|---|---|
| `ArrowRight` | lucide-react | CTA directional cue |
| `MailCheck` | lucide-react | Email/forwarding feature |
| `ReceiptText` | lucide-react | Receipt/extraction feature |
| `ShieldCheck` | lucide-react | Security/control feature |
| `Search` | lucide-react | Search input icon |
| `Inbox` | lucide-react | Check inbox action |
| `MailSearch` | lucide-react | Extract email action |
| `Plus` | lucide-react | Add/create indicator |
| `Edit3` | lucide-react | Edit action |
| `Trash2` | lucide-react | Delete action |
| `Clock` | lucide-react | Date/time metadata |
| `DollarSign` | lucide-react | Price/money metadata |
| `Loader2` | lucide-react | Loading spinner |
| `X` | lucide-react | Close/dismiss |
| `Copy` / `Check` | lucide-react | Copy action feedback |

---

## 7. File Structure Reference

### Component Organization

```
components/
├── ui/                    # Atomic UI components (shadcn/ui style)
│   ├── button.tsx         # Button with CVA variants
│   ├── card.tsx           # Card, CardHeader, CardContent, CardFooter
│   ├── badge.tsx          # Badge (generic)
│   ├── input.tsx          # Input + Textarea
│   └── dialog.tsx         # Modal dialog
├── auth/                  # Auth-specific components
│   └── auth-form.tsx      # Shared login/signup form
├── dashboard/             # Dashboard-specific components
│   └── dashboard-header.tsx
├── receipts/              # Receipt-specific components
│   ├── receipt-dashboard.tsx  # Main dashboard orchestrator
│   ├── receipt-card.tsx       # Individual receipt card
│   ├── receipt-empty-state.tsx
│   ├── copy-forwarding-address.tsx
│   └── urgency-badge.tsx
└── ai/                    # AI/extraction components
    └── test-extraction-form.tsx
```

### Route Organization

```
app/
├── page.tsx               # Landing (/)
├── layout.tsx             # Root layout (fonts, toaster)
├── globals.css            # CSS variables, Tailwind, resets
├── (auth)/                # Auth route group
│   ├── login/page.tsx     # /login
│   └── signup/page.tsx    # /signup
├── (dashboard)/           # Dashboard route group
│   └── dashboard/page.tsx # /dashboard
├── test-extraction/       # /test-extraction
│   └── page.tsx
├── auth/callback/         # Auth callback (Supabase)
│   └── route.ts
└── api/                   # API routes
    ├── receipts/          # CRUD
    ├── extract/           # AI extraction
    ├── gmail/             # Gmail integration
    ├── dashboard/stats/   # Stats endpoint
    └── health/            # Health check
```

---

## 8. Common Patterns Quick-Copy

### Page Shell (Data Page)
```tsx
<main className="mx-auto min-h-screen w-full max-w-6xl px-6 md:px-8">
  {/* header */}
  {/* content sections */}
</main>
```

### Page Shell (Auth Page)
```tsx
<main className="flex min-h-screen items-center justify-center px-6 py-12">
  <Card className="w-full max-w-md">
    {/* form */}
  </Card>
</main>
```

### Section with Title
```tsx
<section className="grid gap-4">
  <h2 className="text-xl font-semibold text-text-primary">Title</h2>
  {/* content */}
</section>
```

### Responsive Grid
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {/* items */}
</div>
```

### Form Field
```tsx
<label className="grid gap-2 text-sm font-medium text-text-primary">
  Label
  <Input placeholder="Example..." />
</label>
```

### Action Row (Right-Aligned)
```tsx
<div className="flex justify-end gap-2">
  <Button variant="ghost">Cancel</Button>
  <Button>Submit</Button>
</div>
```

### Loading Button
```tsx
<Button disabled={isPending}>
  {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
  {isPending ? "Saving..." : "Save"}
</Button>
```

---

## 9. Checklist: Before You Ship

```
□ All colors are Tailwind tokens (no hex)
□ All spacing from the documented scale
□ Typography matches the type scale exactly
□ Container width matches page type
□ Responsive at 375px, 768px, 1280px
□ All buttons have hover + focus + active + disabled
□ All inputs have focus border transition
□ Icons are h-4 w-4 (in buttons) or h-5 w-5 (standalone)
□ Only one animation on the page (if any)
□ No gradients, no shadows (except toast), no blur
□ Semantic HTML (main, nav, section, h1-h3)
□ aria-hidden on decorative icons
□ Touch targets ≥44px
□ Toast for all mutations
□ Loading state for all async operations
□ Empty state for empty lists
□ No console errors
□ No TypeScript errors
□ Matches sibling pages in quality and consistency
```

---

## Document Maintenance

This file is a derived reference. Update it when source documents change:
- Color tokens change → update §1 Colors
- Typography scale changes → update §1 Typography
- New component added → update §2 Decision Tree
- New page added → update §3 Page Architecture
- New icon used → update §6 Icon Reference
