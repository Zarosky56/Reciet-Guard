# Requirements Document

## Introduction

This feature adds three integrated capabilities to Receipt Guardian's mobile experience:

1. A premium, mobile-first **Onboarding_Flow** modelled on the structural pattern of wisprflow.ai (full-bleed steps, one decision per screen, large display copy, single primary action), shown the first time a user lands on the dashboard on a Mobile_Viewport.
2. A **Folding_Card** treatment of the existing "Your return dashboard" hero card that displays a peeled-corner affordance; tapping the corner flips the card to reveal a **Warranty_View** of the user's receipts. The flip must be GPU-accelerated, 60fps, and have no perceptible loading state.
3. **Photo_Capture** (in-app camera) and **Media_Upload** (image/PDF file selection) entry points for creating receipts directly from the dashboard, both feeding the existing extraction Provider_Chain (Document AI → Gemini → Groq → needs_review) so the app remains $0-out-of-pocket per `.kiro/steering/cost-rules.md`.

The new UI must reuse the redesigned token system, primitives, and motion vocabulary established by `.kiro/specs/premium-ui-redesign` (no cobalt/indigo/violet accent, no aurora, no glassmorphism off the allow-list, single coherent loader, transform-only motion). It must reposition existing dashboard chrome where necessary so the composition does not feel cluttered, but it must not introduce a second decorative element into any screen, and it must not regress the AI_Slop_Pattern checklist (Tier-1) defined in `design-system/REVIEW.md`.

## Glossary

- **System**: The Receipt Guardian Next.js application (App Router, `app/(dashboard)/dashboard/page.tsx`, `components/receipts/receipt-dashboard.tsx`).
- **Mobile_Viewport**: A viewport whose CSS-pixel width is ≤ 640px (the existing Tailwind `sm` breakpoint boundary).
- **Onboarding_Flow**: A sequence of full-bleed steps (cover, value statement, capture demo, upload demo, finish) shown to a User the first time they reach the dashboard on a Mobile_Viewport, after authentication has succeeded.
- **Onboarding_State**: A serialisable record `{ completed: boolean, lastStep: integer, version: integer }` persisted across sessions so the System can resume or skip the Onboarding_Flow.
- **Onboarding_Persistence**: The mechanism that writes Onboarding_State to durable storage (`receipt_guardian.onboarding_v1` localStorage key on the client) and reads it back on every dashboard mount.
- **Onboarding_Serializer**: The pure function that serialises an Onboarding_State value to a JSON string, plus its inverse parser.
- **Folding_Card**: The redesigned hero card on the dashboard whose visible top-right corner is rendered with a subtle 3D fold/peel that acts as the primary affordance for revealing the Warranty_View.
- **Card_Flip**: The 3D rotateY transition applied to the Folding_Card (and only the Folding_Card) that swaps the front face (return dashboard summary) for the back face (Warranty_View), and vice versa.
- **Card_Front**: The front face of the Folding_Card containing the existing money-at-risk summary, intake address, "Check inbox", "Add", and "Paste email" actions.
- **Card_Back**: The back face of the Folding_Card containing the Warranty_View.
- **Warranty_View**: A view that lists every receipt with a non-null `warranty_deadline`, sorted ascending by remaining warranty days, using the existing `<ReceiptCard>` primitive.
- **Receipt_Capture_Sheet**: A bottom-anchored sheet on Mobile_Viewport (and centered modal on wider viewports) that hosts the Photo_Capture and Media_Upload entry points and surfaces the resulting receipt for review before save.
- **Photo_Capture**: The capture pathway that opens the device camera in-page (via `navigator.mediaDevices.getUserMedia` where supported, or via the `<input type="file" accept="image/*" capture="environment">` HTML capture fallback when not supported), produces a single still image, and submits it to the extraction pipeline.
- **Media_Upload**: The upload pathway that opens the device file picker via `<input type="file" accept="image/*,application/pdf" multiple>` and submits each selected file to the extraction pipeline.
- **Captured_Asset**: One image or PDF produced by Photo_Capture or Media_Upload, with fields `{ blob: Blob, mimeType: string, sizeBytes: integer, sourcePath: "camera" | "upload" }`.
- **Asset_Validator**: The pure client-side function that accepts a candidate file or blob and returns either a Captured_Asset or a typed validation error (`UNSUPPORTED_TYPE`, `TOO_LARGE`, `TOO_MANY`, `EMPTY`).
- **Provider_Chain**: The extraction pipeline defined in `lib/ai/extract-receipt.ts`: Document AI (only when `ENABLE_DOCUMENT_AI=true`) → Vertex AI Gemini (only when enabled) → AI Studio Gemini → Groq → needs_review, with billing/quota errors caught silently per `.kiro/steering/cost-rules.md`.
- **Extraction_Endpoint**: The HTTP endpoint that accepts a Captured_Asset and returns an `AIExtractionResult` shaped value identical to the existing `app/api/extract/route.ts` response (`{ status, provider, data, error? }`).
- **Reduced_Motion_User**: A User whose system preference matches `prefers-reduced-motion: reduce` or whose browser exposes `[data-reduced-motion="static"]` per the redesigned token system.
- **Decorative_Element**: A purely ornamental visual element as defined by `design-system/VISUAL_IDENTITY.md` (ambient tonal background, structural rule line, single typographic mark). The fold cue on the Folding_Card is a functional affordance, not a Decorative_Element.
- **AI_Slop_Pattern**: The 14-item hard-fail checklist reproduced in `design-system/REVIEW.md` § Tier-1 (cobalt/indigo/violet accents, hue-shifting gradients, `bg-clip-text`, masked grid mesh, aurora blob, conic halo, off-allow-list glassmorphism, stagger-fade entrance, ambient gradient stop, stacked-slop combo, generic placeholder copy, lucide-icon-as-brand-mark, multi-slop composition, landing decorative budget).

## Requirements

### Requirement 1: Mobile Onboarding Flow

**User Story:** As a first-time user opening Receipt Guardian on my phone, I want a short premium walkthrough that explains how the app captures my receipts, so that I understand the product before I see the dashboard.

#### Acceptance Criteria

1. WHEN an authenticated User loads the dashboard route on a Mobile_Viewport AND `Onboarding_State.completed` is `false`, THE System SHALL render the Onboarding_Flow as a full-viewport overlay above the dashboard chrome before the dashboard becomes interactive.
2. THE Onboarding_Flow SHALL contain exactly five ordered steps: `cover`, `value`, `capture-demo`, `upload-demo`, `finish`.
3. THE Onboarding_Flow SHALL render exactly one step at a time, occupying 100% of the viewport width and 100% of the viewport height minus the device safe-area insets.
4. THE Onboarding_Flow SHALL render a single primary action button per step, labelled `Continue` for steps 1 through 4 and `Get started` for step 5.
5. WHEN the User taps the primary action button on step `N` where `N < 5`, THE System SHALL advance to step `N + 1` within 150ms.
6. WHEN the User taps the primary action button on step 5, THE System SHALL set `Onboarding_State.completed` to `true`, persist the state via Onboarding_Persistence, dismiss the overlay, and reveal the dashboard within 250ms.
7. WHEN the User performs a horizontal swipe gesture on a step, THE System SHALL move forward (left swipe) or backward (right swipe) by `floor(swipeDistanceCssPixels / 96)` steps with a minimum of one step per gesture and a maximum equal to the remaining steps in that direction, clamped at the first and last step; gestures shorter than 64 CSS pixels SHALL be ignored.
8. THE Onboarding_Flow SHALL render a step-progress indicator showing the current step index and the total step count using the redesigned `<Loader>` family's static accent dot pattern; THE System SHALL NOT render any indeterminate animation in the Onboarding_Flow.
9. WHEN the User taps a `Skip` affordance present on every step except step 5, THE System SHALL set `Onboarding_State.completed` to `true`, persist the state, and dismiss the overlay within 250ms.
10. WHEN an authenticated User loads the dashboard route AND `Onboarding_State.completed` is `true`, THE System SHALL NOT render the Onboarding_Flow.
11. WHEN an authenticated User loads the dashboard route on a viewport wider than 640 CSS pixels AND `Onboarding_State.completed` is `false`, THE System SHALL set `Onboarding_State.completed` to `true` without rendering the Onboarding_Flow, so desktop users are never blocked by the mobile walkthrough.
12. THE Onboarding_Flow SHALL use only redesigned tokens (`--color-canvas`, `--color-canvas-raised`, `--color-text-primary`, `--color-accent`, `--color-accent-tint`, the `--text-*` type scale, the `--space-*` scale) and SHALL contain no gradient utility, no `bg-clip-text` text, no aurora layer, no conic border, no `backdrop-blur-*` outside the redesign's allow-list, and no Lucide icon presented inside a tile.
13. IF rendering the Onboarding_Flow on the dashboard route would introduce a second Decorative_Element to a screen that already carries one, THEN THE System SHALL suppress the existing screen-level Decorative_Element while the overlay is visible so the per-screen budget defined in `design-system/VISUAL_IDENTITY.md` is preserved.

### Requirement 2: Onboarding State Persistence and Round-Trip

**User Story:** As a returning user, I want the app to remember whether I have completed the onboarding, so that I am not shown the walkthrough again.

#### Acceptance Criteria

1. THE Onboarding_Persistence layer SHALL write Onboarding_State to the `receipt_guardian.onboarding_v1` localStorage key on every state change.
2. WHEN the dashboard route mounts, THE Onboarding_Persistence layer SHALL read the `receipt_guardian.onboarding_v1` localStorage key and parse it via the Onboarding_Serializer.
3. IF the stored value is missing, empty, or fails to parse, THEN THE Onboarding_Persistence layer SHALL initialise Onboarding_State to `{ completed: false, lastStep: 0, version: 1 }`.
4. IF the stored value parses successfully but its `version` field does not match the current schema version, THEN THE Onboarding_Persistence layer SHALL overwrite the stored value with exactly `{ completed: false, lastStep: 0, version: 1 }` and use that exact value as the in-memory Onboarding_State.
5. THE Onboarding_Serializer SHALL be a pure function from `Onboarding_State` to `string` whose inverse parser, when applied to the serialiser's output, returns a value structurally equal to the input (round-trip property).
6. IF localStorage is unavailable (private browsing, quota exceeded, blocked by policy), THEN THE Onboarding_Persistence layer SHALL fall back to an in-memory Onboarding_State for the lifetime of the page and SHALL NOT throw.

### Requirement 3: Folding Dashboard Card with Warranty Reveal

**User Story:** As a user on the dashboard, I want the "Your return dashboard" card to look like it has a folded corner, so that I can flip it to see my warranty-relevant receipts without leaving the page.

#### Acceptance Criteria

1. THE System SHALL render the existing "Your return dashboard" hero block as a Folding_Card with a visible fold cue in the top-right corner whose footprint is at most 56×56 CSS pixels.
2. THE fold cue SHALL be a functional affordance with `role="button"`, an accessible label of `Show warranty view` when the Folding_Card displays Card_Front and `Show return dashboard` when the Folding_Card displays Card_Back, and a tab-stop in the document's natural focus order.
3. WHEN the User activates the fold cue (mouse click, touch tap, Enter key, or Space key) AND the Folding_Card displays Card_Front, THE System SHALL transition the Folding_Card to Card_Back via Card_Flip.
4. WHEN the User activates the fold cue AND the Folding_Card displays Card_Back, THE System SHALL transition the Folding_Card to Card_Front via Card_Flip.
5. THE Card_Flip SHALL animate via a `rotateY` transform on a single GPU-composited layer with `transform-style: preserve-3d`, `backface-visibility: hidden` on each face, `will-change: transform` only during the flip, and SHALL animate no other property than `transform`.
6. THE Card_Flip SHALL complete within 320ms (`--motion-default`) using the `--ease-standard` easing curve.
7. THE System SHALL render both Card_Front and Card_Back into the DOM at the same time so that no network request, no React Suspense boundary, and no skeleton state is visible during a Card_Flip.
8. WHEN the Folding_Card displays Card_Front, the Card_Back face SHALL be hidden from the accessibility tree (`aria-hidden="true"`, `inert` where supported) and SHALL not receive pointer or keyboard focus; the symmetric rule SHALL hold when the Folding_Card displays Card_Back.
9. THE Folding_Card SHALL maintain its current bounding box (width and height) during the Card_Flip so adjacent dashboard sections do not reflow.
10. WHILE the Card_Flip is in progress, THE System SHALL ignore additional fold-cue activations and SHALL NOT queue them.
11. WHEN the User is a Reduced_Motion_User, THE System SHALL swap faces instantaneously without rotation while preserving the same accessibility transitions defined in clauses 2 and 8.
12. THE fold cue SHALL render with the redesigned token system, contain no gradient fill, no `backdrop-blur`, no glow shadow, and SHALL combine its colour signal with a non-colour cue (an inline corner-fold `<svg>`) so the affordance remains visible to users who do not perceive colour differences.
13. THE Card_Back SHALL render the Warranty_View as a vertically scrollable list of `<ReceiptCard>` instances bound to receipts whose `warranty_deadline` is non-null, sorted ascending by warranty days remaining; receipts with a null `warranty_deadline` SHALL NOT appear on Card_Back.
14. WHEN no receipt has a non-null `warranty_deadline`, THE Card_Back SHALL render the redesigned dashed-border empty state with the heading `No warranties tracked yet` and a single body paragraph explaining how warranty deadlines populate; THE empty state SHALL NOT use any aurora overlay, gradient, or glow.
15. WHEN the dashboard route is loaded with the URL hash `#warranty`, THE System SHALL render the Folding_Card initialised to Card_Back without animating a Card_Flip on mount.
16. THE Folding_Card SHALL be the only element in the System that uses a `rotateY` flip transform; THE System SHALL NOT introduce flip animations on any other card or component.
17. THE Folding_Card SHALL render at ≥ 60 frames per second on a baseline mid-tier Android device (Moto G Power class) for the duration of the Card_Flip; THE Card_Flip SHALL NOT trigger layout, paint, or composite work outside the Folding_Card's compositing layer.

### Requirement 4: In-App Photo Capture for Receipts

**User Story:** As a user with a paper receipt in my hand, I want to take a photo from inside the app, so that I can save the receipt without leaving Receipt Guardian.

#### Acceptance Criteria

1. THE System SHALL render a `Capture` action on the dashboard hero that opens the Receipt_Capture_Sheet.
2. WHEN the Receipt_Capture_Sheet is open, THE System SHALL render two equally weighted entry points: `Take photo` (Photo_Capture pathway) and `Upload` (Media_Upload pathway); both entry points SHALL be visible regardless of camera availability so the User can always choose between live capture and file selection.
3. WHEN the User selects `Take photo`, THE System SHALL request camera access via `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`.
4. IF `navigator.mediaDevices.getUserMedia` is unavailable in the User's browser, THEN THE System SHALL fall back to an `<input type="file" accept="image/*" capture="environment">` element so the User can still capture a still image via the OS camera app.
5. IF the User denies the camera permission prompt, THEN THE System SHALL display the message `Camera access was blocked. Use Upload instead, or allow camera access in your browser settings.` and SHALL keep the Receipt_Capture_Sheet open with the Media_Upload action focusable.
6. WHEN camera access is granted, THE System SHALL render a live preview at the device's native aspect ratio inside the Receipt_Capture_Sheet, with a single primary `Capture` shutter button and a secondary `Cancel` button.
7. WHEN the User activates the shutter button, THE System SHALL produce a single still image as a JPEG Blob at a maximum long-edge resolution of 2048 CSS pixels and a maximum file size of 4 MB.
8. WHEN a still image is produced, THE System SHALL display the image in a review state inside the Receipt_Capture_Sheet with `Retake` and `Use photo` actions.
9. WHEN the User activates `Use photo`, THE System SHALL submit the resulting Captured_Asset to the Extraction_Endpoint via the Provider_Chain.
10. WHEN the System closes the Receipt_Capture_Sheet for any reason, THE System SHALL stop every active `MediaStreamTrack` it opened so the device camera light turns off within 500ms.
11. THE Photo_Capture pathway SHALL request the camera only after an explicit User gesture (the `Take photo` activation) and SHALL NOT request camera access on dashboard mount.
12. THE Receipt_Capture_Sheet SHALL meet the redesigned 44×44 CSS-pixel touch-target minimum on every interactive element.

### Requirement 5: Image and Media Upload for Receipts

**User Story:** As a user with a saved receipt image or PDF, I want to upload it from my device, so that the app can extract the details for me.

#### Acceptance Criteria

1. WHEN the Receipt_Capture_Sheet is open AND the User selects `Upload`, THE System SHALL open the device file picker via `<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple>`.
2. WHEN the User selects one or more files, THE Asset_Validator SHALL validate each file against the rules in clauses 3, 4, and 5.
3. THE Asset_Validator SHALL accept only files whose MIME type is one of `image/png`, `image/jpeg`, `image/webp`, or `application/pdf`; any other type SHALL produce the typed error `UNSUPPORTED_TYPE`.
4. THE Asset_Validator SHALL reject any single file whose size exceeds 10 MB with the typed error `TOO_LARGE`.
5. THE Asset_Validator SHALL reject any selection whose total file count exceeds 5 with the typed error `TOO_MANY`.
6. WHEN every selected file passes validation, THE System SHALL submit each Captured_Asset to the Extraction_Endpoint sequentially.
7. WHEN one or more selected files fail validation, THE System SHALL display a non-blocking toast message naming the rejected file(s) and the typed error, and SHALL still process the files that passed validation.
8. THE Receipt_Capture_Sheet SHALL display per-file progress for the upload pathway using the redesigned `<Loader>` primitive (one static accent dot plus a label) and SHALL NOT display a Loader2 spinner or any shimmer animation.

### Requirement 6: Extraction Pipeline and Cost Containment

**User Story:** As the operator of this product, I need every photo capture and upload to honour the documented free-tier provider chain, so that the app never spills into paid Google Cloud usage.

#### Acceptance Criteria

1. WHEN a Captured_Asset is submitted to the Extraction_Endpoint, THE Extraction_Endpoint SHALL invoke the Provider_Chain in the documented order: Document AI (only when `ENABLE_DOCUMENT_AI=true`) → Vertex AI Gemini (only when enabled) → AI Studio Gemini → Groq → needs_review.
2. WHEN `ENABLE_DOCUMENT_AI` is unset or `false`, THE Extraction_Endpoint SHALL skip Document AI entirely and start the chain at the first text-capable provider.
3. WHEN any provider in the Provider_Chain throws a billing-related error matching the documented patterns (HTTP 402, HTTP 403 with quota or billing keywords, `BILLING_DISABLED`, `RESOURCE_EXHAUSTED`), THE Extraction_Endpoint SHALL fall through to the next provider silently and SHALL NOT surface the billing error to the User.
4. WHEN every provider in the Provider_Chain fails or returns confidence below threshold, THE Extraction_Endpoint SHALL return an `AIExtractionResult` with `status: "needs_review"` and a summary of failures, identical in shape to the existing `app/api/extract/route.ts` response.
5. WHEN the Extraction_Endpoint returns `status: "success"`, THE System SHALL open the existing receipt editor sheet pre-filled with the extracted fields and a `Save` action so the User can review and persist the receipt.
6. WHEN the Extraction_Endpoint returns `status: "needs_review"`, THE System SHALL open the existing receipt editor sheet with empty fields and the toast message `Extraction needs review. You can enter it manually.`.
7. THE System SHALL NOT render any UI affordance that prompts the User to enable, upgrade to, or pay for a Google Cloud product.
8. THE Extraction_Endpoint SHALL return within 30 seconds for any single Captured_Asset; IF a provider exceeds 30 seconds for a single attempt, THEN THE Extraction_Endpoint SHALL abort that provider and fall through to the next one. IF every provider in the Provider_Chain is aborted, fails, or returns confidence below threshold (whether by timeout, error, or low confidence), THEN THE Extraction_Endpoint SHALL return `status: "needs_review"` per clause 4 even when the cumulative chain time exceeds 30 seconds.

### Requirement 7: Seamless Integration, Accessibility, and Performance

**User Story:** As a user of the existing dashboard, I want the new onboarding, fold-flip, capture, and upload features to feel native to the redesigned UI, so that the page does not feel cluttered or slower.

#### Acceptance Criteria

1. THE System SHALL preserve every user-facing route and API endpoint that exists prior to this feature; THE System SHALL NOT remove or rename any route in `app/**/page.tsx` or `app/api/**/route.ts`.
2. THE System SHALL render the `Capture` and `Upload` actions inside the existing dashboard hero card alongside `Check inbox`, `Add`, and `Paste email`, and SHALL NOT introduce a new top-level chrome element to host them.
3. WHEN the dashboard hero action row would exceed the available width on a Mobile_Viewport, THE System SHALL collapse the secondary actions (`Add`, `Paste email`, `Capture`, `Upload`) into a single `More` overflow control whose menu uses the redesigned `<Dialog>` primitive.
4. THE System SHALL contain at most one indeterminate animation visible at any time across the entire dashboard route, consistent with the redesign's single coherent loading vocabulary.
5. THE Onboarding_Flow, Folding_Card, Photo_Capture preview, and Media_Upload progress indicators SHALL animate only `transform` and `opacity` properties; THE System SHALL NOT animate `width`, `height`, `top`, `left`, `box-shadow`, or `filter` on any element introduced by this feature.
6. WHEN the User is a Reduced_Motion_User, THE Onboarding_Flow step transitions SHALL swap content without sliding, THE Card_Flip SHALL swap faces without rotating, AND THE Photo_Capture preview SHALL appear without a fade-in.
7. THE System SHALL meet WCAG 2.1 AA contrast ratios on every text/background pair introduced by this feature using the redesigned colour tokens; THE System SHALL combine every status, urgency, or error indicator introduced by this feature with text or an icon and SHALL NOT rely on colour alone.
8. THE System SHALL render every interactive element introduced by this feature with a non-colour focus-visible signal (a 2px outline at 2px offset for buttons, a 1px ring at 1px offset for inputs) per the redesign's interactive-states rule.
9. THE System SHALL meet the redesigned per-screen Decorative_Element budget on the dashboard route (at most one Decorative_Element); THE fold cue and the Receipt_Capture_Sheet sheet handle SHALL be classified as functional affordances, not Decorative_Elements.
10. THE System SHALL NOT introduce a Tier-1 AI_Slop_Pattern violation as defined in `design-system/REVIEW.md` § Tier-1 (T1-1 through T1-14); a Tier-1 hit on the dashboard, the Onboarding_Flow, or the Receipt_Capture_Sheet is a hard fail.
11. THE Onboarding_Flow SHALL NOT increase the dashboard route's first-load JavaScript by more than 12 KB gzipped versus the pre-feature baseline captured in `design-system/__tests__/bundle-baseline.json`; THE Folding_Card and Receipt_Capture_Sheet together SHALL NOT increase the dashboard route's first-load JavaScript by more than 18 KB gzipped versus the same baseline.
12. THE System SHALL NOT add a `<canvas>`, `<video>` element, or WebGL context to the dashboard's static render tree; THE Photo_Capture `<video>` element introduced by clause 4.5 SHALL be mounted only while the Receipt_Capture_Sheet is open and SHALL be unmounted when the sheet closes.
13. WHEN the User navigates from the dashboard to the profile or settings route while the Onboarding_Flow, Folding_Card animation, or Receipt_Capture_Sheet is open, THE System SHALL dismiss the open overlay before the route transition begins so no overlay leaks across routes.
14. THE System SHALL preserve the existing `<DashboardHeader>`, `<MobileBottomNav>`, semantic structure (single `<main>`, single `<h1>`), and `<Toaster position="bottom-right" theme="dark">` configuration on the dashboard route after this feature lands.
