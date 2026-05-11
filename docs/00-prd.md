# Receipt Guardian — Product Requirements Document (Research-Backed)

## 1. Overview

**Product Name:** Receipt Guardian  
**Tagline:** "Never miss a return window again."  
**What it is:** A web app where users forward order confirmation emails to a unique address. AI extracts item details, price, and return deadline automatically. The dashboard shows a clean timeline of all purchases with expiry alerts.

**Research Foundation:** This PRD is informed by 2025 SaaS UX research covering onboarding psychology (Candu), notification behavior (Smashing Magazine), dashboard design patterns (F1Studioz), and competitive analysis of 15+ existing tools.

---

## 2. Problem Statement

### The Daily Pain

People shop online frequently but forget return and warranty deadlines. The average online shopper makes 10-15 purchases per month and remembers zero return windows. When an item breaks or doesn't fit, they scramble to find the email, check the date, and discover the window closed yesterday.

### Why Current Solutions Fail

| Solution | Why Users Abandon It |
|----------|---------------------|
| Spreadsheets | Manual data entry is friction. Users enter 3 receipts then quit. |
| Expense apps (Expensify, Mint) | Built for business tax tracking, not consumer return deadlines. Category-focused, not time-focused. |
| Warranty trackers | 100% manual entry of product name, date, warranty length. Setup time > 2 minutes per item. |
| Calendar reminders | Requires user to calculate the return date and create an event. Too much cognitive effort. |
| "I'll just remember" | Humans are bad at remembering arbitrary deadlines. The Zeigarnik effect means unclosed loops create anxiety, not action. |

### The Cost

- Average return window: 14-30 days
- Average forgotten return value: $40-80 per item
- Annual waste per active online shopper: $200-500
- Emotional cost: Frustration, feeling "ripped off," decision fatigue

---

## 3. Target Users

### Primary Personas

| Persona | Demographics | Pain Level | Behavior | Acquisition Channel |
|---------|-------------|------------|----------|---------------------|
| **Frequent Shopper** | 25-40, urban, buys 10+ items/month online | High | Forwards emails out of habit if it's easy | Instagram, Reddit r/frugal |
| **Gadget Enthusiast** | 30-45, tech-forward, many electronics | High | Cares about warranties, loses paperwork | Reddit r/gadgets, YouTube tech |
| **Gift Buyer** | 25-55, buys presents frequently | Medium | Needs to track return windows for recipients | Pinterest, parenting forums |
| **Anxiety-Prone Organizer** | Any age, dislikes uncertainty | Very High | Wants zero-effort peace of mind | Productivity communities |

### User Psychology Insights

From 2025 SaaS onboarding research (Candu; ProductLed):
- **75% of new users abandon apps within the first week** without effective onboarding
- Users who experience a "quick win" in the first 5 minutes have **3x higher week-2 retention**
- Friction at signup is the #1 cause of dropoff. Every additional form field reduces conversion by ~10%
- Users don't read tutorials. They explore. The product must teach through interaction, not instruction

### What Our Users Actually Want

From Reddit and community research:
1. **"I just want to know: can I still return this?"** — Binary status, not data
2. **"Don't make me type anything"** — Zero-input tracking
3. **"Warn me before it's too late"** — Proactive, not reactive
4. **"Show me what I'm about to lose money on"** — Urgency-sorting

---

## 4. Competitive Analysis

### Direct Competitors (Receipt/Return Tracking)

| Product | Strength | Weakness | Our Advantage |
|---------|----------|----------|---------------|
| **Warranty Wallet** (iOS) | Clean iOS UI, no subscription | Manual entry only, iOS only, no AI | AI auto-extraction + web-based |
| **TrackMyWarranty** | Free, simple | Manual entry, no email integration | Zero typing required |
| **Expired** (Android) | Warranty tracking | Android only, manual, ugly UI | Cross-platform + beautiful design |
| **SmartReceipts** | Business expense tracking | Overwhelming for consumers, no return deadlines | Consumer-first, deadline-focused |
| **SparkReceipt** | AI scanning | Business-oriented, expensive ($15+/mo) | Free tier, simple purpose |

### Indirect Competitors (Bookmark/Read-Later/Save Tools)

| Product | Relevant Feature | Why We Beat It |
|---------|-----------------|----------------|
| **Pocket** (shutting down) | Save-for-later reading | Receipt Guardian is purpose-built for purchase tracking |
| **Readwise** | Content curation | $8/mo, not for receipts. Our free tier wins. |
| **Notion** | Flexible databases | Too much setup. Users build trackers then abandon them. |

### Competitive Moat

1. **AI email parsing** — No consumer app does this automatically
2. **Deadline-first sorting** — Every other app sorts by date added or alphabetically
3. **Zero typing** — Forward email, done. The 2-second interaction.
4. **Beautiful, calm UI** — Other tools feel like accounting software. We feel like a premium lifestyle app.

---

## 5. User Stories

### US-01: Email Forwarding
> As a user, I want to forward an order email to my unique address so that the app captures the receipt automatically.

**Acceptance Criteria:**
- [ ] User receives a unique forwarding address after signup
- [ ] Forwarding any email to that address triggers processing
- [ ] AI extracts: store name, item(s), price, purchase date, return window
- [ ] Extracted data appears in dashboard within 60 seconds
- [ ] If extraction fails, user sees a "Needs review" notification

**UX Rationale:** The "forward email" action is the single core interaction. It must feel instantaneous and reliable. Research shows that perceived speed matters more than actual speed — show a processing state within 100ms, even if extraction takes 5 seconds.

### US-02: Dashboard View
> As a user, I want to see all my tracked receipts in one place with clear deadline status.

**Acceptance Criteria:**
- [ ] Dashboard shows list of receipts sorted by "urgency" (closest deadline first)
- [ ] Each card shows: item name, store, purchase date, return deadline, days remaining
- [ ] Color coding: green (>7 days), yellow (3-7 days), red (<3 days or expired)
- [ ] Clicking a card opens detail view with full info
- [ ] Search by item name or store

**UX Rationale:** Based on dashboard design research (F1Studioz, 2026), users follow an F-shaped scanning pattern. The most urgent item must be in the top-left position. Color-coded urgency communicates status 60% faster than text alone ("traffic light" system).

### US-03: Alert Notifications
> As a user, I want to receive warnings before a return window closes.

**Acceptance Criteria:**
- [ ] Email sent 7 days before deadline
- [ ] Email sent 3 days before deadline
- [ ] Email sent 1 day before deadline
- [ ] User can toggle alerts on/off per receipt
- [ ] User can set preferred notification channel (email)

**UX Rationale:** Notification research (Smashing Magazine, 2025; Facebook, 2024) shows that **fewer notifications improve long-term satisfaction**. Sending all three alerts to every user causes notification fatigue. Instead:
- Default: Send 3-day warning only
- Allow users to opt into 7-day and 1-day alerts
- A Facebook study showed that reducing notification volume led to higher long-term engagement that "gradually recovered and even turned out to be a gain"

### US-04: Receipt Detail & Actions
> As a user, I want to view and manage individual receipts.

**Acceptance Criteria:**
- [ ] Detail view shows all extracted fields
- [ ] User can edit any field if AI made a mistake
- [ ] User can mark receipt as "Returned", "Kept", or "Expired"
- [ ] User can delete a receipt permanently
- [ ] User can add a manual note

### US-05: Auth & Account
> As a user, I want to sign up and log in securely.

**Acceptance Criteria:**
- [ ] Sign up with email + password or Google OAuth
- [ ] Unique forwarding address generated on signup
- [ ] Address format: `{user-id}@receiptguard.app` (or Gmail MVP equivalent)
- [ ] User can view/copy their forwarding address anytime

**UX Rationale:** From Figma's signup research (Candu, 2025): "Minimize the number of fields to reduce friction. Offer social login." Every additional form field reduces conversion by ~10%. We ask for email + password ONLY. No name, no phone, no "what industry are you in?"

---

## 6. Onboarding Flow (Research-Backed)

### The 5-Stage Onboarding Model (Candu, 2025)

```
Stage 1: Sign-Up (30 seconds)
├── Email + password OR Google OAuth
├── No additional fields
└── Immediate dashboard redirect (no "verify email first")

Stage 2: First Impression (First 10 seconds)
├── Dashboard loads with empty state
├── Empty state shows: "Your unique address: [copy button]"
└── One-sentence explanation: "Forward any order email to this address"

Stage 3: Activation (First 5 minutes)
├── User forwards first email
├── Processing state shown immediately (<100ms)
├── Receipt appears in dashboard within 60 seconds
└── Toast notification: "Nike receipt added!"

Stage 4: Early Win (First interaction)
├── User sees their first receipt card
├── Card shows days remaining + urgency color
└── User mentally validates: "Yes, this is useful"

Stage 5: Habit Formation (Days 2-7)
├── Daily check becomes effortless
├── Notifications arrive at helpful times
└── User adds second, third receipt naturally
```

### Empty State as Onboarding

The empty state IS the onboarding. Research (Eleken, 2025) shows empty states are conversion opportunities, not dead ends.

**Current empty state:**
```
No receipts yet
Forward an order email to your unique address
[user-123@guard.app] [Copy]
```

**Research-backed improvement:**
```
Welcome to Receipt Guardian

Forward any order email to:
[user-123@guard.app] [Copy]

We'll extract the item, price, and return deadline automatically.

[See how it works]
```

**Why this works:**
1. Headline acknowledges the user ("Welcome")
2. Action is immediately available (copy address)
3. Benefit is stated, not assumed ("extract automatically")
4. Optional learn-more for the curious (progressive disclosure)

---

## 7. Out of Scope (MVP)

- Photo receipt scanning (camera/OCR)
- Subscription tracking
- Warranty claim auto-generation
- Mobile native app
- Browser extension
- Multiple notification channels (SMS, push)
- Team/family sharing
- Export to CSV/PDF
- Store policy auto-lookup
- AI chat assistant
- Receipt categorization/budgeting

**Rationale for scope cuts:** Based on the "one core action" principle from Linear's design philosophy: every feature must serve the single goal of "never miss a return window." Budgeting, chat, and categorization are feature creep that dilutes the product's identity.

---

## 8. Success Metrics

| Metric | Target | Research Basis |
|--------|--------|----------------|
| Signups (Month 1) | 50 beta users | Rule of thumb: 40 users gives statistically meaningful retention data |
| Email forward rate | >60% of active users forward within 3 days | Candu (2025): Activation must happen within 72 hours or user is lost |
| Retention (Week 2) | >40% of users still forwarding emails | Industry benchmark for SaaS. Below 30% = product-market fit problem |
| AI extraction accuracy | >85% correct on store, item, price, date | Below 80% = too much manual correction, users abandon |
| Manual correction rate | <15% of receipts need editing | Above 20% = AI is not saving enough time |
| Time to first receipt | <5 minutes from signup | Figma research: first action within 5 min = 3x retention |
| NPS score (Month 2) | >30 | Validated product direction |

---

## 9. Monetization (Future)

| Tier | Price | Limits | Target Segment |
|------|-------|--------|----------------|
| **Free** | $0 | 30 receipts/month, email only, 3-day alerts only | Casual shoppers, validation users |
| **Pro** | $4/mo | Unlimited receipts, photo scan, all alert timings, priority AI | Frequent shoppers, gadget enthusiasts |
| **Family** | $8/mo | Pro + up to 4 members, shared dashboard | Households, gift buyers |

**Pricing psychology:** The $4 price point is below the "coffee threshold" — users don't think hard about it. It's also 50% cheaper than Readwise ($8/mo) and 75% cheaper than Expensify ($15+/mo), creating a clear value perception.

---

## 10. Research References

1. **SaaS Onboarding Best Practices** — Candu (2025): 5-stage model, friction reduction, activation milestones
2. **Notification UX** — Smashing Magazine (2025): Severity levels, frequency control, Facebook case study
3. **Smart Dashboard Design** — F1Studioz (2026): F-pattern layout, progressive disclosure, traffic light colors
4. **Empty State UX** — Eleken (2025): Conversion-focused design, "What now?" principle
5. **Dark Mode Design** — Graphic Eagle (2025): Contrast, OLED optimization, accessibility
6. **Micro-interactions** — BlazeDream / UX Collective (2025): Motion increases CTR by 12%, task completion by 15%
7. **Linear Design Breakdown** — 925Studios (2026): Discipline, hierarchy, modular systems
8. **ProductLed Onboarding** — ProductLed (2025): 75% abandonment stat, quick win psychology
