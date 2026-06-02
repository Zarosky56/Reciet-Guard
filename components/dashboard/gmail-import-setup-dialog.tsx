"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  Inbox,
  Mail,
  RefreshCw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
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
  { id: "others", label: "Others" },
] as const;

const DEFAULT_SENDERS = SENDERS.map((sender) => sender.id);
const TOTAL_STEPS = 5;

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
  const [activeStep, setActiveStep] = useState(1);
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
    setActiveStep(1);
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

  const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";

  return (
    <Dialog open={open} title="Check inbox" onClose={onClose} className="max-w-lg">
      <MotionConfig transition={isTest ? { duration: 0 } : undefined}>
        <div className="grid gap-5">
        <div className="grid gap-4">
          {/* Gmail permission card */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-default",
              isStatusLoading
                ? "border-border bg-surface"
                : connected
                  ? "border-success/30 bg-success/5"
                  : "border-warning/30 bg-warning/5",
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                isStatusLoading
                  ? "border-border bg-surface"
                  : connected
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-warning/20 bg-warning/10 text-warning",
              )}
            >
              <Mail className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                Gmail connection
              </p>
              <p className="mt-0.5 truncate text-xs text-text-secondary">
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

          {/* Route path Choice Cards */}
          <div className="grid grid-cols-2 gap-3">
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
              <Button type="button" size="lg" className="w-full" onClick={connectGmail}>
                <Mail data-icon aria-hidden="true" />
                Connect Gmail to check
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                className="w-full"
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
                <Button type="button" size="lg" className="w-full" onClick={connectGmail}>
                  <Mail data-icon aria-hidden="true" />
                  Connect Gmail first
                </Button>
              </>
            ) : (
              <div className="grid gap-5 rounded-xl border border-border bg-surface/30 p-4">
                {/* Wizard Step Indicator and Progress Bar */}
                <div className="grid gap-2 border-b border-border/80 pb-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                    <span className="uppercase tracking-wider">Auto-Fetch Settings</span>
                    <span>Step {activeStep} of {TOTAL_STEPS}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <motion.div
                      className="h-full bg-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${(activeStep / TOTAL_STEPS) * 100}%` }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Wizard Questionnaire Steps */}
                <div className="min-h-44 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {activeStep === 1 && (
                      <motion.div
                        key="step-time"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <OptionGroup
                          title="1. Time window to scan"
                          description="Select how far back we should check your emails for receipts."
                          options={[
                            ["new", "New only"],
                            ["2d", "Last 2 days"],
                            ["7d", "Last 7 days"],
                            ["14d", "Last 14 days"],
                          ]}
                          value={timeWindow}
                          onChange={(value) => {
                            setTimeWindow(value as typeof timeWindow);
                            setActiveStep(2);
                          }}
                        />
                      </motion.div>
                    )}

                    {activeStep === 2 && (
                      <motion.div
                        key="step-senders"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="grid gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            2. Companies to include
                          </p>
                          <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                            Only receipts from these selected senders will be scanned and imported.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 py-1">
                          {SENDERS.map((sender) => {
                            const active = allowedSenders.includes(sender.id);
                            return (
                              <button
                                key={sender.id}
                                type="button"
                                onClick={() => toggleSender(sender.id)}
                                aria-pressed={active}
                                className={cn(
                                  "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-all duration-default ease-standard active:scale-[0.97]",
                                  active
                                    ? "border-accent bg-accent-tint text-text-primary ring-1 ring-accent"
                                    : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-hover",
                                )}
                              >
                                {active && <Check className="size-3.5 stroke-[2.5]" aria-hidden="true" />}
                                {sender.label}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {activeStep === 3 && (
                      <motion.div
                        key="step-uncertain"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <OptionGroup
                          title="3. Uncertain receipts"
                          description="What should we do if AI cannot confidently parse an email as a receipt?"
                          options={[
                            ["add_to_review", "Add to review"],
                            ["ask_first", "Ask first"],
                          ]}
                          value={uncertainAction}
                          onChange={(value) => {
                            setUncertainAction(value as typeof uncertainAction);
                            setActiveStep(4);
                          }}
                        />
                      </motion.div>
                    )}

                    {activeStep === 4 && (
                      <motion.div
                        key="step-notifications"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <OptionGroup
                          title="4. Import notifications"
                          description="Choose how you want to be notified when auto-importing receipts."
                          options={[
                            ["every_import", "Every import"],
                            ["grouped_summary", "Grouped summary"],
                            ["none", "None"],
                          ]}
                          value={notificationPref}
                          onChange={(value) => {
                            setNotificationPref(value as typeof notificationPref);
                            setActiveStep(5);
                          }}
                        />
                      </motion.div>
                    )}

                    {activeStep === 5 && (
                      <motion.div
                        key="step-reminders"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="grid gap-4"
                      >
                        <OptionGroup
                          title="5. Reminder setup"
                          description="Choose which automatic calendar reminders we should trigger for warranty and return dates."
                          options={[
                            ["return_and_warranty", "Return + warranty"],
                            ["return_only", "Return only"],
                            ["warranty_only", "Warranty only"],
                            ["none", "None"],
                          ]}
                          value={reminderPref}
                          onChange={(value) => {
                            setReminderPref(value as typeof reminderPref);
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Wizard Footer Navigation Controls */}
                <div className="flex items-center justify-between border-t border-border/80 pt-4">
                  {activeStep > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
                      onClick={() => setActiveStep((prev) => prev - 1)}
                    >
                      <ChevronLeft className="size-4" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {activeStep === 2 ? (
                    <Button
                      type="button"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => setActiveStep(3)}
                      disabled={allowedSenders.length === 0}
                    >
                      Continue
                      <ChevronRight className="size-4" />
                    </Button>
                  ) : activeStep === 5 ? (
                    <Button
                      type="button"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={saveAutoFetch}
                      disabled={isSaving}
                      data-loading={isSaving ? "true" : undefined}
                    >
                      {isSaving ? (
                        <Loader size="sm" label="" />
                      ) : (
                        <Clock className="size-4" />
                      )}
                      {isSaving ? "Saving setup" : "Save auto fetch setup"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-text-secondary hover:text-text-primary"
                      onClick={() => setActiveStep((prev) => prev + 1)}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </MotionConfig>
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
        "relative flex flex-col justify-between gap-4 rounded-xl border p-4 text-left transition-all duration-default ease-standard active:scale-[0.985] group",
        active
          ? "border-accent bg-accent-tint/10 ring-1 ring-accent"
          : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover hover:scale-[1.01]",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg transition-colors border",
            active
              ? "bg-accent border-accent text-canvas"
              : "bg-surface-hover border-border text-text-secondary group-hover:text-text-primary group-hover:border-border-strong",
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {active && (
          <div className="flex size-5 items-center justify-center rounded-full bg-accent text-canvas shadow-sm">
            <Check className="size-3 stroke-[3]" />
          </div>
        )}
      </div>
      <div>
        <span className="block text-sm font-semibold text-text-primary">
          {title}
        </span>
        <span className="mt-1 block text-xs leading-normal text-text-secondary">
          {description}
        </span>
      </div>
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
    <div className="flex gap-3 rounded-xl border border-border bg-surface/50 px-4 py-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">{body}</p>
      </div>
    </div>
  );
}

function OptionGroup({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description?: string;
  options: Array<[string, string]>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-text-secondary leading-relaxed">{description}</p>
        )}
      </div>
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
                "flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold transition-all duration-default ease-standard active:scale-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                active
                  ? "border-accent bg-accent-tint text-text-primary ring-1 ring-accent"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-surface-hover",
              )}
            >
              <span>{label}</span>
              {active && <Check className="size-4 shrink-0 text-accent stroke-[2.5]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
