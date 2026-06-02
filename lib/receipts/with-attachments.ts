import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { listReceiptAttachments } from "@/lib/receipts/attachments";
import type { ReceiptWithUrgency } from "@/types/receipt";

export async function attachReceiptFiles(
  supabase: SupabaseClient,
  receipts: ReceiptWithUrgency[],
): Promise<ReceiptWithUrgency[]> {
  return Promise.all(
    receipts.map(async (receipt) => ({
      ...receipt,
      attachments: await listReceiptAttachments(supabase, receipt.id),
    })),
  );
}
