import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";

interface ReceiptEmptyStateProps {
  forwardingAddress: string;
}

export function ReceiptEmptyState({ forwardingAddress }: ReceiptEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-bg text-action">
          <Inbox className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-6 text-xl font-semibold text-text-primary">
          No receipts yet
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
          Forward an order email from the same address you signed up with, or
          paste one into the extraction box above.
        </p>
        <div className="mt-6 w-full max-w-xl">
          <CopyForwardingAddress address={forwardingAddress} />
        </div>
      </CardContent>
    </Card>
  );
}
