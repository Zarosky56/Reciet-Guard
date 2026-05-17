"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReceiptText } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { premiumEase } from "@/components/motion/motion-primitives";
import { ProcessRail } from "@/components/ui/loaders";

interface PageLoaderProps {
  show: boolean;
  title?: string;
  description?: string;
}

export function PageLoader({
  show,
  title = "Loading",
  description = "One moment",
}: PageLoaderProps) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: premiumEase }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/80 pb-16 backdrop-blur-md md:pb-0"
          aria-live="assertive"
          role="status"
        >
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.35, ease: premiumEase, delay: 0.05 }}
            className="flex w-full max-w-xs flex-col items-center gap-5 px-6"
          >
            <span
              className={cn(
                "relative flex size-14 items-center justify-center overflow-hidden rounded-2xl",
                "border border-border bg-bg-elevated text-action shadow-inner-hair",
              )}
              aria-hidden="true"
            >
              <ReceiptText className="size-6" />
              <span
                className={cn(
                  "absolute left-2 right-2 h-px bg-action shadow-[0_0_10px_rgba(91,140,255,0.7)]",
                  "animate-ledger-scan",
                )}
              />
            </span>

            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">{title}</p>
              <p className="mt-1 text-xs text-text-muted">{description}</p>
            </div>

            <ProcessRail className="w-full max-w-[180px]" />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
