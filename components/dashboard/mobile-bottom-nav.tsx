"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type HeaderPage = "dashboard" | "settings" | "profile";

const navItems: Array<{
  href: string;
  label: string;
  key: HeaderPage;
  icon: typeof LayoutDashboard;
}> = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", key: "settings", icon: Settings },
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
 * Touch target spec (Requirement 11.6):
 * - Each item is at least 44×44 CSS pixels. The bar is `h-16` (64 px) tall
 *   and each item enforces `min-w-12` (48 px), comfortably exceeding the
 *   minimum.
 *
 * The chrome surface is opaque `bg-canvas-raised` with a `border-t border-border`
 * — no `backdrop-blur-xl` glassmorphism (Requirement 5.4, 13.7).
 */
export function MobileBottomNav({ current = "dashboard" }: MobileBottomNavProps) {
  const pathname = usePathname();

  const activePage = navItems.find((item) => pathname.startsWith(item.href))?.key ?? current;

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
          const isActive = activePage === item.key;
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                // Layout — `flex-1` distributes width across three items, while
                // `min-w-12` (48 px) and the parent `h-16` (64 px) guarantee a
                // ≥ 44×44 CSS-pixel touch target (Requirement 11.6).
                "group relative flex flex-1 flex-col items-center justify-center gap-1",
                "min-h-12 min-w-12 px-2",
                "rounded-md transition-colors duration-default ease-standard",
                // Focus-visible — non-color attribute change to satisfy
                // Property 11 (focus differs from resting in a non-color attr).
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                // Active-state indicator — 2px solid accent bar at the top
                // edge of the active item, no glow shadow (Requirement 8.7).
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
