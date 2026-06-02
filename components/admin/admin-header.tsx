"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loaders";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils/cn";

interface AdminHeaderProps {
  email: string | undefined;
}

const navItems = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users", exact: false },
  { href: "/admin/audit", label: "Audit log", exact: false },
];

/**
 * `<AdminHeader>` — top chrome for the admin area. Mirrors the
 * dashboard header's structure (brand mark + nav pill + actions) but
 * carries an "Admin" badge so it's visually unmistakable which
 * surface the operator is on.
 */
export function AdminHeader({ email }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
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

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <>
      <PageLoader
        show={loggingOut}
        title="Signing out"
        description="Ending session securely"
      />
      <header className="sticky top-0 z-30 border-b border-border bg-canvas-raised">
        <div className="mx-auto flex h-16 w-full max-w-wide items-center justify-between gap-4 px-4 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              className="group flex min-w-0 items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
              aria-label="Receipt Guardian admin"
            >
              <BrandMark size="md" className="text-accent" />
              <span className="hidden text-sm font-semibold tracking-tight text-text-primary sm:block">
                Receipt Guardian
              </span>
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Admin
            </span>
          </div>

          <nav
            aria-label="Admin"
            className="hidden items-center rounded-md border border-border-strong bg-surface p-1 md:flex"
          >
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex h-8 items-center rounded-sm px-3 text-xs font-medium transition-colors duration-default ease-standard",
                    active
                      ? "bg-accent-tint text-text-primary"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {email ? (
              <span className="hidden max-w-48 truncate text-xs text-text-muted lg:block">
                {email}
              </span>
            ) : null}
            <Button asChild type="button" variant="secondary" size="sm">
              <Link href="/dashboard">
                <LayoutDashboard data-icon aria-hidden="true" />
                <span className="hidden sm:inline">My dashboard</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loggingOut}
              data-loading={loggingOut ? "true" : undefined}
              onClick={handleLogout}
              aria-label="Log out"
            >
              {loggingOut ? (
                <Loader size="sm" label="" />
              ) : (
                <LogOut data-icon aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav row */}
        <nav
          aria-label="Admin (mobile)"
          className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden"
        >
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center rounded-sm px-3 text-xs font-medium transition-colors duration-default ease-standard",
                  active
                    ? "bg-accent-tint text-text-primary"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
