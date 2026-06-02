import { NextResponse } from "next/server";
import { z } from "zod";

import { extractReceipt, extractReceiptFromEmail } from "@/lib/ai/extract-receipt";
import { requireApiUser } from "@/lib/auth/api";
import { ALLOWED_MIME_TYPES } from "@/lib/capture/types";

const extractRequestSchema = z.object({
  emailText: z.string().trim().min(20, "Paste at least 20 characters."),
});

const fallbackData = {
  store_name: null,
  item_name: null,
  price: null,
  currency: "USD",
  purchase_date: null,
  return_deadline: null,
  warranty_deadline: null,
  confidence: 0,
};

export async function POST(request: Request) {
  const { response } = await requireApiUser();
  if (response) {
    return response;
  }

  const contentType = request.headers.get("content-type") ?? "";

  // --- Multipart form-data path (capture/upload) ---
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json(
        { status: "needs_review", provider: null, data: fallbackData, error: "invalid document" },
        { status: 422 },
      );
    }

    const document = formData.get("document") as File | Blob | null;
    const mimeType = formData.get("mimeType") as string | null;

    if (
      !document ||
      !mimeType ||
      !(ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      return NextResponse.json(
        { status: "needs_review", provider: null, data: fallbackData, error: "invalid document" },
        { status: 422 },
      );
    }

    const result = await extractReceipt({
      emailText: "",
      document: {
        content: Buffer.from(await document.arrayBuffer()),
        mimeType,
      },
    });

    return NextResponse.json(result, {
      status: result.status === "success" ? 200 : 422,
    });
  }

  // --- JSON path (existing behaviour) ---
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
