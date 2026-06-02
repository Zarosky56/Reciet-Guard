"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Camera, Plus, Settings, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * `<AddMenu>` — shared popover used by both the header `+ Add`
 * button and the floating composer FAB. Renders the same five
 * actions in both places (Capture, Upload, Paste email, Add
 * manually, Settings) so the user has one mental model regardless
 * of which trigger they tapped.
 *
 * Visual contract: `bg-surface-overlay border-border rounded-lg
 * shadow-overlay`, no glow / gradient / aurora. Reduced-motion
 * users see no enter/exit animation.
 */

export interface AddMenuActions {
  onCapture: () => void;
  onUpload: () => void;
  onPasteEmail: () => void;
  onAddManual: () => void;
  onSettings: () => void;
}

interface AddMenuProps extends AddMenuActions {
  open: boolean;
  onClose: () => void;
  /**
   * Anchor edge — affects which corner the menu grows from. The
   * floating composer at the bottom-right opens the menu upward
   * with the menu's bottom-right anchored to the FAB. The header
   * Add button at the top-right opens the menu downward with the
   * menu's top-right anchored to the trigger.
   */
  align?: "top-right" | "bottom-right";
  /**
   * Optional outer wrapper className, used by the floating
   * composer to position itself fixed at the bottom of the
   * viewport. The header consumer mounts AddMenu inside an
   * already-positioned anchor, so it leaves this empty.
   */
  className?: string;
  /** When true, the menu container is `position: fixed`; default `absolute`. */
  fixed?: boolean;
  /** Anchor button — rendered as a sibling next to the menu so they share state. */
  trigger?: ReactNode;
}

const standardEase = [0.2, 0, 0, 1] as const;

export function AddMenu({
  open,
  onClose,
  onCapture,
  onUpload,
  onPasteEmail,
  onAddManual,
  onSettings,
  align = "bottom-right",
  className,
  trigger,
}: AddMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = [
    { id: "capture", label: "Capture", icon: Camera, run: onCapture },
    { id: "upload", label: "Upload", icon: Upload, run: onUpload },
    { id: "paste", label: "Paste email", icon: Sparkles, run: onPasteEmail },
    { id: "manual", label: "Add manually", icon: Plus, run: onAddManual },
    { id: "settings", label: "Settings", icon: Settings, run: onSettings },
  ];

  // Position relative to the trigger. For top-right (header), the menu
  // sits below and to the right edge. For bottom-right (FAB), it sits
  // above and to the right edge.
  const menuPositionClass =
    align === "top-right"
      ? "absolute right-0 top-full mt-2"
      : "absolute bottom-full right-0 mb-3";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger}
      <AnimatePresence>
        {open ? (
          <motion.ul
            key="add-menu"
            initial={
              reduce
                ? undefined
                : { opacity: 0, y: align === "top-right" ? -4 : 8 }
            }
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={
              reduce
                ? undefined
                : { opacity: 0, y: align === "top-right" ? -2 : 4 }
            }
            transition={{ duration: 0.18, ease: standardEase }}
            className={cn(
              menuPositionClass,
              "z-50 flex w-56 flex-col gap-1 overflow-hidden rounded-lg border border-border bg-surface-overlay p-1 shadow-overlay",
            )}
            role="menu"
            aria-label="Add receipt options"
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onClose();
                      item.run();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm",
                      "text-text-secondary transition-colors duration-default ease-standard",
                      "hover:bg-surface-hover hover:text-text-primary",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus",
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
