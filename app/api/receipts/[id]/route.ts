import { NextResponse } from "next/server";
import { z } from "zod";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import { mapReceipt } from "@/lib/receipts/mapper";
import { receiptUpdateSchema } from "@/lib/receipts/schema";

const idSchema = z.string().uuid();

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { supabase, user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return apiError("VALIDATION_ERROR", "Invalid receipt id.", 400);
  }

  const { data, error } = await supabase
    .from("receipts")
    .select(
      "id, user_id, store_name, item_name, price, currency, purchase_date, return_deadline, warranty_deadline, ai_confidence, status, notification_sent_7d, notification_sent_3d, notification_sent_1d, created_at, updated_at",
    )
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return apiError("DATABASE_ERROR", "Could not load receipt.", 500);
  }

  if (!data) {
    return apiError("RECEIPT_NOT_FOUND", "Receipt not found.", 404);
  }

  return NextResponse.json({ receipt: mapReceipt(data) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { supabase, user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return apiError("VALIDATION_ERROR", "Invalid receipt id.", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = receiptUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid receipt.",
      400,
    );
  }

  const { data, error } = await supabase
    .from("receipts")
    .update(parsed.data)
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return apiError("DATABASE_ERROR", "Could not update receipt.", 500);
  }

  if (!data) {
    return apiError("RECEIPT_NOT_FOUND", "Receipt not found.", 404);
  }

  return NextResponse.json({ receipt: mapReceipt(data) });
}

export async function DELETE(_: Request, context: RouteContext) {
  const { supabase, user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const { id } = await context.params;
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) {
    return apiError("VALIDATION_ERROR", "Invalid receipt id.", 400);
  }

  const { data, error } = await supabase
    .from("receipts")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return apiError("DATABASE_ERROR", "Could not delete receipt.", 500);
  }

  if (!data) {
    return apiError("RECEIPT_NOT_FOUND", "Receipt not found.", 404);
  }

  return new NextResponse(null, { status: 204 });
}
