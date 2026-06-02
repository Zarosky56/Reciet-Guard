import Link from "next/link";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-content place-items-center px-6 py-12">
      <section className="grid max-w-md gap-5 text-center">
        <div className="mx-auto text-accent">
          <BrandMark size="lg" aria-label="Receipt Guardian" />
        </div>
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            You are offline
          </h1>
          <p className="text-sm leading-6 text-text-secondary">
            Receipt Guardian needs a connection to sync receipts, reminders, and
            attachments. Reconnect and reopen the dashboard.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Try dashboard again</Link>
        </Button>
      </section>
    </main>
  );
}
