# Goal Task Progress

Track the changes and design iterations made for the Restricted User Gmail Auto-Fetch system.

## Changes Made

### 1. Research and Architecture Definition
- Researched existing MVP code (including [gmail-client.ts](file:///d:/coding/crazy%20idea/Miro_pdf/lib/email/gmail-client.ts), [process-email.ts](file:///d:/coding/crazy%20idea/Miro_pdf/lib/email/process-email.ts), [check-now/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/gmail/check-now/route.ts), and [settings/page.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/app/(dashboard)/settings/page.tsx)).
- Defined OAuth structure to support individual user Gmail syncing via dedicated user connections rather than a single shared mailbox.

### 2. Specification Updates in GOAL.md
- Appended **Section 19: Optional Advanced Enhancements** to [GOAL.md](file:///d:/coding/crazy%20idea/Miro_pdf/GOAL.md).
- Added requirement to **encrypt access and refresh tokens** at rest using Node `crypto` (`aes-256-gcm`).
- Added requirement to **gracefully handle revoked tokens** (`invalid_grant`) and update connection state in DB and UI.
- Added requirement to **optimize background cron execution** via batching or async routines to prevent serverless function timeouts.
- Renumbered subsequent Implementation Order section to Section 20.

### 3. Logical Consistency Revisions in GOAL.md
- Updated Section 4 to replace hardcoded `newer_than:2d` with dynamic query construction using user preferences.
- Updated Section 6 to define database-backed rate-limiting (5-minute cooldown check on `last_sync_at`).
- Updated Section 3 to explicitly require the `OAUTH_ENCRYPTION_KEY` environment variable in `.env.local`.
- Verified that `OAUTH_ENCRYPTION_KEY` was successfully configured in the local `.env.local` file.

### 4. Added Optional Advanced Enhancements
- Added **Forced Reconnection Consent** parameter requirements to ensure stable re-auth refresh tokens.
- Added **Revocation Email Alerts** trigger specification via Resend service integration.
- Added **API Rate Limit Backoff** loop-handling specification to skip user errors gracefully.
- Added **Privacy-Compliant Email Retention** data-minimization column clearing rules.

### 5. Final Schema and Flow Optimizations in GOAL.md
- Updated Section 1 to document the new `sync_preferences` (jsonb) column on `user_gmail_connections` to store Guided Setup preferences.
- Verified database alteration execution for `sync_preferences` column.
- Updated Section 11 to include a client-side execution hint for carrying scanned/captured assets through the receipt creation flow using the existing attachments route.

### 6. Gmail Connection Constraint Fix
- Fixed a database constraint bug in [app/api/auth/gmail/callback/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/auth/gmail/callback/route.ts#L85) where trying to upsert a null value for `sync_preferences` violated the NOT NULL database constraint. Changed the fallback from `null` to `{}`.

### 7. Mobile Onboarding Rebuild Progress
- Began implementation of **GOAL.md Section 9: Mobile Onboarding Rebuild**.
- Expanded onboarding from 7 to 8 steps so the setup can include first receipt entry preference.
- Fixed the broken currency step so users can choose `INR`, `USD`, `EUR`, `GBP`, or enter a custom 3-letter currency code instead of mapping "Other" back to `USD`.
- Converted reminder, notification, Gmail import, and first receipt path steps from passive information screens into actual user setup choices.
- Updated `OnboardingFlow` to emit a setup payload containing selected currency, reminder thresholds, notification preference, Gmail setup choice, and first receipt preference.
- Updated dashboard onboarding completion wiring so preferences are persisted through `/api/notifications/preferences` in one place.
- Fixed server-completed onboarding behavior so stale localStorage does not reopen onboarding when the profile already says onboarding is complete.
- Added local dashboard currency state so the selected onboarding currency takes effect immediately in the current session.
- Added focused tests for onboarding currency selection and updated reducer tests for the 8-step flow.
- Added onboarding visual asset at `public/onboarding/receipt-setup-visual.svg`; replaced the earlier oversized PNG so the asset-budget test stays green.
- Updated the onboarding welcome step to use the generated receipt setup visual.
- Verification loop status: `npm run typecheck`, `npm run lint`, focused onboarding/auth tests, and `npm run build` all passed after reruns.

### 8. Google Auth Button Progress
- Added `Continue with Google` to the shared login/signup auth form using Supabase `signInWithOAuth({ provider: "google" })`.
- Kept Google sign-in separate from Gmail read permissions, routing OAuth through `/auth/callback?next=...`.
- Added auth render tests proving both login and signup show the Google button.
- Browser verification at 300 x 915 confirmed:
  - `/login` renders with `Continue with Google`.
  - `/signup` renders with `Continue with Google`.
  - `/dashboard` redirects unauthenticated users to `/login?next=%2Fdashboard`.
  - No browser console errors were reported for the checked auth pages.
- Browser screenshots were saved under `C:/Users/trial/AppData/Local/Temp/receipt-guardian-qa/`.

### 9. Guided Gmail Import Setup and OAuth Endpoints
- Implemented per-user Gmail OAuth helper utilities in [user-gmail-oauth.ts](file:///d:/coding/crazy%20idea/Miro_pdf/lib/email/user-gmail-oauth.ts):
  - Uses Gmail read-only scope (`https://www.googleapis.com/auth/gmail.readonly`).
  - Generates safe OAuth state.
  - Sanitizes post-OAuth return paths to same-app relative paths.
  - Encrypts OAuth tokens with `aes-256-gcm` using `OAUTH_ENCRYPTION_KEY`.
- Added Gmail OAuth API routes:
  - [connect/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/auth/gmail/connect/route.ts)
  - [callback/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/auth/gmail/callback/route.ts)
  - [disconnect/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/auth/gmail/disconnect/route.ts)
  - [status/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/auth/gmail/status/route.ts)
  - [preferences/route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/auth/gmail/preferences/route.ts)
- Added `user_gmail_connections` Supabase type coverage in [supabase.ts](file:///d:/coding/crazy%20idea/Miro_pdf/types/supabase.ts).
- Built the guided "Check inbox" setup dialog in [gmail-import-setup-dialog.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/dashboard/gmail-import-setup-dialog.tsx):
  - Manual check vs auto fetch path choice.
  - Gmail connection status loading.
  - Permission-first connect action when Gmail is not connected.
  - Auto-fetch questions for time window, sender allowlist, uncertain receipts, notifications, and reminders.
  - Saves auto-fetch preferences through `/api/auth/gmail/preferences`.
- Routed dashboard "Scan Inbox", desktop hero check action, and command palette inbox action through the guided Gmail setup dialog in [receipt-dashboard.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-dashboard.tsx).
- Added a Settings Gmail connection panel in [gmail-connection-settings.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/settings/gmail-connection-settings.tsx) and wired it into [settings/page.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/app/(dashboard)/settings/page.tsx):
  - Shows connected/disconnected/reconnect-needed state.
  - Shows connected Gmail email when available.
  - Provides Connect, Reconnect, Check now, and Disconnect actions.
  - Includes privacy copy explaining restricted read-only receipt scanning.
- Added focused tests:
  - [user-gmail-oauth.test.ts](file:///d:/coding/crazy%20idea/Miro_pdf/tests/user-gmail-oauth.test.ts)
  - [gmail-import-setup-dialog.test.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/tests/gmail-import-setup-dialog.test.tsx)
  - [gmail-connection-settings.test.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/tests/gmail-connection-settings.test.tsx)
- Verification loop status:
  - `npm run typecheck` passed.
  - `npm run lint` passed.
  - Focused Gmail OAuth/setup/settings tests passed.
  - `npm run build` initially failed because a running Next dev server held `.next/trace`; after stopping the workspace Next process lock, reran and passed.
  - Browser QA at 300 x 915 confirmed `/login` and `/signup` render Google auth without console errors and protected `/dashboard` and `/settings` redirect unauthenticated users correctly.
  - Browser QA at 1280 x 720 confirmed `/login` renders without framework overlay or console errors.
  - Unauthenticated Gmail auth API probes returned `401` with the standard app error shape.
  - Full `npm run sadtest` initially exposed a route snapshot mismatch for the new Gmail API routes and an oversized onboarding PNG from the earlier onboarding step; updated the route inventory and replaced the PNG with a 2.3 KB SVG, then reran successfully: 40 test files and 215 tests passed.
  - Final sequential `npm run build`, `npm run typecheck`, and `npm run lint` all passed.
- Boundary noted: the full user-specific Gmail sync engine and `/api/gmail/check-now` replacement remain for the later sync steps. This step made the OAuth, guided setup, status, preference, and settings surfaces ready without claiming the restricted sync worker is complete.
