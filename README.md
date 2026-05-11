# Receipt Guardian

> Never miss a return window again.

Forward your order confirmation emails. AI extracts item details, price, and return deadlines automatically. See everything in a clean dashboard with smart alerts.

## Quick Start

```bash
npm install
npm run dev
```

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
components/                    # Reusable UI components
lib/                           # Utilities, AI, database
  ai-extraction.ts             # Gemini + Groq extraction
  deadline-calculator.ts       # Urgency logic
  supabase.ts                  # Database client
  auth.ts                      # Authentication helpers

types/                         # TypeScript interfaces
__tests__/                     # Unit + API tests
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

## Status

In planning. MVP target: 1-2 weeks.
