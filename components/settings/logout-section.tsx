"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loaders";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils/cn";

/**
 * `<LogoutSection>` — Premium UI Redesign (task 8.6).
 *
 * Renders the sign-out row inside the Settings "Account" card and the
 * Profile page. The redesigned signature uses:
 *
 *   - `<Button variant="danger">` — the destructive variant defined in
 *     the redesigned `<Button>` primitive (task 5.7). Sign-out is a
 *     destructive session action and is the only place a `danger`
 *     button is wired today.
 *   - `<Loader size="sm" />` — the single redesigned loader vocabulary
 *     (task 5.3, Requirement 6.8 / 8.6) replaces the legacy
 *     `<ButtonLoader variant="logout" />` shim.
 *   - `<PageLoader>` — the redesigned full-screen overlay (task 5.11)
 *     covers the page while the logout request is in-flight.
 *
 * The logout flow is preserved exactly: POST `/api/auth/logout`, then
 * `router.push("/login")` and `router.refresh()` to flush the server
 * session cache. Errors clear the loading state so the user can retry.
 *
 * Implements: Requirements 4.5, 4.6, 9.6 (settings page composition),
 * 6.8, 8.6 (loader vocabulary), 8.3 (Button variants).
 */
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
          bordered && "border-t border-border pt-4",
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
          variant="danger"
          disabled={loggingOut}
          data-loading={loggingOut ? "true" : undefined}
          onClick={handleLogout}
          className="shrink-0"
        >
          {loggingOut ? (
            <>
              <Loader size="sm" label="" />
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
