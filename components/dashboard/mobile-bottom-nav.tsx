"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanLine, User } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type HeaderPage = "dashboard" | "settings" | "profile";

type NavKey = HeaderPage | "scan";

interface NavItem {
  href: string;
  label: string;
  key: NavKey;
  icon: typeof LayoutDashboard;
  /**
   * `true` for the centered Scan item — promotes the icon into a filled
   * accent pill so it reads as the gravity action of the app (capture
   * a receipt). The label drops below the pill.
   */
  prominent?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  // The Scan item routes to /dashboard with a capture intent that the
  // dashboard reads on mount to open the camera flow directly. Centring
  // it makes the gravity action of a receipt-tracking app the easiest
  // tap on every screen with the bottom nav. Settings was dropped from
  // the bottom nav (still accessible via the desktop header and the
  // command palette) so Scan can sit at the true centre of a 3-item bar.
  { href: "/dashboard?capture=none", label: "Scan", key: "scan", icon: ScanLine, prominent: true },
  { href: "/profile", label: "Profile", key: "profile", icon: User },
];

interface MobileBottomNavProps {
  current?: HeaderPage;
}

/**
 * Mobile bottom navigation bar.
 *
 * Active-state spec (Requirement 6.5, 8.7, 11.6 — design.md "MobileBottomNav"):
 * - Icon color shifts from `text-text-muted` to `text-accent`.
 * - Label color shifts from `text-text-muted` to `text-accent`.
 * - A 2px solid `bg-accent` bar renders at the top edge of the active item
 *   via a `::before` pseudo-element.
 * - No glow shadow, no scale change, no animation.
 *
 * The Scan item (centered, `prominent`) is a primary CTA: a filled accent
 * pill containing the scanner icon. It never carries the active-bar
 * indicator because it is an action target, not a route the user "lives"
 * on — tapping it jumps to the dashboard with `?capture=none`, which the
 * dashboard observes to open the capture sheet directly to the camera.
 *
 * Touch target spec (Requirement 11.6):
 * - Each item is at least 44×44 CSS pixels. The bar is `h-16` (64 px) tall
 *   and each item enforces `min-w-12` (48 px), comfortably exceeding the
 *   minimum. The Scan pill is 44×44 directly.
 *
 * The chrome surface is opaque `bg-canvas-raised` with a `border-t border-border`
 * — no `backdrop-blur-xl` glassmorphism (Requirement 5.4, 13.7).
 */
export function MobileBottomNav({ current = "dashboard" }: MobileBottomNavProps) {
  const pathname = usePathname();

  // Path-only matching — query params (e.g. ?capture=camera) must not
  // promote any tab to "active". The Scan item is never active anyway.
  const activePage =
    navItems
      .filter((item) => !item.prominent)
      .find((item) => pathname.startsWith(item.href.split("?")[0]))?.key ?? current;

  return (
    <nav
      aria-label="Main (mobile)"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-border bg-canvas-raised",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {navItems.map((item) => {
          const isActive = !item.prominent && activePage === item.key;
          const Icon = item.icon;

          if (item.prominent) {
            // Filled accent pill — the gravity action of the app. Renders
            // an icon-only target (the label sits below the pill) so it
            // visually reads as a single FAB-style button while remaining
            // a real `<Link>` for keyboard navigation and right-click open.
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-label={`${item.label} a receipt`}
                onClick={(e) => {
                  if (pathname === "/dashboard") {
                    e.preventDefault();
                    const url = new URL(window.location.href);
                    url.searchParams.set("capture", "none");
                    window.history.replaceState(null, "", url.pathname + url.search);
                    window.dispatchEvent(
                      new CustomEvent("open-scanner-sheet", { detail: "none" }),
                    );
                  }
                }}
                className={cn(
                  "group relative flex flex-1 flex-col items-center justify-center gap-1",
                  "min-h-12 min-w-12 px-2",
                  "rounded-md transition-colors duration-default ease-standard",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-11 items-center justify-center rounded-pill",
                    "bg-accent text-canvas",
                    "transition-[background-color,transform] duration-default ease-standard",
                    "group-hover:bg-accent-hover group-active:scale-[0.96]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="text-xs font-medium leading-none tracking-wide text-text-muted">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Layout — `flex-1` distributes width, while `min-w-12`
                // (48 px) and parent `h-16` (64 px) guarantee a ≥ 44×44
                // CSS-pixel touch target (Requirement 11.6).
                "group relative flex flex-1 flex-col items-center justify-center gap-1",
                "min-h-12 min-w-12 px-2",
                "rounded-md transition-colors duration-default ease-standard",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                isActive
                  ? cn(
                      "text-accent",
                      "before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2",
                      "before:h-0.5 before:w-8 before:bg-accent before:content-['']",
                    )
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              <Icon className="size-5" strokeWidth={1.75} />
              <span
                className={cn(
                  "text-xs font-medium leading-none tracking-wide",
                  isActive ? "text-accent" : "text-text-muted",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
