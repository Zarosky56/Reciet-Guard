# User Setup Guide — What You Must Do Before the Agent Codes

> This guide is for **you**, not the coding agent.
>
> It explains what accounts, API keys, secrets, dashboards, and setup actions you must prepare so the agent can build Receipt Guardian without getting blocked.
>
> **Important:** This project must stay **$0**. If any website asks you to upgrade, pay, add a card, or buy a domain, stop and tell the agent.

---

## 1. Your Main Job

You do **not** need to code.

Your job is to prepare:

- Free service accounts
- API keys
- Environment variables
- Supabase database project
- Gmail inbox for receiving forwarded receipts
- Google Cloud setup for Gmail API now, and optional Pub/Sub later
- Resend account for notification emails
- Vercel account for deployment

After that, the agent can code using the documentation.

---

## 2. Accounts You Need

Create or confirm you have these accounts:

| Account | Website | Required? | Cost |
|---------|---------|-----------|------|
| GitHub | https://github.com | Yes | $0 |
| Vercel | https://vercel.com | Yes | $0 Hobby plan |
| Supabase | https://supabase.com | Yes | $0 Free plan |
| Google account | https://accounts.google.com | Yes | $0 |
| Google AI Studio | https://aistudio.google.com | Yes | $0 free Gemini key |
| Groq | https://console.groq.com | Yes | $0 free key |
| Resend | https://resend.com | Yes | $0 free tier |
| Sentry | https://sentry.io | Optional | $0 free tier |

**Do not buy a domain yet.** Domain is post-MVP only.

---

## 3. Create the Shared Gmail Inbox

The MVP uses one shared Gmail inbox for all forwarded receipts.

### What to do

1. Go to https://accounts.google.com/signup
2. Create a Gmail account for the project.
3. Suggested email:
   - `receiptguardbeta@gmail.com`
   - or any similar free Gmail address
4. Save the email and password somewhere safe.
5. Enable 2FA if Google asks.

### What to give the agent

Give the agent only the Gmail address, not the password.

Example:

```txt
GMAIL_USER_EMAIL=receiptguardbeta@gmail.com
```

The agent may later ask you to run an OAuth flow to generate a refresh token.

---

## 4. Get Google Gemini API Key

Gemini is the primary free AI extraction provider.

### Where to get it

Go to:

https://aistudio.google.com/apikey

### What to do

1. Sign in with your Google account.
2. Click **Create API Key**.
3. Choose an existing Google Cloud project or create a new one.
4. Copy the API key.
5. Save it privately.

### What to put in `.env.local`

```env
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### Free-tier rule

Gemini has a free tier. If Google asks you to upgrade or pay, stop and tell the agent.

---

## 5. Get Groq API Key

Groq is the free fallback AI provider if Gemini fails or rate limits.

### Where to get it

Go to:

https://console.groq.com/keys

### What to do

1. Sign up or log in.
2. Open **API Keys**.
3. Click **Create API Key**.
4. Copy the key.
5. Save it privately.

### What to put in `.env.local`

```env
GROQ_API_KEY=your_groq_api_key_here
```

---

## 6. Create Supabase Project

Supabase handles database, auth, and Row Level Security.

### Where to go

https://supabase.com/dashboard

### What to do

1. Click **New Project**.
2. Choose the free plan.
3. Project name suggestion:
   - `receipt-guardian`
4. Create a strong database password.
5. Save the database password privately.
6. Choose the nearest free region.
7. Wait for the project to finish creating.

### Get Supabase Keys

In Supabase dashboard:

1. Go to **Project Settings**.
2. Go to **API**.
3. Copy:
   - Project URL
   - anon public key
   - service role key

### What to put in `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Important security rule

The service role key is private.

- Do not paste it in public chat.
- Do not commit it to GitHub.
- Only put it in `.env.local` and Vercel environment variables.

---

## 7. Run Supabase Database SQL

Your job is to run the basic initialization SQL in Supabase before implementation starts.

### Where to run SQL

1. Open Supabase dashboard.
2. Select your project.
3. Go to **SQL Editor**.
4. Click **New query**.
5. Paste the SQL from `docs/01-data-model-and-api.md` section **1.1 Basic Supabase Initialization SQL**.
6. Click **Run**.

### What you must confirm

After running the SQL:

- Tables were created successfully.
- RLS is enabled.
- No red error message appears.

### If an error appears

Copy the full error and send it to the agent.

Do not try to randomly change SQL yourself.

### Basic SQL location

The latest approved database schema is stored here:

```txt
docs/01-data-model-and-api.md
```

Look for:

```txt
## 1.1 Basic Supabase Initialization SQL
```

---

## 8. Enable Supabase Auth Providers

### Email/password auth

In Supabase dashboard:

1. Go to **Authentication**.
2. Go to **Providers**.
3. Make sure **Email** is enabled.

### Google OAuth auth

Google login is useful but can be added after basic email/password auth.

If the agent asks for Google OAuth setup, you will need:

- Google OAuth Client ID
- Google OAuth Client Secret

Do not worry about this until the agent asks.

---

## 9. Set Up Gmail API

The Gmail API lets the app read forwarded order emails from the shared Gmail inbox.

### Where to go

Google Cloud Console:

https://console.cloud.google.com

### What to do

1. Create a new Google Cloud project.
2. Project name suggestion:
   - `receipt-guardian-gmail`
3. Go to **APIs & Services**.
4. Click **Enable APIs and Services**.
5. Search for **Gmail API**.
6. Click **Enable**.

---

## 10. Configure Google OAuth Consent Screen for Gmail API

### Where to go

In Google Cloud Console:

1. Go to **APIs & Services**.
2. Go to **OAuth consent screen**.

### What to do

1. Choose **External** if available.
2. App name:
   - `Receipt Guardian`
3. User support email:
   - your email
4. Developer contact email:
   - your email
5. Save and continue.
6. Add test user:
   - the same Gmail account you are using for the shared inbox.

### Important

Keep the app in testing mode for MVP.

Do not submit for Google verification unless the agent says it is needed later.

---

## 11. Create Gmail OAuth Credentials

### Where to go

Google Cloud Console:

1. Go to **APIs & Services**.
2. Go to **Credentials**.
3. Click **Create Credentials**.
4. Choose **OAuth client ID**.

### What to choose

For the MVP token generation script, choose:

```txt
Application type: Desktop app
Name: Receipt Guardian Gmail Reader
```

### What to download

Download the JSON credentials file.

It usually contains:

- client ID
- client secret

### What to give the agent

Do not paste the full JSON into chat unless the agent specifically asks.

You will need these values in `.env.local`:

```env
GMAIL_CLIENT_ID=your_google_oauth_client_id
GMAIL_CLIENT_SECRET=your_google_oauth_client_secret
GMAIL_REFRESH_TOKEN=generated_later_by_oauth_script
GMAIL_USER_EMAIL=receiptguardbeta@gmail.com
```

### About `GMAIL_REFRESH_TOKEN`

The refresh token is generated by running an OAuth authorization flow.

The agent will create the script or command for this.

Your job will be:

1. Run the command the agent provides.
2. Open the Google auth link.
3. Sign in with the shared Gmail account.
4. Approve access.
5. Copy the generated refresh token.
6. Put it in `.env.local`.

---

## 12. Later: Optional Google Pub/Sub for Gmail Push

Pub/Sub is the best automation alternative to frequent Vercel cron.

### Why this is optional

This project must stay $0.

Google Pub/Sub has a free tier, but Google Cloud may ask some accounts for billing setup.

For now, do **not** set up Pub/Sub. The current MVP should use the manual **Check Inbox Now** Gmail flow. Keep this section for later when you want automatic Gmail push ingestion.

If Google asks for billing and you do not want to add billing, stop. The app can still work with manual **Check Inbox Now**.

### Where to go

https://console.cloud.google.com/cloudpubsub

### What you may need to do

Only do this later if the agent asks you to turn on automated Pub/Sub ingestion:

1. Create a Pub/Sub topic.
2. Suggested topic name:
   - `gmail-receipt-notifications`
3. Create a push subscription.
4. The push URL will be provided by the agent after deployment.
5. Give Gmail permission to publish to the topic.
6. Register Gmail watch.

### What to put in `.env.local`

Later, the agent may ask for:

```env
GOOGLE_PUBSUB_VERIFICATION_TOKEN=some_random_secret
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GMAIL_PUBSUB_TOPIC=projects/your_project_id/topics/gmail-receipt-notifications
```

### Important

Do not continue if Pub/Sub requires paid upgrade.

Tell the agent:

```txt
Pub/Sub asked for billing. Use manual Gmail check fallback for now.
```

---

## 13. Get Resend API Key

Resend sends deadline warning emails.

### Where to go

https://resend.com/api-keys

### What to do

1. Create a free Resend account.
2. Go to **API Keys**.
3. Click **Create API Key**.
4. Copy the key.

### What to put in `.env.local`

```env
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=onboarding@resend.dev
```

### Important free-tier note

Without a custom domain, Resend usually allows test/development sending from a default Resend email.

Do not buy a domain for MVP.

If Resend blocks production sending without a domain, tell the agent. The agent can keep notifications in test mode or use a free fallback during beta.

---

## 14. Optional: Sentry Error Tracking

Sentry is optional.

### Where to go

https://sentry.io

### What to do

1. Create a free account.
2. Create a Next.js project.
3. Copy the DSN.

### What to put in `.env.local`

```env
SENTRY_DSN=your_sentry_dsn
```

If you do not want Sentry now, skip it.

---

## 15. Create Vercel Account and Project

Vercel hosts the app for free.

### Where to go

https://vercel.com

### What to do

1. Sign up using GitHub.
2. Stay on the **Hobby** plan.
3. Do not upgrade to Pro.
4. After the agent pushes the code to GitHub, import the repository into Vercel.
5. Add environment variables in Vercel.

### GitHub and Vercel order

Use this exact GitHub repository:

```txt
https://github.com/Zarosky56/Reciet-Guard
```

Use this order:

1. Use the existing repository above.
2. Push the project code to that repository.
3. Import that same repository into Vercel.
4. Add all `.env.local` values into Vercel Environment Variables.
5. Deploy the app.
6. Only after deployment, use the Vercel production URL for services that need a backend URL.

Do not create another repository unless you are intentionally starting over.

### Pub/Sub backend URL

Google Pub/Sub asks for a backend URL because it needs a deployed HTTPS webhook endpoint.

You will not have this URL until Vercel deploys the app.

For now:

- Skip Pub/Sub.
- Use manual **Check Inbox Now**.
- Come back to Pub/Sub after Vercel gives you a production URL.

Later, the Pub/Sub push endpoint will look like:

```txt
https://your-vercel-app.vercel.app/api/webhooks/gmail
```

### Where to add env vars in Vercel

1. Open your Vercel project.
2. Go to **Settings**.
3. Go to **Environment Variables**.
4. Add each key from `.env.local`.
5. Make sure they are available for Production, Preview, and Development unless the agent says otherwise.

---

## 16. Environment Variable Checklist

Create `.env.local` in the project root.

The agent may create `.env.example`. You must fill `.env.local` yourself.

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers
GOOGLE_AI_API_KEY=
GROQ_API_KEY=

# Gmail API
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GMAIL_USER_EMAIL=receiptguardbeta@gmail.com

# Optional Google Pub/Sub
GOOGLE_CLOUD_PROJECT_ID=
GMAIL_PUBSUB_TOPIC=
GOOGLE_PUBSUB_VERIFICATION_TOKEN=

# Notifications
RESEND_API_KEY=
FROM_EMAIL=onboarding@resend.dev

# App
APP_URL=http://localhost:3000
WEBHOOK_SECRET=make_a_long_random_secret_here

# Optional Monitoring
SENTRY_DSN=
```

### How to create random secrets

You can ask the agent to generate safe random strings, or use any password manager.

Secrets that should be random:

```env
WEBHOOK_SECRET=
GOOGLE_PUBSUB_VERIFICATION_TOKEN=
```

---

## 17. What You Must Never Share Publicly

Do not share these in screenshots, GitHub, public chat, Discord, Reddit, or README files:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_AI_API_KEY`
- `GROQ_API_KEY`
- `GMAIL_CLIENT_SECRET`
- `GMAIL_REFRESH_TOKEN`
- `RESEND_API_KEY`
- `WEBHOOK_SECRET`
- `GOOGLE_PUBSUB_VERIFICATION_TOKEN`

If you accidentally expose a key, revoke it immediately and create a new one.

---

## 18. What to Give the Agent Before Coding

Give the agent this information:

```txt
I have created:
- Supabase project: yes/no
- Vercel account: yes/no
- Google AI Studio key: yes/no
- Groq key: yes/no
- Shared Gmail inbox: yes/no
- Gmail API enabled: yes/no
- Gmail OAuth credentials: yes/no
- Gmail refresh token generated: yes/no
- Resend API key: yes/no
- Pub/Sub setup: skip for now / later only
```

Do **not** paste actual secrets unless the agent specifically needs you to put them in `.env.local`.

Usually, you should put secrets directly into `.env.local` yourself.

---

## 19. What to Do When the Agent Asks You to Test

The agent may ask you to test things manually.

### Local app test

You may need to open:

```txt
http://localhost:3000
```

### Supabase test

You may need to check:

- Tables exist
- Users are created
- Receipts are inserted
- RLS policies exist

### Gmail test

You may need to:

1. Sign up in the app using your email.
2. Forward an order email to the shared Gmail inbox.
3. Click **Check Inbox Now** in the app.
4. Confirm the receipt appears.

### Notification test

You may need to:

1. Create a test receipt with deadline 3 days from today.
2. Ask the agent to trigger the deadline check route.
3. Confirm an email arrives.

---

## 20. If Something Asks for Money

If any service asks for payment, do this:

1. Stop.
2. Take note of which service asked for money.
3. Tell the agent exactly what happened.
4. Do not upgrade.
5. Do not add a credit card unless you personally decide to later.

Use this message:

```txt
This service asked for payment or billing: [service name]. Please use the $0 fallback.
```

---

## 21. MVP Setup Order for You

Follow this order:

1. Create GitHub account.
2. Create Vercel account on Hobby plan.
3. Create Supabase free project.
4. Get Supabase URL and keys.
5. Get Gemini API key.
6. Get Groq API key.
7. Create shared Gmail inbox.
8. Enable Gmail API in Google Cloud.
9. Create Gmail OAuth Desktop credentials.
10. Let the agent help generate Gmail refresh token.
11. Create Resend free API key.
12. Skip Pub/Sub for now.
13. Fill `.env.local`.
14. Later, copy the same env vars into Vercel.
15. Add Pub/Sub later only if you explicitly want automated email ingestion.

---

## 22. Final Pre-Coding Checklist

Before telling the agent to start coding, confirm:

- [ ] I have a GitHub account.
- [ ] I have a Vercel Hobby account.
- [ ] I have a Supabase free project.
- [ ] I copied Supabase URL and anon key.
- [ ] I copied Supabase service role key privately.
- [ ] I have a Gemini API key.
- [ ] I have a Groq API key.
- [ ] I created a shared Gmail inbox.
- [ ] I enabled Gmail API.
- [ ] I created Gmail OAuth Desktop credentials.
- [ ] I understand the refresh token will be generated later.
- [ ] I have a Resend API key.
- [ ] I understand Pub/Sub is later, not needed for the current manual MVP.
- [ ] I will not buy a domain for MVP.
- [ ] I will not upgrade any service for MVP.
- [ ] I will not commit `.env.local` to GitHub.

---

## 23. Final Reminder

Your responsibility is setup, accounts, keys, and testing.

The agent’s responsibility is coding, implementation, debugging, and documentation updates.

If a setup step is confusing, ask the agent before clicking random settings.

**Goal:** keep the MVP free, simple, and unblocked.
