"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ReceiptText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonLoader } from "@/components/ui/loaders";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils/cn";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

type HeaderPage = "dashboard" | "settings" | "profile";

interface DashboardHeaderProps {
  email: string | undefined;
  current?: HeaderPage;
}

const navItems: Array<{ href: string; label: string; key: HeaderPage }> = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/settings", label: "Settings", key: "settings" },
  { href: "/profile", label: "Profile", key: "profile" },
];

export function DashboardHeader({
  email,
  current = "dashboard",
}: DashboardHeaderProps) {
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
      <header className="sticky top-0 z-30 -mx-6 border-b border-border/70 bg-bg/75 px-6 backdrop-blur-xl md:-mx-8 md:px-8">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="group flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label="Receipt Guardian dashboard"
          >
            <span
              className="border-conic-soft relative flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-action shadow-inner-hair"
              aria-hidden="true"
            >
              <ReceiptText className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold tracking-tight text-text-primary">
                Receipt Guardian
              </span>
              {email ? (
                <span className="hidden truncate text-xs text-text-muted md:block">
                  {email}
                </span>
              ) : null}
            </span>
          </Link>

          <nav
            aria-label="Main"
            className="hidden items-center rounded-xl border border-border bg-surface/70 p-1 shadow-inner-hair md:flex"
          >
            {navItems.map((item) => {
              const isActive = current === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium transition-colors duration-200",
                    isActive
                      ? "bg-bg-elevated text-text-primary shadow-inner-hair"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loggingOut}
              data-loading={loggingOut ? "true" : undefined}
              onClick={handleLogout}
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
        </div>
      </header>

      <MobileBottomNav current={current} />
    </>
  );
}
