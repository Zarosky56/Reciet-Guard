"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface CopyForwardingAddressProps {
  address: string;
}

export function CopyForwardingAddress({ address }: CopyForwardingAddressProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const canCopy = address !== "Not configured";

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function copyAddress() {
    if (!canCopy) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Forwarding address could not be copied.");
    }
  }

  return (
    <div className="group/copy flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-3.5 shadow-inner-hair transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-action shadow-inner-hair"
        >
          <Mail className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-text-muted">
            Intake address
          </p>
          <p
            data-testid="forwarding-address"
            className="truncate font-mono text-[13px] text-text-primary"
          >
            {address}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={copied ? "secondary" : "default"}
        size="sm"
        onClick={copyAddress}
        disabled={!canCopy}
        data-testid="copy-address"
        className="shrink-0"
      >
        {copied ? (
          <Check data-icon className="text-success" aria-hidden="true" />
        ) : (
          <Copy data-icon aria-hidden="true" />
        )}
        {canCopy ? (copied ? "Copied" : "Copy") : "Unavailable"}
      </Button>
    </div>
  );
}
