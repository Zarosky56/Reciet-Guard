# Receipt Guardian — Agent Implementation Plan ($0 Build)

> **Purpose:** This document is the step-by-step execution plan for an AI coding agent or developer to build Receipt Guardian from the existing research docs.
>
> **Hard constraint:** The MVP must be buildable for **$0**. Do not introduce paid APIs, paid hosting, paid domains, paid databases, paid cron services, paid email routing, or subscriptions.
>
> **Primary implementation style:** Build in small verified increments. Each phase must leave the app runnable.

---

## 0. Research Basis Used for This Plan

This plan follows implementation-planning best practices from:

- **Asana implementation planning:** define goals, conduct research, map risks, schedule milestones, assign responsibilities, allocate resources.
- **Morningmate implementation-plan components:** goals, scope, deliverables, resources, risks, roles, timeline, communication plan.
- **Atlassian Definition of Done:** every task needs explicit completion criteria, not vague “works on my machine.”
- **Atlassian RACI:** identify tasks, roles, ownership, gaps, dependencies.
- **Supabase official Next.js SSR guidance:** use `@supabase/ssr` for App Router auth with cookies.
- **Gmail API official Node.js quickstart:** enable Gmail API, configure OAuth consent, create Desktop OAuth credentials.
- **Vercel Cron official pricing docs:** Hobby cron runs **once per day only**, so do not use Vercel Hobby cron for 5-minute Gmail polling.

---

## 1. Required Reading Map for the Agent

Before implementing, the agent must read these docs in this order:

| Step | Read | Why |
|------|------|-----|
| 1 | `README.md` | Understand project purpose and core flow |
| 2 | `docs/00-prd.md` | Understand MVP scope, user stories, acceptance criteria |
| 3 | `docs/06-decisions-log.md` | Understand why the stack was chosen and what not to change |
| 4 | `docs/01-data-model-and-api.md` | Understand database schema and API contract |
| 5 | `docs/02-architecture.md` | Understand system architecture, AI extraction, Gmail ingestion |
| 6 | `docs/03-design-system.md` | Implement premium UI consistently |
| 7 | `docs/04-testing-and-debugging.md` | Use the expected testing strategy and debugging checklist |
| 8 | `docs/05-deployment.md` | Deploy and configure free-tier infrastructure safely |

**Rule:** Do not start a phase until the phase-specific docs listed in that phase have been read.

---

## 2. $0 Build Policy

### Allowed Free Services

| Service | Usage | $0 Condition |
|---------|-------|--------------|
| **Next.js** | App framework | Open source |
| **Vercel Hobby** | Hosting + API routes | Stay within free hobby limits |
| **Supabase Free** | Auth + Postgres + realtime | Stay under free DB and auth limits |
| **Google Gemini Free** | Primary AI extraction | Stay within free daily request limits |
| **Groq Free** | AI fallback | Stay within free rate limits |
| **Gmail API** | Shared inbox for forwarded receipts | Use free Google API quota |
| **Google Pub/Sub Free Tier** | Later Gmail push automation | Keep documented, but do not implement in current manual-first MVP |
| **Resend Free** | Deadline emails | Stay under 100 emails/day |
| **GitHub Free** | Source control and optional scheduled workflow | Stay in free minutes |
| **Sentry Free** | Error tracking | Optional; stay under free event quota |

### Not Allowed in MVP

- Paid domain purchase
- Paid Vercel Pro
- Paid Supabase Pro
- Paid Resend plan
- Paid OpenAI API
- Paid Mailgun, SendGrid inbound, AWS SES, or Zapier
- Paid cron services
- Paid monitoring tools
- Paid OCR services

### Important Cron Constraint

Vercel Hobby cron supports **only once-daily cron jobs**. Therefore:

- Use Vercel daily cron only for **deadline notification checks**.
- Do **not** use Vercel Hobby cron for Gmail polling every 5 minutes.
- For the current MVP, use manual “Check Inbox Now” first.
- Keep Gmail push via Google Pub/Sub documented as the later automation upgrade if it remains free.

---

## 3. Decision: Manual Gmail Check Now, Pub/Sub Later

### Is Pub/Sub Still a Good Vercel Cron Alternative?

**Yes, technically.** Gmail push + Pub/Sub is a good alternative to frequent Vercel cron because:

- It is event-driven: Gmail notifies the app when mail arrives.
- It avoids polling every 5 minutes.
- It works with a Vercel API route as the HTTPS push endpoint.
- It scales better than polling.
- It reduces wasted API calls.

### The $0 Caveat

Pub/Sub has a free tier, but Google Cloud setup may ask for billing configuration depending on account/project state. For this project:

- Do not implement Pub/Sub in the current manual-first MVP.
- Keep the architecture ready for Pub/Sub later.
- If Pub/Sub can be used without paid upgrade and stays within free tier later, add it as an automation upgrade.
- If Google Cloud requires billing setup that the user does not want, do **not** block the MVP.
- Manual Gmail check remains the current working path.

### Final MVP Email Strategy

| Priority | Method | Cost | Use When |
|----------|--------|------|----------|
| 1 | Manual paste / manual receipt add | $0 | Phase 0 validation |
| 2 | Manual “Check Gmail Inbox Now” button | $0 | Current MVP ingestion path |
| 3 | Gmail push via Pub/Sub → Vercel webhook | $0 if within free tier | Later automation upgrade |
| 4 | Cloudflare Email Routing | Requires domain | Post-MVP only |

---

## 4. SMART Goals

| Goal | Success Metric | Target |
|------|----------------|--------|
| Validate AI extraction | Correct fields from real emails | 80%+ field accuracy on 10 emails |
| Build auth + dashboard | User can sign up and see dashboard | 100% local success |
| Build receipt CRUD | Create, edit, delete, mark status | All CRUD paths pass manual QA |
| Build manual Gmail ingestion | Forwarded email becomes receipt after user clicks check | Receipt appears after manual inbox check |
| Build notifications | Deadline email is sent | 3-day warning works in test mode |
| Keep cost at $0 | No paid services required | $0 required spend |

---

## 5. Scope

### MVP In Scope

- Next.js App Router app
- Supabase Auth
- Supabase Postgres tables and RLS
- Manual email paste extraction
- AI extraction with Gemini and Groq fallback
- Receipt dashboard
- Receipt CRUD
- Urgency calculation
- Gmail API integration
- Manual Gmail check via Gmail API
- Gmail Pub/Sub webhook documented for later upgrade
- Daily deadline notification check
- Resend email notification on free tier
- Responsive dark-first premium UI
- Basic tests for critical logic

### MVP Out of Scope

- Domain-based custom forwarding addresses
- Paid Cloudflare Email Routing domain setup
- OCR / photo upload
- Browser extension
- Native mobile app
- Stripe payments
- Multi-user family accounts
- Warranty claim automation
- AI fine-tuning

---

## 6. Milestone Overview

| Phase | Name | Output | Depends On |
|-------|------|--------|------------|
| 0 | Project Setup | Next.js app runs locally | None |
| 1 | AI Validation | Paste email → JSON extraction | Gemini/Groq keys |
| 2 | Database + Auth | User signup/login + RLS tables | Supabase project |
| 3 | Receipt CRUD | Dashboard with manual receipts | Auth + DB |
| 4 | Premium UI | Design-system-compliant dashboard | CRUD |
| 5 | Gmail Ingestion | Manual Gmail check works; Pub/Sub remains documented for later | Gmail API setup |
| 6 | Notifications | Daily deadline alerts | Receipts + Resend |
| 7 | Testing + Hardening | Critical tests pass | All core features |
| 8 | Deployment | Vercel + Supabase free deployment | Stable build |
| 9 | Beta Launch | 5 beta users onboarded | Production deployed |

---

## 7. Global Definition of Done

A phase is done only when:

- App builds without TypeScript errors.
- App starts locally with `npm run dev`.
- No paid dependency was introduced.
- Environment variables are documented in `.env.example`.
- User-facing UI follows `docs/03-design-system.md`.
- API behavior follows `docs/01-data-model-and-api.md`.
- Security-sensitive code does not expose service role keys to the browser.
- Phase acceptance criteria are checked off.
- Any skipped work is documented as a known limitation.

---

## 8. Phase 0 — Project Setup

### Goal
Create the runnable Next.js foundation.

### Read Before Starting

- `README.md`
- `docs/06-decisions-log.md` sections on Next.js, Supabase, shadcn/ui
- `docs/05-deployment.md` local setup section

### Tasks

1. Create Next.js app with TypeScript, App Router, Tailwind, ESLint.
2. Install base dependencies:
   - `@supabase/supabase-js`
   - `@supabase/ssr`
   - `@google/generative-ai`
   - `groq-sdk`
   - `zod`
   - `date-fns`
   - `lucide-react`
   - `sonner`
   - `class-variance-authority`
   - `clsx`
   - `tailwind-merge`
3. Configure path alias `@/*`.
4. Create `.env.example` with all required keys but no secrets.
5. Add base folder structure:

```txt
app/
  (auth)/
  (dashboard)/
  api/
components/
  ui/
  receipts/
  dashboard/
lib/
  ai/
  auth/
  db/
  email/
  notifications/
  utils/
types/
tests/
```

### Acceptance Criteria

- `npm run dev` starts successfully.
- `npm run lint` passes or has only scaffold warnings.
- `.env.example` exists.
- No real secret is committed.

---

## 9. Phase 1 — AI Extraction Validation

### Goal
Prove the core value: pasted order email becomes structured receipt data.

### Read Before Starting

- `docs/02-architecture.md` section 4: AI Extraction Service
- `docs/04-testing-and-debugging.md` AI Evaluation Tests
- `docs/00-prd.md` user stories US-01 and US-04

### Tasks

1. Create `types/receipt.ts` for extraction result types.
2. Create `lib/ai/prompt.ts` with strict JSON extraction prompt.
3. Create `lib/ai/json-repair.ts` for malformed JSON cleanup.
4. Create `lib/ai/providers/gemini.ts`.
5. Create `lib/ai/providers/groq.ts`.
6. Create `lib/ai/extract-receipt.ts` with fallback chain:
   - Try Gemini first.
   - If Gemini fails or confidence < 0.7, try Groq.
   - If all fail, return `needs_review` result.
7. Create API route `app/api/extract/route.ts` for manual test extraction.
8. Create temporary page `app/test-extraction/page.tsx` with textarea and JSON output.
9. Test with at least 10 real anonymized receipt/order emails.

### Acceptance Criteria

- Pasting a real order email returns valid JSON.
- JSON includes store, item, price, currency, purchase date, return deadline, confidence.
- If return deadline is missing, default to purchase date + 30 days.
- Gemini failure gracefully falls back to Groq.
- 80%+ fields correct across 10 sample emails.

### Stop Condition

If AI accuracy is below 70% after 3 prompt iterations, stop building automation and revise extraction strategy.

---

## 10. Phase 2 — Supabase Auth and Database

### Goal
Users can sign up, log in, and store isolated receipt data.

### Read Before Starting

- `docs/01-data-model-and-api.md` database schema and API endpoints
- `docs/02-architecture.md` database and RLS sections
- `docs/05-deployment.md` Supabase setup section
- Supabase official Next.js SSR guidance: use `@supabase/ssr`

### Tasks

1. Create Supabase free project.
2. Create database tables:
   - `profiles`
   - `receipts`
   - `email_logs`
   - `notification_logs`
3. Enable RLS on all user-owned tables.
4. Add RLS policies so users can only access their own rows.
5. Create `lib/supabase/client.ts` for browser client.
6. Create `lib/supabase/server.ts` for server client using cookies.
7. Create auth routes/pages:
   - `/login`
   - `/signup`
   - `/auth/callback`
8. Create middleware to protect dashboard routes.
9. Create profile row on signup.
10. Store MVP forwarding address as shared Gmail display address, not paid domain address.

### Acceptance Criteria

- User can sign up.
- User can log in.
- User can log out.
- Unauthenticated user cannot access dashboard.
- User A cannot read User B receipts.
- No service role key is used in browser code.

---

## 11. Phase 3 — Receipt CRUD and Dashboard Logic

### Goal
Users can create and manage receipts manually before email automation.

### Read Before Starting

- `docs/00-prd.md` US-02 and US-04
- `docs/01-data-model-and-api.md` receipt endpoints
- `docs/04-testing-and-debugging.md` deadline calculator tests

### Tasks

1. Create `lib/receipts/deadline.ts`:
   - `getDaysRemaining`
   - `getUrgency`
   - `sortByUrgency`
2. Create receipt API routes:
   - `GET /api/receipts`
   - `POST /api/receipts`
   - `GET /api/receipts/[id]`
   - `PATCH /api/receipts/[id]`
   - `DELETE /api/receipts/[id]`
3. Validate all input with Zod.
4. Create dashboard page.
5. Create manual receipt add form.
6. Create receipt edit form.
7. Create status actions: active, returned, kept, expired.
8. Add search by store and item name.
9. Sort active receipts by return deadline ascending.

### Acceptance Criteria

- User can create a receipt manually.
- User can edit any receipt field.
- User can delete a receipt.
- User can mark receipt returned/kept/expired.
- Dashboard shows days remaining and urgency.
- Dashboard sorts urgent receipts first.

---

## 12. Phase 4 — Premium UI Implementation

### Goal
Make the app feel premium, calm, fast, and consistent.

### Read Before Starting

- `docs/03-design-system.md` entire file
- `docs/00-prd.md` onboarding flow and UX rationales

### Tasks

1. Implement dark-first theme tokens in Tailwind.
2. Use Inter font for UI and JetBrains Mono for numbers.
3. Create reusable UI components:
   - Button
   - Card
   - Badge
   - Input
   - Dialog
   - Toast
4. Create receipt components:
   - `ReceiptCard`
   - `UrgencyBadge`
   - `ReceiptGrid`
   - `ReceiptEmptyState`
   - `CopyForwardingAddress`
5. Add premium micro-interactions:
   - Card hover lift
   - Button press scale
   - Copy button “Copied!” feedback
   - Toast on receipt creation
6. Add responsive layout:
   - 1 column mobile
   - 2 columns tablet
   - 3 columns desktop
7. Respect `prefers-reduced-motion`.

### Acceptance Criteria

- UI matches design system colors, spacing, typography, and component rules.
- Empty state clearly teaches user what to do next.
- Copy-to-clipboard gives instant feedback.
- Dashboard works on mobile and desktop.
- All interactive elements have visible focus states.

---

## 13. Phase 5 — Gmail API Manual Ingestion Now, Pub/Sub Later

### Goal
Forwarded emails become receipts through a manual "Check Inbox Now" action. Pub/Sub stays documented for later automation, but is not required for the current MVP.

### Read Before Starting

- `docs/02-architecture.md` email ingestion section
- Gmail API Node.js quickstart
- Google Pub/Sub push subscription docs only if preparing the later automation upgrade
- `docs/04-testing-and-debugging.md` Gmail debugging section

### Important Implementation Decision

Use manual “Check Inbox Now” for the current MVP. Keep Gmail push via Pub/Sub in the architecture and docs for a later automation upgrade, but do not make it a blocker.

### Tasks: Gmail API Setup

1. Create shared Gmail inbox, e.g. `receiptguardbeta@gmail.com`.
2. Enable Gmail API in Google Cloud Console.
3. Configure OAuth consent screen.
4. Create OAuth Desktop credentials.
5. Generate refresh token using local script.
6. Store Gmail credentials in `.env.local` and Vercel env vars:
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_USER_EMAIL`
7. Create `lib/email/gmail-client.ts`.
8. Create `lib/email/parse-gmail-message.ts`.
9. Create `lib/email/process-email.ts`.

### Tasks: Manual Gmail Check Current MVP

1. Create authenticated route `POST /api/gmail/check-now`.
2. Route fetches unread emails from shared Gmail.
3. Only process messages where sender matches a known user email.
4. Extract body text.
5. Run AI extraction.
6. Save receipt.
7. Store Gmail message ID in `email_logs`.
8. Mark message as read or processed.

### Later Upgrade: Pub/Sub Automation

Do not implement this section in the current manual-first MVP unless the user explicitly asks to turn automation on.

1. Create Pub/Sub topic for Gmail notifications.
2. Grant Gmail publish permission to topic.
3. Create push subscription targeting `POST /api/webhooks/gmail`.
4. Add `GOOGLE_PUBSUB_VERIFICATION_TOKEN` env var.
5. Create route `POST /api/webhooks/gmail`.
6. Verify Pub/Sub request authenticity.
7. Decode Pub/Sub message.
8. Use Gmail `historyId` to fetch changed messages.
9. Process only new unread messages.
10. Save processed `messageId` to prevent duplicates.
11. Create daily Vercel cron route to renew Gmail watch, because Gmail watches expire.

### User Matching Rule for MVP

Because no paid domain is used:

- All users forward to the shared Gmail address.
- The app identifies the user by matching forwarded email sender to signup email.
- Onboarding must clearly say: “Forward from the same email you signed up with.”

### Acceptance Criteria

- User can click “Check Inbox Now” and import forwarded receipts.
- Pub/Sub webhook is documented for later and is not required for current MVP acceptance.
- Duplicate emails are not processed twice.
- Unknown sender emails are ignored or logged as unassigned.
- If Pub/Sub setup fails due to billing/free-tier limits, the MVP still works via manual check.

---

## 14. Phase 6 — Deadline Notifications

### Goal
Users receive helpful deadline alerts while staying within free limits.

### Read Before Starting

- `docs/00-prd.md` US-03 notification rationale
- `docs/03-design-system.md` notification UI section
- `docs/05-deployment.md` cron and monitoring sections
- Vercel Cron pricing docs: Hobby is once daily only

### Tasks

1. Create Resend free account.
2. Add `RESEND_API_KEY` env var.
3. Create `lib/notifications/send-deadline-email.ts`.
4. Create email template for 3-day warning only.
5. Create `app/api/cron/check-deadlines/route.ts`.
6. Configure `vercel.json` once-daily cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-deadlines",
      "schedule": "0 9 * * *"
    }
  ]
}
```

7. Query active receipts with return deadline within 3 days and notification not sent.
8. Send email.
9. Mark `notification_sent_3d = true`.
10. Log notification result.

### Acceptance Criteria

- Cron route can be manually triggered in dev.
- A test receipt expiring in 3 days sends one email.
- Same receipt does not send duplicate alerts.
- Daily email volume stays below Resend free limit.

---

## 15. Phase 7 — Testing and Hardening

### Goal
Make the MVP safe enough for 5 beta users.

### Read Before Starting

- `docs/04-testing-and-debugging.md` entire file
- `docs/01-data-model-and-api.md` error response format
- `docs/02-architecture.md` security architecture

### Tasks

1. Add unit tests for deadline logic.
2. Add unit tests for JSON repair.
3. Add tests for AI fallback behavior with mocked providers.
4. Add API tests for receipt CRUD.
5. Add RLS manual test checklist.
6. Add one Playwright happy-path test if time allows.
7. Add structured logging for:
   - AI extraction failure
   - Gmail processing failure
   - Unauthorized access attempts
   - Notification failure
8. Add user-facing error states.
9. Add rate limiting if simple and free; otherwise document as technical debt before public launch.

### Acceptance Criteria

- Critical unit tests pass.
- CRUD works after a fresh login.
- User data isolation is manually verified.
- AI failures show “needs review” instead of crashing.
- Gmail failures do not crash the app.

---

## 16. Phase 8 — Deployment

### Goal
Deploy the MVP on free tiers.

### Read Before Starting

- `docs/05-deployment.md` entire file
- `docs/06-decisions-log.md` risk and scaling sections

### Tasks

1. Push code to GitHub.
2. Create Vercel Hobby project.
3. Add all env vars in Vercel.
4. Connect Supabase production project.
5. Run Supabase SQL migrations.
6. Confirm RLS is enabled.
7. Configure Vercel daily cron for deadline alerts.
8. Deploy production.
9. Test auth in production.
10. Test manual receipt creation in production.
11. Test AI extraction in production.
12. Test Gmail check route in production.
13. Test Pub/Sub webhook if configured.

### Acceptance Criteria

- Production app loads.
- User can sign up in production.
- User can create and view receipt.
- AI extraction works in production.
- No paid plan is enabled.
- No real secrets are committed.

---

## 17. Phase 9 — Beta Launch

### Goal
Validate with 5 real users before expanding.

### Read Before Starting

- `docs/00-prd.md` success metrics
- `docs/06-decisions-log.md` pivot triggers

### Tasks

1. Invite 5 users who shop online frequently.
2. Give them one instruction: forward one order email.
3. Watch whether they can complete onboarding without help.
4. Track:
   - signup success
   - first receipt imported
   - AI extraction accuracy
   - correction needed
   - confusion points
5. Interview each user after 3 days.
6. Fix the top 3 blockers only.

### Acceptance Criteria

- 5 beta users sign up.
- At least 3 forward an email.
- At least 3 successfully see a receipt.
- At least 2 say they would keep using it.
- No critical data leak or auth bug occurs.

---

## 18. Agent Execution Rules

The implementing agent must follow these rules:

1. **Do not skip docs.** Read phase-specific docs before each phase.
2. **Do not introduce paid services.** If a service asks for paid upgrade, stop and propose free fallback.
3. **Do not overbuild.** Build only MVP scope.
4. **Do not build Cloudflare Email Routing before domain purchase.** Domain is post-MVP.
5. **Do not rely on Vercel frequent cron.** Hobby plan supports daily cron only.
6. **Do not expose service role key client-side.** Ever.
7. **Do not store unnecessary raw email forever without privacy decision.** Store minimal text for MVP or document retention.
8. **Do not treat AI output as trusted.** Validate with Zod before saving.
9. **Do not silently fail.** Use logs and `needs_review` status.
10. **Keep app runnable after every phase.**

---

## 19. Implementation Backlog

### Must Have

- [ ] Next.js app scaffold
- [ ] Supabase auth
- [ ] Receipts table + RLS
- [ ] AI extraction route
- [ ] Manual receipt creation
- [ ] Dashboard
- [ ] Receipt CRUD
- [ ] Manual Gmail check
- [ ] Gmail Pub/Sub webhook documented for later, not implemented now
- [ ] 3-day email notification
- [ ] Production deployment

### Should Have

- [ ] Search receipts
- [ ] Receipt edit form
- [ ] Needs review state
- [ ] Toast notifications
- [ ] Copy forwarding address feedback
- [ ] Basic unit tests

### Could Have

- [ ] Supabase realtime updates
- [ ] Playwright E2E test
- [ ] Sentry free error tracking
- [ ] GitHub Actions CI

### Won't Have in MVP

- [ ] Paid domain
- [ ] Cloudflare Email Routing
- [ ] OCR scanning
- [ ] Payments
- [ ] Mobile app
- [ ] Browser extension

---

## 20. Final MVP Acceptance Checklist

The MVP is ready for beta only if:

- [ ] Build cost remains $0.
- [ ] User can sign up and log in.
- [ ] User can paste an email and create a receipt.
- [ ] User can manually add a receipt.
- [ ] User can forward to Gmail and import with “Check Inbox Now.”
- [ ] Pub/Sub automation works or is explicitly deferred with fallback.
- [ ] User can edit/delete/mark receipts.
- [ ] Dashboard sorts by urgency.
- [ ] 3-day deadline notification works.
- [ ] RLS prevents cross-user access.
- [ ] App deploys to Vercel Hobby.
- [ ] Supabase remains on free tier.
- [ ] No paid services are required.

---

## 21. Notes for Future Scaling

Only after real usage proves demand:

1. Buy domain.
2. Move from shared Gmail to Cloudflare Email Routing.
3. Give each user a real unique forwarding address.
4. Add richer notification preferences.
5. Add OCR if users request paper receipts.
6. Add paid tier only after users explicitly ask for paid features.

Until then: **stay $0, stay simple, validate first.**
