import { ReceiptText } from "lucide-react";

import { ProcessRail } from "@/components/ui/loaders";

export default function ProfileLoading() {
  return (
    <div className="fixed inset-x-0 top-16 bottom-16 z-20 flex items-center justify-center md:bottom-0">
      <div className="flex flex-col items-center gap-5 px-6">
        <span
          className="relative flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-border bg-bg-elevated text-action shadow-inner-hair"
          aria-hidden="true"
        >
          <ReceiptText className="size-6" />
          <span className="absolute left-2 right-2 h-px bg-action shadow-[0_0_10px_rgba(91,140,255,0.7)] animate-ledger-scan" />
        </span>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">
            Loading profile
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Fetching your account details
          </p>
        </div>
        <ProcessRail className="w-full max-w-[180px]" />
      </div>
    </div>
  );
}
