# Visual Identity

> The single source of truth for Receipt Guardian's redesigned visual identity. This document is authored *after* the Visual_Identity (accent color, type stack, surface treatment, brand mark) was defined in code. It describes the realized identity, not a forward-looking aspiration.
>
> _Validates Requirements: 1.2, 1.3, 1.6, 10.8._

---

## Visual identity stance

### Aesthetic stance

Receipt Guardian is a financial-document tool. Its visual identity is **graphite-and-brass document craft** — a quiet, dark, document-adjacent surface that treats every screen as a single sheet of paper rather than a "premium dark dashboard." The interface is calm, slightly warm, and deliberately uncool. Type carries the personality; color carries meaning, not mood; motion exists only when state changes.

The point of view in one sentence: **"It should read like a well-set ledger page, not like a 2026 SaaS landing template."**

What that means concretely:

- **Dark, but warm.** The canvas is a graphite (`oklch(0.13 0.005 270)`) tilted barely toward neutral cool, paired with text and accents tilted warm (90-degree hue for text, 78-degree hue for the accent). The result is a dark interface that does not read as "cobalt-on-charcoal AI dashboard."
- **One accent, document-relevant.** A desaturated warm amber, `oklch(0.78 0.13 78)` ≈ `#D9A24C` — "burnished brass on graphite." Amber is the deadline-domain color the urgency badge already uses for "due soon"; making it the global accent means the entire app speaks the same color language as its most important state.
- **Surface, not depth.** Two surfaces (`canvas` → `surface`) plus an interactive raised step on hover. No shadows at rest, no gradients, no decorative blur. A card looks like a card because it has a fill and a border, not because it has a glow.
- **Type-led identity.** The brand mark is a custom typographic `R` in SVG, not a Lucide icon in a tile. The wordmark sits flush next to it with no halo, no border, no gradient. Headings in Geist Sans with `cv11`/`ss03` carry the personality budget that decoration usually steals.
- **Motion as state, not entrance.** No stagger-fade hero. No reveal-on-scroll. The single allowed indeterminate animation is the 2px route-progress bar, and the single allowed attention loop is the expired-urgency pulse. Hover, focus, and press are CSS transitions on `transform` and `opacity` only.

### Named reference products

These products were studied for *spacing rhythm, restraint, and hierarchy* — not copied for color or shape. Their references live under `design-system/references/` (see `references/INDEX.md`).

- **Linear** — chrome that disappears, dense data without visual noise, single-card auth pages on a dark void. Studied for: information density, sidebar restraint, focus on data over chrome.
- **Vercel** — minimal project-list card layout, opaque header chrome, monospace numerals where they earn their place. Studied for: header simplicity, card-grid spacing, when to switch to mono.
- **Stripe (dashboard + Stripe Press)** — calm data density, a single accent doing real work, generous interior padding, type as the personality. Studied for: typographic hierarchy, color restraint, how a financial product communicates trust without "trust badges."
- **Apple Settings (macOS Sonoma+)** — grouped sections, generous whitespace, clear labels, no decorative imagery in form-heavy screens. Studied for: section grouping, label-to-input rhythm, single-column form layout for Profile/Settings.
- **Arc Browser** — chrome that gets out of the way, content-first navigation, restrained color. Studied for: header presence, mobile bottom-nav active-state cues.
- **Notion** — simple email-form auth, low-friction onboarding, monochrome interfaces with one accent. Studied for: auth-shell layout.
- **Raycast** — card grids on a dark canvas, consistent spacing, no decoration. Studied for: dashboard-card layout density.

### Named patterns explicitly rejected

These are the patterns the redesign *deliberately walked away from*. Each one is grepped to zero in the codebase and enforced by lint rules and property tests.

- **The Tailwind-default cobalt accent** (`#3B82F6` `blue-500`, `#5B8CFF`, `indigo-500`, `violet-500`). Replaced by amber `oklch(0.78 0.13 78)`. Reason: cobalt-on-near-black is the single most legible AI-generated-UI tell of 2025-2026.
- **The conic-gradient halo around the icon-in-a-tile brand mark** (`.border-conic-soft`). Replaced by a flush typographic `R` SVG with no tile, no halo, no border. Reason: every AI-generated dark dashboard ships this exact pattern.
- **Aurora / radial-gradient blob backgrounds** (`bg-aurora-action`, `bg-aurora-soft`, `bg-scene-hero`, `bg-scene-auth`). Replaced by at most one tonal band (`bg-canvas-raised` ≤8% lighter than canvas) per page, or nothing.
- **Masked dotted/grid mesh backgrounds** (`bg-grid-faint` + `mask-fade-radial` / `mask-fade-bottom`). Removed entirely.
- **Gradient hero text** (`text-gradient-primary`, `text-gradient-action`, `bg-clip-text` on any heading). Removed entirely.
- **Glow shadows on resting elements** (`shadow-glow-action`, `shadow-glow-soft`, `inner-hair`). Replaced by border-tone shifts on hover. Only `shadow-overlay` survives, used solely for Dialog/PageLoader/Toaster overlays.
- **Backdrop-blur chrome** on the dashboard header. Replaced by an opaque `bg-canvas-raised` header. Backdrop-blur survives only on the global Toaster and the modal scrim, capped at 8px.
- **Stagger-fade entrance animations** on lists, hero sections, proof grids. Replaced by static rendering. The `<Stagger>`, `<StaggerItem>`, `<HoverLift>`, `<FadeIn>` primitives are deleted; only `<Reveal>` survives, used only by Dialog open/close.
- **Multi-color gradient fills** on buttons, cards, or borders. The `<Button>` primitive's `before:` gradient overlay and `bg-[linear-gradient(...)]` primary fill are deleted.
- **Ledger-scan / loader-rail / shimmer / glow-pulse** decorative loops. Replaced by a single `<Loader>` component (a 6px static dot + label) and the single 2px `route-progress` bar.
- **Generic placeholder voice** ("Quiet deadlines. Loud savings.", "Trusted by thousands", "Get started in 60 seconds") used as decorative copy. Replaced by approved copy in `design-system/landing.md`.
- **Tile-bordered icon as brand mark.** Replaced by the typographic `R` SVG mark.
- **Stacking more than one decorative element per composition.** The Landing hero carries at most one of: ambient tonal band, structural rule line, single typographic mark.

### Justification (Requirement 1.6)

Every token, primitive, and composition in this redesign traces back to one of three justifications, recorded in the matching design-system spec file:

1. **Domain fit.** Amber is already the receipt/deadline domain color (the urgency badge uses it for "due soon"). Promoting it to the global accent makes the most important state in the product the same color as the brand.
2. **AI-slop avoidance.** Every choice was checked against Requirement 13's hard-fail catalogue. If a candidate token, component, or layout pattern matched any of the 14 banned patterns, it was rejected.
3. **Reduction.** Where two design choices delivered equivalent function, the simpler one was kept. Two surfaces beat three. One shadow beats four. One accent beats a palette. One indeterminate animation beats five.

---

## Contrast matrix

All ratios computed against the redesigned color tokens (Layer 1, see `design-system/DESIGN.md` § "Color tokens"). WCAG 2.1 AA threshold is **≥4.5:1** for normal-size text and **≥3:1** for UI components, large text, and graphical objects (Requirements 2.5, 11.1, 11.2).

| Pair | Token (foreground / background) | Ratio | Threshold | Result |
|---|---|---|---|---|
| Body text on canvas | `text-primary` / `canvas` | 16.8:1 | ≥4.5 (text) | ✅ |
| Secondary text on canvas | `text-secondary` / `canvas` | 7.4:1 | ≥4.5 (text) | ✅ |
| Secondary text on surface | `text-secondary` / `surface` | 5.8:1 | ≥4.5 (text) | ✅ |
| Tertiary text on canvas | `text-muted` / `canvas` | 4.6:1 | ≥4.5 (text) — falls back to ≥3 (decorative-only) | ✅ |
| Accent text on canvas | `accent` / `canvas` | 8.9:1 | ≥4.5 (text) | ✅ |
| Accent text on surface | `accent` / `surface` | 7.1:1 | ≥4.5 (text) | ✅ |
| Default border on canvas | `border` / `canvas` | 1.9:1 | ≥3 (UI) | ⚠️ Fails alone — paired with the focus-ring **2px-thickness-at-2px-offset** non-color signal required by Requirement 11.3 |
| Focus ring on canvas | `border-focus` / `canvas` | 8.9:1 | ≥3 (UI) | ✅ |
| Focus ring on surface | `border-focus` / `surface` | 7.1:1 | ≥3 (UI) | ✅ |

**Notes.**

- `text-muted` is used for placeholders, captions, and tertiary metadata. When it carries information that would not be guessable from context, the calling composition either upgrades it to `text-secondary` or pairs it with an additional cue (icon, label).
- The `border` token's 1.9:1 ratio is intentional. It is decorative on resting surfaces and is paired with the high-contrast `border-focus` token (8.9:1) plus a 2px ring at 2px offset for any focusable element, satisfying Requirement 11.3's "focus differs from resting in a non-color attribute" rule.
- The accent token at `oklch(0.78 0.13 78)` is the same value as `border-focus`. The accent is the focus ring; this is intentional — it makes "what the user can act on" and "what the user is focused on" speak the same color.

---

## AI_Slop_Pattern rejected-pattern checklist

This is the verbatim hard-fail catalogue from Requirement 13. Any pattern below is forbidden in code, content, or composition. Reviewers MUST check each item before marking a screen complete (also enforced as a Tier-1 hard-fail check in `design-system/REVIEW.md`).

- [ ] **13.1 — No Tailwind-default cobalt/indigo/violet accents.** No `indigo-500`, `violet-500`, `blue-500`, `#3B82F6`, or `#5B8CFF` on any user-facing surface.
- [ ] **13.2 — No purple-to-blue / blue-to-cyan / orange-to-pink linear-gradient backgrounds.** No multi-stop gradient as a hero, CTA, or card fill.
- [ ] **13.3 — No `bg-clip-text` gradient text.** No gradient-filled headings or wordmarks.
- [ ] **13.4 — No masked dotted/grid mesh backgrounds.** No `bg-grid-faint` + `mask-fade-radial` / `mask-fade-bottom` layered behind hero or card content.
- [ ] **13.5 — No radial "aurora" or "spotlight" gradient blobs** as a card-internal background layer.
- [ ] **13.6 — No conic-gradient halos** around icon or logo tiles.
- [ ] **13.7 — No glassmorphism** (translucent fill + backdrop-blur) on any surface other than the global Toaster and the modal scrim.
- [ ] **13.8 — No stagger-fade entrance animations** on lists, hero sections, or proof grids.
- [ ] **13.9 — Ambient layers are one tonal element only.** If used at the page level, the layer is ≤8% lighter than the canvas, contains no perceptible gradient stop or center, and is not layered with a grid or noise mesh.
- [ ] **13.10 — The "AI dark dashboard" stack is forbidden together.** "Dark canvas + cobalt-blue accent + radial gradient + grid pattern + glow shadow" SHALL NOT appear together on the same screen.
- [ ] **13.11 — No generic placeholder voice.** "Quiet deadlines. Loud savings.", "Trusted by thousands", "How it works", "Get started in 60 seconds" are forbidden as decorative copy unless explicitly approved as part of the redesign's voice work.
- [ ] **13.12 — No Lucide-icon-in-a-tile brand mark.** The brand mark is the custom typographic `R` SVG at `public/brand/mark.svg`.
- [ ] **13.13 — No stacking decorative elements.** A single composition SHALL NOT stack more than one of: tile-bordered icon, gradient text, conic halo, aurora background, dotted grid, glow shadow.
- [ ] **13.14 — Landing hero ≤ 1 decorative element.** The Landing hero contains at most one of: ambient tonal background, structural rule line, single typographic mark. Two or more is a hard fail.

### How to use this checklist

1. **At review.** Walk every In_Scope_Screen against this list before approving the change. Any unchecked failure is a hard fail and blocks merge.
2. **In CI.** The property tests in `design-system/__tests__/` enforce the mechanically-detectable subset:
   - Property 4 (`no-deprecated.property.test.ts`) covers 13.4, 13.5, 13.6 (deprecated class names).
   - Property 5 (`no-forbidden-gradients.property.test.ts`) covers 13.2, 13.3, 13.7.
   - Property 6 (`no-cobalt.property.test.ts`) covers 13.1.
   - Property 16 (`decorative-budget.property.test.ts`) covers 13.13, 13.14.
   - Property 18 (`ambient-luminance.property.test.ts`) covers 13.9.
3. **Beyond CI.** 13.8 (stagger-fade), 13.10 (the combined stack), 13.11 (placeholder voice), and 13.12 (Lucide-tile brand mark) are partially mechanical and partially review-only. Always do a manual pass.

---

## Wireframe and screenshot notes

Screenshot/wireframe assets for the redesigned screens live under `design-system/references/` (see `references/INDEX.md` for the folder map). Per-screen specs (`landing.md`, `login.md`, `signup.md`, `dashboard.md`, `profile.md`, `settings.md`, `test-extraction.md`, `navigation.md`) carry the wireframe-level prose for each hero and main block.

- `references/auth/` — Linear, Notion, Stripe login pages. Used to specify the redesigned `<AuthShell>` (centered card at `max-w-auth`, Brand_Mark + wordmark above, no gradient scene, no entrance animation).
- `references/dashboard/` — Linear, Raycast, Stripe, Vercel dashboards. Used to specify the redesigned dashboard hero (single Card with title, money-at-risk summary, intake address, no aurora, no grid).
- `references/landing/` — to be captured. Reference candidates: linear.app, vercel.com, raycast.com home pages.
- `references/navigation/` — Arc Browser. Used to specify the opaque, blur-free header chrome and the 2px-bar mobile-bottom-nav active state.
- `references/settings/` — Apple Settings, Linear settings. Used to specify single-column Profile and Settings layouts at `max-w-narrow` / `max-w-content` with documented vertical rhythm (section gap 32, card-internal gap 16, label-to-input gap 8).

When adding a new In_Scope_Screen wireframe, capture a static PNG into the matching `references/` subfolder, then write a one-line justification in this file's "Named reference products" section (Requirement 1.6).
