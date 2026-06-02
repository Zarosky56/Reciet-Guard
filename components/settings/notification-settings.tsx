"use client";

import { Bell, Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type PermissionState = "unsupported" | "default" | "granted" | "denied";

interface Preferences {
  defaultCurrency: string;
  onboardingCompleted: boolean;
  introToAppEnabled: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  reminderThresholds: number[];
}

const THRESHOLDS = [
  { value: 20, label: "20d" },
  { value: 7, label: "7d" },
  { value: 3, label: "3d" },
  { value: 1, label: "1d" },
  { value: 0, label: "Today" },
];

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function getBrowserPermission(): PermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return Notification.permission;
}

function statusBadge(permission: PermissionState, enabled: boolean) {
  if (permission === "unsupported") return <Badge>Unsupported</Badge>;
  if (permission === "denied") return <Badge variant="danger">Blocked</Badge>;
  if (permission === "granted" && enabled) {
    return <Badge variant="success">Enabled</Badge>;
  }
  return <Badge>Not configured</Badge>;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [permission, setPermission] =
    useState<PermissionState>("unsupported");
  const [busy, setBusy] = useState(false);

  const selectedThresholds = useMemo(
    () => new Set(preferences?.reminderThresholds ?? []),
    [preferences?.reminderThresholds],
  );

  useEffect(() => {
    setPermission(getBrowserPermission());
    fetch("/api/notifications/preferences")
      .then((response) => response.json())
      .then((json) => {
        setPreferences(json.preferences);
        setVapidPublicKey(json.vapidPublicKey ?? null);
      })
      .catch(() => {
        toast.error("Notification settings could not be loaded.");
      });
  }, []);

  async function patchPreferences(update: Partial<Preferences>) {
    const response = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    const json = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(json?.error?.message ?? "Could not save preferences.");
    }
    setPreferences(json.preferences);
    return json.preferences as Preferences;
  }

  async function enablePush() {
    if (!vapidPublicKey) {
      toast.error("Push notifications need VAPID keys in production env.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("This browser does not support app notifications.");
      return;
    }

    setBusy(true);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        await patchPreferences({ pushNotificationsEnabled: false });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("Subscription could not be saved.");
      }

      setPreferences((current) =>
        current ? { ...current, pushNotificationsEnabled: true } : current,
      );
      toast.success("App notifications enabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Push setup failed.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready.catch(() => null);
      const subscription =
        registration ? await registration.pushManager.getSubscription() : null;
      await subscription?.unsubscribe();
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription?.endpoint }),
      });
      setPreferences((current) =>
        current ? { ...current, pushNotificationsEnabled: false } : current,
      );
      toast.success("App notifications disabled.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleEmail() {
    if (!preferences) return;
    setBusy(true);
    try {
      await patchPreferences({
        emailNotificationsEnabled: !preferences.emailNotificationsEnabled,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleThreshold(value: number) {
    if (!preferences) return;
    const next = new Set(preferences.reminderThresholds);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    if (next.size === 0) next.add(7);

    setBusy(true);
    try {
      await patchPreferences({
        reminderThresholds: Array.from(next).sort((a, b) => b - a),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTestAlert() {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "Test alert failed.");
      }

      const pushSent = (json?.push?.sent ?? 0) > 0;
      const emailSent = Boolean(json?.email?.sent);
      if (pushSent && emailSent) {
        toast.success("Test app and email alerts sent.");
      } else if (pushSent) {
        toast.success("Test app alert sent.");
      } else if (emailSent) {
        toast.success("Test email alert sent. No push subscription was reached.");
      } else {
        toast.warning(json?.push?.error ?? "No enabled push subscription was reached.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test alert failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!preferences) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Loading notification status
      </div>
    );
  }

  const pushEnabled =
    permission === "granted" && preferences.pushNotificationsEnabled;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bell className="size-4 text-accent" aria-hidden="true" />
          <span className="text-sm font-medium text-text-primary">
            App notifications
          </span>
        </div>
        {statusBadge(permission, pushEnabled)}
      </div>

      <div className="flex flex-wrap gap-2">
        {pushEnabled ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={disablePush}
            disabled={busy}
          >
            Disable app alerts
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={enablePush}
            disabled={busy || permission === "denied" || permission === "unsupported"}
          >
            Enable app alerts
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={toggleEmail}
          disabled={busy}
        >
          {preferences.emailNotificationsEnabled ? (
            <Check data-icon aria-hidden="true" />
          ) : (
            <X data-icon aria-hidden="true" />
          )}
          Email alerts
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={sendTestAlert}
          disabled={busy}
        >
          Send test alert
        </Button>
      </div>

      <div className="grid gap-2">
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Reminder timing
        </p>
        <div className="flex flex-wrap gap-2">
          {THRESHOLDS.map((threshold) => {
            const selected = selectedThresholds.has(threshold.value);
            return (
              <button
                key={threshold.value}
                type="button"
                onClick={() => toggleThreshold(threshold.value)}
                disabled={busy}
                className={cn(
                  "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
                  selected
                    ? "border-accent bg-accent-tint text-text-primary"
                    : "border-border bg-surface text-text-secondary hover:bg-surface-hover",
                )}
              >
                {threshold.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
