# Receipt Guardian — Deployment & DevOps (Research-Backed)

## 1. Deployment Philosophy

### The "Small Batches, High Frequency" Model

Research from DORA (DevOps Research and Assessment) and 2025 SaaS best practices shows that teams deploying **multiple times per day** have:
- 46x higher deployment frequency
- 440x faster lead time for changes
- 5x lower change failure rate
- 7x faster mean time to recovery

**Our approach:** Every PR merged to `main` auto-deploys to production. No "release days," no deploy freezes. If a change is bad, we roll back in <2 minutes.

### Deployment Strategy

| Environment | Platform | Purpose | Auto-deploy? |
|-------------|----------|---------|-------------|
| **Local** | `localhost:3000` | Development | N/A |
| **Preview** | Vercel per-branch | PR testing, design review | Every push |
| **Staging** | Vercel (staging branch) | Pre-prod validation | Manual |
| **Production** | Vercel (main branch) | Live users | Every merge to main |

## 2. Local Development Setup

### Prerequisites
- Node.js 20+
- npm or pnpm
- Git
- Supabase CLI (optional, for local DB)

### Step-by-Step

```bash
# 1. Clone repo
git clone https://github.com/Zarosky56/Reciet-Guard.git
cd Reciet-Guard

# 2. Install dependencies
npm install

# 3. Create env file
cp .env.example .env.local
# Fill in your keys (see Architecture doc)

# 4. Start dev server
npm run dev
# Opens at http://localhost:3000

# 5. Run tests
npm test

# 6. (Optional) Start local Supabase
npx supabase start
# Then use local DB URL in .env.local
```

## 3. Vercel Deployment

### Initial Setup

1. Push code to GitHub repository: `https://github.com/Zarosky56/Reciet-Guard`
2. Go to [vercel.com](https://vercel.com), import that exact repo
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_AI_API_KEY`
   - `GROQ_API_KEY`
   - `RESEND_API_KEY`
   - `WEBHOOK_SECRET`
4. Deploy — automatic on every push to `main`

### Custom Domain (Later)

When ready to buy domain:
1. Buy on Namecheap or Cloudflare
2. Add to Vercel project → Domains
3. Update nameservers as instructed
4. Vercel handles SSL automatically (free)

## 4. Supabase Setup

### New Project
1. Go to [supabase.com](https://supabase.com)
2. Create project (free tier)
3. Copy Project URL and Anon Key to Vercel env vars

### Database Schema (Run in SQL Editor)

```sql
-- Run this in Supabase SQL Editor after creating project

-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Users table (managed by Supabase Auth, but document our fields)
-- Note: Supabase Auth handles users table automatically

-- Receipts table
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name VARCHAR(255),
  item_name VARCHAR(500),
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  purchase_date DATE,
  return_deadline DATE,
  warranty_deadline DATE,
  raw_email_text TEXT,
  ai_confidence DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','returned','kept','expired')),
  notification_sent_7d BOOLEAN DEFAULT false,
  notification_sent_3d BOOLEAN DEFAULT false,
  notification_sent_1d BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email logs
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  from_address VARCHAR(255),
  subject VARCHAR(500),
  received_at TIMESTAMPTZ DEFAULT now(),
  processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending','success','failed','needs_review')),
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_deadline ON receipts(return_deadline);
CREATE INDEX idx_receipts_status ON receipts(status);

-- RLS Policies
CREATE POLICY "Users can only see their own receipts"
  ON receipts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own email logs"
  ON email_logs FOR ALL
  USING (auth.uid() = user_id);
```

## 5. Cron Jobs (Vercel)

Create `vercel.json`:

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

This runs every day at 9 AM UTC to check for expiring receipts and send notifications.

## 6. Rollback Plan

If a deployment breaks production:

```bash
# Option 1: Revert in Git
git revert HEAD
git push origin main
# Vercel auto-deploys previous version

# Option 2: Vercel dashboard
# Go to Vercel → Deployments → Find last working deploy → Click "Promote to Production"

# Option 3: Database rollback
# Supabase → Backups → Point-in-time recovery (not available on free tier)
# For free tier: export data before major migrations
```

## 7. Monitoring & Observability (Free Tools)

### Why Observability Matters for Solo Devs

Research (Google SRE Book, 2024; DORA 2025): Teams with comprehensive monitoring catch 90% of issues before users report them. For a solo dev, this means fewer 3 AM emergency fixes.

**The three pillars:**
1. **Metrics** — Is the system healthy? (uptime, response time, error rate)
2. **Logs** — What happened? (structured event logs)
3. **Traces** — Where did it break? (request flow across services)

| Tool | Pillar | Purpose | Cost |
|------|--------|---------|------|
| Vercel Analytics | Metrics | Page performance, Core Web Vitals, errors | Free tier |
| Sentry | Logs + Traces | Error tracking, release health, performance monitoring | 5k events/month free |
| Supabase Dashboard | Metrics | DB performance, slow queries, connection pool | Free |
| UptimeRobot | Metrics | Site uptime monitoring (1-min intervals) | Free tier |
| Vercel Logs | Logs | Serverless function logs, build logs | Free tier |

### Key Metrics to Watch

| Metric | Warning Threshold | Critical Threshold | Action |
|--------|-------------------|-------------------|--------|
| API response time (p95) | >500ms | >2s | Check DB indexes, add caching |
| AI extraction failure rate | >5% | >15% | Review prompt, switch providers |
| Error rate (5xx) | >0.1% | >1% | Check Sentry immediately |
| Database size | >400MB | >480MB | Plan Supabase Pro upgrade |
| Daily active users | Flat for 3 days | Dropping >20% | Check onboarding funnel |
| Uptime | <99.5% | <99% | Investigate Vercel status page |

### Add Sentry to Next.js

```bash
npx @sentry/wizard@latest -i nextjs
```

This auto-configures:
- Error tracking with stack traces
- Performance monitoring (API route timing)
- Release health (crash-free session rate)
- Breadcrumbs (user actions leading to error)

## 8. CI/CD Pipeline (GitHub Actions)

### Pipeline Philosophy

Research (DORA 2025): The strongest predictor of software delivery performance is **automated testing + trunk-based development**. Every PR must pass tests before merge. No "it works on my machine."

### Pipeline Stages

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  # Deploys automatically via Vercel Git integration
  # No deploy step needed in GitHub Actions
```

### Branch Protection Rules

| Rule | Why |
|------|-----|
| Require PR before merge | Prevents direct pushes to main |
| Require status checks | CI must pass before merge |
| Require 1 review | Second pair of eyes catches 50%+ of issues |
| Squash merge only | Clean linear history, easy to revert |

## 9. Production Readiness Checklist

Based on the 12-factor app methodology and SaaS launch best practices (2025):

### Infrastructure
- [ ] All env vars set in Vercel (production environment)
- [ ] Supabase RLS policies enabled and tested
- [ ] Database indexes created (see Architecture doc)
- [ ] Database backups configured (Supabase free tier: manual exports)
- [ ] Sentry configured with source maps
- [ ] Vercel Cron job configured and tested
- [ ] Health check endpoint (`/api/health`) responding
- [ ] Custom domain connected with SSL (Cloudflare or Vercel)

### Security
- [ ] Webhook secret set and validated
- [ ] No service role key exposed in client-side code
- [ ] API routes verify user ownership on all data access
- [ ] CORS configured correctly (only allow your domain)
- [ ] Content Security Policy headers set
- [ ] Rate limiting enabled on public API routes

### UX & Content
- [ ] Error pages (404, 500) styled with helpful copy
- [ ] Favicon and meta tags (OG image, description) set
- [ ] Loading states and skeleton screens implemented
- [ ] Empty state designed and implemented
- [ ] Mobile responsiveness tested on iOS Safari and Android Chrome
- [ ] Dark mode toggle works and remembers preference

### Legal & Trust
- [ ] Terms of Service page (use a template like getterms.io)
- [ ] Privacy Policy page (GDPR/CCPA compliant)
- [ ] Cookie consent banner (if using analytics)
- [ ] Contact/support email visible in footer

### Launch Preparation
- [ ] Beta invite list or waitlist configured (optional)
- [ ] Product Hunt draft prepared
- [ ] Reddit post copy written (r/SideProject, r/webdev)
- [ ] Twitter/X announcement thread drafted
- [ ] "How it works" demo video or GIF recorded

## 10. Scaling Considerations (Future)

| Milestone | Action |
|-----------|--------|
| 100+ users | Monitor Supabase free tier limits (500MB DB) |
| 500+ users | Consider Cloudflare R2 for email storage (cheaper egress) |
| 1000+ users | Upgrade Supabase to Pro ($25/mo) for backups + SLA |
| 5000+ users | Implement caching layer (Vercel Edge Config) |
| 10000+ users | Consider dedicated AI proxy to manage rate limits |

## 11. MVP → Production Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Week 1 | Days 1-3 | Local dev setup, auth, basic dashboard UI |
| Week 1 | Days 4-7 | Email ingestion (manual paste → AI extraction) |
| Week 2 | Days 8-10 | Gmail API integration, auto-receipt creation |
| Week 2 | Days 11-14 | Notifications, polish, 5 beta testers |
| Week 3 | Days 15-18 | Bug fixes from beta feedback, buy domain |
| Week 3 | Days 19-21 | Cloudflare email routing, switch from Gmail |
| Week 4 | Day 22+ | Launch on Product Hunt / Reddit |
