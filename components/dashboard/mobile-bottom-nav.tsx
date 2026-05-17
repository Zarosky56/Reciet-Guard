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

export function MobileBottomNav({ current = "dashboard" }: MobileBottomNavProps) {
  const pathname = usePathname();

  const activePage = navItems.find((item) => pathname.startsWith(item.href))?.key ?? current;

  return (
    <nav
      aria-label="Main (mobile)"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-border/70 bg-bg/80 backdrop-blur-xl",
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
                "group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-lg transition-colors duration-200",
                isActive
                  ? "text-action"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              {isActive ? (
                <span
                  className="absolute top-0 h-[2px] w-8 rounded-full bg-action shadow-[0_0_8px_rgba(91,140,255,0.5)]"
                  aria-hidden="true"
                />
              ) : null}
              <Icon
                className={cn(
                  "size-[20px] transition-transform duration-200",
                  isActive && "scale-105",
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none tracking-wide",
                  isActive ? "text-action" : "text-text-muted",
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
