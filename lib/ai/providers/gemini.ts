import { GoogleGenerativeAI } from "@google/generative-ai";

import { buildReceiptExtractionPrompt } from "@/lib/ai/prompt";

const GEMINI_MODEL = "gemini-2.0-flash";

export async function extractWithGemini(emailText: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(buildReceiptExtractionPrompt(emailText));
  return result.response.text();
}
