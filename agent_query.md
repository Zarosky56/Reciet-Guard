# AI Agent Instruction Manual: Overhaul & Performance Tuning

This document contains step-by-step instructions and technical specs for an AI coding agent to implement UI enhancements, real-time database synchronization, camera latency optimizations, Google Cloud resource allocation, and ingestion email routing.

---

## 📋 Execution Checklist

### 🟩 Query 1: Return & Warranty Deadline Overhaul
- [ ] **visual separation**: Update the form fields inside the editor panel of [receipt-dashboard.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-dashboard.tsx#L1239-L1475).
  - Add subtitle headers and descriptive helper texts separating **Refund Policy** from **Manufacturer Warranty**.
- [ ] **preset selector buttons**: Replace the raw date input boxes with horizontal button chips:
  - Return Window: `None` | `14 Days` | `30 Days` (Default) | `90 Days` | `Custom`
  - Warranty: `Unsure` | `None` | `1 Year` | `2 Years` | `Custom`
- [ ] **date math calculation**:
  - Implement a state handler so clicking a preset parses the `purchase_date` field (defaulting to current date if empty), calculates the target date (`addDays` or `addYears` from `date-fns`), and updates the form state.
  - Hide the HTML input type="date" elements unless the user clicks the `Custom` chip. Display the computed date as static text (e.g., *"Coverage until June 1, 2027"*).
- [ ] **auto-fetch warning states**:
  - In [receipt-card.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-card.tsx#L225-L250), check if `receipt.status === "active"` and `receipt.return_deadline` is `null`.
  - Replace the text `"Closed"` with a warning chip: `⚠️ Set Return Window`.
  - Wire a click callback to this badge so it opens the [ReceiptEditorSheet](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-dashboard.tsx#L1239-L1475) for this receipt and highlights the missing fields.

### 🟩 Query 2: Realtime Database Synchronization (Auto-Refresh)
- [ ] **Supabase Realtime Channel**:
  - In [receipt-dashboard.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-dashboard.tsx), initialize a client-side Supabase subscription inside a `useEffect` listening to postgres changes on the `receipts` table.
  - When an event occurs, trigger a quick fetch to `/api/receipts` and update local state via `setReceipts(json.receipts)`.
  ```typescript
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("receipts-realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "receipts" },
        async () => {
          const res = await fetch("/api/receipts");
          const json = await res.json().catch(() => null);
          if (res.ok && Array.isArray(json?.receipts)) {
            setReceipts(json.receipts);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  ```

### 🟩 Query 3: Instantly Open Camera Stream
- [ ] **intercept bottom-nav clicks**:
  - In [mobile-bottom-nav.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/dashboard/mobile-bottom-nav.tsx#L96-L120), intercept clicks on the "Scan" Link if the user is already on `/dashboard`.
  - Call `e.preventDefault()`, push/replace parameters in browser history silently, and dispatch a custom window event:
    ```typescript
    window.dispatchEvent(new CustomEvent("open-scanner-sheet", { detail: "camera" }));
    ```
- [ ] **handle scanner event**:
  - In [receipt-dashboard.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-dashboard.tsx), add an event listener for `"open-scanner-sheet"` to invoke `openCaptureSheet("camera")` instantly.
- [ ] **auto-start stream**:
  - In [photo-capture.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/photo-capture.tsx#L168-L221), invoke `requestCamera()` automatically inside a mounting `useEffect` instead of loading the component in the `Idle` screen.

### 🟩 Query 4: Show Loader During Camera Processing
- [ ] **declare isProcessing state**:
  - Add `const [isProcessing, setIsProcessing] = useState(false);` inside [receipt-capture-sheet.tsx](file:///d:/coding/crazy%20idea/Miro_pdf/components/receipts/receipt-capture-sheet.tsx).
  - Toggle `isProcessing(true)` inside the photo capture callback prior to initiating the API network call, and set it to `false` in the `finally` block.
- [ ] **render processing screen**:
  - If `isProcessing` is true, render a centered processing card containing the `<Loader size="md" label="Scanning receipt details..." />` component and subtext. Keep the sheet open until processing terminates.

### 🟩 Query 5: Premium Tier Google Cloud & Gen AI Resource Allocation
- [ ] **dual-path API routing**:
  - In [route.ts](file:///d:/coding/crazy%20idea/Miro_pdf/app/api/extract/route.ts) and [extract-receipt.ts](file:///d:/coding/crazy%20idea/Miro_pdf/lib/ai/extract-receipt.ts), extract the user's subscription tier.
  - Route **Free Users** to the **Google AI Studio Free Tier API** (using `Gemini 2.0 Flash` to stay within free-quota limits).
  - Route **Premium Users** to **Vertex AI (Google Cloud GCP)**, which bills against your `$1000 Gen AI credits` for faster throughput and enterprise-grade privacy.
- [ ] **premium Document AI expense parser**:
  - Wire the **Google Cloud Document AI Expense Parser** in [document-ai.ts](file:///d:/coding/crazy%20idea/Miro_pdf/lib/ai/providers/document-ai.ts).
  - Limit Document AI execution to premium accounts only, billing scans to your `$300 GCP Trial credits`. Free-tier uploads fallback to standard AI Studio multimodal prompts.
- [ ] **backup automation**:
  - Script a serverless trigger on GCP Cloud Run/Functions to run a daily pg_dump on your database and store it in a secure Google Cloud Storage bucket, billed to GCP credits.

### 🟩 Query 6: Secure Ingestion Routing & Custom Forwarding Addresses
- [ ] **generate profile tokens**:
  - Add a unique 8-character token to the `profiles` table.
  - Modify signup triggers to populate this token randomly. Set the user forwarding display to `receiptguardbeta+TOKEN@gmail.com`.
- [ ] **robust header ingestion parsing**:
  - Modify [process-email.ts](file:///d:/coding/crazy%20idea/Miro_pdf/lib/email/process-email.ts) to search across all delivery headers (`To`, `Delivered-To`, `X-Original-To`, `Bcc`) to parse the token and match the user.
- [ ] **Cloudflare edge worker filtration**:
  - On catch-all routing (`*@receiptguard.app`), run a Cloudflare Worker checking Cloudflare KV storage for valid active tokens. Discard invalid mail at the Edge before hitting your Next.js webhook.
- [ ] **attachment size handling**:
  - In the Cloudflare Worker, if attachments exceed 3 MB, bypass Vercel limits by uploading files directly to a **Supabase Storage Bucket** from the Worker and forwarding only the bucket links to the Next.js API.

---

## 🗄️ Database Migrations (Supabase SQL)

Run this migration script to support unique token mapping:

```sql
-- Add token field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inbox_token VARCHAR(8) UNIQUE;

-- Create helper function to generate random 8-character alphanumeric string
CREATE OR REPLACE FUNCTION generate_inbox_token() 
RETURNS VARCHAR(8) AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result VARCHAR(8) := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Populate existing null profiles with tokens
UPDATE public.profiles 
SET inbox_token = generate_inbox_token() 
WHERE inbox_token IS NULL;

-- Make inbox_token NOT NULL for future entries
ALTER TABLE public.profiles 
ALTER COLUMN inbox_token SET NOT NULL;
```

---

## ⚙️ Required Environment Variables

Add the following environment variables to your `.env.local` and Vercel Deployment configuration:

```env
# Supabase Database & Realtime
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Cloud & Gen AI Credentials (Paid/Vertex Tier)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type": "service_account", ...}
VERTEX_AI_PROJECT_ID=your_gcp_project_id

# Ingestion Verification Token
GOOGLE_PUBSUB_VERIFICATION_TOKEN=your_random_verification_hash
CLOUDFLARE_KV_API_TOKEN=your_cloudflare_token
```
