"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/**
 * `<CommandPalette>` — Cmd-K / Ctrl-K overlay.
 *
 * Replaces the dashboard "More" dropdown. Every secondary action
 * (Add manually, Paste email, Capture, Upload, filters, status
 * changes, navigation) is one keystroke away.
 *
 * Visual contract follows the redesign rules:
 *   - Scrim: `bg-canvas/70 backdrop-blur-sm` (capped under 8px).
 *   - Panel: `bg-surface-overlay border-border rounded-lg shadow-overlay`.
 *   - No glow, no gradient, no aurora.
 *   - Active row uses `bg-surface-hover` (token-only).
 *
 * Implements: Requirements 6.5, 8.1, 8.2, 11.3, 11.6.
 */

export interface CommandItem {
  id: string;
  label: string;
  /** Optional contextual hint shown on the right (e.g. "Manual entry"). */
  hint?: string;
  /** Lucide icon. Inline data-icon styling lives in the row CSS. */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Section label used to group related commands. */
  section: string;
  /** Action invoked when the command is selected. */
  run: () => void;
  /** Searchable keywords beyond the label. */
  keywords?: string[];
  /** Keyboard hint shown right-aligned (e.g. "/" for search focus). */
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

const standardEase = [0.2, 0, 0, 1] as const;

export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const reduce = useReducedMotion();

  // Filter & group
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((cmd) => {
      const haystack = `${cmd.label} ${cmd.section} ${(cmd.keywords ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((cmd) => {
      const list = map.get(cmd.section) ?? [];
      list.push(cmd);
      map.set(cmd.section, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Defer focus so the framer-motion mount finishes
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Clamp active index when the filtered list shrinks
  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, activeIndex]);

  // Keyboard navigation
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[activeIndex];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    },
    [activeIndex, filtered, onClose],
  );

  // Auto-scroll active row into view
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${activeIndex}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="cmd-scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: standardEase }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-canvas/70 px-4 pt-[12vh] backdrop-blur-sm sm:pt-[18vh]"
          role="presentation"
          onMouseDown={onClose}
        >
          <motion.section
            key="cmd-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduce ? undefined : { opacity: 0, y: 8 }}
            animate={reduce ? undefined : { opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease: standardEase }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
            className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-surface-overlay text-text-primary shadow-overlay"
          >
            <h2 id={titleId} className="sr-only">
              Command palette
            </h2>
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
              <Input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="h-12 border-0 bg-transparent px-0 text-base focus:outline-none focus:outline-0 focus-visible:outline-none focus-visible:outline-0"
                aria-label="Search commands"
              />
            </div>

            <div
              ref={listRef}
              role="listbox"
              aria-label="Commands"
              className="max-h-96 overflow-y-auto py-2"
            >
              {grouped.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-text-muted">
                  No commands match
                </p>
              ) : (
                grouped.map(([section, items]) => (
                  <div key={section} className="px-2 py-1">
                    <p className="px-3 py-1 text-xs uppercase tracking-wide text-text-muted">
                      {section}
                    </p>
                    {items.map((cmd) => {
                      const flatIndex = filtered.indexOf(cmd);
                      const isActive = flatIndex === activeIndex;
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          data-cmd-index={flatIndex}
                          onMouseEnter={() => setActiveIndex(flatIndex)}
                          onClick={() => {
                            cmd.run();
                            onClose();
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors duration-default ease-standard",
                            "focus:outline-none",
                            isActive
                              ? "bg-surface-hover text-text-primary"
                              : "text-text-secondary hover:text-text-primary",
                          )}
                        >
                          {Icon ? (
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                isActive ? "text-accent" : "text-text-muted",
                              )}
                              aria-hidden="true"
                            />
                          ) : (
                            <span className="size-4 shrink-0" aria-hidden="true" />
                          )}
                          <span className="flex-1 truncate">{cmd.label}</span>
                          {cmd.hint ? (
                            <span className="hidden text-xs text-text-muted sm:inline">
                              {cmd.hint}
                            </span>
                          ) : null}
                          {cmd.shortcut ? (
                            <kbd className="rounded-xs border border-border bg-canvas px-1.5 py-0.5 font-mono text-xs text-text-muted">
                              {cmd.shortcut}
                            </kbd>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-text-muted">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded-xs border border-border bg-canvas px-1.5 py-0.5 font-mono">
                    ↑↓
                  </kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded-xs border border-border bg-canvas px-1.5 py-0.5 font-mono">
                    ↵
                  </kbd>
                  select
                </span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded-xs border border-border bg-canvas px-1.5 py-0.5 font-mono">
                  esc
                </kbd>
                close
              </span>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
