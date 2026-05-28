"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils/cn";

/**
 * Premium UI Redesign — `<RouteProgress>` (task 5.11).
 *
 * A 2px top-of-page indeterminate bar shown during route transitions.
 * Per Requirement 6.8, this is the **only** indeterminate loop allowed
 * anywhere in the redesigned Motion_Language. Every other pending UI
 * uses the static `<Loader>`.
 *
 * Composition:
 *   - Container: `fixed inset-x-0 top-0 h-0.5` (2px), `z-50` so the bar
 *     sits above the sticky `<DashboardHeader>` (`z-30`) and the mobile
 *     bottom nav (`z-40`). Pointer events disabled.
 *   - Indicator: `bg-accent` translated horizontally via the
 *     `route-progress` keyframe (linear, 1.2s, infinite), defined in
 *     `tailwind.config.ts` and exposed as `animate-route-progress`.
 *   - The animated node carries `data-reduced-motion="static"` so the
 *     global selector in `app/globals.css` cancels its animation; in
 *     reduced-motion mode the indicator collapses to a static accent
 *     bar pinned at the start of the track (Requirement 6.6, 11.4).
 *
 * Trigger model: rather than tying visibility to the heuristic anchor
 * click in the previous implementation, the bar is shown as soon as a
 * navigation begins (path or search-params change) and hidden once the
 * new route renders. The component is wrapped in `<Suspense>` at
 * `app/layout.tsx`, which provides the boundary the App Router uses
 * during pending transitions.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [visible, setVisible] = useState(false);
  const prevKey = useRef(pathname + "?" + searchParams.toString());
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the resolved route changes, the App Router has finished the
  // pending transition — show the bar briefly, then hide it. Keeping
  // the bar visible for ~200 ms after resolution gives the eye time to
  // read the indicator on near-instant transitions.
  useEffect(() => {
    const nextKey = pathname + "?" + searchParams.toString();
    if (nextKey === prevKey.current) return;
    prevKey.current = nextKey;

    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 200);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, searchParams]);

  // While a navigation is pending, intercept anchor clicks to show the
  // bar immediately. The next render of the resolved route will hide
  // it via the effect above.
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;

      const currentKey = pathname + "?" + searchParams.toString();
      if (href === currentKey || href === pathname) return;

      setVisible(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading next page"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5",
        "overflow-hidden",
      )}
    >
      {/*
       * The accent bar slides via `animate-route-progress` (transform-only,
       * 1.2s linear, infinite). The same node is the static-swap target:
       * `[data-reduced-motion="static"]` in `app/globals.css` cancels the
       * animation with `animation: none !important`, which removes the
       * keyframed transform and leaves the bar at its base style — a
       * full-width accent bar covering the track. That static accent bar
       * is the reduced-motion fallback per Requirement 6.6 / 11.4.
       */}
      <div
        data-reduced-motion="static"
        className={cn("h-full w-full bg-accent", "animate-route-progress")}
      />
    </div>
  );
}
