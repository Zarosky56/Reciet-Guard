# Receipt Guardian — Data Model & API Specification (Research-Backed)

## 0. API Design Principles

### RESTful Design (2025 Best Practices)

Based on industry standards (Stripe API, GitHub API, JSON:API):

| Principle | Implementation |
|-----------|---------------|
| **Resource-oriented URLs** | `/receipts`, `/receipts/:id`, not `/getReceipts` |
| **HTTP verbs** | GET (read), POST (create), PATCH (update), DELETE (remove) |
| **Plural nouns** | `/receipts`, not `/receipt` |
| **Consistent error format** | `{ error: { code, message, details } }` |
| **Version in URL** | `/api/v1/receipts` (future-proofing) |
| **Pagination by default** | `?limit=20&offset=0` on all list endpoints |
| **Filtering via query params** | `?status=active&urgency=red` |
| **JSON responses** | All responses are JSON, UTF-8 encoded |

### Pagination Strategy

```
GET /api/v1/receipts?limit=20&offset=0

Response:
{
  "data": [ ...receipts... ],
  "meta": {
    "total": 142,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**Why cursor-based?** Offset pagination slows down as offset grows (`O(offset)`). For MVP with <1000 receipts per user, offset is fine. At scale, migrate to cursor-based (`?cursor=xyz`).

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Public (webhook) | 100 req/min | Per IP |
| Authenticated (receipts) | 200 req/min | Per user |
| Auth (signup/login) | 10 req/min | Per IP |

Headers returned:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1715431200
```

---

## 1. Database Schema (Supabase / PostgreSQL)

### Table: `profiles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, FK → auth.users.id, ON DELETE CASCADE |
| forwarding_address | VARCHAR(255) | UNIQUE, nullable for shared Gmail MVP |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

Supabase Auth owns user email/password in `auth.users`. The app uses `profiles` only for app-specific user metadata.

### Table: `receipts`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users.id, ON DELETE CASCADE |
| store_name | VARCHAR(255) | |
| item_name | VARCHAR(500) | |
| price | DECIMAL(10,2) | |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| purchase_date | DATE | |
| return_deadline | DATE | |
| warranty_deadline | DATE | nullable |
| raw_email_text | TEXT | (for re-processing) |
| ai_confidence | DECIMAL(3,2) | 0.00 to 1.00 |
| status | VARCHAR(20) | DEFAULT 'active', CHECK IN ('active','returned','kept','expired') |
| notification_sent_7d | BOOLEAN | DEFAULT false |
| notification_sent_3d | BOOLEAN | DEFAULT false |
| notification_sent_1d | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

### Table: `email_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users.id |
| receipt_id | UUID | FK → receipts.id, nullable |
| gmail_message_id | VARCHAR(255) | UNIQUE, nullable |
| from_address | VARCHAR(255) | |
| subject | VARCHAR(500) | |
| received_at | TIMESTAMPTZ | DEFAULT now() |
| processing_status | VARCHAR(20) | DEFAULT 'pending', CHECK IN ('pending','success','failed','needs_review') |
| error_message | TEXT | nullable |

## 1.1 Basic Supabase Initialization SQL

Run this once in **Supabase Dashboard → SQL Editor → New query** before the coding agent starts building.

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  forwarding_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name VARCHAR(255),
  item_name VARCHAR(500),
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  purchase_date DATE,
  return_deadline DATE,
  warranty_deadline DATE,
  raw_email_text TEXT,
  ai_confidence DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('active','returned','kept','expired')),
  notification_sent_7d BOOLEAN DEFAULT false,
  notification_sent_3d BOOLEAN DEFAULT false,
  notification_sent_1d BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL,
  gmail_message_id VARCHAR(255) UNIQUE,
  from_address VARCHAR(255),
  subject VARCHAR(500),
  received_at TIMESTAMPTZ DEFAULT now(),
  processing_status VARCHAR(20) DEFAULT 'pending'
    CHECK (processing_status IN ('pending','success','failed','needs_review')),
  error_message TEXT
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own profile" ON profiles;
CREATE POLICY "Users see own profile"
  ON profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Isolate user receipts" ON receipts;
CREATE POLICY "Isolate user receipts"
  ON receipts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Isolate user email logs" ON email_logs;
CREATE POLICY "Isolate user email logs"
  ON email_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_receipts_user_status
  ON receipts(user_id, status);

CREATE INDEX IF NOT EXISTS idx_receipts_deadline
  ON receipts(return_deadline) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_receipts_created
  ON receipts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_status
  ON email_logs(processing_status) WHERE processing_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_receipts_active_deadline
  ON receipts(user_id, return_deadline) WHERE status = 'active';

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_receipts_updated_at ON receipts;
CREATE TRIGGER set_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 2. API Endpoints

### Auth

#### POST `/api/auth/signup`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "forwarding_address": "user-uuid@receiptguard.app"
  },
  "token": "jwt"
}
```

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response (200):**
```json
{
  "user": { ... },
  "token": "jwt"
}
```

### Receipts

#### GET `/api/receipts`
**Headers:** `Authorization: Bearer <jwt>`  
**Query:** `?status=active&search=nike&sort=deadline_asc`  
**Response (200):**
```json
{
  "receipts": [
    {
      "id": "uuid",
      "store_name": "Nike",
      "item_name": "Air Max Shoes",
      "price": 89.99,
      "currency": "USD",
      "purchase_date": "2025-05-01",
      "return_deadline": "2025-06-01",
      "days_remaining": 21,
      "status": "active",
      "urgency": "green"
    }
  ],
  "total": 1
}
```

#### GET `/api/receipts/:id`
**Response (200):** Full receipt object with `raw_email_text` hidden

#### PATCH `/api/receipts/:id`
**Request:**
```json
{
  "store_name": "Nike Store",
  "return_deadline": "2025-06-15",
  "status": "returned"
}
```
**Response (200):** Updated receipt

#### DELETE `/api/receipts/:id`
**Response (204):** No content

### Dashboard

#### GET `/api/dashboard/stats`
**Headers:** `Authorization: Bearer <jwt>`  
**Response (200):**
```json
{
  "total_receipts": 12,
  "active_receipts": 8,
  "expiring_soon": 3,
  "expired_this_month": 2,
  "money_at_risk": 156.97
}
```

### Webhook (Email Ingestion)

#### POST `/api/webhook/email`
**Called by:** Gmail API push notification or Cloudflare Worker  
**Headers:** `X-Webhook-Secret: <secret>`  
**Request:**
```json
{
  "to": "user-uuid@receiptguard.app",
  "from": "orders@amazon.com",
  "subject": "Your Amazon order #123-456789",
  "body_text": "...",
  "body_html": "...",
  "received_at": "2025-05-11T10:00:00Z"
}
```
**Response (200):**
```json
{
  "receipt_id": "uuid",
  "status": "extracted",
  "confidence": 0.92
}
```

## 3. Error Responses

All errors follow this format:
```json
{
  "error": {
    "code": "RECEIPT_NOT_FOUND",
    "message": "Receipt with ID xyz not found",
    "status": 404
  }
}
```

| Code | Status | When |
|------|--------|------|
| UNAUTHORIZED | 401 | Invalid/missing JWT |
| FORBIDDEN | 403 | User accessing another user's receipt |
| NOT_FOUND | 404 | Receipt/user doesn't exist |
| VALIDATION_ERROR | 400 | Missing required field |
| RATE_LIMIT | 429 | Too many requests to AI |
| AI_EXTRACTION_FAILED | 422 | AI couldn't parse the email |

## 4. TypeScript Types

```typescript
// types/index.ts

interface User {
  id: string;
  email: string;
  forwarding_address: string;
  created_at: string;
}

interface Receipt {
  id: string;
  user_id: string;
  store_name: string;
  item_name: string;
  price: number;
  currency: string;
  purchase_date: string;
  return_deadline: string;
  warranty_deadline?: string;
  status: 'active' | 'returned' | 'kept' | 'expired';
  days_remaining: number;
  urgency: 'green' | 'yellow' | 'red';
}

interface EmailPayload {
  to: string;
  from: string;
  subject: string;
  body_text: string;
  body_html?: string;
  received_at: string;
}

interface AIExtractionResult {
  store_name: string;
  item_name: string;
  price: number;
  currency: string;
  purchase_date: string;
  return_deadline: string;
  confidence: number;
}
```
