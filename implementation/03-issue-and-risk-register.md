# Receipt Guardian — Issue and Risk Register

## Confirmed issues fixed in this pass

| Severity | Area | Issue | Status |
|---|---|---|---|
| High | AI extraction | `/api/extract` was public and could be abused for AI calls. | Fixed |
| High | Test extraction page | `/test-extraction` exposed AI testing UI without requiring login. | Fixed |
| High | Gmail import | Any authenticated user could trigger processing of all unread shared inbox messages. | Fixed by scoping Gmail search to current user's email |
| High | Cron | Production deadline cron was public if `CRON_SECRET` was missing. | Fixed for production |
| Medium | Receipt list | Negative, invalid, or huge pagination values could create bad Supabase ranges. | Fixed |
| Medium | Receipt delete | Delete returned success even if the receipt did not exist or did not belong to the user. | Fixed |
| Medium | Price validation | Empty price could be coerced to `0` instead of `null`. | Fixed |

## Remaining risks to prioritize

### High priority

- **No rate limiting:** authenticated and auth endpoints can still be abused. Add rate limits before public beta.
- **No E2E coverage:** critical flows depend on manual QA. Add Playwright or equivalent smoke tests.
- **Gmail shared inbox model:** shared Gmail works for MVP but is fragile for scale and privacy perception.
- **AI cost/abuse exposure:** even authenticated extraction can be abused without quotas or rate limits.
- **Raw email retention:** `raw_email_text` is stored for successful Gmail imports. Define retention and deletion rules.

### Medium priority

- **Dashboard fetches all receipts:** dashboard page uses `.select("*")` with no pagination. This is okay for MVP but will slow down with history.
- **Status vs computed expiry:** a receipt can remain `active` after return deadline passes unless user or automation changes it.
- **Gmail processing transparency:** users do not see why imports were skipped, duplicated, or marked needs-review.
- **Low-confidence extraction UX:** current behavior warns but does not persist review tasks.
- **Delete confirmation:** destructive delete has no confirmation dialog.
- **Currency formatting:** `Intl.NumberFormat` can throw for invalid currency codes if bad data enters the database.
- **Build warning:** production build emits a Node `punycode` deprecation warning from dependencies.

### Lower priority

- **Docs drift:** testing docs mention some scripts and endpoint versions that do not currently exist.
- **Homepage polish:** current landing page communicates value but feels basic.
- **Dashboard information architecture:** all actions are visible at once, making receipt cards feel busy.
- **Empty states:** current empty state is functional but not premium or guided enough.
- **Monitoring:** no Sentry or structured trace IDs are currently wired.

## Possible issues that may arise later

- **Supabase RLS misconfiguration:** if SQL is not run exactly, users may fail to create profiles/receipts or could see wrong data.
- **Email confirmation behavior:** Supabase settings may require confirmation, causing signup to not immediately reach dashboard.
- **Gmail search syntax edge cases:** unusual email addresses may not match the Gmail query exactly.
- **Provider outages:** Gemini or Groq rate limits could increase needs-review rates.
- **Resend restrictions:** free Resend accounts may restrict recipients or sender domains.
- **Timezone edge cases:** deadlines near midnight can appear one day off for some locales.
- **Large email bodies:** long HTML-heavy emails may reduce extraction quality or increase latency.
- **Duplicate detection gaps:** duplicate protection is based on Gmail message ID, not semantic duplicate receipts.
- **Concurrent imports:** simultaneous Gmail checks could race on unread messages and duplicate logs if Gmail/API timing overlaps.
- **Mobile form fatigue:** manual receipt form may feel long on small screens without a redesigned progressive flow.
- **Accessibility regressions:** premium visuals can reduce contrast if not tested carefully.

## Risk mitigation roadmap

1. **Add rate limits and usage quotas:** protect AI extraction, Gmail import, receipt CRUD, signup, and login.
2. **Add E2E smoke tests:** signup/login, create receipt, edit, delete, search, logout, and unauthorized checks.
3. **Add import activity UI:** show Gmail import results and review states.
4. **Add review queue:** persist low-confidence extractions for user correction.
5. **Add retention policy:** purge or redact raw email text after a defined period.
6. **Add monitoring:** trace IDs, structured logs, and optional Sentry.
7. **Improve dashboard scalability:** server pagination, column selection, filters, and indexes.

## Manual decision needed

- **Gmail MVP model:** decide whether to keep shared Gmail for beta or move toward per-user OAuth/import.
- **Data retention:** decide how long raw email bodies should be kept.
- **AI quota:** decide per-user daily extraction limits.
- **Premium redesign scope:** decide whether to redesign only UI styling or also improve data states and flows.
