"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/ui/loaders";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils/cn";

export function LogoutSection({ bordered = true }: { bordered?: boolean }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <PageLoader
        show={loggingOut}
        title="Signing out"
        description="Ending session securely"
      />
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          bordered && "border-t border-border/70 pt-5",
        )}
      >
        <div>
          <h3 className="text-sm font-medium text-text-primary">Sign out</h3>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            End your current session on this device.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={loggingOut}
          data-loading={loggingOut ? "true" : undefined}
          onClick={handleLogout}
          className="shrink-0"
        >
          {loggingOut ? (
            <>
              <ButtonLoader variant="logout" />
              Signing out
            </>
          ) : (
            <>
              <LogOut data-icon aria-hidden="true" />
              Log out
            </>
          )}
        </Button>
      </div>
    </>
  );
}
