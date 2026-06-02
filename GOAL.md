# Restricted User Gmail Auto-Fetch Goal

Implement a restricted, user-specific Gmail auto-fetch and receipt extraction
system for Receipt Guardian. The system must connect Gmail per user, scan only
recent receipt-like emails from a strict sender allowlist, enforce a hard sync
quota, and import only receipts that are still useful to the user.

## Current Setup Status

- Supabase SQL setup has already been run in the SQL editor.
- `user_gmail_connections` exists with RLS policies.
- `gmail_sync_runs` exists with RLS policies.
- `receipts.gmail_message_id` and `receipts.gmail_thread_id` have been added.
- Gmail import dedupe index has been added.
- Google authentication provider has already been enabled in Supabase Auth.
- Future implementation should not assume these setup steps are missing.

## 1. Database: User Gmail Connections

Create a Supabase/Postgres table named `user_gmail_connections`.

### Required Columns

- `id`
- `user_id`
- `gmail_email`
- `access_token`
- `refresh_token`
- `expires_at`
- `scope`
- `status`
- `needs_reconnect`
- `connected_at`
- `updated_at`
- `last_sync_at`
- `sync_preferences` (jsonb field storing user's auto-fetch choices such as timeframeDays, allowedSenders, uncertainAction, notificationPref, and reminderPref)

### Security Requirements

- Enable RLS on `user_gmail_connections`.
- Users can only select, insert, update, and delete their own connection.
- Policies must use `auth.uid() = user_id`.
- Store only the minimum required Gmail OAuth scope.
- Prefer `https://www.googleapis.com/auth/gmail.readonly`.
- Never expose tokens to the browser.

## 2. Gmail OAuth API

Create Google OAuth connect and callback endpoints under:

- `/api/auth/gmail/connect`
- `/api/auth/gmail/callback`
- `/api/auth/gmail/disconnect`

### Required Behavior

- Connect endpoint starts the Google OAuth flow for the signed-in user.
- Callback endpoint stores or updates that user's Gmail connection.
- Disconnect endpoint removes the user's stored Gmail tokens.
- If token refresh fails later, mark the connection as `needs_reconnect`.
- Settings UI should clearly show connected, disconnected, and reconnect-needed
  states.

## 3. Google Sign-In And Sign-Up

Add direct sign-in and sign-up with Google/Gmail for user authentication.

### Important Separation

Google sign-in is for logging into Receipt Guardian. Gmail connection is for
reading receipt-like emails from the user's inbox. These should be implemented
as separate flows:

- Google sign-in/sign-up: authenticates the user.
- Connect Gmail: asks for Gmail read-only permission for receipt imports.

This avoids accidentally asking for inbox access during account creation.

### Required Behavior

- Add "Continue with Google" to login and signup screens.
- Use Supabase Auth Google provider for authentication.
- Route successful Google login users to the dashboard.
- If a Google-authenticated user has not completed onboarding, send them through
  onboarding first.
- Keep existing email/password login and signup working.
- Do not request Gmail read permissions during normal sign-in.
- Ask for Gmail read-only permission only from settings or the Gmail import
  setup flow.

### Required Configuration

- Enable Google provider in Supabase Auth.
- Add the Supabase Google callback URL in Google Cloud Console.
- Add local and production redirect URLs in Supabase.
- Configure production URL before deploying to Vercel.
- Document and add `OAUTH_ENCRYPTION_KEY` in `.env.local` to support token encryption.

### Acceptance Criteria

- New users can create an account with Google.
- Existing users can sign in with Google.
- Existing email/password users are not broken.
- Authenticated users land in the correct dashboard/onboarding route.
- Gmail import is not enabled until the user separately connects Gmail.

## 4. User Gmail Sync Function

Implement the user-specific sync logic in:

`lib/email/user-gmail-sync.ts`

### Required Gmail Search Filter

Construct the Gmail search query dynamically based on the user's selected time window and sender choices:
- Default query structure: `newer_than:${days}d subject:(invoice OR receipt OR order OR bill) from:(...)`
- Respect user-defined choices for days (`2d`, `7d`, `14d`) and approved senders, defaulting to 2 days and all standard whitelisted senders if not configured.

### Required Sync Rules

- Only sync for the currently authenticated user or a provided trusted user id
  from server-side code.
- Load that user's Gmail OAuth connection.
- Refresh the access token if expired.
- Process a strict maximum of 5 Gmail messages per sync run.
- The max 5 limit must be enforced server-side and must not be client-controlled.
- Extract receipt data from eligible emails.
- Discard extracted receipts when the extracted return or warranty deadline is
  already in the past.
- If no deadline is found, keep the receipt as needing review instead of
  discarding it.
- Never import the same Gmail message twice.

## 5. Deduplication

Add dedupe protection so repeated syncs do not create duplicate receipts.

### Required Behavior

- Store Gmail `message_id` or `thread_id` on imported receipt records or in a
  dedicated import log table.
- Skip messages that were already processed for the same user.
- Return skipped duplicate counts in sync results.

## 6. Manual Check Endpoint

Update:

`app/api/gmail/check-now/route.ts`

### Required Behavior

- Use the signed-in user's Gmail connection.
- Do not use any global or admin Gmail token for user inbox imports.
- Run `syncUserGmailReceipts` with the hard max 5 message limit.
- Return a clear summary:
  - checked
  - imported
  - needs_review
  - skipped_duplicate
  - skipped_expired
  - failed
- Rate limit manual sync based on database fields (e.g. check `last_sync_at` in `user_gmail_connections` and return a 429 status code if the request is less than 5 minutes since the last sync) to prevent users from spamming requests.

## 7. Settings UI Hookup

Update:

`app/(dashboard)/settings/page.tsx`

### Required UI

- Show Gmail connection status.
- Show connected Gmail email address.
- Add "Connect Gmail" button.
- Add "Disconnect Gmail" button.
- Add "Check now" button when connected.
- Show reconnect warning if token refresh failed.
- Show privacy copy explaining that the app only scans recent receipt-like
  emails from the approved sender allowlist.

## 8. Guided Gmail Import Setup Flow

When the user clicks "Check inbox", show a premium guided choice instead of
immediately starting a Gmail scan.

### Required Entry Choice

Ask the user to choose one of two paths:

- Manual check: run a one-time inbox check now.
- Auto fetch: connect Gmail and configure automatic receipt fetching.

### Manual Check Behavior

- If Gmail is already connected, run the restricted one-time sync.
- If Gmail is not connected, explain why Gmail permission is needed and route
  the user through the Gmail connect flow.
- After connection, return the user to the manual check result screen.
- Show a clear result summary:
  - checked
  - imported
  - needs review
  - duplicates skipped
  - expired receipts skipped
  - failed

### Auto Fetch Behavior

- If Gmail is not connected, ask for Gmail permission first.
- Use a clear permission screen before redirecting to Google OAuth.
- After Gmail connection succeeds, continue the setup flow automatically.
- Ask setup questions before enabling auto fetch.

### Required Auto Fetch Questions

Ask the user which time window to scan:

- New emails only
- Last 2 days
- Last 7 days
- Last 14 days

Ask which companies/senders to include:

- Amazon India
- Amazon
- Flipkart
- Apple
- Uber
- Other supported senders

Ask what the app should do with uncertain receipts:

- Add to review automatically
- Ask before adding

Ask notification preference for auto imports:

- Notify for every imported receipt
- Send a grouped summary
- Do not notify

Ask reminder preference for imported receipts:

- Enable return and warranty reminders
- Enable only return reminders
- Enable only warranty reminders
- Do not enable reminders automatically

### Required Auto Fetch Rules

- Respect the user's selected time window and sender choices.
- Keep the server-side maximum of 5 processed messages per sync run.
- Never allow the client to bypass quota limits.
- Use the strict allowlist by default.
- If "Other supported senders" is selected, only allow server-approved senders.
- Store user auto-fetch preferences securely.
- Let users edit or disable auto fetch from settings.

### Premium UI/UX Requirements

- The flow should feel polished, calm, and trustworthy.
- Use a guided setup sheet or full-screen mobile flow.
- Use smooth, subtle animations for step transitions.
- Avoid jarring layout shifts during OAuth return and setup completion.
- Use clear progress indication.
- Use concise copy that explains privacy and permissions.
- Make manual check and auto fetch feel like deliberate choices.
- Mobile layout must not overflow at narrow widths.
- Respect reduced-motion preferences.

## 9. Mobile Onboarding Rebuild

Recreate the onboarding experience as a premium, mobile-first setup flow. The
current onboarding is too static and does not reliably configure important
preferences such as currency. The new onboarding should help users set up their
environment, understand what the app needs, and reach the dashboard without
confusion.

### Current Workspace Issues To Fix

- Current onboarding lives in `components/onboarding/onboarding-flow.tsx`.
- Step files live in `components/onboarding/steps`.
- Currency selection in `step-currency.tsx` is incomplete because clicking
  "Other" maps back to `USD` instead of letting the user choose another
  currency.
- Onboarding can reopen on a fresh browser or PWA install when localStorage is
  incomplete, even if the server profile says onboarding is already complete.
- `OnboardingFlow` supports `initialStep` and `onStepChange`, but the dashboard
  does not currently pass those props, so step resume behavior is incomplete.
- The current steps explain notifications, camera, Gmail, and reminders, but do
  not let users actively configure enough of the setup.
- The current visual treatment is simple and sleek, but too plain for a
  high-trust mobile first-run experience.

### Product Goal

- Make onboarding feel like the user's first setup experience, not a passive
  tutorial carousel.
- Help users understand where they are, what each permission does, and what will
  happen next.
- Get users to a useful dashboard quickly while still collecting essential setup
  preferences.
- Keep the flow skippable without leaving broken or incomplete settings.
- Make the mobile PWA/app experience feel polished enough for future app store
  distribution.

### Required Flow

- Use a full-screen mobile-first onboarding flow with safe-area support.
- Keep each step focused on one decision or one action.
- Include a visible progress indicator.
- Include a clear skip option.
- Include back navigation or swipe-back behavior where appropriate.
- Save progress after every step so the user can resume if the app closes.
- Persist completion both locally and server-side.
- Do not reopen onboarding when the server profile says onboarding is complete,
  unless the user explicitly enables "Intro to app" again from profile.
- If the user skips, save sensible defaults and mark onboarding complete.
- Respect reduced-motion preferences.

### Required Setup Steps

Include setup screens for:

- Welcome and value preview.
- Default currency.
- Reminder timing preference.
- Notification preference.
- Camera/scan explanation.
- Gmail import explanation.
- First receipt entry preference.
- Completion and next action.

### Currency Requirements

- Let users choose common currencies such as `INR`, `USD`, `EUR`, and `GBP`.
- Add support for a custom 3-letter currency code.
- Validate custom currency input before saving.
- Show the selected currency clearly.
- Persist selected currency through `/api/notifications/preferences`.
- Update the dashboard default receipt currency after onboarding completes.
- Add tests that prove currency selection changes and saves correctly.

### Reminder Requirements

- Let users choose reminder presets, such as:
  - Smart default: 20 days, 7 days, 3 days, 1 day, due today.
  - Minimal: 7 days, 1 day.
  - Urgent only: 1 day, due today.
  - Custom later in settings.
- Persist reminder preference through existing notification preference storage.
- Make it clear that reminders can be changed later.

### Notification Permission Requirements

- Use permission priming before any browser/system notification prompt.
- Explain why notifications help before asking.
- Do not block onboarding if permission is denied.
- If the user declines, keep email reminders enabled by default.
- If the user accepts, enable app push notifications where supported.
- Show a graceful fallback when push notifications are unavailable on the
  current browser/device.

### Camera Permission Requirements

- Explain camera scanning before requesting camera access.
- Do not request camera permission during onboarding unless the user explicitly
  chooses to test scanning.
- Keep camera optional.
- If camera access is denied, show upload and manual entry as alternatives.
- Ensure camera-related onboarding copy matches actual app behavior.

### Gmail Import Requirements

- Explain Gmail import separately from Google sign-in.
- Do not request Gmail read permission during basic account onboarding unless
  the user explicitly chooses Gmail auto import.
- Give users clear choices:
  - Set up Gmail import now.
  - Use manual or AI paste first.
  - Skip Gmail setup for later.
- If Gmail setup is chosen, route into the guided Gmail import setup flow.

### First Receipt Entry Preference

- Ask how the user wants to add their first receipt:
  - Scan with camera.
  - Upload receipt image/PDF.
  - Paste an order email with AI.
  - Manual entry.
  - Connect Gmail later.
- Use the user's choice to guide the next dashboard action after onboarding.
- Do not create duplicate forms. Reuse existing add receipt, capture, upload,
  AI paste, and manual entry behavior.

### Premium UI And Animation Requirements

- Use existing `framer-motion` and app motion tokens instead of adding a new
  animation dependency.
- Use transform and opacity animations only for major transitions.
- Use horizontal motion for forward/back step changes.
- Use small micro-interactions for selected options, progress, and completion.
- Use receipt-themed visual assets or custom in-app illustrations that make the
  setup feel concrete.
- Avoid generic static icon-only slides.
- Avoid visual clutter, nested cards, and text-heavy tutorial screens.
- Keep all controls thumb-friendly with at least 44px touch targets.
- Ensure the flow works on narrow devices such as 300px wide screens.
- Avoid horizontal overflow and text clipping.
- Ensure animations remain smooth and do not cause lag.

### Mobile UX Research Principles

- Show value before asking for permissions.
- Ask only for information that is needed for setup.
- Prefer just-in-time permission requests over early permission prompts.
- Use progress indication so users know how many steps remain.
- Save progress across sessions.
- Keep copy short and scannable.
- Let users skip without punishment.
- Use animation to demonstrate product value, not as decoration.

## 10. Attachment And Extraction Strategy

### Required Behavior

- Parse email body first.
- If useful receipt data is not found, inspect PDF or image attachments when
  present.
- Preserve available receipt image/PDF attachment metadata for the imported
  receipt.
- Keep failed or uncertain extraction results in review instead of silently
  losing them.

## 11. Real Receipt Image And PDF Handling

Replace all fake/demo receipt media in production receipt views with real
attachment handling.

### Current Workspace Notes

- The backend already has an attachment upload route at
  `app/api/receipts/[id]/attachments/route.ts`.
- Receipt detail UI already knows how to use `receipt.attachments[0].signed_url`
  when a real attachment exists.
- Current receipt cards and detail views still fall back to demo/Unsplash/mock
  receipt previews when no real file exists.
- The current scan/upload extraction flow sends files to `/api/extract`, but the
  original uploaded/scanned file is not guaranteed to be saved as a receipt
  attachment when the receipt is created.

### Required Behavior

- Remove fake Unsplash/demo receipt thumbnails from real receipt cards.
- Remove mock PDF filenames and fake PDF previews from real receipt details.
- Show real receipt images only when an image attachment exists.
- Show real PDF actions only when a PDF attachment exists.
- If no file exists, show a neutral "No receipt file attached" state.
- When a user uploads an image or PDF, save that original file as a real receipt
  attachment.
- When a user clicks or captures a picture with the camera, save that captured
  photo as a real receipt attachment.
- When a user creates a receipt from scan/upload extraction, carry the captured asset through the create flow and attach it to the newly created receipt. (Developer Tip: This should be implemented cleanly on the client-side by keeping the uploaded/captured `File` in React state and calling the `/api/receipts/[id]/attachments` API endpoint immediately after the receipt creation request succeeds).
- When Gmail imports include PDF/image attachments, save them as real receipt
  attachments linked to the imported receipt.
- Mark the first receipt file as primary when appropriate.
- Never show demo media in production receipt detail views.

### Detail View Requirements

- Image attachments should preview inside the receipt detail window.
- PDF attachments should show an "Open PDF" action.
- All real attachments should have a download action when a signed URL exists.
- Attachment filename, file type, and file size should reflect the real stored
  file.
- If signed URL creation fails, show a graceful unavailable state instead of a
  fake fallback.

### Demo/Test Data Rules

- Keep "Load Demo Receipt" only in clearly labeled demo/testing areas.
- Demo receipt media must never appear as if it is a real user receipt.
- Production receipt cards and detail windows should prefer category icons or an
  empty file state when no attachment exists.

## 12. Add Receipt Entry Flow

When the user clicks "Add Receipt", show a clear entry-choice flow before
opening a form.

### Required Behavior

- Clicking "Add Receipt" should ask the user how they want to add the receipt.
- Show at least two choices:
  - Manual entry
  - AI paste
- Manual entry opens the existing manual receipt form.
- AI paste opens the existing "Paste an order email" box.
- The flow should reuse existing receipt creation and extraction behavior
  instead of creating duplicate forms.
- The choice UI should feel premium, fast, and easy to understand on mobile.
- The choice UI should close cleanly after the user selects an option.

### UX Requirements

- Use concise labels and clear icons.
- Keep the choice lightweight, such as a small menu, command sheet, or bottom
  sheet on mobile.
- Preserve keyboard accessibility.
- Use smooth, subtle animation.
- Avoid layout shift or overlap with the dashboard search/filter controls.

## 13. Sync Audit Logging

Create a lightweight audit log for Gmail sync runs.

### Suggested Table

`gmail_sync_runs`

### Suggested Columns

- `id`
- `user_id`
- `started_at`
- `finished_at`
- `status`
- `checked_count`
- `imported_count`
- `needs_review_count`
- `skipped_duplicate_count`
- `skipped_expired_count`
- `failed_count`
- `error_summary`

### Required Behavior

- Record every manual sync attempt.
- Do not store raw email body content in logs.
- Logs should help debug Gmail sync without exposing private email data.

## 14. Bug Audit And Browser Verification

Before considering the Gmail, attachment, and add-receipt work finished, perform
a focused bug audit across the current app.

### Required Behavior

- Inspect the current workspace for potential runtime bugs, broken imports,
  stale UI paths, missing data wiring, and inconsistent receipt states.
- Fix any clear bugs found during the audit.
- Use browser-based testing to open the app and verify the most important flows.
- Check mobile and desktop layouts for overflow, overlap, broken navigation, and
  unusable controls.
- Verify that dashboard, receipt detail, settings, login, signup, and add
  receipt entry flows render without runtime errors.
- Verify that the app does not show fake receipt media in production receipt
  details.
- Verify that real receipt attachments can be previewed, opened, or downloaded
  when available.
- Capture or document any issue that cannot be fixed immediately.

### Browser Testing Requirements

- Test at least one narrow mobile viewport.
- Test at least one desktop viewport.
- Check the browser console for errors.
- Confirm unauthenticated users are redirected correctly.
- Confirm authenticated-only pages do not expose private data when logged out.
- Re-run browser checks after fixing bugs.

## 15. Date And Deadline Handling

### Required Behavior

- Normalize extracted dates before comparing deadlines.
- Compare deadlines as date-only values where possible.
- Avoid timezone bugs where a deadline due today is incorrectly treated as past.
- Discard only when the extracted deadline is confidently parsed and already
  past.

## 16. Acceptance Criteria

- Users can sign up and sign in with Google.
- Google sign-in does not automatically grant Gmail inbox access.
- Onboarding has been rebuilt as a premium mobile-first setup flow.
- Onboarding works on narrow mobile screens without overflow or clipped text.
- Onboarding progress saves after every step.
- Onboarding does not reopen when the server profile says it is complete.
- "Intro to app" can still replay onboarding from profile when enabled.
- Currency selection works for common currencies and custom 3-letter codes.
- Selected currency persists and updates the dashboard default currency.
- Reminder preferences selected in onboarding persist correctly.
- Notification permission flow uses permission priming and degrades gracefully.
- Camera permission is optional and only requested after user action.
- Gmail import is explained separately from Google sign-in.
- First receipt entry preference routes the user to the correct next action.
- Users can connect their own Gmail account from settings.
- Clicking "Check inbox" opens the manual-check vs auto-fetch choice.
- Auto fetch asks setup questions before scanning.
- Auto fetch preferences are saved and editable.
- OAuth tokens are stored per user with RLS.
- Users can disconnect Gmail.
- Manual "Check now" uses only the connected user's Gmail account.
- Gmail search uses the exact restricted query.
- Each sync processes no more than 5 messages.
- Duplicate Gmail messages are skipped.
- Receipts with already-past extracted deadlines are discarded.
- Receipts with missing or uncertain deadlines go to review.
- Sync result counts are visible to the user.
- Token refresh failures are handled with a reconnect state.
- Uploaded receipt images and PDFs are saved as real attachments.
- Camera-captured receipt photos are saved as real attachments.
- Gmail receipt attachments are saved and linked to imported receipts.
- Receipt details can preview images, open PDFs, and download real files.
- Fake/demo receipt media does not appear in production receipt details.
- Clicking "Add Receipt" asks the user to choose Manual entry or AI paste.
- Manual entry opens the manual receipt form.
- AI paste opens the existing "Paste an order email" box.
- Focused bug audit has been completed.
- Browser verification has been completed on mobile and desktop.
- Any discovered high-impact runtime errors have been fixed.
- Every meaningful change has been tested and verified before moving to the
  next implementation step.
- If a test, browser check, or manual verification fails, the failing step has
  been fixed and rerun until the favorable outcome is reached or a real blocker
  is documented.
- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run build` passes.

## 17. Testing Requirements

- Unit or integration test Google auth button rendering.
- Unit or integration test onboarding currency selection.
- Unit or integration test custom currency validation.
- Unit or integration test onboarding completion persistence.
- Unit or integration test onboarding resume behavior.
- Unit or integration test server-complete onboarding does not reopen because
  of stale localStorage.
- Unit or integration test onboarding skip saves defaults.
- Unit or integration test onboarding reminder preference persistence.
- Unit or integration test notification preference selection.
- Unit or integration test Gmail import setup state.
- Browser test mobile onboarding at a narrow viewport, including 300px width.
- Browser test onboarding progress, back/forward, skip, and finish behavior.
- Browser test currency selection visibly changes the selected option.
- Browser test custom currency input.
- Browser test onboarding completion reaches the dashboard.
- Browser test "Intro to app" replay from profile.
- Browser test manual-check path.
- Browser test auto-fetch setup path.
- Unit test Gmail query construction.
- Unit test max 5 message processing limit.
- Unit test dedupe behavior.
- Unit test expired-deadline discard behavior.
- Unit test missing-deadline needs-review behavior.
- Unit test token refresh failure handling.
- Integration test uploaded image/PDF attachment persistence.
- Integration test camera capture attachment persistence.
- Integration test Gmail attachment persistence.
- Browser test receipt detail image preview.
- Browser test receipt detail PDF open/download action.
- Browser test no-attachment empty state.
- Browser test Add Receipt choice flow.
- Browser test Manual entry option.
- Browser test AI paste option opens the existing email paste panel.
- Browser test dashboard renders without runtime errors.
- Browser test login and signup render without runtime errors.
- Browser test settings renders without runtime errors.
- Browser test mobile layout has no search/filter overlap or horizontal
  overflow.
- Integration test `/api/gmail/check-now` with a connected user.
- Integration test settings connection state rendering.
- Manual test OAuth connect, check now, and disconnect.

## 18. Task Tracking and Progress Logs

- Any agent executing the tasks in this file MUST maintain and update [goal_task.md](file:///d:/coding/crazy%20idea/Miro_pdf/goal_task.md) as a living document of their progress.
- Mark completed tasks, log any design decisions or files created/modified, and note issues encountered as they happen.

## 19. Verification Loop Requirement

Every implementation step must be tested and verified before continuing.

### Required Loop

For each meaningful change:

1. Implement the smallest safe change.
2. Run the relevant unit, integration, type, lint, or browser checks.
3. If the check passes, continue to the next step.
4. If the check fails, inspect the failure and fix the root cause.
5. Rerun the same check.
6. Repeat until the favorable outcome is reached.
7. If the favorable outcome cannot be reached, document the blocker, exact
   failing check, and next required action.

### Required Final Verification

- Run `npm run lint`.
- Run `npm run typecheck`.
- Run relevant focused tests.
- Run `npm run build`.
- Run browser verification on mobile and desktop.
- Verify onboarding on at least one narrow mobile viewport.
- Verify the changed flow end-to-end, not only isolated components.
- Do not mark the goal complete while known high-impact runtime errors remain.

## 20. Optional Advanced Enhancements

### Required Behavior for Token Encryption
- Encrypt the stored `access_token` and `refresh_token` in the database at rest.
- Use standard symmetric encryption (e.g., Node's built-in `crypto` library with `aes-256-gcm`) and an environment variable key (e.g., `OAUTH_ENCRYPTION_KEY`).
- Decrypt the tokens on-the-fly when loading them in the sync engine.

### Required Behavior for Revocation Handling
- Catch `invalid_grant` or authentication errors from Google OAuth client (which occur if the user revokes permissions).
- Automatically flag the user connection in `user_gmail_connections` by setting `needs_reconnect = true` and `status = 'disconnected'`.
- Present a clear warning to the user on the Settings and Dashboard screens.

### Required Behavior for Cron Optimization
- Ensure user Gmail syncs are executed using batching or parallel runs to prevent Next.js API timeouts on serverless environments.

### Required Behavior for Forced Reconnection Consent (Optional)
- When redirecting the user to Google's OAuth consent screen, append `prompt=consent` and `access_type=offline` to the request params. This guarantees Google issues a new `refresh_token` even if the user has previously authorized the application.

### Required Behavior for Revocation Email Alerts (Optional)
- When a user's Gmail connection is flagged as `needs_reconnect` due to permission revocation, queue and send a notification email via Resend alerting them to manually reconnect their account from the settings screen.

### Required Behavior for API Rate Limit Backoff (Optional)
- Gracefully catch Google API rate limit exceptions (HTTP 403 / 429) inside the sync routines. Log a warning and skip processing for the current user, rather than causing the whole background process to fail.

### Required Behavior for Privacy-Compliant Email Retention (Optional)
- Automatically delete or nullify the `raw_email_text` column from the `receipts` table after 30 days of creation, maintaining the privacy of user emails once receipt details have been extracted and verified.

## 21. Implementation Order

1. Add `user_gmail_connections` migration and RLS policies.
2. Add optional `gmail_sync_runs` migration.
3. Add Google sign-in/sign-up buttons through Supabase Auth.
4. Rebuild the mobile onboarding setup flow.
5. Fix onboarding currency, progress persistence, completion persistence, and
   replay behavior.
6. Browser-test onboarding on narrow mobile and desktop before continuing.
7. Build the guided Gmail import setup UI.
8. Add Gmail OAuth connect, callback, and disconnect endpoints.
9. Implement token refresh helpers.
10. Implement `lib/email/user-gmail-sync.ts`.
11. Update `/api/gmail/check-now`.
12. Implement real receipt image/PDF persistence for upload, camera, and Gmail.
13. Remove fake/demo media from production receipt card and detail views.
14. Implement the Add Receipt Manual vs AI Paste entry choice.
15. Update settings UI.
16. Add tests for auth rendering, onboarding, setup flow, quota, dedupe, deadline discard, and token
   refresh.
17. Add tests for real attachment persistence, preview, download, and empty
   states.
18. Perform focused bug audit and browser verification on mobile and desktop.
19. Fix discovered high-impact runtime/UI bugs.
20. Rerun failing steps until the favorable outcome is reached.
21. Run lint, typecheck, tests, and build.
