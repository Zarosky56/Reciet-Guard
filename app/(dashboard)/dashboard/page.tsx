import { ensureProfile, requireUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReceiptDashboard } from "@/components/receipts/receipt-dashboard";
import { mapReceipts } from "@/lib/receipts/mapper";
import { attachReceiptFiles } from "@/lib/receipts/with-attachments";
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
  const receipts = await attachReceiptFiles(supabase, mapReceipts(data));

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-wide px-4 sm:px-6 md:px-8">
      <DashboardHeader email={user.email} />
      <ReceiptDashboard
        initialReceipts={receipts}
        forwardingAddress={forwardingAddress}
        userId={user.id}
        defaultCurrency={profile?.default_currency ?? "USD"}
        onboardingCompleted={profile?.onboarding_completed ?? false}
        introToAppEnabled={profile?.intro_to_app_enabled ?? false}
      />
    </main>
  );
}
