# Receipt Guardian — Run, Visit, Dummy-Data QA Plan

## Purpose

Use this checklist to run the app locally, visit the site, enter dummy data, and verify the main product flows before considering the app beta-ready.

## Prerequisites

- **Node dependencies:** run `npm install` if `node_modules` is missing.
- **Environment:** copy `.env.example` to `.env.local` and fill local Supabase, AI, Gmail, Resend, app URL, and cron secret values.
- **Database:** run the SQL from `docs/01-data-model-and-api.md` in Supabase.
- **Auth:** ensure Supabase email/password auth is enabled.
- **Do not commit secrets:** keep `.env.local` private.

## Local run commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

Visit:

```text
http://localhost:3000
```

## Site visit checklist

### Landing page

- **Open homepage:** visit `/`.
- **Check visual quality:** confirm hero, CTA, proof cards, spacing, and mobile responsiveness.
- **CTA links:** click sign up and login buttons.
- **No console errors:** browser console should not show hydration or runtime errors.

### Signup flow

- **Open signup:** visit `/signup`.
- **Dummy email:** use `qa+user-a@example.com` if Supabase permits unverified test emails, or use a real controlled test inbox.
- **Dummy password:** use a non-production password such as `TestPass123!`.
- **Expected result:** user reaches `/dashboard` or completes Supabase email confirmation flow.

### Login flow

- **Open login:** visit `/login`.
- **Use existing dummy account:** login with the test user.
- **Expected result:** dashboard loads and shows the authenticated user's email.

### Manual receipt creation

Create these dummy receipts:

| Store | Item | Price | Currency | Purchase Date | Return Deadline | Expected Urgency |
|---|---|---:|---|---|---|---|
| Amazon | Sony WH-1000XM5 Headphones | 348.00 | USD | Today - 2 days | Today + 2 days | urgent / soon |
| Nike | Air Max Shoes | 129.99 | USD | Today - 10 days | Today + 14 days | safe |
| Apple | Magic Keyboard | 99.00 | USD | Today - 31 days | Today - 1 day | expired / red |
| IKEA | Desk Lamp | blank | USD | blank | blank | unknown deadline |

Verify:

- **Create:** receipt appears in the grid.
- **Search:** searching store and item filters correctly.
- **Edit:** edit item name, price, deadline, and status.
- **Status:** mark receipt as returned, kept, expired, and active.
- **Delete:** delete a dummy receipt and confirm it disappears.
- **At-risk value:** active receipt totals update correctly.
- **Blank price:** blank price stays unknown, not `$0`.

### AI extraction flow

Paste this dummy email into the extraction box:

```text
From: orders@example.com
Subject: Your Example Store order

Thanks for your purchase from Example Store on 2026-05-01.
Item: Trail running shoes
Total: $89.99 USD
Returns are accepted until 2026-05-31.
```

Verify:

- **Authenticated only:** logged-out users cannot call extraction.
- **Success path:** extracted fields populate the manual form when provider confidence is high.
- **Needs review:** low-confidence output shows a helpful warning.
- **Save after review:** user can edit extracted fields before saving.
- **No secret leakage:** API keys never appear in browser network responses.

### Gmail import flow

Use only a controlled test Gmail inbox.

- **Forward test email:** send or forward from the same email used for signup.
- **Click check inbox:** use `Check Inbox Now` in the dashboard.
- **Expected result:** only unread messages from the current user's email are processed.
- **Duplicate check:** click again and confirm duplicate messages are not imported twice.
- **Unknown sender:** forward from a non-user email and confirm it does not attach to another user.
- **Unread behavior:** verify processed messages are marked read only after processing.

### RLS and account isolation

- **User A:** create one receipt.
- **Logout:** sign out.
- **User B:** sign up or log in with another account.
- **Dashboard:** confirm User A's receipt is invisible.
- **API:** call User A's receipt ID as User B and expect `404`.
- **Delete:** attempt deleting User A's receipt as User B and expect `404`.

### Cron and notification check

- **Local cron without secret:** allowed only outside production.
- **Production cron:** must require `Authorization: Bearer <CRON_SECRET>`.
- **Due receipt:** create an active receipt due within 3 days.
- **Run cron:** call `/api/cron/check-deadlines` with the cron secret in production-like testing.
- **Expected result:** reminder is sent or failure is reported clearly.

## Browser/device matrix

- **Mobile:** 375px width.
- **Tablet:** 768px width.
- **Desktop:** 1440px width.
- **Keyboard:** complete receipt creation without mouse.
- **Reduced motion:** verify motion is minimized when OS reduced motion is enabled.

## Final pre-launch gate

- **Automated:** lint, typecheck, tests, build pass.
- **Manual:** dummy receipt CRUD, AI extraction, Gmail import, RLS isolation, cron check pass.
- **Security:** no public AI endpoint, no public production cron, no service-role key in client bundle.
- **UX:** dashboard clearly identifies urgent returns and money at risk.
