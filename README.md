# Receipt Guardian

> Never miss a return window again.

Forward your order confirmation emails. AI extracts item details, price, and return deadlines automatically. See everything in a clean dashboard with smart alerts.

## Status

MVP implementation is now in place:

- Next.js App Router + TypeScript + Tailwind
- Supabase Auth, protected dashboard, and receipt CRUD
- Manual email paste extraction with Gemini primary and Groq fallback
- Manual Gmail API "Check Inbox Now" ingestion
- Duplicate Gmail message protection through `email_logs.gmail_message_id`
- 3-day deadline notification cron using Resend
- Critical unit tests for deadline logic, JSON repair, AI fallback, and Gmail parsing

Pub/Sub push ingestion remains deferred for a later zero-cost automation upgrade.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill the values prepared in `user.md`.
Never commit `.env.local`.

Required for core local use:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_API_KEY=
GROQ_API_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_USER_EMAIL=
RESEND_API_KEY=
FROM_EMAIL=onboarding@resend.dev
APP_URL=http://localhost:3000
CRON_SECRET=
```

Generate a Gmail refresh token after setting `GMAIL_CLIENT_ID` and
`GMAIL_CLIENT_SECRET`:

```bash
npm run gmail:token
```

## Database

Run the SQL in `docs/01-data-model-and-api.md` section
`1.1 Basic Supabase Initialization SQL` in the Supabase SQL editor. That schema
is the source of truth for the MVP.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Vercel

Import the existing GitHub repo into Vercel Hobby and add the same environment
variables from `.env.local`. `vercel.json` configures one daily cron at
`/api/cron/check-deadlines`, which stays within the Hobby once-daily limit.

## Known MVP Limitations

- Users must forward from the same email used for signup.
- Gmail ingestion is manual through "Check Inbox Now"; Pub/Sub is documented for
  later and not required now.
- Raw Gmail text is stored only for processed Gmail receipts and truncated to
  10,000 characters; define a retention policy before public launch.
- Public API rate limiting is not implemented yet. Add a free/simple limiter
  before a broad public launch.
- Resend may restrict sending to verified recipients/domains on some accounts;
  keep `onboarding@resend.dev` for the free MVP unless Resend requires a
  different free sender.

## Project Structure

```
docs/                          # Planning & specification
  00-prd.md                    # Product requirements
  01-data-model-and-api.md     # Database schema + API spec
  02-architecture.md           # System design + tech stack
  03-design-system.md          # Colors, typography, components
  04-testing-and-debugging.md  # Testing strategy + debug guide
  05-deployment.md             # Vercel + Supabase setup
  06-decisions-log.md          # Technical decisions + risks

app/                           # Next.js App Router (pages)
  api/                         # Extract, receipts, Gmail, cron, health
components/                    # Reusable UI components
lib/                           # Utilities, AI, database
  ai/                          # Gemini + Groq extraction
  auth/                        # Auth helpers
  email/                       # Gmail client/parser/processing
  notifications/               # Resend deadline checks
  receipts/                    # Validation, mapping, urgency logic
  supabase/                    # Browser, server, and admin clients

types/                         # TypeScript interfaces
tests/                         # Critical unit tests
scripts/                       # Dev + debug scripts
```

## Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Framework | Next.js 15 + TypeScript | $0 |
| Styling | Tailwind CSS + shadcn/ui | $0 |
| Database | Supabase (PostgreSQL) | $0 |
| Auth | Supabase Auth | $0 |
| AI | Google Gemini + Groq fallback | $0 |
| Email | Gmail API (MVP) → Cloudflare (prod) | $0 |
| Notifications | Resend | $0 |
| Hosting | Vercel | $0 |

## Core Flow

```
User forwards order email ──▶ AI extracts data ──▶ Saved to database ──▶ Dashboard shows deadline ──▶ Alerts before expiry
```

## Docs

- **[PRD](docs/00-prd.md)** — Features, user stories, acceptance criteria
- **[Data Model & API](docs/01-data-model-and-api.md)** — Schema, endpoints, TypeScript types
- **[Architecture](docs/02-architecture.md)** — System diagram, data flow, env vars
- **[Design System](docs/03-design-system.md)** — Colors, spacing, components, animations
- **[Testing & Debugging](docs/04-testing-and-debugging.md)** — Test strategy, common issues
- **[Deployment](docs/05-deployment.md)** — Vercel, Supabase, cron jobs, monitoring
- **[Decisions & Risks](docs/06-decisions-log.md)** — Why we chose what we chose
- **[Implementation Plan](docs/07-implementation-plan.md)** — Agent-ready step-by-step $0 build plan

## Cost Policy

This MVP is designed to run on free tiers only. Do not add paid services, paid
domains, paid API credits, Vercel Pro, or Supabase Pro for the MVP.
