# Receipt Guardian — Codebase Audit and Implementation Plan

## Current codebase snapshot

- **Framework:** Next.js 15 App Router with TypeScript, Tailwind CSS, React 19, Supabase, Gmail API, Gemini, Groq, Resend, and Vitest.
- **Main product flow:** user signs up with Supabase Auth, opens `/dashboard`, manually creates receipts, pastes order emails into AI extraction, or triggers Gmail import through `/api/gmail/check-now`.
- **Data model:** `profiles`, `receipts`, and `email_logs` with RLS policies documented in `docs/01-data-model-and-api.md`.
- **Core backend modules:** `lib/receipts`, `lib/ai`, `lib/email`, `lib/notifications`, `lib/auth`, and `lib/supabase`.
- **Current UI state:** functional MVP, dark theme, simple cards, basic forms, and minimal visual hierarchy.

## Validation already performed

- **Lint:** `npm run lint` passed.
- **Typecheck:** `npm run typecheck` passed.
- **Unit tests:** `npm test` passed with 14 tests across 5 files.
- **Production build:** `npm run build` passed before the security fixes. Re-run after edits is required as the final gate.

## Issues fixed during this audit

- **Protected AI extraction:** `/api/extract` now requires an authenticated user before calling AI providers.
- **Protected extraction test page:** `/test-extraction` now requires login because it calls the protected extraction API.
- **Scoped Gmail import:** `/api/gmail/check-now` now searches unread Gmail messages from the current user's email instead of all unread senders.
- **Safer cron exposure:** `/api/cron/check-deadlines` is no longer public in production when `CRON_SECRET` is missing.
- **Safer receipt pagination:** invalid, negative, or huge `limit` and `offset` values are now normalized.
- **Safer delete semantics:** deleting a receipt now returns `404` when the record does not belong to the user or does not exist.
- **Safer price validation:** empty price is treated as `null` instead of being coerced to `0`.

## New implementation phases

### Phase 1 — Stability and security hardening

- **Auth boundaries:** keep all AI, Gmail, dashboard, and receipt mutation endpoints behind authenticated routes.
- **Rate limiting:** add a low-cost limiter for `/api/extract`, `/api/gmail/check-now`, `/api/receipts`, login, and signup.
- **Input validation:** add field-level UI validation for currency, dates, price, and required high-confidence receipt fields.
- **RLS verification:** manually test User A vs User B data isolation before inviting beta users.
- **Secrets audit:** confirm `SUPABASE_SERVICE_ROLE_KEY`, AI keys, Gmail credentials, Resend key, and cron secret never appear in the client bundle.

### Phase 2 — Premium UI redesign

- **Landing page:** replace the plain hero with a cinematic premium product page: glass panels, gradient glow, dashboard mockup, trust rail, and animated proof points.
- **Dashboard:** promote urgent receipts, money-at-risk, upcoming return windows, and AI confidence into an executive-style command center.
- **Receipt cards:** redesign cards with urgency glow, brand/store identity, deadline countdown, price emphasis, confidence chip, and compact actions.
- **Forms:** move manual receipt entry and AI extraction into polished panels with progressive disclosure and review states.
- **Empty states:** use premium onboarding flows with steps: forward email, paste email, create receipt manually, test reminders.

### Phase 3 — Product-quality data flow

- **Gmail ingestion:** add a visible import activity log so users know whether messages were imported, skipped, duplicated, or need review.
- **AI review queue:** save low-confidence extractions for human review instead of only showing a warning.
- **Dashboard pagination:** use server pagination and filters for large receipt history.
- **Status automation:** mark active receipts as expired when deadlines pass, or show expired computed state separately from user-chosen status.
- **Notifications:** add visible notification history and retry handling for Resend failures.

### Phase 4 — QA, observability, and launch readiness

- **E2E critical path:** add Playwright or equivalent checks for signup, login, manual receipt creation, edit, delete, search, and logout.
- **API contract tests:** add authenticated tests for receipt CRUD and unauthorized access.
- **AI evaluation set:** maintain anonymized email samples for extraction regression checks.
- **Operational logs:** add trace IDs for Gmail import, AI extraction, DB save, and notification sending.
- **Release checklist:** require lint, typecheck, test, build, manual dummy-data QA, and RLS checklist before deploy.

## Implementation priority order

1. **Keep security fixes:** validate current changes with build and manual app checks.
2. **Add rate limiting:** highest remaining production risk.
3. **Redesign landing and dashboard shell:** highest perceived-quality improvement.
4. **Redesign receipt cards and editor:** highest day-to-day UX improvement.
5. **Add import/review transparency:** highest trust improvement for AI/Gmail behavior.
6. **Add E2E dummy-data testing:** highest confidence improvement before launch.
