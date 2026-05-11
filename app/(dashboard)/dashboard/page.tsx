import { ensureProfile, requireUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReceiptDashboard } from "@/components/receipts/receipt-dashboard";
import { mapReceipts } from "@/lib/receipts/mapper";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await ensureProfile(user.id);
  const forwardingAddress =
    profile?.forwarding_address ?? process.env.GMAIL_USER_EMAIL ?? "Not configured";
  const supabase = await createClient();
  const { data } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user.id);
  const receipts = mapReceipts(data);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 md:px-8">
      <DashboardHeader email={user.email} />
      <ReceiptDashboard
        initialReceipts={receipts}
        forwardingAddress={forwardingAddress}
      />
    </main>
  );
}
