"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { Reveal } from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

/**
 * `<Dialog>` — overlay primitive (Phase 2 redesign, task 5.10).
 *
 * Surface treatment (Requirement 5.3, 8.1, 8.2):
 *   - Panel uses the overlay elevation: `bg-surface-overlay`,
 *     `border-border`, `rounded-lg`, and the single allowed shadow
 *     token `shadow-overlay`. Resting cards have no shadow; the
 *     overlay shadow is reserved for this primitive and the toaster.
 *   - Scrim is `bg-canvas/70 backdrop-blur-sm` per Requirement 5.4.
 *     Tailwind's `backdrop-blur-sm` is 4px, well under the 8px ceiling.
 *
 * Motion (Requirement 6.5, 8.1):
 *   - The panel's open/close animation is delegated to the canonical
 *     `<Reveal>` primitive (transform/opacity only, `--motion-default`
 *     duration, `--ease-standard` ease). The `exit` motion prop is
 *     forwarded through `<Reveal>`'s `HTMLMotionProps<"div">` spread
 *     so `<AnimatePresence>` animates the panel out on close.
 *   - The scrim animates opacity only via `motion.div`. Per the design
 *     doc, `Dialog` is the only retained framer-motion consumer in
 *     `components/ui/*`; every other primitive drives motion through
 *     `<Reveal>` or pure CSS transitions.
 *   - Reduced-motion users are honoured: `<Reveal>` short-circuits to
 *     a plain motion component without animation props, and the global
 *     `prefers-reduced-motion` media query in `app/globals.css`
 *     clamps CSS transitions to 0.01ms.
 *
 * Accessibility:
 *   - `role="dialog"` + `aria-modal="true"` + `aria-labelledby` on the
 *     `<h2>` title.
 *   - First focusable element receives focus on open; focus is trapped
 *     inside the panel; previous focus is restored on close.
 *   - `Escape` closes the dialog. `mousedown` on the scrim closes;
 *     `mousedown` on the panel does not propagate to the scrim handler.
 *
 * Prop signature is preserved from the pre-redesign Dialog so consumer
 * pages do not need to change (Requirement 8.9, 14.7).
 */
export function Dialog({
  open,
  title,
  children,
  onClose,
  className,
}: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    focusableElements[0]?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="dialog-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70 backdrop-blur-sm sm:items-center sm:p-6"
          role="presentation"
          onMouseDown={onClose}
        >
          <Reveal
            key="dialog-panel"
            exit={{ opacity: 0, y: 8 }}
            className="w-full max-w-lg"
          >
            <section
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={cn(
                "w-full overflow-hidden rounded-lg border border-border bg-surface-overlay text-text-primary shadow-overlay",
                className,
              )}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-overlay px-5 py-4">
                <h2
                  id={titleId}
                  className="text-[15px] font-semibold tracking-tight text-text-primary"
                >
                  {title}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X data-icon aria-hidden="true" />
                </Button>
              </div>
              <div className="px-5 py-5 sm:px-6">{children}</div>
            </section>
          </Reveal>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
