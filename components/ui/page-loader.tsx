"use client";

import type { ReactNode } from "react";

import { Loader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils/cn";

/**
 * Premium UI Redesign — `<PageLoader>` (task 5.11).
 *
 * A centered overlay used for full-page operations (sign-out is the
 * primary call site today). The composition is intentionally calm:
 *
 *   - Scrim: `bg-canvas/70 backdrop-blur-sm` (≤ 8px blur per Requirement
 *     5.4). The scrim is the only place backdrop-blur is allowed besides
 *     `<Dialog>` and the global Toaster.
 *   - Card: `bg-surface-overlay`, `border-border`, `rounded-lg`,
 *     `shadow-overlay` — the single shadow token defined in the
 *     redesigned tokens (Requirement 5.3).
 *   - Indicator: the redesigned `<Loader size="md">` (a static accent
 *     dot + label). The previous animated `ledger-scan` glyph and
 *     `ProcessRail` are removed; the only allowed indeterminate loop in
 *     the redesigned Motion_Language is `<RouteProgress>` (Requirement
 *     6.8).
 *
 * Reduced-motion users see no animation here regardless — `<Loader>` is
 * static by design (Requirement 6.6, 11.4).
 *
 * Prop signature is preserved for backwards compatibility with
 * `dashboard-header.tsx` and `logout-section.tsx` (Requirement 8.9):
 * `show`, `title`, and `description` are accepted; `title` becomes the
 * loader label, `description` renders below.
 */
interface PageLoaderProps {
  show: boolean;
  title?: string;
  description?: ReactNode;
  className?: string;
}

export function PageLoader({
  show,
  title = "Loading",
  description = "One moment",
  className,
}: PageLoaderProps) {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-busy="true"
      className={cn(
        // Scrim — full-screen, sits above page chrome and the mobile
        // bottom nav (z-40), below toasts.
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-canvas/70 backdrop-blur-sm",
        // Bottom padding clears the fixed mobile nav so the centered
        // card optically aligns with the visible viewport, matching the
        // previous behaviour.
        "pb-16 md:pb-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-auth flex-col items-center gap-3 px-6 py-5 text-center",
          "rounded-lg border border-border bg-surface-overlay shadow-overlay",
          "mx-6",
        )}
      >
        <Loader size="md" label={title} />
        {description ? (
          <p className="text-xs text-text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
