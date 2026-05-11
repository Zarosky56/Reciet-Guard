import Groq from "groq-sdk";

import { buildReceiptExtractionPrompt } from "@/lib/ai/prompt";

const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function extractWithGroq(emailText: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq is not configured");
  }

  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: buildReceiptExtractionPrompt(emailText),
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? "";
}
