"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function IntroToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isEnabled, setIsEnabled] = useState(enabled);

  async function setIntro(next: boolean) {
    setBusy(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          introToAppEnabled: next,
          onboardingCompleted: next ? false : true,
        }),
      });
      if (!response.ok) {
        throw new Error("Intro preference could not be saved.");
      }

      setIsEnabled(next);
      if (next) {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="font-mono text-sm text-text-primary">
        {isEnabled ? "On" : "Off"}
      </span>
      <Button
        type="button"
        size="sm"
        variant={isEnabled ? "secondary" : "primary"}
        onClick={() => setIntro(!isEnabled)}
        disabled={busy}
      >
        {isEnabled ? "Turn off" : "Replay intro"}
      </Button>
    </div>
  );
}
