"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

interface CopyForwardingAddressProps {
  address: string;
}

export function CopyForwardingAddress({ address }: CopyForwardingAddressProps) {
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Mail className="h-4 w-4 shrink-0 text-action" aria-hidden="true" />
        <span
          data-testid="forwarding-address"
          className="truncate font-mono text-sm text-text-primary"
        >
          {address}
        </span>
      </div>
      <Button
        type="button"
        variant={copied ? "secondary" : "default"}
        size="sm"
        onClick={copyAddress}
        data-testid="copy-address"
      >
        {copied ? (
          <Check className="h-4 w-4 text-success" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
