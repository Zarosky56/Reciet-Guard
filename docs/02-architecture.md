# Receipt Guardian — Architecture (Research-Backed)

## 1. System Overview

### Architecture Philosophy

Our architecture follows the **"serverless-first, scale-later"** principle. Every component runs on managed services with generous free tiers, eliminating server maintenance and scaling concerns. This pattern is used by Vercel, Linear, and countless modern SaaS products.

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   User Browser  │────▶│  Next.js App │────▶│   Supabase       │
│  (Dashboard)    │◀────│   (Vercel)   │◀────│  (Auth + DB)     │
└─────────────────┘     └──────────────┘     └──────────────────┘
                               │
                               │ Webhook
                               ▼
                        ┌──────────────┐
                        │ Gmail API or │
                        │  Cloudflare  │
                        │   Worker     │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   AI Layer   │
                        │ Gemini /     │
                        │ Groq         │
                        └──────────────┘
```

### Why This Architecture?

| Decision | Research Basis | Benefit |
|----------|---------------|---------|
| Serverless functions | Vercel edge runtime (2025): Cold starts <50ms | No server management, pay-per-request |
| PostgreSQL over NoSQL | Relational data has natural receipts→users relationships | ACID compliance, complex queries, RLS |
| Realtime subscriptions | Supabase realtime: sub-100ms latency | Dashboard updates without polling |
| Multi-provider AI | Costbench (2026): No single free tier is reliable 100% of time | 99.9% extraction uptime on $0 budget |

---

## 2. Data Flow: Email Received

### Step-by-Step Flow

```
1. User forwards order email ──▶ receiptguardbeta@gmail.com
2. Gmail push notification ──▶ Google Pub/Sub ──▶ /api/webhooks/gmail
3. Webhook validates Pub/Sub request and shared secret
4. Fetches changed email content via Gmail API history/message lookup
5. Extracts plain text (HTML→text fallback)
6. Sends text + metadata to AI extraction service
7. AI returns structured JSON or error
8. Validates JSON schema
9. Calculates return_deadline (stated OR purchase_date + 30 days)
10. Saves to Supabase with RLS check
11. Triggers Supabase realtime event
12. Dashboard receives realtime update
13. If confidence < 0.7, creates "needs_review" flag + email notification
```

### Processing Time Budgets

| Step | Target | Max Acceptable | Why |
|------|--------|----------------|-----|
| Webhook received → processing start | <100ms | 500ms | Perceived speed matters (PRD UX Rationale) |
| Gmail API fetch | <2s | 5s | Network dependent |
| AI extraction | <5s | 15s | Gemini typical: 2-4s, Groq: 1-2s |
| Database save | <200ms | 1s | Supabase is fast |
| Total (user-perceived) | <10s | 30s | Show "processing" immediately, update async |

---

## 3. Tech Stack

| Layer | Technology | Why | Free Tier |
|-------|-----------|-----|-----------|
| **Framework** | Next.js 15 (App Router) | Full-stack, API routes, SSR, edge runtime | Vercel free: unlimited hobby projects |
| **Language** | TypeScript | Type safety, IDE autocomplete, fewer runtime errors | N/A |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first, copy-paste components, accessibility built-in | N/A |
| **Database** | Supabase (PostgreSQL) | Auth + DB + realtime in one service, RLS, generous free tier | 500MB DB, 1GB storage, 50K MAU |
| **Auth** | Supabase Auth | Secure JWT, email + OAuth, session management | Included in free tier |
| **State** | React hooks + SWR | Simple caching, revalidation, no Redux boilerplate | N/A |
| **Email Ingestion (MVP)** | Gmail API + manual "Check Inbox Now" | Guaranteed $0 path, no paid Vercel frequent cron, no domain needed | Gmail free quota |
| **Email Ingestion (Prod)** | Cloudflare Email Workers | Serverless, catch-all routing, zero cost | 100K requests/day free |
| **AI Primary** | Google Gemini 2.0 Flash | 1,500 req/day, 1M context, multimodal | Free tier never expires |
| **AI Fallback 1** | Groq (Llama 3.3 70B) | 30 req/min, 500-800 tokens/sec | Free tier, no credit card |
| **AI Fallback 2** | OpenRouter | $0 models from multiple providers | Free models always available |
| **Notifications** | Resend | Developer-focused, simple API, reliable delivery | 100 emails/day free |
| **Hosting** | Vercel | Auto-deploy from Git, edge CDN, preview branches | Free tier generous |
| **Cron Jobs** | Vercel Hobby Cron | Daily deadline checks and Gmail watch maintenance only | Hobby supports once-daily cron only |
| **Error Tracking** | Sentry | Automatic Next.js integration, contextual errors | 5K events/month free |

---

## 4. AI Extraction Service

### Why a Multi-Provider AI Architecture?

Research (Costbench, 2026; MadAppGang, 2025) shows that no single free AI API is reliable 100% of the time. Rate limits, downtime, and model degradation are common. A multi-provider fallback chain provides 99.9% uptime at $0 cost.

### Prompt Engineering Best Practices

Based on 2025 LLM research, structured output is more reliable than freeform text:

```
You are a receipt extraction engine. Extract information from the email below.

Rules:
1. Return ONLY valid JSON. No markdown, no explanations.
2. If a field cannot be determined, use null.
3. If no return deadline is stated, calculate: purchase_date + 30 days.
4. Currency defaults to "USD" if not specified.
5. Item name should be concise (max 10 words).
6. Store name should be the brand/merchant name only.

Fields:
- store_name: string (merchant name)
- item_name: string (primary item, max 10 words)
- price: number (numeric value only)
- currency: string (3-letter code: USD, EUR, GBP, etc.)
- purchase_date: string (YYYY-MM-DD)
- return_deadline: string (YYYY-MM-DD, calculated if not stated)
- confidence: number (0.0 to 1.0, your certainty)

Email text:
"""
{email_body}
"""

Output format (STRICT JSON):
{"store_name":"...","item_name":"...","price":99.99,"currency":"USD","purchase_date":"2025-05-01","return_deadline":"2025-05-31","confidence":0.92}
```

### JSON Repair Strategy

If the AI returns malformed JSON (common with free tiers):

```typescript
// lib/ai/json-repair.ts
function repairJSON(raw: string): object | null {
  // Step 1: Remove markdown code blocks
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Step 2: Extract JSON object using regex
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  
  // Step 3: Try parsing
  try {
    return JSON.parse(match[0]);
  } catch {
    // Step 4: Fix common issues (trailing commas, single quotes)
    cleaned = match[0]
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/'/g, '"');
    return JSON.parse(cleaned);
  }
}
```

### Multi-Provider Fallback Chain

```typescript
// lib/ai/extraction.ts
async function extractReceipt(emailText: string): Promise<ExtractionResult> {
  const providers = [
    { name: 'gemini', fn: extractWithGemini },
    { name: 'groq', fn: extractWithGroq },
    { name: 'openrouter', fn: extractWithOpenRouter }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn(emailText);
      if (result.confidence >= 0.7) {
        log.info(`Extraction succeeded with ${provider.name}`, { confidence: result.confidence });
        return result;
      }
      log.warn(`Low confidence from ${provider.name}: ${result.confidence}`);
    } catch (error) {
      log.error(`Extraction failed with ${provider.name}`, error);
    }
  }

  // All providers failed or returned low confidence
  return { status: 'needs_review', rawText: emailText };
}
```

### Provider Comparison

| Provider | Speed | Accuracy | Context | Free Limit | Best For |
|----------|-------|----------|---------|------------|----------|
| Gemini 2.0 Flash | 2-4s | High | 1M tokens | 1,500 req/day | Long emails, complex receipts |
| Groq Llama 3.3 70B | 1-2s | High | 128K tokens | 30 req/min | Fast iteration, short emails |
| OpenRouter Mixtral | 3-6s | Medium | 32K tokens | Variable | Overflow / emergency fallback |

---

## 5. Email Ingestion Deep Dive

### MVP: Gmail API Manual Check (Pub/Sub Kept for Later)

**Why Gmail for MVP:** No domain purchase, no DNS setup, immediate testing.

**Why manual check now:** Vercel Hobby cron only supports once-daily jobs, so it cannot run a free 5-minute Gmail poller. Gmail push via Google Cloud Pub/Sub remains the preferred later automation path, but the current MVP should use a manual "Check Inbox Now" button so the build is not blocked by Pub/Sub setup or billing requirements.

```
Setup:
1. Create Gmail account: receiptguardbeta@gmail.com
2. Enable Gmail API in Google Cloud Console (free)
3. Create OAuth 2.0 credentials (Desktop app type)
4. Run one-time auth script to get refresh token
5. Store refresh token in Vercel env vars
6. Build authenticated manual inbox check route
7. Keep Google Pub/Sub documented for later automation upgrade
```

**Manual Check Fallback Implementation:**

```typescript
// app/api/gmail/check-now/route.ts
// Triggered by an authenticated user clicking "Check Inbox Now"
export async function POST() {
  const gmail = await getAuthenticatedGmailClient();
  
  // Fetch unread emails from the last 10 minutes
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread newer_than:10m'
  });

  for (const msg of response.data.messages || []) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full'
    });

    // Identify user by their "From" address
    const fromHeader = email.data.payload?.headers?.find(
      h => h.name === 'From'
    )?.value;
    
    const user = await findUserByEmail(fromHeader);
    if (!user) continue; // Unknown sender — skip

    // Extract and process
    const body = extractEmailBody(email.data);
    const receipt = await extractReceipt(body);
    await saveReceipt(user.id, receipt);

    // Mark as read to avoid re-processing
    await gmail.users.messages.modify({
      userId: 'me',
      id: msg.id!,
      requestBody: { removeLabelIds: ['UNREAD'] }
    });
  }
}
```

**Pub/Sub Push Implementation:**

```typescript
// app/api/webhooks/gmail/route.ts
// Triggered by Google Pub/Sub when Gmail receives new mail
export async function POST(request: Request) {
  const payload = await request.json();
  const message = decodePubSubMessage(payload.message.data);
  const historyId = message.historyId;

  const changedMessages = await fetchGmailChangesSince(historyId);

  for (const email of changedMessages) {
    await processForwardedEmail(email);
  }

  return Response.json({ ok: true });
}
```

**How user identification works (Gmail MVP):**
- All users forward to ONE shared Gmail: `receiptguardbeta@gmail.com`
- We identify the user by matching the sender's "From" address against signup emails
- Users MUST forward from the same email they signed up with
- This is a known limitation documented in onboarding

**Security:**
- Only process emails from known user email addresses
- Deduplicate by Gmail `messageId` (store in `email_logs`)
- Never expose the shared Gmail address publicly (only shown to logged-in users)

### Production: Cloudflare Email Workers

**Why Cloudflare for production:** True catch-all routing, any address @yourdomain works, serverless, free tier generous.

```javascript
// cloudflare-worker.js
export default {
  async email(message, env, ctx) {
    // Verify webhook secret
    const secret = message.headers.get('X-Webhook-Secret');
    if (secret !== env.WEBHOOK_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Extract recipient (determines user)
    const to = message.headers.get('to');
    const userId = extractUserIdFromAddress(to);

    // Forward to app API
    await fetch(`${env.APP_URL}/api/webhook/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.APP_WEBHOOK_SECRET
      },
      body: JSON.stringify({
        to,
        from: message.headers.get('from'),
        subject: message.headers.get('subject'),
        body: await message.text()
      })
    });

    return new Response('OK');
  }
};
```

---

## 6. Database Design

### Schema Rationale

We use PostgreSQL relational features because receipts have clear relationships to users, and we need complex queries ("all receipts expiring in 3 days across all users").

### Performance Optimization

```sql
-- Critical indexes for query performance
CREATE INDEX idx_receipts_user_status ON receipts(user_id, status);
CREATE INDEX idx_receipts_deadline ON receipts(return_deadline) WHERE status = 'active';
CREATE INDEX idx_receipts_created ON receipts(user_id, created_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(processing_status) WHERE processing_status = 'pending';

-- Partial index: only active receipts need deadline lookups
CREATE INDEX idx_receipts_active_deadline ON receipts(user_id, return_deadline) 
WHERE status = 'active';
```

### Row Level Security (RLS)

```sql
-- Users can only access their own data
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolate user receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Isolate user email logs" ON email_logs
  FOR ALL USING (auth.uid() = user_id);
```

### Supabase Realtime

```typescript
// lib/realtime.ts
import { supabase } from './supabase';

export function subscribeToReceipts(userId: string, callback: (receipt: Receipt) => void) {
  return supabase
    .channel('receipts')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'receipts',
        filter: `user_id=eq.${userId}`
      },
      (payload) => callback(payload.new as Receipt)
    )
    .subscribe();
}
```

---

## 7. Security Architecture

### Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Email spoofing (fake order emails) | Medium | Medium | Verify sender domain against known stores; flag unknown senders for review |
| Webhook abuse (spam to API) | High | Medium | Secret header + IP allowlist + rate limiting |
| AI prompt injection | Low | Medium | Sanitize input; AI only extracts data, never executes |
| Data breach (user isolation failure) | Low | Critical | RLS policies + service role only for cron jobs |
| JWT theft | Low | High | Supabase auto-rotation; short expiry (1hr); refresh tokens |
| API rate limit exhaustion | Medium | Medium | Multi-provider AI; client-side debounce; caching |

### Webhook Security Checklist

```typescript
// middleware/webhook-auth.ts
export function validateWebhook(req: NextRequest): boolean {
  const secret = req.headers.get('x-webhook-secret');
  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return false;
  }

  // Optional: Verify timestamp (prevent replay attacks)
  const timestamp = req.headers.get('x-webhook-timestamp');
  if (timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age > 5 * 60 * 1000) return false; // 5 min max age
  }

  return true;
}
```

---

## 8. Error Handling & Observability

### Error Classification

| Level | Examples | Response | Alert |
|-------|----------|----------|-------|
| **Fatal** | Database connection lost, RLS misconfigured | Return 500, log to Sentry | Immediate (SMS/email) |
| **Error** | AI extraction failed all providers, webhook auth failed | Return 200 (ack), mark as failed, retry later | Within 1 hour |
| **Warning** | Single AI provider failed (fallback used), low confidence extraction | Continue processing, log | Daily digest |
| **Info** | User signed up, receipt created, notification sent | Normal operation | None |

### Logging Strategy

```typescript
// lib/logger.ts
import * as Sentry from '@sentry/nextjs';

export const logger = {
  info: (msg: string, meta?: object) => {
    console.log(`[INFO] ${msg}`, meta);
  },
  warn: (msg: string, meta?: object) => {
    console.warn(`[WARN] ${msg}`, meta);
    Sentry.captureMessage(msg, { level: 'warning', extra: meta });
  },
  error: (msg: string, error: Error, meta?: object) => {
    console.error(`[ERROR] ${msg}`, error, meta);
    Sentry.captureException(error, { extra: { ...meta, message: msg } });
  }
};
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    checkAIProvider('gemini'),
    checkAIProvider('groq'),
    checkEmailService()
  ]);

  const healthy = checks.every(c => c.healthy);

  return Response.json({
    status: healthy ? 'healthy' : 'degraded',
    checks: checks.map(c => ({ name: c.name, status: c.healthy ? 'ok' : 'fail', latency: c.latency })),
    timestamp: new Date().toISOString()
  }, { status: healthy ? 200 : 503 });
}
```

---

## 9. Caching Strategy

| Layer | Strategy | TTL | Purpose |
|-------|----------|-----|---------|
| **Browser** | SWR + localStorage | User session | Dashboard data, user preferences |
| **Edge** | Vercel Edge Config | 60s | Feature flags, public config |
| **API** | In-memory Map | 5min | AI provider health status |
| **Database** | Supabase connection pool | Connection-level | Reduce connection overhead |

**No aggressive caching** for receipts — users expect to see updates immediately after forwarding an email.

---

## 10. Environment Variables

```bash
# ─── Supabase ───
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# ─── AI Providers ───
GOOGLE_AI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=

# ─── Email Ingestion (MVP) ───
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_WEBHOOK_SECRET=

# ─── Email Ingestion (Production) ───
CLOUDFLARE_WEBHOOK_SECRET=

# ─── Notifications ───
RESEND_API_KEY=
FROM_EMAIL=noreply@receiptguard.app

# ─── App Config ───
APP_URL=http://localhost:3000
WEBHOOK_SECRET=random_string_min_32_chars
NODE_ENV=development

# ─── Monitoring ───
SENTRY_DSN=
```

---

## 11. Scaling Roadmap

| Users | Changes Needed | Cost |
|-------|---------------|------|
| 0-100 | Current architecture | $0 |
| 100-500 | Monitor Supabase DB size (500MB limit) | $0 |
| 500-2,000 | Upgrade to Supabase Pro ($25/mo); Cloudflare R2 for email storage | $25/mo |
| 2,000-10,000 | Add Redis caching layer; optimize AI prompts for token efficiency | $25-50/mo |
| 10,000+ | Migrate to dedicated AI proxy; vertical scaling Supabase | $100+/mo |
