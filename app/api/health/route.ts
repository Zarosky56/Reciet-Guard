import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    checks: {
      supabase:
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
        Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      gemini: Boolean(process.env.GOOGLE_AI_API_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      document_ai:
        process.env.ENABLE_DOCUMENT_AI === "true" &&
        Boolean(process.env.GOOGLE_CLOUD_PROJECT_ID) &&
        Boolean(process.env.DOCUMENT_AI_PROCESSOR_ID),
      gmail:
        Boolean(process.env.GMAIL_CLIENT_ID) &&
        Boolean(process.env.GMAIL_CLIENT_SECRET) &&
        Boolean(process.env.GMAIL_REFRESH_TOKEN),
      resend: Boolean(process.env.RESEND_API_KEY),
    },
    timestamp: new Date().toISOString(),
  });
}
