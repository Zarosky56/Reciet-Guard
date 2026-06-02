"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Inbox,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils/cn";

type SetupPath = "manual" | "auto";

interface GmailStatus {
  connected: boolean;
  gmailEmail?: string | null;
  status?: string;
  needsReconnect?: boolean;
}

const SENDERS = [
  { id: "amazon.in", label: "Amazon India" },
  { id: "amazon.com", label: "Amazon" },
  { id: "flipkart.com", label: "Flipkart" },
  { id: "apple.com", label: "Apple" },
  { id: "uber.com", label: "Uber" },
] as const;

const DEFAULT_SENDERS = SENDERS.map((sender) => sender.id);

export function GmailImportSetupDialog({
  open,
  onClose,
  onManualCheck,
  isInboxPending,
}: {
  open: boolean;
  onClose: () => void;
  onManualCheck: () => void;
  isInboxPending: boolean;
}) {
  const [path, setPath] = useState<SetupPath>("manual");
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [timeWindow, setTimeWindow] = useState<"new" | "2d" | "7d" | "14d">("2d");
  const [allowedSenders, setAllowedSenders] = useState<string[]>(DEFAULT_SENDERS);
  const [uncertainAction, setUncertainAction] =
    useState<"add_to_review" | "ask_first">("add_to_review");
  const [notificationPref, setNotificationPref] =
    useState<"every_import" | "grouped_summary" | "none">("grouped_summary");
  const [reminderPref, setReminderPref] =
    useState<"return_and_warranty" | "return_only" | "warranty_only" | "none">(
      "return_and_warranty",
    );

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsStatusLoading(true);
    fetch("/api/auth/gmail/status")
      .then((response) => response.json())
      .then((json) => {
        if (!cancelled) setStatus(json);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({ connected: false, status: "disconnected" });
        }
      })
      .finally(() => {
        if (!cancelled) setIsStatusLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const connected = Boolean(status?.connected);
  const needsPermission = !connected || status?.needsReconnect;
  const connectHref = useMemo(() => {
    if (typeof window === "undefined") return "/api/auth/gmail/connect";
    const next = `${window.location.pathname}${window.location.search}`;
    return `/api/auth/gmail/connect?next=${encodeURIComponent(next)}`;
  }, []);

  function connectGmail() {
    window.location.assign(connectHref);
  }

  function toggleSender(sender: string) {
    setAllowedSenders((current) => {
      if (current.includes(sender)) {
        return current.length === 1
          ? current
          : current.filter((item) => item !== sender);
      }
      return [...current, sender];
    });
  }

  async function saveAutoFetch() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/gmail/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeWindow,
          allowedSenders,
          uncertainAction,
          notificationPref,
          reminderPref,
        }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(json?.error?.message ?? "Could not save Gmail setup.");
        return;
      }

      toast.success("Auto fetch preferences saved.");
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  function runManualCheck() {
    onManualCheck();
    onClose();
  }

  return (
    <Dialog open={open} title="Check inbox" onClose={onClose}>
      <div className="grid gap-5">
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                Gmail permission
              </p>
              <p className="mt-1 truncate text-xs text-text-secondary">
                {isStatusLoading
                  ? "Checking connection..."
                  : connected
                    ? status?.gmailEmail ?? "Connected"
                    : "Not connected yet"}
              </p>
            </div>
            {isStatusLoading ? (
              <Loader size="sm" label="" />
            ) : connected ? (
              <Badge variant="success">Connected</Badge>
            ) : (
              <Badge variant="warning">Permission needed</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ChoiceButton
              active={path === "manual"}
              icon={Inbox}
              title="Manual check"
              description="One-time inbox scan now."
              onClick={() => setPath("manual")}
            />
            <ChoiceButton
              active={path === "auto"}
              icon={RefreshCw}
              title="Auto fetch"
              description="Set rules first."
              onClick={() => setPath("auto")}
            />
          </div>
        </div>

        {path === "manual" ? (
          <div className="grid gap-4">
            <Explainer
              icon={ShieldCheck}
              title="Private by default"
              body="Receipt Guardian scans only recent receipt-like messages from approved senders."
            />
            {needsPermission ? (
              <Button type="button" size="lg" onClick={connectGmail}>
                <Mail data-icon aria-hidden="true" />
                Connect Gmail to check
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={runManualCheck}
                disabled={isInboxPending}
                data-loading={isInboxPending ? "true" : undefined}
              >
                {isInboxPending ? (
                  <Loader size="sm" label="" />
                ) : (
                  <Inbox data-icon aria-hidden="true" />
                )}
                {isInboxPending ? "Checking inbox" : "Run one-time check"}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {needsPermission ? (
              <>
                <Explainer
                  icon={ShieldCheck}
                  title="Connect before auto fetch"
                  body="We ask Google for read-only Gmail access, then you choose exactly what to scan."
                />
                <Button type="button" size="lg" onClick={connectGmail}>
                  <Mail data-icon aria-hidden="true" />
                  Connect Gmail first
                </Button>
              </>
            ) : (
              <>
                <OptionGroup
                  title="Time window"
                  options={[
                    ["new", "New only"],
                    ["2d", "Last 2 days"],
                    ["7d", "Last 7 days"],
                    ["14d", "Last 14 days"],
                  ]}
                  value={timeWindow}
                  onChange={(value) => setTimeWindow(value as typeof timeWindow)}
                />

                <div className="grid gap-2">
                  <p className="text-sm font-medium text-text-primary">
                    Companies to include
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SENDERS.map((sender) => {
                      const active = allowedSenders.includes(sender.id);
                      return (
                        <button
                          key={sender.id}
                          type="button"
                          onClick={() => toggleSender(sender.id)}
                          aria-pressed={active}
                          className={cn(
                            "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors duration-default ease-standard",
                            active
                              ? "border-accent bg-accent-tint text-text-primary"
                              : "border-border bg-surface text-text-secondary hover:bg-surface-hover",
                          )}
                        >
                          {active && <Check className="size-3" aria-hidden="true" />}
                          {sender.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <OptionGroup
                  title="Uncertain receipts"
                  options={[
                    ["add_to_review", "Add to review"],
                    ["ask_first", "Ask first"],
                  ]}
                  value={uncertainAction}
                  onChange={(value) =>
                    setUncertainAction(value as typeof uncertainAction)
                  }
                />

                <OptionGroup
                  title="Import notifications"
                  options={[
                    ["every_import", "Every import"],
                    ["grouped_summary", "Grouped summary"],
                    ["none", "None"],
                  ]}
                  value={notificationPref}
                  onChange={(value) =>
                    setNotificationPref(value as typeof notificationPref)
                  }
                />

                <OptionGroup
                  title="Reminder setup"
                  options={[
                    ["return_and_warranty", "Return + warranty"],
                    ["return_only", "Return only"],
                    ["warranty_only", "Warranty only"],
                    ["none", "None"],
                  ]}
                  value={reminderPref}
                  onChange={(value) => setReminderPref(value as typeof reminderPref)}
                />

                <Button
                  type="button"
                  size="lg"
                  onClick={saveAutoFetch}
                  disabled={isSaving}
                  data-loading={isSaving ? "true" : undefined}
                >
                  {isSaving ? (
                    <Loader size="sm" label="" />
                  ) : (
                    <Clock data-icon aria-hidden="true" />
                  )}
                  {isSaving ? "Saving setup" : "Save auto fetch setup"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}

function ChoiceButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof Inbox;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "grid min-h-28 gap-2 rounded-md border p-3 text-left transition-[background-color,border-color,transform] duration-default ease-standard active:scale-[0.985]",
        active
          ? "border-accent bg-accent-tint"
          : "border-border bg-surface hover:bg-surface-hover",
      )}
    >
      <Icon className="size-5 text-accent" aria-hidden="true" />
      <span>
        <span className="block text-sm font-semibold text-text-primary">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-text-secondary">
          {description}
        </span>
      </span>
    </button>
  );
}

function Explainer({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3 rounded-md border border-border bg-surface px-4 py-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">{body}</p>
      </div>
    </div>
  );
}

function OptionGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-text-primary">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([id, label]) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(id)}
              className={cn(
                "min-h-10 rounded-md border px-3 text-xs font-medium transition-colors duration-default ease-standard",
                active
                  ? "border-accent bg-accent-tint text-text-primary"
                  : "border-border bg-surface text-text-secondary hover:bg-surface-hover",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
