# Requirements Document

## Introduction

Receipt Guardian's current UI was built against a thoughtful design system (`design-system/DESIGN.md`) that preaches restraint — dark canvas, one accent color, no gradients, no decoration, motion as meaning. The shipped code drifted in the opposite direction. It now layers radial aurora gradients, masked grids, conic-gradient halos around icon marks, gradient hero text, glow shadows, "ledger-scan" loaders, framer-motion stagger on every section, backdrop-blur chrome, and a generic cobalt-blue (`#5B8CFF`/`#3B82F6`) accent on near-black surfaces. That stack is the 2026 textbook signature of AI-generated UI — the same handful of moves a model emits when asked for "premium dark dashboard": Tailwind indigo, glass cards, subtle grid, soft glow, stagger-fade hero, conic-bordered logo tile.

This redesign re-grounds the app in an original, intentional visual identity that still respects the system's stated philosophy of "calm precision," but executes it at a higher craft level than today's code does. The output is not a new product — it is the same Receipt Guardian (landing, auth, dashboard, profile, settings, test-extraction) re-skinned and re-toned so it reads as the work of a human designer with a point of view, not a model imitating Vercel.

The deliverable is a redesigned visual layer (tokens, primitives, screens) plus updated source-of-truth design-system documents. No new product features. No new routes. No backend changes. The redesign must be shippable on the existing Next.js 14+ / Tailwind / shadcn-style stack.

## Glossary

- **Design_System**: The canonical set of tokens, primitives, patterns, and rules in `/design-system/*.md` plus `tailwind.config.ts` and `app/globals.css`. After this redesign, these documents and the code that references them must agree.
- **Visual_Identity**: The combined system of color tokens, typography stack, spacing scale, radius scale, elevation/surface treatment, and iconography that defines how Receipt Guardian looks at a glance.
- **Surface_Treatment**: How elevated containers (cards, dialogs, toasts, headers) are visually separated from the page canvas — borders, fills, inner highlights, shadows, and any background ornamentation.
- **Motion_Language**: The set of allowed animations, their durations, easings, triggers, and the global rules governing when motion may be used.
- **Token**: A named design value (e.g. `--color-bg`, `bg-surface`, `radius-card`) referenced by components instead of raw values.
- **Component_Primitive**: A reusable UI building block in `components/ui/*` (Button, Card, Input, Textarea, Dialog, Badge, Avatar, Skeleton, Loader, PageLoader, RouteProgress).
- **In_Scope_Screen**: One of the existing user-facing routes that must be redesigned: Landing (`/`), Login (`/login`), Signup (`/signup`), Dashboard (`/dashboard`), Profile (`/profile`), Settings (`/settings`), Test Extraction (`/test-extraction`).
- **AI_Slop_Pattern**: A documented visual pattern that signals AI-generated UI. The full list is enumerated in Requirement 13. The redesign must eliminate every pattern on that list.
- **Premium_Quality_Bar**: The combined acceptance criteria in Requirement 15 ("feels premium"). A screen ships only when every criterion in Requirement 15 holds.
- **Performance_Budget**: The numeric limits on visual-layer cost (CSS bytes, JS bytes, paint cost, animation cost) defined in Requirement 12.
- **Reduced_Motion_User**: A user whose browser reports `prefers-reduced-motion: reduce`.
- **Brand_Mark**: The Receipt Guardian logo + wordmark composition used in the header and on auth pages.

## Requirements

### Requirement 1: Original Visual Identity (Anti-AI-Slop)

**User Story:** As a returning user, I want the app to feel like a deliberately designed product with its own visual point of view, so that I trust it with my financial data instead of perceiving it as a generic AI-generated SaaS template.

#### Acceptance Criteria

1. THE Design_System SHALL define exactly one Visual_Identity that does not match any pattern listed in Requirement 13 (AI_Slop_Pattern).
2. THE Design_System SHALL document the redesign's point of view in a single dedicated section of `design-system/DESIGN.md` titled "Visual identity" stating, in prose, the chosen aesthetic stance, the named reference products that informed it, and the named patterns explicitly rejected. THE documentation SHALL be authored after the core Visual_Identity (accent color, type stack, surface treatment, brand mark) is defined in code, and SHALL describe the realized identity rather than a forward-looking aspiration.
3. THE Design_System SHALL replace the current `--color-action` and `--color-action-strong` blues (`#5B8CFF` and `#3B82F6`) with a single accent color that is not Tailwind's default `blue-500`/`indigo-500`/`violet-500` and not a 1:1 match for Linear, Vercel, Stripe, or shadcn/ui defaults.
4. THE Brand_Mark SHALL be redrawn as a typographic or geometric mark that is not a `lucide-react` icon (`ReceiptText`, `MailCheck`, etc.) inside a generic rounded-square tile.
5. THE Design_System SHALL ship an SVG asset for the redrawn Brand_Mark in `public/brand/` and reference it from the header and auth screens instead of the Lucide-icon-in-a-tile pattern currently used.
6. WHEN any new screen, component, or token is introduced during this redesign, THE Design_System SHALL include a written justification (one line minimum) for why that decision is consistent with the stated Visual_Identity.

### Requirement 2: Color Token System

**User Story:** As a developer extending the UI, I want a small, opinionated color token system, so that every surface, text level, border, and accent traces back to a named token instead of a one-off hex value.

#### Acceptance Criteria

1. THE Design_System SHALL define color tokens grouped into the following categories: canvas (page backgrounds), surface (elevated containers, ≥3 levels), border (default + hover/strong + focus), text (primary, secondary, tertiary/muted), accent (single brand accent + a single hover/active variant), semantic (success, warning, danger, optional info).
2. THE Design_System SHALL define every color token in both `tailwind.config.ts` (under `theme.extend.colors`) and as a CSS custom property on `:root` in `app/globals.css`, and the two SHALL agree exactly. Both definition locations SHALL exist before any color token is added.
3. WHEN a contributor adds or modifies a color, THE Design_System SHALL require updating both definitions in the same change. IF only one location is updated, THEN THE change SHALL be rejected at review.
4. THE Design_System SHALL forbid raw hex, rgb, hsl, oklch, or `#` literals inside any file under `app/`, `components/`, or `lib/` for foreground or background color usage, except inside `tailwind.config.ts`, `app/globals.css`, and `public/**` SVG assets.
5. THE Design_System SHALL define the accent color in a perceptual color space (`oklch(...)`) with documented L/C/H values, and SHALL document that the accent's contrast ratio against the canvas token meets WCAG 2.1 AA (≥4.5:1) for normal text and ≥3:1 for UI components.
6. WHERE a feature requires a tinted-accent background (e.g. selected state, badge fill), THE Design_System SHALL provide a pre-tokenized variant rather than allowing inline opacity expressions like `bg-action/10`.
7. THE Design_System SHALL forbid any multi-color or hue-shifting gradient (linear, radial, conic) used as a background fill, text fill, or border on any user-facing surface, with the single exception of the optional ambient atmospheric layer governed by Requirement 5.

### Requirement 3: Typography System

**User Story:** As a user reading numerical data and instructional copy, I want a typographic system with clear hierarchy, considered detail, and tabular numbers, so that the interface reads as crafted rather than as Tailwind defaults.

#### Acceptance Criteria

1. THE Design_System SHALL define exactly two type families: one variable sans-serif for UI and one variable monospace for tabular numbers and code. Both SHALL be loaded via `next/font` with `display: "swap"` and Latin subset only.
2. THE Design_System SHALL choose a UI sans-serif that is documented in `design-system/DESIGN.md` with rationale, and that choice SHALL NOT be the default `Inter` shipped today unless the redesign deliberately keeps it and documents a non-default OpenType feature configuration that distinguishes the result from out-of-the-box Inter.
3. WHEN the UI sans-serif is rendered, THE Design_System SHALL enable at least three OpenType features documented in `design-system/DESIGN.md` (e.g. `cv11`, `ss01`, `ss03`, `cv05`, `tnum`) selected to give the typography a recognizable identity.
4. THE Design_System SHALL define a fixed type scale of no more than 9 named steps spanning caption to display, each with documented size, line-height, letter-spacing, and weight. Sizes SHALL be expressed in `rem`.
5. THE Design_System SHALL forbid arbitrary `text-[NN]` or `leading-[NN]` Tailwind utilities in user-facing components except inside the type-scale definition layer.
6. WHERE numerals are displayed (stat values, prices, dates, deadlines, monospace data), THE Design_System SHALL apply tabular numbers via `font-feature-settings: "tnum"` or a Tailwind utility wrapping it.
7. THE Design_System SHALL forbid `bg-clip-text` gradient text on any heading, subhead, or body element on any In_Scope_Screen.
8. WHEN a heading exceeds 32px rendered size, THE Design_System SHALL apply a documented negative letter-spacing value from the type scale, and SHALL apply `text-wrap: balance` for headings with a defined max-line count.

### Requirement 4: Spacing, Layout, and Radius Scale

**User Story:** As a designer reviewing the implementation, I want every spacing and radius value to come from a documented scale, so that visual rhythm is mathematical instead of accidental.

#### Acceptance Criteria

1. THE Design_System SHALL define a spacing scale derived from a single base unit (e.g. 4px) and SHALL document the allowed steps (e.g. 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96).
2. THE Design_System SHALL forbid arbitrary `p-[NN]`, `m-[NN]`, `gap-[NN]`, `top-[NN]`, etc. utilities in user-facing components.
3. THE Design_System SHALL define a radius scale of no more than 5 named steps (e.g. `radius-xs`, `radius-sm`, `radius-md`, `radius-lg`, `radius-pill`) and SHALL document which step each Component_Primitive uses.
4. THE Design_System SHALL define container width tokens (auth, narrow content, default content, wide content) and SHALL require every page to use exactly one of them.
5. WHEN a layout uses a multi-column grid, THE Design_System SHALL require the grid to be defined with a documented breakpoint, gutter, and column count, and SHALL forbid one-off `grid-cols-[Xfr_Yrem]` definitions inside page components except where added to a documented layout primitive.
6. THE Design_System SHALL define a consistent vertical rhythm rule (e.g. section gap, card-internal gap, label-to-input gap) and SHALL audit that every In_Scope_Screen conforms to that rule.

### Requirement 5: Surface and Elevation Treatment

**User Story:** As a user scanning the dashboard, I want elevated containers to read as deliberate physical surfaces, so that the hierarchy is legible without relying on stacked decorative effects.

#### Acceptance Criteria

1. THE Design_System SHALL define no more than three elevation levels for surfaces (canvas, surface, raised-surface) plus a separate overlay level for dialogs and toasts.
2. THE Design_System SHALL convey elevation primarily through canvas/surface fill contrast and border tone, and SHALL NOT use drop shadows on cards in the default resting state.
3. WHERE an interactive surface (interactive card, button, dialog) requires depth feedback, THE Design_System SHALL define a single documented shadow token (e.g. `shadow-overlay`) and SHALL apply it only to overlays, focused inputs, or hovered interactive cards — not to all cards by default.
4. THE Design_System SHALL forbid `backdrop-filter: blur(...)` and the Tailwind `backdrop-blur-*` utilities on every In_Scope_Screen surface, except on the global `Toaster` and on the modal scrim used by `Dialog` and `PageLoader` (where it MAY be applied at no more than 8px blur).
5. THE Design_System SHALL forbid the current "conic-gradient halo" pattern (`.border-conic-soft`) from any element. The class SHALL be removed from `app/globals.css`.
6. THE Design_System SHALL forbid the current "aurora" radial gradient classes (`bg-aurora-action`, `bg-aurora-soft`, `bg-scene-hero`, `bg-scene-auth`) from being layered on top of card content. WHERE an ambient atmospheric background is used at the page level, it SHALL be governed by Requirement 13 clauses 9 and 10.
7. THE Design_System SHALL forbid the `bg-grid-faint` mesh background from being placed on top of content cards. The hero may use a single subtle structural element (e.g. a typographic or rule-based composition) but SHALL NOT use a Tailwind-CSS dotted/grid mesh as the page-level texture.

### Requirement 6: Motion Language

**User Story:** As a user navigating the app, I want motion that signals state changes meaningfully, so that the interface feels alive without feeling animated for its own sake.

#### Acceptance Criteria

1. THE Design_System SHALL define exactly one motion palette with named duration tokens (no more than 5 steps from `instant` to `slow`) and named easing tokens (no more than 4 curves) in `tailwind.config.ts` and `design-system/DESIGN.md`.
2. THE Design_System SHALL forbid page-level enter animations (e.g. fade-in-up of the entire page or hero section) on any In_Scope_Screen.
3. THE Design_System SHALL forbid stagger animations on lists where the list is part of the user's primary task (Receipts grid, Settings sections, Profile fields).
4. WHERE motion is used, the only allowed triggers SHALL be: user input (hover, focus, press, drag), state change (loading → loaded, dialog open/close, status change), or a documented attention signal on a single critical element per screen.
5. THE Design_System SHALL define motion primitives only on `transform` and `opacity` properties. Animations of `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow`, `filter`, or `background` SHALL NOT be used in any keyframe or transition on user-facing components.
6. WHEN a user is a Reduced_Motion_User, THE Design_System SHALL disable every animation defined in this redesign, including indeterminate progress indicators (the existing `ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `pulse-red`, `shimmer` keyframes), and SHALL replace them with a static equivalent (e.g. a non-animated dot, a static border highlight).
7. THE Design_System SHALL replace the existing `framer-motion`-based `Stagger`/`StaggerItem`/`HoverLift`/`FadeIn` primitives with a smaller motion API. THE Design_System SHALL document whether `framer-motion` is retained or removed from `package.json`, and if retained, SHALL restrict its use to the documented Component_Primitives only.
8. THE Design_System SHALL forbid more than one indeterminate-loop animation visible on any screen at any time.

### Requirement 7: Iconography

**User Story:** As a user reading the interface, I want icons to feel coherent and intentional, so that they reinforce the brand instead of looking like the default Lucide library.

#### Acceptance Criteria

1. THE Design_System SHALL document the icon strategy for the redesign, choosing exactly one of: (a) keep `lucide-react` with a single documented stroke width and a curated subset of allowed icon names, or (b) adopt a different icon family with the same constraints, or (c) commission a custom icon set for the Brand_Mark and key navigation icons while using `lucide-react` for utility icons.
2. THE Design_System SHALL define the rendered stroke width of all icons as a single value (e.g. 1.5 or 1.75) and SHALL forbid mixing stroke widths within the same screen.
3. THE Design_System SHALL define icon size tokens (e.g. `icon-xs`, `icon-sm`, `icon-md`, `icon-lg`) tied to the spacing scale.
4. THE Design_System SHALL forbid wrapping icons in decorative tiles (rounded-square `border-conic-soft`, glow rings, gradient backgrounds) except for the Brand_Mark, which is governed by Requirement 1 clauses 4 and 5.
5. WHERE an icon is used decoratively next to text, the icon SHALL have `aria-hidden="true"` and SHALL NOT introduce additional color beyond the icon's parent color token.

### Requirement 8: Component Primitives Redesign

**User Story:** As a developer, I want every shipped component primitive to reflect the new visual identity, so that page-level work composes correctly without re-decoration.

#### Acceptance Criteria

1. THE Design_System SHALL update each of the following Component_Primitives to use only redesigned tokens and the redesigned Motion_Language: `Button` (all variants and sizes), `Card` (and Card subparts), `Input`, `Textarea`, `Dialog`, `Badge`, `Avatar`, `Skeleton`, `Loaders` (all variants), `PageLoader`, `RouteProgress`, `MobileBottomNav`, `DashboardHeader`, `AmbientBackground`.
2. THE Design_System SHALL consider a Component_Primitive fully migrated only when the primitive uses redesigned tokens AND the redesigned Motion_Language exclusively. IF a primitive retains any deprecated visual element from the AI_Slop_Pattern catalogue (gradient fill, conic halo, glow shadow, aurora background, masked grid), THEN the primitive SHALL NOT be marked complete.
3. THE `Button` primitive SHALL define no more than 4 variants (primary, secondary, ghost, danger) and 4 sizes (sm, default, lg, icon), and SHALL NOT use a multi-color gradient fill on any variant.
4. THE `Card` primitive SHALL render with a single solid surface fill, a single border tone, and SHALL NOT layer the current `bg-card-elevated` linear-gradient overlay or the `shadow-card-sm`/`shadow-card-lift` pair on the resting state.
5. THE `Input`/`Textarea` primitives SHALL render a focus state with a single documented border-color change and an optional 1-token-thick focus ring, and SHALL NOT use a 4px shadow halo (`shadow-[0_0_0_4px_rgba(...)]`) or a glow on focus.
6. WHEN the `Loaders` family is redesigned, THE Design_System SHALL replace the current `ledger-scan`/`loader-rail`/`loader-step`/`ScanGlyph`/`ProcessRail`/`ProcessSteps` set with a single coherent loading vocabulary documented in `design-system/COMPONENT_PATTERNS.md`, and SHALL remove the unused keyframes from `tailwind.config.ts`.
7. THE `MobileBottomNav` SHALL not use a glow-shadow indicator (`shadow-[0_0_8px_rgba(91,140,255,0.5)]`); the active state SHALL be conveyed via a redesigned indicator documented in `design-system/navigation.md`.
8. WHEN a component renders an empty state, THE component SHALL use the redesigned empty-state pattern from `design-system/COMPONENT_PATTERNS.md` and SHALL NOT layer the `bg-aurora-soft` gradient over the empty-state card (as `ReceiptEmptyState` currently does).
9. THE redesigned components SHALL preserve every existing prop signature so that consuming pages do not need a logic rewrite, except where a deprecated visual prop (e.g. an unused `pulseUrgency` mode) is removed and documented in a migration note.

### Requirement 9: Screen-by-Screen Redesign Scope

**User Story:** As a project owner, I want a defined per-screen scope, so that "redesign the UI" has a finite, verifiable definition of done.

#### Acceptance Criteria

1. THE redesign SHALL cover every In_Scope_Screen and SHALL produce an updated page-level spec for each in `design-system/`: `landing.md`, `login.md`, `signup.md`, `dashboard.md`, `profile.md`, `settings.md`, `test-extraction.md`.
2. THE redesigned `Landing` (`/`) SHALL render without an animated stagger entrance, without `bg-grid-faint`, without `bg-scene-hero`, without `text-gradient-primary`, and without `border-conic-soft`. The hero composition SHALL be defined in `design-system/landing.md` with a wireframe-level prose description.
3. THE redesigned `Login` (`/login`) and `Signup` (`/signup`) SHALL share a single redesigned auth shell that does not use `bg-scene-auth`, `border-conic-soft`, the `ActionLoader` glyph during submit, or the existing `ReceiptText` icon-in-a-tile mark. The two screens SHALL differ only in copy and the secondary footer link.
4. THE redesigned `Dashboard` (`/dashboard`) SHALL re-architect the hero block currently rendered in `ReceiptDashboard` so that it does not stack `bg-aurora-action`, `bg-grid-faint`, and `mask-fade-bottom` on the same card. The redesigned hero block SHALL use a single documented surface treatment defined in `design-system/dashboard.md`.
5. THE redesigned `Dashboard` SHALL keep the existing functional surfaces (money-at-risk summary, intake address, AI extraction, search input with `/` shortcut, segmented filters, receipt grid, editor sheet) but SHALL re-tone each to comply with the redesigned Motion_Language and Surface_Treatment.
6. THE redesigned `Profile` (`/profile`) and `Settings` (`/settings`) SHALL define their layouts in their respective specs and SHALL share the redesigned `DashboardHeader`/`MobileBottomNav` chrome.
7. THE redesigned `Test Extraction` (`/test-extraction`) SHALL retain its developer-tool tone but SHALL use the redesigned monospace and surface tokens.
8. THE redesign SHALL NOT add any new route, page, or top-level user-facing feature beyond what exists today.

### Requirement 10: Design-System Documentation as Source of Truth

**User Story:** As a future contributor (human or AI), I want the design-system docs to be unambiguous and consistent with the code, so that the redesign cannot drift back into AI-slop the next time work is delegated.

#### Acceptance Criteria

1. THE redesign SHALL update `design-system/DESIGN.md` to reflect every token, anti-pattern, and rule introduced by Requirements 1 through 8.
2. THE redesign SHALL update `design-system/COMPONENT_PATTERNS.md` to reflect every Component_Primitive change introduced by Requirement 8.
3. THE redesign SHALL update `design-system/REFERENCES.md` so that its quick-lookup tables match the redesigned tokens exactly.
4. THE redesign SHALL update `design-system/IMPLEMENTATION.md` to remove references to commands or workflow steps that the redesign deprecates, and to add redesign-specific guidance.
5. THE redesign SHALL update `design-system/REVIEW.md` to reflect the redesigned scoring rubric, with the AI_Slop_Pattern checklist from Requirement 13 incorporated as a hard-fail Tier-1 check.
6. THE redesign SHALL update `design-system/ACCESSIBILITY.md` and `design-system/PERFORMANCE.md` to reflect the redesigned tokens and the budgets defined in Requirements 11 and 12.
7. WHEN the code disagrees with the docs after the redesign ships, the code SHALL be considered the bug and the docs SHALL be considered authoritative for behavior — except where the docs themselves were the bug, in which case the documenter SHALL update the docs in the same change that fixes the code.
8. THE redesign SHALL add a new file `design-system/VISUAL_IDENTITY.md` containing the Visual_Identity statement required by Requirement 1 clause 2, the rejected AI_Slop_Pattern catalogue from Requirement 13, and example screenshots / wireframes of the redesigned screens.

### Requirement 11: Accessibility

**User Story:** As a user with a disability, I want the redesigned UI to remain WCAG 2.1 AA compliant, so that the visual changes do not regress accessibility.

#### Acceptance Criteria

1. WHEN any redesigned text appears on its target surface, THE pair SHALL meet WCAG 2.1 AA contrast (≥4.5:1 for normal text, ≥3:1 for ≥18px bold or ≥24px regular).
2. WHEN any redesigned UI component (border, focus ring, accent indicator) appears on its target surface, THE pair SHALL meet ≥3:1 contrast.
3. THE redesigned focus-visible state SHALL be visually distinguishable from the resting state on every interactive element and SHALL NOT rely on color alone (it SHALL also include a thickness, offset, or shape change). THE non-color change SHALL be visually prominent enough that a sighted user can identify the focused element at a glance from across an arm's-length viewing distance.
4. WHEN a Reduced_Motion_User loads any In_Scope_Screen, every animation defined by Requirement 6 SHALL be disabled and the screen SHALL remain fully usable.
5. THE redesign SHALL preserve the existing semantic HTML structure (one `<main>`, one `<h1>` per page, `<nav>` for navigation, labels associated with every input).
6. THE redesigned interactive elements SHALL preserve a minimum 44×44 CSS-pixel touch target, including in the `MobileBottomNav` and in receipt-card action buttons.
7. THE redesigned color tokens SHALL NOT use color as the sole indicator of urgency, status, or error — a text label AND/OR an iconographic mark SHALL always also be present, as enforced by the existing `UrgencyBadge` pattern.

### Requirement 12: Performance Budget for the Visual Layer

**User Story:** As a user on a slower connection, I want the new look to load and respond as fast as the current one, so that aesthetic upgrades don't cost speed.

#### Acceptance Criteria

1. THE redesign SHALL NOT increase the gzipped first-load JavaScript for the `/dashboard` route by more than 10 KB compared to the pre-redesign baseline measured in `next build` output.
2. THE redesign SHALL NOT increase the gzipped CSS bundle by more than 5 KB compared to the pre-redesign baseline.
3. THE redesigned typography SHALL load no more than two web-font families and SHALL preload the UI sans-serif's regular weight only.
4. THE redesigned ambient/background layer SHALL NOT introduce any image asset larger than 16 KB and SHALL NOT use a `<canvas>`, WebGL, or `<video>` element on any In_Scope_Screen.
5. WHEN a user navigates between two In_Scope_Screens, the transition SHALL complete within 200 ms on a baseline reference device (Lighthouse mobile profile).
6. THE redesigned animations SHALL keep the main thread idle (no JavaScript-driven per-frame work) by using only CSS transitions/animations or framer-motion declarative animations on `transform`/`opacity`.
7. WHEN a single In_Scope_Screen is rendered, the count of simultaneously-running CSS animations SHALL be bounded by Requirement 6 clause 8 (no more than one indeterminate loop visible at a time).

### Requirement 13: Anti-AI-Slop Catalogue (Hard-Fail List)

**User Story:** As a reviewer, I want a checklist of patterns that are forbidden, so that "doesn't look AI-generated" has an objective definition.

#### Acceptance Criteria

1. THE Design_System SHALL forbid Tailwind-default indigo/violet/blue accent palettes (`indigo-500`, `violet-500`, `blue-500`/`#3B82F6`, `#5B8CFF`) on any user-facing surface.
2. THE Design_System SHALL forbid purple-to-blue, blue-to-cyan, and orange-to-pink linear-gradient backgrounds on hero sections, CTAs, or cards.
3. THE Design_System SHALL forbid `bg-clip-text` gradient text on headings or wordmarks.
4. THE Design_System SHALL forbid masked dotted/grid mesh backgrounds (`bg-grid-faint` + `mask-fade-radial`/`mask-fade-bottom`) layered behind hero or card content.
5. THE Design_System SHALL forbid radial "aurora" or "spotlight" gradient blobs as a card-internal background layer.
6. THE Design_System SHALL forbid conic-gradient halos around icon/logo tiles.
7. THE Design_System SHALL forbid glassmorphism (translucent fill + backdrop-blur) on any surface other than the Toaster and the modal scrim.
8. THE Design_System SHALL forbid stagger-fade entrance animations on lists, hero sections, or proof grids.
9. WHERE an ambient atmospheric layer is used at the page level (e.g. a subtle background shift), THE layer SHALL be a single tonal element no more than 8% lighter than the canvas, SHALL NOT contain a perceptible gradient stop or center, and SHALL NOT be layered with a grid or noise mesh.
10. THE Design_System SHALL forbid the combination of "dark canvas + cobalt-blue accent + radial gradient + grid pattern + glow shadow" appearing together on the same screen.
11. THE Design_System SHALL forbid generic placeholder language patterns ("Quiet deadlines. Loud savings.", "Trusted by thousands", "How it works", "Get started in 60 seconds") as decorative copy unless explicitly approved as part of the redesign's voice work.
12. THE Design_System SHALL forbid `lucide-react` icons as the brand mark inside a rounded-square tile.
13. THE Design_System SHALL forbid stacking more than one of: tile-bordered icon, gradient text, conic halo, aurora background, dotted grid, glow shadow on a single composition.
14. THE redesigned `Landing` page hero SHALL contain at most one (1) of the following decorative elements: ambient tonal background, structural rule line, single typographic mark. Any combination of two or more SHALL fail review.

### Requirement 14: Migration and Backward Compatibility

**User Story:** As a developer rolling out the redesign, I want a clean migration path, so that the redesign can be merged without breaking existing routes, tests, or data flow.

#### Acceptance Criteria

1. THE redesign SHALL preserve every existing route path under `app/` and SHALL NOT change any API contract under `app/api/`.
2. THE redesign SHALL preserve the existing data shapes in `types/receipt.ts` (e.g. `ReceiptStatus`, `ReceiptWithUrgency`, `Urgency`).
3. WHEN a deprecated CSS class is removed (`border-conic-soft`, `bg-scene-hero`, `bg-scene-auth`, `bg-aurora-action`, `bg-aurora-soft`, `bg-grid-faint`, `mask-fade-radial`, `mask-fade-bottom`, `text-gradient-primary`, `text-gradient-action`), THE redesign SHALL grep the codebase for usages and remove or replace each one in the same change.
4. WHEN a deprecated keyframe is removed (`ledger-scan`, `loader-rail`, `loader-step`, `glow-pulse`, `shimmer`), THE redesign SHALL remove the keyframe from `tailwind.config.ts` and SHALL replace every consumer.
5. THE redesign SHALL preserve the existing `prefers-reduced-motion` global override in `app/globals.css` and SHALL extend it as required by Requirement 6 clause 6.
6. THE redesign SHALL preserve the existing `Toaster` configuration semantics (position, theming, action button styling) but MAY restyle it.
7. WHEN the redesign removes or renames a `Component_Primitive` prop or variant, THE redesign SHALL document the removal in a migration note inside `design-system/COMPONENT_PATTERNS.md`.

### Requirement 15: Definition of "Feels Premium" (Acceptance Criteria for Done)

**User Story:** As the user requesting this redesign, I want a concrete definition of premium that can be verified, so that "looks premium" is testable instead of subjective.

#### Acceptance Criteria

1. WHEN a reviewer compares the redesigned screen against any AI_Slop_Pattern from Requirement 13, no pattern SHALL be present.
2. WHEN a reviewer reads the rendered text on any In_Scope_Screen, the typographic hierarchy SHALL be inferable from size and weight alone with no color cue, and SHALL match the documented type scale from Requirement 3 clause 4.
3. WHEN a reviewer measures spacing between any two adjacent elements on any In_Scope_Screen, the measurement SHALL match a value from the spacing scale defined in Requirement 4 clause 1.
4. WHEN a reviewer interacts with any interactive element (button, input, card, link, status toggle), the resting, hover, focus-visible, active, and disabled states SHALL all be visually distinct and SHALL all derive from the redesigned tokens.
5. WHEN a reviewer reduces motion via OS settings, every animation SHALL stop and the screen SHALL remain fully usable.
6. WHEN a reviewer renders any In_Scope_Screen at viewport widths 360px, 768px, 1024px, 1440px, and 1920px, the layout SHALL remain readable with no horizontal scroll and no broken intersections of the documented grid.
7. WHEN a reviewer renders the Landing screen alongside a known reference set (Linear homepage, Vercel homepage, Stripe homepage, Arc browser homepage, Things 3 marketing page, Raycast homepage), THE redesigned Landing SHALL be visually distinguishable from each of the references — i.e. it SHALL NOT be a near-duplicate of any one reference's hero composition, color, or motion.
8. WHEN a reviewer counts decorative elements (gradient layers, decorative borders, glow shadows, grid meshes, animated background pieces) on any single In_Scope_Screen, the count SHALL be at most 1, in compliance with Requirement 13 clause 13.
9. WHEN a reviewer applies the redesigned tokens to a previously un-redesigned component, the component SHALL look correct without further per-component theming work, demonstrating that the token system is internally consistent.
10. WHEN a reviewer audits the final `tailwind.config.ts`, `app/globals.css`, and `design-system/*.md` files, every value referenced from a component SHALL trace to a named token, with no orphan utilities.
