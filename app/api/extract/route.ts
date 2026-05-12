import { NextResponse } from "next/server";
import { z } from "zod";

import { extractReceiptFromEmail } from "@/lib/ai/extract-receipt";
import { requireApiUser } from "@/lib/auth/api";

const extractRequestSchema = z.object({
  emailText: z.string().trim().min(20, "Paste at least 20 characters."),
});

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = extractRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message ?? "Invalid request.",
          status: 400,
        },
      },
      { status: 400 },
    );
  }

  const result = await extractReceiptFromEmail(parsed.data.emailText);
  return NextResponse.json(result, {
    status: result.status === "success" ? 200 : 422,
  });
}
