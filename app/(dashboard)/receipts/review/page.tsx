import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CapturedReceiptReview } from "@/components/receipts/captured-receipt-review";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ReceiptReviewPage() {
  const user = await requireUser();

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-wide px-4 sm:px-6 md:px-8">
      <DashboardHeader email={user.email} />
      <CapturedReceiptReview />
    </main>
  );
}
