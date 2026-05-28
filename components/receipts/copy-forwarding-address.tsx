"use client";

import { Check, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Premium UI Redesign — `<CopyForwardingAddress>` (task 8.4).
 *
 * Inline, copyable intake-address chip used by the dashboard hero and
 * empty state. The redesign retokenizes the surface:
 *
 *   - container: `bg-surface border border-border rounded-md`, no
 *     `shadow-inner-hair`, no `bg-bg-elevated`, no glow;
 *   - icon plate: `bg-canvas border border-border` with the accent
 *     foreground; no decorative tile per Requirement 7.4;
 *   - copy button: redesigned `<Button variant="primary">` resting,
 *     swaps to `secondary` once copied (matches the "Copy → Copied"
 *     feedback pattern documented in `COMPONENT_PATTERNS.md` §8).
 *
 * Click semantics are preserved verbatim:
 *   - calls `navigator.clipboard.writeText(address)` on click,
 *   - flips an inline `copied` state to render the check icon and
 *     "Copied" label for 2 seconds,
 *   - emits `toast.error("Forwarding address could not be copied.")`
 *     on clipboard failure.
 *
 * Implements: Requirements 6.4, 8.8, 11.7, 13.5.
 */

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
    <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 transition-colors duration-default ease-standard hover:border-border-strong sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-border bg-canvas text-accent"
        >
          <Mail className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Intake address
          </p>
          <p
            data-testid="forwarding-address"
            className="truncate font-mono text-sm text-text-primary"
          >
            {address}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={copied ? "secondary" : "primary"}
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
