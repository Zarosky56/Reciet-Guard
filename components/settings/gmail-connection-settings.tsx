"use client";

import { AlertTriangle, Inbox, Mail, RefreshCw, Unplug } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loaders";

interface GmailStatus {
  connected: boolean;
  gmailEmail?: string | null;
  status?: string | null;
  needsReconnect?: boolean;
  lastSyncAt?: string | null;
}

interface GmailCheckSummary {
  checked?: number;
  summary?: {
    imported?: number;
    success?: number;
    needs_review?: number;
    skipped_duplicate?: number;
    duplicate?: number;
    skipped_expired?: number;
    failed?: number;
  };
}

function summarizeCheck(result: GmailCheckSummary) {
  const summary = result.summary ?? {};
  const imported = summary.imported ?? summary.success ?? 0;
  const needsReview = summary.needs_review ?? 0;
  const duplicates = summary.skipped_duplicate ?? summary.duplicate ?? 0;
  const expired = summary.skipped_expired ?? 0;
  const failed = summary.failed ?? 0;

  return [
    `${result.checked ?? 0} checked`,
    `${imported} imported`,
    `${needsReview} review`,
    `${duplicates} duplicate`,
    `${expired} expired`,
    `${failed} failed`,
  ].join(" · ");
}

export function GmailConnectionSettings() {
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const connected = Boolean(status?.connected && !status.needsReconnect);
  const needsReconnect = Boolean(status?.needsReconnect);
  const connectHref = useMemo(() => {
    if (typeof window === "undefined") return "/api/auth/gmail/connect";
    const next = `${window.location.pathname}${window.location.search}`;
    return `/api/auth/gmail/connect?next=${encodeURIComponent(next)}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      try {
        const response = await fetch("/api/auth/gmail/status");
        const json = await response.json();
        if (!cancelled) setStatus(json);
      } catch {
        if (!cancelled) {
          setStatus({ connected: false, status: "disconnected" });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  function connectGmail() {
    window.location.assign(connectHref);
  }

  async function disconnectGmail() {
    setIsBusy(true);
    try {
      const response = await fetch("/api/auth/gmail/disconnect", {
        method: "POST",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Could not disconnect Gmail.");
      }
      setStatus({ connected: false, status: "disconnected" });
      setLastResult(null);
      toast.success("Gmail disconnected.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Disconnect failed.");
    } finally {
      setIsBusy(false);
    }
  }

  async function checkNow() {
    setIsBusy(true);
    try {
      const response = await fetch("/api/gmail/check-now", { method: "POST" });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Gmail check failed.");
      }
      const summary = summarizeCheck(json);
      setLastResult(summary);
      toast.success(`Inbox check finished: ${summary}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gmail check failed.");
    } finally {
      setIsBusy(false);
    }
  }

  if (isLoading) {
    return <Loader size="sm" label="Loading Gmail connection" />;
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {connected ? (
          <Badge variant="success">Connected</Badge>
        ) : needsReconnect ? (
          <Badge variant="warning">Reconnect needed</Badge>
        ) : (
          <Badge>Not connected</Badge>
        )}
        <span className="min-w-0 truncate text-sm text-text-secondary">
          {status?.gmailEmail ?? "No Gmail account linked"}
        </span>
      </div>

      {needsReconnect ? (
        <div className="flex gap-2 rounded-md border border-warning bg-surface px-3 py-2 text-xs leading-5 text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Gmail permission needs to be refreshed before imports can run.
        </div>
      ) : null}

      <p className="text-sm leading-6 text-text-secondary">
        Receipt Guardian asks for read-only Gmail access and scans only recent
        receipt-like messages from approved senders.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={connected ? "secondary" : "primary"}
          onClick={connectGmail}
          disabled={isBusy}
        >
          <Mail data-icon aria-hidden="true" />
          {connected ? "Reconnect Gmail" : "Connect Gmail"}
        </Button>
        {connected ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={checkNow}
              disabled={isBusy}
            >
              {isBusy ? (
                <RefreshCw data-icon className="animate-spin" aria-hidden="true" />
              ) : (
                <Inbox data-icon aria-hidden="true" />
              )}
              Check now
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={disconnectGmail}
              disabled={isBusy}
            >
              <Unplug data-icon aria-hidden="true" />
              Disconnect
            </Button>
          </>
        ) : null}
      </div>

      {lastResult ? (
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-xs leading-5 text-text-secondary">
          Last check: {lastResult}
        </p>
      ) : null}
    </div>
  );
}
