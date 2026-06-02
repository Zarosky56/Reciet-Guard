# Implementation Plan: Premium Mobile Onboarding & Capture

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

The plan implements three additive surfaces on the existing Next.js 14 (App Router, TypeScript) dashboard:

1. **Onboarding_Flow** — full-bleed mobile walkthrough (`components/onboarding/*`, `lib/onboarding/*`).
2. **Folding_Card** — restyle of the existing dashboard hero card with a `rotateY` flip to a Warranty_View.
3. **Receipt_Capture_Sheet** — bottom sheet hosting Photo_Capture (in-page camera) and Media_Upload (file picker), both feeding the existing Provider_Chain (`lib/ai/extract-receipt.ts`).

The implementation reuses the redesigned tokens, primitives (`<Button>`, `<Card>`, `<Dialog>`, `<Loader>`, `<UrgencyBadge>`, `<ReceiptCard>`), and motion vocabulary. The existing `app/api/extract/route.ts` is **extended** (not replaced) to accept multipart form data; the Provider_Chain inside `lib/ai/extract-receipt.ts` keeps Document AI gated behind `ENABLE_DOCUMENT_AI=true`, falls back silently on billing/quota errors (HTTP 402, 403 with billing/quota keywords, `BILLING_DISABLED`, `RESOURCE_EXHAUSTED`), and never surfaces a paid-upgrade prompt — preserving the strict $0 out-of-pocket contract from `.kiro/steering/cost-rules.md`.

Test framework: **vitest** + **fast-check** (already in `package.json` devDependencies), with `@testing-library/react` for component tests and `jsdom` for the DOM. Tests live under `tests/` mirroring the source path (`tests/lib/onboarding/persistence.test.ts`, `tests/components/receipts/folding-card.test.tsx`, etc.). Run with `npm run sadtest` (the existing `vitest run` script).

## Tasks

- [x] 1. Project scaffolding and shared types
  - [x] 1.1 Create `lib/onboarding/types.ts` with `OnboardingState`, `OnboardingStepIndex`, `ONBOARDING_STORAGE_KEY`, `CURRENT_ONBOARDING_VERSION`, and `DEFAULT_ONBOARDING_STATE`
    - Export the exact field set `{ completed, lastStep, version }` (no extras)
    - Freeze `DEFAULT_ONBOARDING_STATE` and pin `version` to the literal `1`
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 1.2 Create `lib/capture/types.ts` with `AllowedMimeType`, `CapturedAsset`, `AssetValidationError`, `AssetValidationOutcome`, `MAX_BYTES`, `MAX_FILES`, `ALLOWED_MIME_TYPES`
    - `MAX_BYTES = 10 * 1024 * 1024`, `MAX_FILES = 5`
    - `ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const`
    - _Requirements: 5.3, 5.4, 5.5, 5.9_

- [x] 2. Onboarding_Persistence (pure module + storage I/O)
  - [x] 2.1 Implement `lib/onboarding/persistence.ts`
    - Export `serializeOnboardingState(state)` that emits `{ completed, lastStep, version }` in fixed insertion order
    - Export `parseOnboardingState(raw)` that returns `null` for malformed JSON, missing/extra keys, wrong types, or `version !== CURRENT_ONBOARDING_VERSION`
    - Export `loadOnboardingState()` that performs feature detection inside a `try`/`catch`, reads once, and overwrites the key with `serialize(DEFAULT)` on missing/empty/corrupt/wrong-version values
    - Export `saveOnboardingState(state)` that returns `true` on success, `false` on failure, and never throws
    - On any localStorage throw set a module-scoped `localStorageDisabled = true`; subsequent calls return `false` without retrying
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 2.7_

  - [ ]* 2.2 Write property test for Onboarding_Serializer round-trip in `tests/lib/onboarding/serializer-roundtrip.property.test.ts`
    - **Property 1: Onboarding state serialization round-trip**
    - **Validates: Requirements 2.5**
    - Use `fast-check` to generate `OnboardingState` triples `(boolean, integer ∈ [0,5], 1)` and assert `parse(serialize(s))` deeply equals `s` and has exactly the key set `{completed, lastStep, version}`

  - [ ]* 2.3 Write property test for persistence robustness in `tests/lib/onboarding/persistence-robustness.property.test.ts`
    - **Property 2: Persistence robustness under corrupt or throwing storage**
    - **Validates: Requirements 2.3, 2.4, 2.6, 2.7**
    - Stub `localStorage` with each of `{ missing, empty, garbage, wrong-shape JSON, version=2, throwing-on-getItem, throwing-on-setItem }`; assert `loadOnboardingState()` returns `DEFAULT`, never throws, and (when writable) overwrites with the serialized default; subsequent `saveOnboardingState` returns `false` after any throw

  - [ ]* 2.4 Write unit test for synchronous persistence in `tests/lib/onboarding/persistence-sync.test.ts`
    - **Property 3: Onboarding state mutation persists synchronously before yielding**
    - **Validates: Requirements 2.1**
    - Assert that immediately after `saveOnboardingState(s)` returns, `localStorage.getItem(ONBOARDING_STORAGE_KEY) === serializeOnboardingState(s)`

- [x] 3. Onboarding_Flow state reducer
  - [x] 3.1 Implement `lib/onboarding/state.ts`
    - Export `onboardingReducer(current: OnboardingStepIndex, action)` covering `advance`, `back`, `skip`, `finish`, and `swipe({ deltaX, deltaY })`
    - Encode the swipe formula: commit iff `|Δx| ≥ 64 ∧ |Δx| ≥ 2|Δy|`; steps moved = `floor(|Δx| / 96)`; clamp to `[1, 5]`
    - Pure function, no side effects, no DOM access
    - _Requirements: 1.5, 1.7, 1.9_

  - [ ]* 3.2 Write property test for the swipe formula
    - **Property 6: Onboarding swipe gesture formula**
    - **Validates: Requirements 1.7**
    - Generate `(currentStep ∈ {1..4}, startX, startY, endX, endY)` quintuples; assert the reducer yields the documented post-state and is clamped at `[1, 5]`

- [x] 4. Asset_Validator (pure)
  - [x] 4.1 Implement `lib/capture/asset-validator.ts`
    - Export `validateAssets(files: ReadonlyArray<File>, source)` returning `AssetValidationOutcome`
    - Reject `TOO_MANY` first when `files.length > 5` (whole selection rejected, `assets: []`)
    - Per-file: emit `EMPTY` for `size === 0`, `UNSUPPORTED_TYPE` for MIME outside the allow-list, `TOO_LARGE` for `size > MAX_BYTES`; preserve input order in `assets`
    - Construct `CapturedAsset` with `blob: file`, `mimeType` cast after allow-list check, `sizeBytes: file.size`, `sourcePath: source`
    - Pure: no DOM access, no side effects
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.9_

  - [ ]* 4.2 Write property test for the validator decision table
    - **Property 15: Asset_Validator decision table**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5, 5.9**
    - Use `fast-check` to generate `File[]` with random MIMEs, sizes (incl. 0 and > 10 MiB), and lengths up to 10; assert the `ok: true` predicate exactly equals `length ≤ 5 ∧ ∀f: type ∈ ALLOWED ∧ 0 < size ≤ MAX_BYTES`; assert `assets` order matches input order of valid files; assert `TOO_MANY` empties `assets`

- [x] 5. Capture client (multipart submission with timeout and silent fallthrough)
  - [x] 5.1 Implement `lib/capture/capture-client.ts`
    - Export `submitCapturedAsset(asset, options?)` that POSTs `multipart/form-data` to `/api/extract` with fields `document` (blob) and `mimeType` (string)
    - Apply per-call `AbortController` with 30000 ms timeout (use `options.signal` if provided, link both)
    - Translate non-2xx responses other than 422 into a synthesized `{ status: "needs_review", provider: null, data: fallbackData, error: "..." }` so callers never see network/billing errors
    - Never include billing/upgrade strings in any synthesized error message
    - _Requirements: 6.3, 6.7, 6.8_

  - [ ]* 5.2 Write unit test for capture-client fallthrough
    - **Property 24 (client-side restatement): Provider_Chain silent fallthrough on billing errors**
    - **Validates: Requirements 6.3, 6.7**
    - Mock `fetch` to return HTTP 402, 403 with `BILLING_DISABLED`/`quota`, network error, and 200 success; assert the returned object is always an `AIExtractionResult`-shape and never contains `"upgrade"`, `"billing"`, `"enable"`, `"Document AI"`, `"Vertex"`, or `console.cloud.google.com`

- [x] 6. Server: extend `app/api/extract/route.ts` to accept multipart
  - [x] 6.1 Update `app/api/extract/route.ts` to dispatch on `Content-Type`
    - If `application/json`: keep existing behaviour (`extractReceiptFromEmail(parsed.data.emailText)`)
    - If `multipart/form-data`: parse via `request.formData()`, read `document` (`File | Blob`) and `mimeType` (`string`)
    - Validate `mimeType ∈ ALLOWED_MIME_TYPES`; on missing/invalid return HTTP 422 with `{ status: "needs_review", provider: null, data: fallbackData, error: "invalid document" }`
    - Otherwise call `extractReceipt({ emailText: "", document: { content: Buffer.from(await document.arrayBuffer()), mimeType } })`
    - Preserve existing auth check (`requireApiUser`)
    - Re-evaluate `process.env.ENABLE_DOCUMENT_AI` and `process.env.ENABLE_VERTEX_AI` per request — do not cache at module scope
    - _Requirements: 6.1, 6.2, 6.9, 7.1_

  - [x] 6.2 Lower the confidence threshold in `lib/ai/extract-receipt.ts` from `0.7` / `0.5` to `0.6` for both the text providers and Document AI
    - Pin both `MIN_CONFIDENCE` and `MIN_DOCUMENT_AI_CONFIDENCE` to `0.6` to match Requirement 6.4 / 6.5 / 6.8
    - Adjust the existing failure-summary string format if needed
    - _Requirements: 6.4, 6.5, 6.8_

  - [x] 6.3 Tighten silent billing-error fallthrough in `lib/ai/extract-receipt.ts` and provider modules
    - In each provider call site (`tryDocumentAi`, `tryVertexMultimodal`, `tryTextProviders`), classify caught errors via a shared helper `isBillingOrQuotaError(error)` that matches HTTP 402, HTTP 403 with `/billing|quota/i`, `BILLING_DISABLED`, `RESOURCE_EXHAUSTED`
    - On match, push a server-side log line and continue to the next provider — never re-throw, never surface the underlying error
    - Ensure the public `AIExtractionResult.error` summary string never contains the substrings `upgrade`, `billing`, `Document AI`, `Vertex`, `console.cloud.google.com`
    - _Requirements: 6.3, 6.7_

  - [x] 6.4 Enforce the per-provider 30-second abort ceiling
    - Confirm each provider's HTTP call carries an `AbortSignal` linked to a 30000 ms `setTimeout`; if not, add one
    - On abort, the helper records `${provider}: timeout` and the chain proceeds
    - Total chain time may exceed 30 s; the route still returns `needs_review` per Requirement 6.8
    - _Requirements: 6.8_

  - [ ]* 6.5 Write integration test for `/api/extract` multipart dispatch
    - **Property 23: Provider_Chain order across env-flag combinations**
    - **Validates: Requirements 6.1, 6.2, 6.9**
    - Use `fast-check` to generate `(ENABLE_DOCUMENT_AI, ENABLE_VERTEX_AI) ∈ {"true","TRUE","false","","0","yes","1",undefined}²` × submission shape; mock the providers to record invocation order; assert the order matches the decision table and that paid providers are invoked only for the literal `"true"` (case-insensitive)

  - [ ]* 6.6 Write integration test for needs_review fallback
    - **Property 25: Provider_Chain returns needs_review when every provider fails or is below confidence**
    - **Validates: Requirements 6.4**
    - Mock every provider to throw or return confidence `< 0.6`; assert the route returns HTTP 422 with `{ status: "needs_review", provider: null, error: <summary> }`

  - [ ]* 6.7 Write integration test for the 30-second per-provider ceiling
    - **Property 26: 30-second per-asset extraction ceiling with abort + fallthrough**
    - **Validates: Requirements 6.8**
    - Use vitest fake timers; mock providers to delay beyond 30 s; advance time and assert each provider attempt aborts at 30 s and the chain continues; assert the eventual response is one of `success` or `needs_review`

  - [ ]* 6.8 Write integration test for billing-error silent fallthrough
    - **Property 24: Provider_Chain silent fallthrough on billing errors**
    - **Validates: Requirements 6.3, 6.7**
    - Mock the first provider to throw HTTP 402, then HTTP 403 with `BILLING_DISABLED`, then `RESOURCE_EXHAUSTED`; assert the chain proceeds to the next provider in each case and the response body never contains the original billing-error message or the strings `upgrade`/`billing`/`Document AI`/`Vertex`/`console.cloud.google.com`

- [x] 7. Onboarding step components (visual leaves)
  - [x] 7.1 Implement `components/onboarding/steps/step-cover.tsx`
    - Render `<BrandMark size="md">` next to the wordmark (no tile, no halo, no conic ring)
    - Headline `"Receipt Guardian"`, body `"Stop missing return windows."`
    - Use redesigned tokens only; no gradient utility, no `bg-clip-text`, no aurora layer
    - _Requirements: 1.4, 1.12, 7.10_

  - [x] 7.2 Implement `components/onboarding/steps/step-value.tsx`
    - Headline `"Track every return window"`, body `"We watch the deadlines so you don't have to."`
    - _Requirements: 1.4, 1.12_

  - [x] 7.3 Implement `components/onboarding/steps/step-capture-demo.tsx`
    - Inline static SVG of a phone with a receipt frame; no `<video>`, no `<canvas>`, no animated GIF
    - Headline `"Snap any paper receipt"`, body `"Tap Capture, point your camera, and we read the receipt for you."`
    - _Requirements: 1.4, 1.12, 7.5, 7.12_

  - [x] 7.4 Implement `components/onboarding/steps/step-upload-demo.tsx`
    - Inline static SVG; no animation
    - Headline `"Upload PDFs and screenshots"`, body `"We accept PNG, JPEG, WEBP, and PDF up to 10 MB."`
    - _Requirements: 1.4, 1.12, 7.5_

  - [x] 7.5 Implement `components/onboarding/steps/step-finish.tsx`
    - Headline `"You're set"`, body `"Your dashboard is ready below."`
    - Primary action label `"Get started"`; no Skip
    - _Requirements: 1.4, 1.6_

- [x] 8. Onboarding_Flow container
  - [x] 8.1 Implement `components/onboarding/onboarding-flow.tsx`
    - Render exactly one of the five step components at a time, occupying `100vw × calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))`
    - Render `<Button variant="primary" size="lg">` (Continue / Get started) as the first focus stop on every step mount
    - Render Skip as a `<Button variant="ghost">` on steps 1–4
    - Render five static accent dots as the progress indicator using the redesigned `<Loader>` family static dot pattern (no indeterminate animation)
    - Wire pointer/keyboard activation (Enter, Space) to the reducer's `advance`/`finish`/`skip` actions
    - Wire `touchstart`/`touchend` to compute `(deltaX, deltaY)` and dispatch the `swipe` action; ignore non-committed gestures
    - Apply `data-reduced-motion="static"` on the step transition wrapper; animate only `transform: translateX(...)` with `--motion-default` and `--ease-standard`
    - On finish/skip, call `onComplete()` — the consumer persists state and unmounts the overlay
    - Trap focus inside the overlay; restore focus to the dashboard's first interactive element on close
    - Suppress dashboard-level Decorative_Element while open (Requirement 1.13) — emit `data-onboarding-open` on the document root that the dashboard's existing ambient layer watches
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8, 1.9, 1.12, 1.13, 7.5, 7.6_

  - [ ]* 8.2 Write component test for step navigation across modalities
    - **Property 5: Onboarding step navigation across activation modalities**
    - **Validates: Requirements 1.5, 1.6, 1.9**
    - Use `@testing-library/react` to mount `<OnboardingFlow initialStep={N}>` and exercise each `(currentStep, action, modality)` triple; assert post-state matches the documented contract

  - [ ]* 8.3 Write component test for per-step structural invariants
    - **Property 7: Per-step structural invariants**
    - **Validates: Requirements 1.3, 1.4, 1.8**
    - For each `i ∈ {1..5}` mount with `initialStep={i}`; assert exactly one `[data-step]` element, exactly one primary button with the documented label, `document.activeElement === primary`, and exactly five static dots; assert no element matches an indeterminate-animation selector

  - [ ]* 8.4 Write component test for reduced-motion clamp
    - **Property 27 (onboarding subset): Reduced-motion clamp**
    - **Validates: Requirements 1.6, 7.6**
    - Stub `matchMedia("(prefers-reduced-motion: reduce)")` to `true`; mount `<OnboardingFlow>`; advance steps; assert the step transition wrapper carries `data-reduced-motion="static"` and that no `transform` value differs between two consecutive frames

- [x] 9. Folding_Card and Warranty_View
  - [x] 9.1 Implement `components/receipts/folding-card.tsx`
    - Wrap front/back faces in a `[perspective:1200px]` parent and a `[transform-style:preserve-3d]` layer that animates `transform: rotateY(0|180deg)` only
    - Each face is a `<Card>` with `[backface-visibility:hidden]`; back face is pre-rotated `180deg`
    - The fold cue is a real `<button>` of size 48×48 (within `[44, 56]`), rendered top-right, carrying `aria-label` `"Show warranty view"` / `"Show return dashboard"` and a `<CornerFoldGlyph>` SVG (non-colour signal)
    - Read `window.location.hash` on mount; if `#warranty` start with face `back`, suppress the first-paint transition via `data-mounted="false"` until first `requestAnimationFrame`
    - On toggle: set `data-flipping="true"`, add `will-change: transform`; clear both on `transitionend` or via a 320 ms fallback `setTimeout`
    - During an in-progress flip, ignore further activations (do not queue them)
    - Apply `aria-hidden` and `inert` to the inactive face
    - Apply `data-reduced-motion="static"` so the global selector clamps the transition
    - Use `useLayoutEffect` to assert the bounding-rect width/height stays within ±1 CSS px across face changes (in dev only — `process.env.NODE_ENV === "development"`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.15, 3.16, 3.17, 3.18, 7.5_

  - [x] 9.2 Implement `components/receipts/warranty-view.tsx`
    - Filter `receipts` to `warranty_deadline !== null` and sort ascending by warranty days remaining
    - Render the result as a vertically scrollable list of `<ReceiptCard>` inside a container with `overflow-y: auto; overscroll-behavior: contain`
    - Empty state uses the redesigned dashed-border pattern with heading `"No warranties tracked yet"` and a single body paragraph; no aurora, gradient, or glow
    - When `isLoading`, render `<Skeleton />` × 3 (initial-load only — never during an in-progress flip)
    - _Requirements: 3.13, 3.14, 3.19_

  - [ ]* 9.3 Write component test for Folding_Card toggle invariant
    - **Property 8: Folding_Card toggle invariant**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.10**
    - Use `fast-check` to generate `(initialFace, sequence of activations across modalities and timings)`; mount, exercise the sequence, assert `face === initialFace XOR (committedFlips mod 2)`; assert in-flight activations are dropped (not queued); assert the fold cue retains keyboard focus across each committed flip

  - [ ]* 9.4 Write component test for geometric and a11y stability during flip
    - **Property 9: Folding_Card geometric stability across flip**
    - **Property 10: Folding_Card concurrent-faces and a11y-tree contract during flip**
    - **Validates: Requirements 3.1, 3.7, 3.8, 3.9**
    - Mount with varied front/back content sizes; trigger flip; assert `getBoundingClientRect()` width/height delta ≤ ±1 px; assert both faces present in DOM during transition; assert the inactive face carries `aria-hidden="true"` and `inert`; assert no `<Skeleton>` or `[aria-busy]` is rendered as a result of the flip

  - [ ]* 9.5 Write component test for style invariants
    - **Property 11: Folding_Card style invariants**
    - **Validates: Requirements 3.5, 3.6**
    - Read computed styles on the flip layer; assert `transform-style === "preserve-3d"`, each face's `backface-visibility === "hidden"`, the layer's `transition-property` includes only `transform`, and `will-change` is set only on `[data-flipping="true"]`

  - [ ]* 9.6 Write component test for URL hash → initial face
    - **Property 12: Folding_Card URL hash → initial face contract**
    - **Validates: Requirements 3.15, 3.16**
    - Set `window.location.hash = "#warranty"` then `""`; mount; assert initial face matches the documented mapping; assert no `transitionend` event fires during the first animation frame after mount

  - [ ]* 9.7 Write component test for Warranty_View filter, sort, and scroll confinement
    - **Property 14: Warranty_View filtering, sorting, and scroll confinement**
    - **Validates: Requirements 3.13**
    - Generate `ReceiptWithUrgency[]` with mixed null/non-null `warranty_deadline`; assert the rendered list equals the filtered + sorted projection; assert the container's computed `overflow-y === "auto"` and `overscroll-behavior === "contain"`

  - [ ]* 9.8 Write source-level test for rotateY singularity
    - **Property 13: rotateY usage source-singularity**
    - **Validates: Requirements 3.17**
    - Walk every `.ts(x)` file under `app/`, `components/`, `lib/`; assert the literal substring `"rotateY("` appears only in `components/receipts/folding-card.tsx`

- [x] 10. Checkpoint - Onboarding and Folding_Card surfaces complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Photo_Capture and Media_Upload
  - [x] 11.1 Implement `components/receipts/photo-capture.tsx`
    - Five-state machine: `Idle → RequestingPermission → {NoSupport | Streaming | PermissionDenied}; Streaming → {StreamFailed | Captured}; Captured → {Streaming | Submitted}`
    - Call `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })` only after the user activates the `Take photo` action (never on dashboard mount)
    - Mount the `<video>` element only inside this component; on every transition out of `Streaming` and on unmount, stop every track on the active `MediaStream` so the camera light turns off within 500 ms
    - 3000 ms timeout on first `loadedmetadata` → `StreamFailed`
    - Shutter: draw the `<video>` to a `<canvas>` scaled so `max(width, height) ≤ 2048 CSS px`; encode JPEG at quality `0.92`, re-encode at `0.85`/`0.8`/`0.75` if blob > 4 MB; emit `CapturedAsset { blob, mimeType: "image/jpeg", sourcePath: "camera" }`
    - Review state with `Retake` (returns to `Streaming` without re-requesting permission) and `Use photo` (calls `onCaptured`)
    - Fallback path: when `navigator.mediaDevices?.getUserMedia` is undefined, use `<input type="file" accept="image/*" capture="environment">` and feed the resulting `File` directly into the review state
    - On `NotAllowedError` / `NotReadableError` / `OverconstrainedError`, render the documented inline error and stop tracks
    - All interactive elements ≥ 44×44 CSS px; animate only `transform`/`opacity`
    - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.13, 4.14, 4.15, 7.5, 7.12_

  - [x] 11.2 Implement `components/receipts/media-upload.tsx`
    - Programmatically open `<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple>` on mount
    - On confirm, run `validateAssets(files, "upload")`; surface every rejection via a single `toast.error(...)` listing all rejected files with their typed error codes; `duration={5000}`
    - When `TOO_MANY` is present, reject the whole selection and do not submit
    - Submit valid Captured_Assets sequentially via `submitCapturedAsset(...)`, awaiting each response before submitting the next
    - On `error` or `needs_review`, continue with the remaining queue
    - Render per-file progress as the redesigned `<Loader>` static dot + label; no spinner, no shimmer, no pulsing skeleton, no indeterminate progress bar
    - On dismissal of the picker without selection, call `onCancel` without constructing any Captured_Asset
    - _Requirements: 5.1, 5.2, 5.6, 5.7, 5.8, 5.10, 5.11_

  - [ ]* 11.3 Write component test for sequential submission and continue-past-failure
    - **Property 16: Media_Upload sequential submission preserves order and continues past failures**
    - **Validates: Requirements 5.6, 5.10**
    - Generate `Captured_Asset[]` of length `1..5` with mocked responses (`success`, `needs_review`, network failure, billing error); spy on `submitCapturedAsset`; assert call order matches input order, in-flight count never exceeds 1, every asset is submitted

  - [ ]* 11.4 Write component test for mixed-validation toast behaviour
    - **Property 17: Media_Upload mixed validation surfaces every rejection and processes valid files**
    - **Validates: Requirements 5.7**
    - Provide a mixed `File[]` (some valid, some invalid for each error code); assert the toast text contains every rejected file name and code, lasts ≥ 5000 ms, and exactly one fetch fires per valid file

  - [ ]* 11.5 Write component test for Photo_Capture lifecycle
    - **Property 20: Photo_Capture readiness and lifecycle**
    - **Validates: Requirements 4.6, 4.13, 4.14**
    - Stub `navigator.mediaDevices.getUserMedia`; assert the camera is requested only after `Take photo` activation; advance fake timers to 3000 ms with no `loadedmetadata` to trigger `StreamFailed`; close via each modality (`Cancel`, `X`, scrim, `Escape`, route navigation); assert every track was stopped within 500 ms

  - [ ]* 11.6 Write component test for JPEG output bounds
    - **Property 18: Photo_Capture JPEG output bounds**
    - **Validates: Requirements 4.8**
    - Stub `<canvas>.toBlob` to return blobs at varied sizes; generate source dimensions `(w, h)` via `fast-check`; assert the emitted blob has `max(width, height) ≤ 2048` and `blob.size ≤ 4 * 1024 * 1024` and `blob.type === "image/jpeg"`

- [x] 12. Receipt_Capture_Sheet
  - [x] 12.1 Implement `components/receipts/receipt-capture-sheet.tsx`
    - On viewports `< sm` (640 px), render as a bottom sheet that animates `transform: translateY(...)` only; on `≥ sm`, render as a centred `<Dialog>`
    - Use the redesigned overlay treatment: `bg-surface-overlay`, `border-border`, `rounded-lg`, `shadow-overlay`, scrim `bg-canvas/70 backdrop-blur-sm`
    - Render two equal-width `<Button variant="primary" size="lg">` entry points (`Take photo`, `Upload`) inside a `flex-1 gap-3` row; both visible regardless of camera availability; both ≥ 44×44; `|width(Take photo) - width(Upload)| ≤ 2 CSS px`
    - Mount `<PhotoCapture>` xor `<MediaUpload>` based on user selection
    - Restore focus to the invoking dashboard action on close (Cancel, scrim, Escape, X, route navigation)
    - Apply `data-reduced-motion="static"` on the sheet wrapper
    - On close, abort any in-flight `submitCapturedAsset` `AbortController` and unmount `<video>` within 500 ms
    - _Requirements: 4.1, 4.2, 4.11, 4.12, 4.13, 4.15, 7.5, 7.6, 7.12_

  - [ ]* 12.2 Write component test for entry-point parity
    - **Property 19: Receipt_Capture_Sheet entry-point parity across camera availability**
    - **Validates: Requirements 4.2**
    - Mount with `cameraAvailable: true` and `false`; assert both buttons render, widths within ±2 px, both `tabIndex >= 0`, both have visible text + icon; assert no element matches a Tier-1 AI_Slop_Pattern selector and no element exceeds `backdrop-blur-sm`

  - [ ]* 12.3 Write component test for close lifecycle and focus restoration
    - **Property 21: Receipt_Capture_Sheet close lifecycle restores focus**
    - **Validates: Requirements 4.12**
    - Mount inside a harness that owns the invoking button ref; close via each modality `m ∈ {Cancel, scrim, Escape, X, navigation}`; assert in-flight Captured_Asset state is cleared and `document.activeElement === invoking action`

  - [ ]* 12.4 Write component test for camera/video unmount on close
    - **Property 30: Dashboard render tree contains no `<canvas>` / `<video>` when sheet closed**
    - **Validates: Requirements 7.12**
    - Mount the sheet open with camera streaming; close it; spy on `MutationObserver`; assert the `<video>` is unmounted within 500 ms

- [x] 13. Wire onboarding, Folding_Card, and Receipt_Capture_Sheet into ReceiptDashboard
  - [x] 13.1 Extend `components/receipts/receipt-dashboard.tsx` — onboarding mount
    - In a `useEffect(() => {…}, [])`, call `loadOnboardingState()` and `window.matchMedia("(max-width: 640px)").matches`
    - If `state.completed === false ∧ matches`, mount `<OnboardingFlow>` and wrap the dashboard subtree in `<div inert={true} aria-hidden="true">`
    - If `state.completed === false ∧ !matches`, persist `state.completed = true` without rendering the overlay
    - On `OnboardingFlow.onComplete`, call `saveOnboardingState({ completed: true, lastStep: 5, version: 1 })`, unmount the overlay, restore focus to the dashboard
    - On route navigation away, dismiss the overlay before the destination commits (use `router.events` or `useEffect` cleanup tied to pathname)
    - _Requirements: 1.1, 1.6, 1.9, 1.10, 1.11, 7.13_

  - [x] 13.2 Extend `components/receipts/receipt-dashboard.tsx` — Folding_Card hosting
    - Replace the existing "Your return dashboard" hero `<Card>` JSX with `<FoldingCard front={…} back={<WarrantyView receipts={receipts} isLoading={isLoading} />}>`
    - Keep the existing money-at-risk summary, intake address, and existing actions inside `front`
    - Read the URL hash on mount and pass `initialFace="back"` when `#warranty`
    - On flip-to-back, push `#warranty` into the URL via `history.replaceState`; on flip-to-front, clear the hash
    - _Requirements: 3.1, 3.13, 3.15, 3.16_

  - [x] 13.3 Extend `components/receipts/receipt-dashboard.tsx` — Capture and Upload actions
    - Append `Capture` and `Upload` `<Button>` instances to the existing hero action row (alongside `Check inbox`, `Add`, `Paste email`)
    - Both actions share the same primitive and size as `Add`
    - Capture each invoking button's ref so the sheet can restore focus on close
    - On activation, set the sheet's `open` state and remember which entry point to default to
    - On `onExtractionResult`: `success` → open the existing `ReceiptEditorSheet` pre-filled; `needs_review` → open the editor empty and `toast("Extraction needs review. You can enter it manually.")`
    - _Requirements: 4.1, 4.11, 5.6, 6.5, 6.6, 7.2_

  - [x] 13.4 Extend `components/receipts/receipt-dashboard.tsx` — overflow `More` collapse
    - Use a `useLayoutEffect` + `ResizeObserver` to measure the action row container's content-box width and the sum of the four secondary buttons' rendered widths plus inter-button gaps on every resize
    - When the sum exceeds the container, collapse `[Add, Paste email, Capture, Upload]` into a single `More` `<Button>` whose menu uses the redesigned `<Dialog>`; `Check inbox` remains visible inline
    - Otherwise render all five buttons inline
    - _Requirements: 7.2, 7.3_

  - [ ]* 13.5 Write component test for the onboarding rendering gate
    - **Property 4: Onboarding overlay rendering gate**
    - **Validates: Requirements 1.1, 1.10, 1.11, 1.13**
    - Stub `matchMedia` and `localStorage`; mount `<ReceiptDashboard>` across `(width, completed)` combinations; assert the overlay presence and `inert`/`aria-hidden` on the dashboard subtree match the documented gate; assert that `width > 640 ∧ !completed` results in `state.completed === true` being persisted without rendering the overlay

  - [ ]* 13.6 Write component test for Capture/Upload hero placement
    - **Property 31: Capture and Upload actions live inside the existing hero card**
    - **Validates: Requirements 7.2**
    - Mount; assert the `Capture` and `Upload` buttons share an ancestor `<Card>` with the `Check inbox` button; assert no new top-level chrome element was introduced

  - [ ]* 13.7 Write component test for the action-row overflow collapse
    - **Property 32: Action row overflow collapses to "More" on Mobile_Viewport**
    - **Validates: Requirements 7.3**
    - Use `fast-check` to generate viewport widths in `[320, 640]` and varied button rendered widths; mount; trigger `ResizeObserver` callback; assert the collapse fires when sums exceed the container, and that `Check inbox` always remains visible

  - [ ]* 13.8 Write component test for navigation-away overlay dismissal
    - **Property 33: Navigation away with overlay open dismisses overlay before destination renders**
    - **Validates: Requirements 7.13**
    - Mount the dashboard with `<OnboardingFlow>` open; navigate to `/profile` and `/settings`; assert the overlay unmounts before the destination's `<main>` commits and is absent from the destination DOM

- [ ] 14. Cross-cutting accessibility, motion, and source-invariant tests
  - [ ]* 14.1 Write test for animated-property restriction
    - **Property 28: Animated property restriction across feature surface**
    - **Validates: Requirements 7.5**
    - Walk every CSS file and inline `style` / `transition` declaration introduced by this feature's component files; assert no transition or keyframe animates `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`, `box-shadow`, `filter`, or `background-image`

  - [ ]* 14.2 Write test for at-most-one indeterminate animation on the dashboard
    - **Property 29: At-most-one indeterminate animation visible on the dashboard**
    - **Validates: Requirements 7.4**
    - For every combination `(onboarding open?, in-progress flip?, sheet open?, photo-capture state)`, mount the dashboard and assert the count of elements matching the indeterminate-animation selector is `≤ 1`

  - [ ]* 14.3 Write test for the 44×44 touch-target invariant
    - **Property 22: 44×44 touch-target invariant**
    - **Validates: Requirements 4.15, 7.8**
    - Iterate every interactive element inside `<OnboardingFlow>`, the Folding_Card fold cue, `<ReceiptCaptureSheet>`, and the `More` overflow menu; assert `getBoundingClientRect()` width and height each ≥ 44

  - [ ]* 14.4 Write test for reduced-motion clamp across the feature surface
    - **Property 27: Reduced-motion clamp covers every animation introduced by this feature**
    - **Validates: Requirements 1.6, 3.11, 7.6**
    - Stub `matchMedia("(prefers-reduced-motion: reduce)")` to `true`; mount each feature component; sample animated properties between consecutive `requestAnimationFrame` ticks and assert no measurable delta; assert `<FoldingCard>` swap completes within one frame with no `rotateY` rotation

  - [ ]* 14.5 Write test for style and source invariants
    - **Property 34: Style and source invariants restated for this feature's components**
    - **Validates: Requirements 1.12, 3.12, 7.7, 7.8, 7.9, 7.10**
    - Static-walk each new component file; assert no raw colour literals, no arbitrary-value Tailwind utilities, no Tier-1 AI_Slop_Pattern selectors (cobalt/indigo/violet, hue-shifting gradient, `bg-clip-text`, masked grid mesh, aurora blob, conic halo, off-allow-list glassmorphism, stagger-fade entrance, ambient gradient stop, stacked slop, generic placeholder copy, Lucide-as-brand-mark); assert each interactive element renders the redesigned focus-visible signal

  - [ ]* 14.6 Write test for forbidden billing/upgrade copy across UI surfaces
    - **Property 24 (UI restatement): No upgrade prompts**
    - **Validates: Requirements 6.7, cost-rules.md "No paid upgrade prompts"**
    - Mount every component introduced by this feature in every error path (camera denied, all-providers-fail, billing error, network error); render to text; assert the rendered text never contains the substrings `upgrade`, `billing`, `enable Document AI`, `Vertex`, `console.cloud.google.com`, or any link to a billing portal

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP. They are exclusively test tasks.
- Each task references the granular requirement clauses it satisfies (not just user stories).
- Property tests use `fast-check` (already a devDependency) and run under `vitest` with the existing `npm run sadtest` script.
- Cost contract: every task that touches the Provider_Chain re-confirms that `ENABLE_DOCUMENT_AI` and `ENABLE_VERTEX_AI` gate paid Google Cloud calls (per `.kiro/steering/cost-rules.md`); billing/quota errors fall through silently to the next provider; no UI surface introduced by this feature contains an upgrade or billing prompt.
- The Pub/Sub Gmail push and Cloud Storage temp-upload fallbacks called out in the cost rules are **not in scope** for this feature (they live in `lib/email/*` and the existing `app/api/gmail/*` routes); those fallbacks already exist and remain untouched.
- The existing `app/api/extract/route.ts` is **extended**, not replaced — JSON `{ emailText }` callers (the test-extraction page, paste-email flow) keep working unchanged (Requirement 7.1).
- The dashboard route's pre-feature behaviour is preserved on viewports `> 640 px` and for users whose `Onboarding_State.completed === true`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "5.1", "6.1", "6.2", "7.1", "7.2", "7.3", "7.4", "7.5", "9.2"] },
    { "id": 2, "tasks": ["6.3"] },
    { "id": 3, "tasks": ["6.4"] },
    { "id": 4, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.2", "5.2", "6.5", "6.6", "6.7", "6.8", "8.1", "9.1", "11.1", "11.2"] },
    { "id": 5, "tasks": ["8.2", "8.3", "8.4", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8", "11.3", "11.4", "11.5", "11.6", "12.1"] },
    { "id": 6, "tasks": ["12.2", "12.3", "12.4", "13.1"] },
    { "id": 7, "tasks": ["13.2"] },
    { "id": 8, "tasks": ["13.3"] },
    { "id": 9, "tasks": ["13.4"] },
    { "id": 10, "tasks": ["13.5", "13.6", "13.7", "13.8", "14.1", "14.2", "14.3", "14.4", "14.5", "14.6"] }
  ]
}
```
