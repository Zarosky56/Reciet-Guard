"use client";

import { Download, Share, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "rg.pwa.installPromptDismissedAt";
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7;

function isStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;

  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();
  const touchMac = platform === "macintel" && window.navigator.maxTouchPoints > 1;

  return /iphone|ipad|ipod/.test(userAgent) || touchMac;
}

function recentlyDismissed() {
  const dismissedAt = window.localStorage.getItem(DISMISSED_KEY);
  if (!dismissedAt) return false;

  return Date.now() - Number(dismissedAt) < DISMISS_COOLDOWN_MS;
}

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    setIos(isIOS());

    const showTimer = window.setTimeout(() => {
      if (isIOS()) {
        setVisible(true);
      }
    }, 1800);

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), 900);
    }

    function handleInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(showTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) {
      setIos(true);
      setVisible(true);
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setVisible(false);
      return;
    }

    dismiss();
  }

  if (!visible) return null;

  return (
    <aside
      className={cn(
        "fixed inset-x-3 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-border bg-surface p-4 shadow-overlay",
        "pb-[calc(1rem+env(safe-area-inset-bottom))]",
      )}
      role="dialog"
      aria-live="polite"
      aria-label="Install Receipt Guardian"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-canvas text-accent">
          <Download className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Install Receipt Guardian
              </h2>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                Add it to your phone for faster access, full-screen launch, and
                future reminder notifications.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-sm p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              aria-label="Dismiss install prompt"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {ios && !deferredPrompt ? (
            <p className="mt-3 flex items-center gap-2 rounded-md border border-border bg-canvas px-3 py-2 text-xs leading-5 text-text-secondary">
              <Share className="size-4 shrink-0 text-text-primary" aria-hidden="true" />
              Use Share, then Add to Home Screen.
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
              Later
            </Button>
            <Button type="button" size="sm" onClick={install}>
              Install app
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
