"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/lib/utils/cn";
import { premiumEase } from "@/components/motion/motion-primitives";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPath = useRef(pathname + searchParams.toString());

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    timerRef.current = null;
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    const currentPath = pathname + searchParams.toString();
    if (currentPath === prevPath.current) return;
    prevPath.current = currentPath;

    cleanup();
    setProgress(100);
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      timerRef.current = setTimeout(() => setProgress(0), 300);
    }, 350);

    return cleanup;
  }, [pathname, searchParams, cleanup]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;

      const currentPath = pathname + searchParams.toString();
      if (href === currentPath || href === pathname) return;

      cleanup();
      setProgress(15);
      setVisible(true);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          const increment = prev < 40 ? 8 : prev < 60 ? 4 : prev < 80 ? 1.5 : 0.5;
          return Math.min(prev + increment, 90);
        });
      }, 200);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams, cleanup]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="route-progress"
          className={cn(
            "pointer-events-none fixed inset-x-0 top-0 z-[200] h-[2px]",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: premiumEase }}
        >
          <motion.div
            className="h-full rounded-r-full bg-action shadow-[0_0_12px_rgba(91,140,255,0.55)]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: premiumEase }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
