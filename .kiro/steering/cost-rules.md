# Cost Rules — Strict $0 Out-of-Pocket

These rules are **permanent constraints** for this project. Apply them to every change.

## Hard Rules

1. **Never charge the user real money.** The user has a Google Cloud trial subscription
   with free credits. The app must use trial credits only and **never** spill over to
   paid usage that would bill the user's card.
2. **When trial credits run out**, the app must **automatically fall back** to the
   existing free alternatives (Gemini API via `GOOGLE_AI_API_KEY`, then Groq).
3. **No paid upgrade prompts** in the UI. Premium features should silently degrade
   to free tier behavior when paid services are unavailable.

## Google Cloud Services in Use

| Service | Used for | Free tier behavior | Fallback when trial ends |
|---|---|---|---|
| Document AI (Expense/Invoice Parser) | Higher-accuracy receipt extraction from PDFs/images | 1,000 pages/month free for first year (then paid) | Fall back to Gemini text extraction |
| Cloud Storage (GCS) | Temp storage for receipt files before Document AI processes them | 5 GB free always | Fall back to in-memory base64 / direct Gemini upload |
| Pub/Sub (optional) | Gmail push automation | 10 GB messages/month free always | Fall back to manual "Check Inbox Now" |

## Implementation Requirements

- **Feature flag**: gate every paid Google Cloud call behind an env flag like
  `ENABLE_DOCUMENT_AI=true`. If false or unset, skip Document AI entirely.
- **Error handling**: catch billing-related errors (HTTP 402, 403 with quota or
  billing keywords, `BILLING_DISABLED`, `RESOURCE_EXHAUSTED`) and fall back
  silently to the next provider in the chain.
- **Provider chain order**: Document AI (if enabled) → Gemini API → Groq → needs_review
- **Billing alerts**: user should set up a Google Cloud budget alert at $1 to get
  notified before any real charge occurs. Document this in setup docs.

## What NOT to do

- Do not add features that require paid-only Google Cloud APIs (like Vertex AI
  custom models, Translation API beyond free tier, etc.) without explicit user approval.
- Do not enable auto-billing or remove billing safeguards from the code.
- Do not assume Document AI is always available; always check the env flag and
  handle failures gracefully.
