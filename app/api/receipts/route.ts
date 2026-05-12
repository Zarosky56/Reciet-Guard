import { NextResponse } from "next/server";

import { apiError } from "@/lib/api/errors";
import { requireApiUser } from "@/lib/auth/api";
import { mapReceipt, mapReceipts } from "@/lib/receipts/mapper";
import { receiptCreateSchema } from "@/lib/receipts/schema";

export async function GET(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status")?.trim();
  const requestedLimit = Number(searchParams.get("limit") ?? 100);
  const requestedOffset = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 100)
    : 100;
  const offset = Number.isFinite(requestedOffset)
    ? Math.max(Math.trunc(requestedOffset), 0)
    : 0;

  let query = supabase
    .from("receipts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .range(offset, offset + limit - 1);

  if (status && ["active", "returned", "kept", "expired"].includes(status)) {
    query = query.eq("status", status);
  }

  if (search) {
    const safeSearch = search.replaceAll("%", "").replaceAll(",", " ");
    query = query.or(
      `store_name.ilike.%${safeSearch}%,item_name.ilike.%${safeSearch}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError("DATABASE_ERROR", "Could not load receipts.", 500);
  }

  const receipts = mapReceipts(data);

  return NextResponse.json({
    receipts,
    total: count ?? receipts.length,
  });
}

export async function POST(request: Request) {
  const { supabase, user, response } = await requireApiUser();
  if (response) {
    return response;
  }

  const body = await request.json().catch(() => null);
  const parsed = receiptCreateSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid receipt.",
      400,
    );
  }

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      ...parsed.data,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error || !data) {
    return apiError("DATABASE_ERROR", "Could not create receipt.", 500);
  }

  return NextResponse.json({ receipt: mapReceipt(data) }, { status: 201 });
}
