# Receipt Guardian — Testing & Debugging (Research-Backed)

## 1. Testing Strategy

### Philosophy: The Test Pyramid for AI-Powered SaaS

Modern SaaS testing (2025) follows a modified pyramid because AI components are **non-deterministic** — the same input may produce slightly different outputs across runs.

```
        ┌─────────┐
        │   E2E   │  5% — Critical user journeys only
        ├─────────┤
        │   API   │  15% — Auth, webhooks, contracts
        ├─────────┤
        │  Unit   │  40% — Business logic, calculations
        ├─────────┤
        │ AI Eval │  40% — Extraction accuracy, fallback behavior
        └─────────┘
```

**Test what scares you:**
1. **AI extraction accuracy** — Core value proposition. If this fails, the product is useless.
2. **Auth & data isolation** — Security. One data leak kills trust forever.
3. **Deadline calculation logic** — Business logic. Wrong deadlines = angry users.
4. **Email webhook processing** — Integration. Silent failures mean lost receipts.
5. **Multi-provider fallback** — Reliability. If Gemini fails, does Groq catch it?

### What NOT to test (MVP)

| Don't Test | Why | Instead |
|-----------|-----|---------|
| UI pixel perfection | Visual regression is expensive | Manual QA on 3 devices |
| Supabase SDK internals | Tested by Supabase team | Trust the SDK, test your queries |
| Every email format | Infinite combinations | Sample 20 real emails, iterate monthly |
| AI output consistency | LLMs are non-deterministic | Test for "good enough" thresholds |
| All animation timings | Subject to browser variance | Test presence, not exact timing |

---

## 2. Test Types

### Unit Tests (Jest + ts-jest)

**Coverage target:** 80% of `lib/` directory (business logic only, not UI)

| Module | Tests | Priority |
|--------|-------|----------|
| `lib/ai-extraction.ts` | Prompt formatting, JSON repair, error handling | Critical |
| `lib/deadline-calculator.ts` | Days remaining, urgency color, leap years, timezone edge cases | Critical |
| `lib/receipt-parser.ts` | Store name normalization, currency detection, price parsing | High |
| `lib/auth.ts` | JWT validation, session refresh, RLS simulation | Critical |
| `lib/notification-scheduler.ts` | Cron logic, deduplication, timezone handling | High |

**Sample unit test (deadline calculator):**
```typescript
// __tests__/deadline-calculator.test.ts
import { getUrgency, getDaysRemaining } from '@/lib/deadline-calculator';

describe('deadline calculator', () => {
  it('returns green for >7 days', () => {
    const deadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    expect(getUrgency(deadline)).toBe('green');
  });

  it('returns yellow for 3-7 days', () => {
    const deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    expect(getUrgency(deadline)).toBe('yellow');
  });

  it('returns red for <3 days', () => {
    const deadline = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    expect(getUrgency(deadline)).toBe('red');
  });

  it('returns red for expired', () => {
    const deadline = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(getUrgency(deadline)).toBe('red');
  });

  it('handles leap years correctly', () => {
    const deadline = new Date('2024-02-29');
    expect(() => getDaysRemaining(deadline)).not.toThrow();
  });

  it('handles timezone boundaries', () => {
    // Test at midnight UTC boundary
    const deadline = new Date('2025-05-12T00:00:00Z');
    const now = new Date('2025-05-11T23:59:59Z');
    expect(getDaysRemaining(deadline, now)).toBe(1);
  });
});
```

### API Contract Tests

API tests verify that the contract between frontend and backend is maintained. This prevents the "works on my machine" problem.

```bash
# tests/api.sh — Run before every deploy
#!/bin/bash
BASE_URL="http://localhost:3000"

# 1. Health check
echo "Testing health endpoint..."
curl -sf "$BASE_URL/api/health" || exit 1

# 2. Auth flow
echo "Testing signup..."
TOKEN=$(curl -sf -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test+'$RANDOM'@example.com","password":"test123"}' \
  | jq -r '.token')

# 3. Create receipt
echo "Testing receipt creation..."
RECEIPT_ID=$(curl -sf -X POST "$BASE_URL/api/receipts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"store_name":"Amazon","item_name":"Headphones","price":99.99}' \
  | jq -r '.id')

# 4. List receipts
echo "Testing receipt list..."
curl -sf "$BASE_URL/api/receipts" -H "Authorization: Bearer $TOKEN" | jq '.receipts | length' | grep -q '1'

# 5. Webhook (with secret)
echo "Testing webhook..."
curl -sf -X POST "$BASE_URL/api/webhook/email" \
  -H "X-Webhook-Secret: $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"to":"user@test.com","from":"orders@amazon.com","subject":"Order","body_text":"Thanks for your order!"}'

echo "All API tests passed!"
```

### AI Evaluation Tests (Non-Deterministic Testing)

AI outputs vary slightly across runs. Traditional "exact match" assertions fail. Instead, use **threshold-based evaluation**.

```typescript
// __tests__/ai-evaluation.test.ts
interface ExtractionResult {
  store_name: string;
  item_name: string;
  price: number;
  currency: string;
  purchase_date: string;
  return_deadline: string;
}

interface TestCase {
  emailFile: string;
  expected: Partial<ExtractionResult>;
  thresholds: {
    store_name?: number; // Levenshtein distance max
    item_name?: number;
    price_exact?: boolean;
    date_within_days?: number;
  };
}

const testCases: TestCase[] = [
  {
    emailFile: 'amazon-simple.txt',
    expected: {
      store_name: 'Amazon',
      item_name: 'Sony WH-1000XM5 Headphones',
      price: 348.00,
      currency: 'USD'
    },
    thresholds: {
      store_name: 2, // "Amazon" vs "Amazon.com" = OK
      item_name: 5,  // Allow small word differences
      price_exact: true,
      date_within_days: 1
    }
  }
];

describe('AI extraction evaluation', () => {
  testCases.forEach(({ emailFile, expected, thresholds }) => {
    it(`correctly extracts ${emailFile}`, async () => {
      const emailText = await readFile(`test/emails/${emailFile}`);
      const result = await extractReceipt(emailText);

      // Store name: fuzzy match
      const storeDistance = levenshtein(result.store_name, expected.store_name!);
      expect(storeDistance).toBeLessThanOrEqual(thresholds.store_name || 2);

      // Price: exact match (critical for business logic)
      if (thresholds.price_exact) {
        expect(result.price).toBe(expected.price);
      }

      // Dates: within tolerance
      if (thresholds.date_within_days) {
        const expectedDate = new Date(expected.purchase_date!);
        const actualDate = new Date(result.purchase_date);
        const diffDays = Math.abs((expectedDate.getTime() - actualDate.getTime()) / (1000 * 3600 * 24));
        expect(diffDays).toBeLessThanOrEqual(thresholds.date_within_days);
      }
    });
  });
});
```

### AI Benchmark Suite

Create a benchmark dataset of 50 real emails (anonymized). Run monthly to track accuracy improvement.

| Metric | Baseline (Month 1) | Target (Month 3) | How to measure |
|--------|-------------------|------------------|----------------|
| Store name accuracy | 85% | 92% | Fuzzy match against ground truth |
| Item name accuracy | 80% | 88% | Human review of 20% sample |
| Price exact match | 90% | 95% | Must be exact (no tolerance) |
| Date within 1 day | 85% | 93% | Calendar date comparison |
| JSON valid output | 95% | 99% | Parse success rate |
| Needs review rate | 15% | 8% | Manual review queue size |

### Fallback Chain Tests

```typescript
// __tests__/ai-fallback.test.ts
describe('AI fallback chain', () => {
  it('uses Groq when Gemini rate limits', async () => {
    // Mock Gemini to throw rate limit
    jest.spyOn(gemini, 'extract').mockRejectedValue(new Error('RATE_LIMITED'));
    
    const result = await extractReceipt('test email');
    
    expect(groq.extract).toHaveBeenCalled();
    expect(result.status).toBe('success');
  });

  it('marks as needs_review when all providers fail', async () => {
    jest.spyOn(gemini, 'extract').mockRejectedValue(new Error('DOWN'));
    jest.spyOn(groq, 'extract').mockRejectedValue(new Error('DOWN'));
    jest.spyOn(openrouter, 'extract').mockRejectedValue(new Error('DOWN'));
    
    const result = await extractReceipt('test email');
    
    expect(result.status).toBe('needs_review');
  });
});
```

### E2E Tests (Playwright — Critical Paths Only)

Only test the "happy path" that proves the product works:

```typescript
// e2e/critical-path.spec.ts
import { test, expect } from '@playwright/test';

test('full happy path: signup → forward email → see receipt', async ({ page }) => {
  // 1. Sign up
  await page.goto('/signup');
  await page.fill('[name=email]', `test-${Date.now()}@example.com`);
  await page.fill('[name=password]', 'test123');
  await page.click('button[type=submit]');
  
  // 2. Copy forwarding address
  await expect(page).toHaveURL('/dashboard');
  await page.click('[data-testid="copy-address"]');
  
  // 3. Simulate email (in test, call webhook directly)
  const address = await page.locator('[data-testid="forwarding-address"]').textContent();
  await fetch('http://localhost:3000/api/webhook/email', {
    method: 'POST',
    headers: { 'X-Webhook-Secret': process.env.WEBHOOK_SECRET! },
    body: JSON.stringify({
      to: address,
      from: 'orders@amazon.com',
      subject: 'Your Amazon order',
      body_text: 'Thank you for your order of Sony Headphones for $99.99'
    })
  });
  
  // 4. Wait for receipt to appear
  await expect(page.locator('text=Sony Headphones')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('text=$99.99')).toBeVisible();
});
```

**Why only one E2E test?** E2E tests are slow and flaky. One happy path test proves the system works end-to-end. Everything else is better tested at the unit/integration level.

---

## 3. Debugging Guide

### Debugging Philosophy

Receipt Guardian is a distributed system (email → API → AI → database → client). When something breaks, the challenge is **finding which component failed**.

**Golden rule:** Every request must leave a trace. Every error must be observable.

### Structured Error IDs

Every receipt processing job gets a unique trace ID:

```
Trace ID: rg-20250511-7f3a9b2c
├── Stage: webhook_received (12ms)
├── Stage: gmail_fetch (1.2s)
├── Stage: ai_extraction (3.4s) ← FAILED: Gemini rate limited
├── Stage: ai_fallback_groq (1.1s) ← SUCCESS
├── Stage: db_save (180ms)
└── Stage: realtime_push (45ms)
```

This trace ID is logged, sent to Sentry, and included in user-facing error messages ("Receipt #7f3a9b2c needs review").

### Common Issues & Fixes

#### Issue: AI returns malformed JSON
**Symptom:** Extraction fails, receipt marked "needs_review"  
**Root Cause:** Free-tier LLMs sometimes return markdown-wrapped JSON or trailing commas.  
**Debug:**
```bash
# Check the raw AI response
node scripts/debug-extraction.js --email-file test.txt --verbose
```
**Fix:**
- Add JSON repair pipeline (see Architecture doc)
- Strengthen prompt: "Return ONLY compact JSON. No markdown. No explanations."
- Log raw responses for pattern analysis
- If one provider consistently fails a format, route that format to another provider

#### Issue: Gmail API stops receiving emails
**Symptom:** No new receipts appearing for hours  
**Root Cause:** Gmail watch expires every 7 days and must be renewed.  
**Debug:**
```bash
# Check if Gmail watch is still active
curl "https://www.googleapis.com/gmail/v1/users/me/watch?access_token=TOKEN"

# Check email_logs for failed processing
node scripts/check-failed-emails.js
```
**Fix:**
- Vercel Hobby Cron can renew Gmail watch once per day if Pub/Sub push is enabled
- Alert if no emails processed in 24 hours
- Fallback: use the authenticated "Check Inbox Now" manual Gmail check route instead of frequent Vercel polling

#### Issue: Deadline notifications not sending
**Symptom:** Users don't get email alerts  
**Root Cause:** Cron job not running, Resend API limit, or wrong query logic.  
**Debug:**
```sql
-- Check receipts that should have notified
SELECT id, item_name, return_deadline, notification_sent_3d
FROM receipts
WHERE return_deadline BETWEEN NOW() AND NOW() + INTERVAL '3 days'
  AND status = 'active'
  AND notification_sent_3d = false;

-- Check cron execution logs
SELECT * FROM cron_logs WHERE job_name = 'check-deadlines' ORDER BY run_at DESC LIMIT 10;
```
**Fix:**
- Add cron health check: log every execution to database
- Verify Resend API key has quota remaining
- Test query in Supabase SQL Editor before deploying

#### Issue: User sees other user's receipts
**Symptom:** Data leak (CRITICAL)  
**Root Cause:** RLS policy missing or API bypassing RLS with service role.  
**Debug:**
```sql
-- Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('receipts', 'email_logs');

-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename = 'receipts';

-- Test as a specific user
SET LOCAL ROLE authenticated;
SET request.jwt.claim.sub = 'test-user-uuid';
SELECT * FROM receipts; -- Should only show test-user's receipts
```
**Fix:**
- NEVER use service role key in API routes
- Always use supabase-js with user's JWT
- Add middleware that verifies `req.user.id === resource.user_id`
- Log all access violations to Sentry with full context

#### Issue: Dashboard loading slowly
**Symptom:** >2s to load receipts  
**Root Cause:** Missing database index, too much data fetched, no pagination.  
**Debug:**
```sql
-- Check query execution plan
EXPLAIN ANALYZE 
SELECT * FROM receipts 
WHERE user_id = 'uuid' AND status = 'active'
ORDER BY return_deadline 
LIMIT 20;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'receipts';
```
**Fix:**
- Add composite index: `CREATE INDEX idx_receipts_user_deadline ON receipts(user_id, return_deadline) WHERE status = 'active';`
- Always paginate: `LIMIT 20 OFFSET 0`
- Use Supabase `select()` with specific columns, not `*`
- Pre-compute `days_remaining` as generated column

---

## 4. Logging Strategy

| Level | What to Log | Where | Retention |
|-------|-------------|-------|-----------|
| **FATAL** | Unhandled exceptions, database unavailability | Console + Sentry + Pager (if configured) | 90 days |
| **ERROR** | AI extraction failures, webhook auth failures, RLS violations | Console + Sentry | 30 days |
| **WARN** | Single AI provider failure (fallback used), low confidence extractions (<0.7), rate limit approaches | Console + Sentry (warning level) | 14 days |
| **INFO** | User signup, receipt created, notification sent, cron job executed | Console | 7 days |
| **DEBUG** | Full AI prompts and responses, email body previews | Local only | Session |

**Production rule:** Never log full email bodies or PII. Log metadata only (sender domain, subject line, receipt ID).

---

## 5. Local Debugging Tools

```bash
# Start dev server with full debug logging
DEBUG=app:*,ai:*,db:* npm run dev

# Test AI extraction on a single email with full trace
node scripts/test-extraction.js --file emails/amazon.txt --verbose --trace

# Reset local database and seed test data
npx supabase db reset && node scripts/seed-test-data.js

# Check Supabase realtime subscriptions
npx supabase status

# Simulate webhook locally
npx ngrok http 3000
# Update Gmail webhook URL to https://xxx.ngrok.io/api/webhook/email

# Run specific test with coverage
npm test -- --coverage --testPathPattern=deadline-calculator

# Benchmark AI extraction speed
node scripts/benchmark-ai.js --provider=gemini --iterations=20
```

---

## 6. Test Email Samples

Create folder `test/emails/` with these samples. Source them from your own inbox (anonymize personal info):

| File | Purpose | Expected Challenge |
|------|---------|-------------------|
| `amazon-simple.txt` | Standard order confirmation | Baseline — should extract perfectly |
| `amazon-multi-item.txt` | Multiple items in one order | Which item to prioritize? (Answer: most expensive or first listed) |
| `nike-promo.txt` | Heavy promotional text, small order details | Noise filtering |
| `apple-digital.txt` | No physical item, subscription-like | No return date — should calculate from purchase_date |
| `ebay-seller.txt` | Third-party seller format | Store name might be seller username, not "eBay" |
| `no-return-date.txt` | No explicit return policy mentioned | Must default to purchase_date + 30 days |
| `foreign-currency.txt` | EUR, GBP, JPY | Currency symbol vs. code detection |
| `refund-confirmation.txt` | Refund/reversal email | Should not create duplicate receipt |
| `shipping-only.txt` | Shipping confirmation (no order details) | Should gracefully skip or mark as "needs_review" |
| `html-heavy.txt` | Mostly HTML, minimal plain text | HTML-to-text extraction quality |
| `long-email.txt` | 5,000+ words of terms and conditions | AI context window handling |
| `short-email.txt` | 2-sentence confirmation | Minimal information extraction |

### Monthly Benchmark Process

```bash
# 1. Run extraction on all samples
node scripts/benchmark-ai.js --all

# 2. Generate accuracy report
# Output: per-store accuracy, per-field accuracy, confidence distribution

# 3. Review "needs_review" cases
# Identify patterns: which stores fail most? Which fields are hardest?

# 4. Iterate prompt
# Update prompt template based on failure patterns

# 5. Re-run and compare
# Track month-over-month improvement
```

**Accuracy target progression:**
- Month 1 (MVP): 75% field accuracy acceptable
- Month 2: 85% field accuracy
- Month 3: 90% field accuracy
- Month 6: 93% field accuracy with <5% needs_review rate

## 7. MVP Manual RLS Checklist

Run this before inviting beta users:

1. Sign up as User A and create a receipt.
2. Sign out, sign up as User B, and confirm User A's receipt is not visible.
3. As User B, call `GET /api/receipts` and confirm only User B rows appear.
4. Try `GET /api/receipts/{user-a-receipt-id}` as User B and expect `404`.
5. Confirm no client bundle contains `SUPABASE_SERVICE_ROLE_KEY`.
6. Confirm server-only service-role usage is limited to Gmail ingestion and cron
   notification jobs that explicitly set `user_id`.
