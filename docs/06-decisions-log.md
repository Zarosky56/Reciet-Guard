# Receipt Guardian — Decisions & Risks Log (Research-Backed)

## 1. Key Technical Decisions

### Decision: Next.js vs Other Frameworks
**Chosen:** Next.js 15 (App Router)  
**Alternatives Considered:** SvelteKit, Nuxt, Remix, plain React + Express  
**Research Basis:**
- Next.js is the most deployed React framework in production SaaS (Vercel, 2025)
- App Router enables React Server Components, reducing client bundle by 30-50%
- API routes colocated with frontend eliminate backend repo complexity
- Vercel's edge runtime: cold starts <50ms, globally distributed

**Why:**
- Full-stack in one codebase (no separate backend repo)
- API routes for webhooks built-in
- Vercel deployment is one-click with preview branches
- Largest ecosystem, most tutorials, easiest hiring
- Server components reduce client JS

**Trade-off:** Slightly more complex than needed for a simple CRUD app, but future-proof. The learning curve is offset by the massive community and documentation.

**Reversal condition:** If bundle size exceeds 200KB for initial load, consider migrating heavy pages to static generation or edge functions.

---

### Decision: Supabase vs Firebase vs PlanetScale
**Chosen:** Supabase  
**Alternatives Considered:** Firebase, PlanetScale + Clerk, self-hosted PostgreSQL  
**Research Basis:**
- Firebase Firestore is document-based: poor for relational queries, no JOINs
- PlanetScale is MySQL-based: no native JSON support, no realtime subscriptions
- Self-hosted requires DevOps expertise and 24/7 monitoring
- Supabase is PostgreSQL: industry-standard, ACID-compliant, supports complex queries

**Why:**
- PostgreSQL (real relational DB, not Firestore document store)
- Auth included (no separate service like Clerk/Auth0)
- Realtime subscriptions for dashboard updates
- Row Level Security (RLS) built-in — critical for data isolation
- Generous free tier: 500MB DB, 1GB storage, 50K MAU

**Trade-off:** Vendor lock-in to Supabase ecosystem. Migration possible but painful. The free tier has no SLA.

**Reversal condition:** If we exceed 500MB database before monetization, evaluate PlanetScale or AWS RDS for cost optimization.

---

### Decision: Gmail API (MVP) vs Cloudflare Email Routing (Production)
**Chosen:** Gmail API for MVP, Cloudflare for production  
**Alternatives Considered:** Mailgun inbound, SendGrid inbound, AWS SES  
**Research Basis:**
- Mailgun inbound requires paid plan ($35+/mo)
- SendGrid inbound requires paid plan ($90+/mo)
- AWS SES is complex to configure and not truly serverless
- Gmail API is free but requires OAuth management
- Cloudflare Email Workers are $0 with 100K requests/day

**Why:**
- Gmail API is easiest to test (just create one Gmail account)
- No domain purchase needed for validation phase
- Cloudflare Email Workers are free and serverless for production
- Cloudflare catch-all means ANY address @yourdomain works automatically

**Risk:** Gmail API requires OAuth refresh token renewal every 7 days. Must automate with Vercel Cron.

**Reversal condition:** If Cloudflare email delivery is unreliable, migrate to AWS SES (cost: ~$0.10/1000 emails).

---

### Decision: Google Gemini vs OpenAI vs Local Models
**Chosen:** Gemini 2.0 Flash primary, Groq fallback  
**Alternatives Considered:** OpenAI GPT-4o, Anthropic Claude, local Ollama, self-hosted  
**Research Basis (Costbench 2026; MadAppGang 2025):**
- OpenAI has no free tier — requires paid credits upfront
- Claude free tier is limited to 5 requests/day (insufficient)
- Local models (Ollama) require GPU — user's PC cannot run them
- Gemini offers the most generous free tier: 1,500 requests/day, no expiry, no credit card
- Groq offers the fastest inference: 500-800 tokens/sec on free tier
- Multi-provider fallback is essential: no single free API is 100% reliable

**Why:**
- Gemini free tier: 1,500 req/day, no credit card, 1M context window
- Groq free tier: 30 req/min, extremely fast inference, same hardware as paid
- User's PC can't run local models (explicit requirement)
- OpenAI requires paid credits (no free tier)

**Risk:** Google's free tier data is used to improve models (not private). Users must be informed in Privacy Policy. However, order confirmation emails contain no sensitive PII (name, address already known to Google via Gmail).

**Reversal condition:** If extraction accuracy with Gemini <80% after prompt optimization, evaluate fine-tuning or rule-based extraction for top 20 retailers.

---

### Decision: shadcn/ui vs Custom Components vs Material UI
**Chosen:** shadcn/ui  
**Alternatives Considered:** Custom from scratch, Material UI, Chakra UI, Ant Design  
**Research Basis:**
- Material UI is the most popular React UI library but looks generic ("Material Design fatigue")
- Chakra UI is good but v2 introduced breaking changes that disrupted many projects
- Ant Design is enterprise-focused, heavy bundle, Chinese documentation bias
- shadcn/ui is the fastest-growing: copy-paste components, full customization, no dependency lock-in
- shadcn/ui uses Radix UI primitives: accessibility built-in, tested by thousands of apps

**Why:**
- Copy-paste components (not a dependency — you own the code, no version conflicts)
- Built on Radix UI (accessibility out of the box, WCAG compliant)
- Tailwind-first (consistent with our styling, no CSS-in-JS overhead)
- Dark mode built-in (critical for our dark-first design)
- Professional look without design expertise — used by Vercel, Stripe, Notion teams

**Trade-off:** Slightly larger initial setup time than npm install. But the ability to customize every component without fighting the library pays off within days.

---

### Decision: No Mobile App (Yet)
**Chosen:** Responsive web app only  
**Alternatives Considered:** React Native, Flutter, PWA  
**Research Basis:**
- 60% of SaaS usage is on mobile browsers, not native apps (Statista, 2025)
- React Native adds ~3 months to MVP timeline
- App store review processes add 1-7 days per release
- PWA can achieve 90% of native functionality with 10% of the effort
- The "forward email" action is easier in a mobile browser than in a native app

**Why:**
- Web works on all devices (phone, tablet, laptop) with one codebase
- No app store fees ($99 Apple, $25 Google) or review delays
- Faster iteration: deploy in seconds, not days
- Can become PWA later for "install to home screen" feel
- Email forwarding is simpler from a browser than from an app

**Risk:** Users may expect a native app. PWA can bridge this gap later. If iOS Safari limits PWA features, evaluate React Native at 5,000+ users.

---

## 2. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|--------|-----------|--------|------------|-------|
| **AI extraction accuracy <85%** | Medium | High | Manual review queue, user editing, prompt iteration, multiple AI providers | AI/Prompt Engineer |
| **Gmail API rate limits** | Low | Medium | Use batch processing, implement delays, move to Cloudflare quickly | Backend |
| **User doesn't forward emails** | High | High | Onboarding shows how, copy-paste as fallback, browser extension later | Product/UX |
| **Supabase free tier limits** | Medium | Medium | Monitor usage, compress stored emails, archive old data | Backend |
| **AI API goes down/rate limited** | Medium | High | Multi-provider fallback (Gemini → Groq → OpenRouter), graceful degradation | Backend |
| **Security: email spoofing** | Low | High | Verify DKIM where possible, don't auto-process high-value items without review | Security |
| **Competitor launches similar product** | Medium | Medium | First-mover advantage in simplicity, iterate fast, build community | Product |
| **No one wants to use it** | Medium | Critical | Validate with manual MVP first (no code), 5 friends test for 2 weeks | Product |
| **Vercel free tier limits** | Low | Medium | Edge caching, optimize bundle size, upgrade to Pro if needed ($20/mo) | Backend |
| **Notification fatigue** | Medium | Medium | Default to 3-day alerts only; opt-in for more frequent (Smashing Magazine, 2025) | Product |

---

## 3. Open Questions

| Question | Status | Decision Needed By | Research Needed |
|----------|--------|-------------------|-----------------|
| Do we store raw email text long-term? | Open | Before production (GDPR/privacy) | Check GDPR Article 5 (data minimization) |
| Should we support photo receipt scanning? | Open | Post-MVP if users ask | Tesseract.js vs Google Vision API accuracy comparison |
| What happens when user returns an item? | Open | Receipt status workflow | User interview: do they want to track returns or just archive? |
| Do we integrate with store APIs directly? | Open | Future (hard, requires partnerships) | Amazon/eBay API documentation review |
| Should we support multiple currencies natively? | Open | If first users are international | Check if >20% of users are non-USD |
| How to handle multi-item orders? | Open | One receipt per item or one per order? | A/B test: which do users prefer? |
| Do we need a browser extension? | Open | If email forwarding adoption <40% | Research: would a "Save to Receipt Guardian" button increase usage? |

---

## 4. Pivot Triggers

If these happen, reconsider the product:

| Trigger | Threshold | Action | Timeline |
|---------|-----------|--------|----------|
| Email forwarding adoption low | <20% of beta users forward within 1 week | Pivot to photo scan or browser extension | Week 2 |
| AI accuracy insufficient | <70% after 3 prompt iterations | Switch to rule-based parsing for top 20 stores + AI for unknowns | Month 1 |
| Users want expense tracking | >50% of feedback requests | Pivot to personal finance/receipt organizer | Month 2 |
| Users want sharing | >30% ask for family/spouse access | Add family sharing as paid feature | Month 2 |
| High churn | <20% week-2 retention | Interview users, find real pain, pivot feature set | Week 3 |
| No organic growth | 0% word-of-mouth after 1 month | Evaluate product-market fit; consider shutting down | Month 2 |

---

## 5. Lessons from MiroPDF Pivot

| MiroPDF Mistake | Root Cause | Receipt Guardian Fix |
|-----------------|------------|----------------------|
| Massive feature list (15+ features) | No prioritization framework | Single core feature: track return deadlines. Everything else is "nice to have." |
| Multiple user personas | Trying to serve everyone | One primary persona: frequent online shopper. Ignore others until core is solid. |
| Complex tech (OCR, real-time collab, PDF rendering) | Engineering-driven, not user-driven | Simple: email → AI → database → dashboard. No PDF, no OCR, no real-time. |
| No clear daily user action | Feature list without user workflow | Clear action: forward one email. Takes 2 seconds. |
| "Build everything, then launch" | Waterfall mentality | Build minimal, test with 5 users, iterate. Launch in 2 weeks, not 6 months. |
| Local AI models (user PC too weak) | Ignoring hardware constraints | Cloud AI APIs ($0 free tier). PC requirements: just a browser. |
| No validation plan | Assumed users would want it | Manual MVP: clipboard + spreadsheet + 5 friends. Validate before building. |
| No competitive differentiation | "PDF reader" is a commodity | "AI-powered return deadline tracker" is a new category. No direct competitor. |

---

## 6. Success Criteria (Revisited)

| Metric | Target | If Below Target | Research Basis |
|--------|--------|----------------|--------------|
| Beta signups (Month 1) | 50 | Re-evaluate marketing channels | 40 users = statistically meaningful retention data |
| Email forward rate | >60% of active users | Simplify onboarding, add copy-paste fallback | Candu (2025): Activation must happen within 72 hours |
| AI extraction accuracy | >85% | Iterate prompt, add rule-based fallback | Below 80% = too much manual correction |
| Manual correction rate | <15% | Improve prompt, add confidence threshold | Above 20% = AI not saving enough time |
| Week 2 retention | >40% | Interview dropouts, find friction | Industry SaaS benchmark. Below 30% = PMF problem |
| Users say they'd pay | >20% | Build Pro tier with paid features | Rule of thumb: 20% willingness to pay = viable business |
| Time to first receipt | <5 minutes | Add interactive onboarding tutorial | Figma research: first action within 5 min = 3x retention |
| NPS score (Month 2) | >30 | Interview detractors, fix top pain points | NPS >30 = product has product-market fit |

---

## 7. Decision Process

For future technical decisions, use this framework:

### The 5 Gates

1. **Does it serve the core value prop?** (track return deadlines)
   - No → Don't build it. Full stop.
2. **Can we build it in <1 week?**
   - No → Defer to post-MVP. Create a GitHub issue and move on.
3. **Is there a free alternative?**
   - No → Can we afford it? If not, don't build it.
4. **Does it increase user friction?**
   - Yes → Don't build it unless it's critical to the core value prop.
5. **Can we test it manually first?**
   - Yes → Do that before writing any automation. Use Notion/spreadsheets for validation.

### Decision Review Cadence

| Review Type | Frequency | What We Review |
|-------------|-----------|---------------|
| **Weekly product review** | Every Friday | Metrics, user feedback, open questions |
| **Bi-weekly tech review** | Every other Monday | Technical debt, architecture decisions, performance |
| **Monthly pivot review** | First Monday of month | Success metrics against targets, pivot triggers |
| **Quarterly planning** | Start of quarter | Roadmap, major investments, team growth |

---

## 8. Technical Debt Tracking

| Item | Why Deferred | When to Fix | Impact if Not Fixed |
|------|-------------|-------------|---------------------|
| No email attachment parsing | MVP scope | If users forward PDF receipts | Low — workaround: manual entry |
| No retry logic for AI failures | Simple first | After 100 receipts processed | Medium — some receipts fail silently |
| No email deduplication | Unlikely in beta | If users forward same email twice | Low — duplicate receipts are annoying but harmless |
| Client-side validation only | Fast to build | Before handling payments | Medium — data quality issues |
| No caching layer | Small user base | >500 users | Medium — dashboard load times degrade |
| No automated DB backups | Free tier limitation | When upgrading to Supabase Pro | High — data loss risk |
| No rate limiting on public APIs | MVP simplicity | Before public launch | High — abuse risk |
| No email parsing for HTML-only emails | Plain text covers 90% | If >10% of emails are HTML-only | Low — fallback to HTML-to-text converter |
| No A/B testing framework | Not needed for MVP | When optimizing onboarding conversion | Medium — flying blind on UX changes |
