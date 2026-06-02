"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Sparkline } from "@/components/dashboard/sparkline";
import { cn } from "@/lib/utils/cn";
import type { ReceiptStatus, ReceiptWithUrgency } from "@/types/receipt";

/**
 * `<HeroBackChart>` — back face of the dashboard hero card. Renders
 * three small charts answering three questions a glance can't:
 *
 *   1. **At risk · last 14 days** — single-line sparkline showing the
 *      money-at-risk trajectory.
 *   2. **By urgency** — single horizontal bar split into red / yellow
 *      / green segments by total at-risk dollars in each bucket.
 *   3. **By status** — four bars (active / returned / kept / expired)
 *      sized by count, with a numeric label on the right.
 *
 * Animation contract:
 *   - All charts wait for the `visible` prop to flip true (the parent
 *     sets it after the flip transition lands), so the entrance lands
 *     *after* the card stops rotating, not during.
 *   - Bars use `transform: scaleX()` from 0 → 1 with a 80ms-per-bar
 *     stagger, 480ms total, `--ease-emphasized`.
 *   - The line sparkline uses `stroke-dashoffset` (the standard
 *     "draw" reveal) keyed off `visible`.
 *   - Reduced-motion: charts render at final state with no transition.
 *
 * Token-only: no glow, no gradient. Bars use `bg-success` /
 * `bg-warning` / `bg-danger` for the urgency split and `bg-accent`
 * for the status row.
 */

interface HeroBackChartProps {
  receipts: ReceiptWithUrgency[];
  /** 14-day at-risk series for the sparkline. */
  series: number[];
  /**
   * When true, the charts perform their entrance animation. The
   * parent flips this on after the card-flip transition completes
   * so the animations don't race the rotation.
   */
  visible: boolean;
  className?: string;
}

const STATUS_LABEL: Record<ReceiptStatus, string> = {
  active: "Active",
  returned: "Returned",
  kept: "Kept",
  expired: "Expired",
};

const STATUS_ORDER: ReceiptStatus[] = ["active", "returned", "kept", "expired"];

const standardEase = [0.2, 0, 0, 1] as const;
const emphasizedEase = [0.3, 0, 0.1, 1] as const;

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function HeroBackChart({
  receipts,
  series,
  visible,
  className,
}: HeroBackChartProps) {
  const reduceMotion = useReducedMotion();

  // -------------------------------------------------------------------------
  // Aggregations
  // -------------------------------------------------------------------------

  const active = receipts.filter((r) => r.status === "active");
  const byUrgency = {
    red: active
      .filter((r) => r.urgency === "red")
      .reduce((sum, r) => sum + (r.price ?? 0), 0),
    yellow: active
      .filter((r) => r.urgency === "yellow")
      .reduce((sum, r) => sum + (r.price ?? 0), 0),
    green: active
      .filter((r) => r.urgency === "green")
      .reduce((sum, r) => sum + (r.price ?? 0), 0),
  };
  const totalAtRisk = byUrgency.red + byUrgency.yellow + byUrgency.green;
  const urgencyShares = {
    red: totalAtRisk > 0 ? byUrgency.red / totalAtRisk : 0,
    yellow: totalAtRisk > 0 ? byUrgency.yellow / totalAtRisk : 0,
    green: totalAtRisk > 0 ? byUrgency.green / totalAtRisk : 0,
  };

  const byStatusCount: Record<ReceiptStatus, number> = {
    active: 0,
    returned: 0,
    kept: 0,
    expired: 0,
  };
  receipts.forEach((r) => {
    byStatusCount[r.status] += 1;
  });
  const maxStatusCount = Math.max(
    1,
    ...STATUS_ORDER.map((s) => byStatusCount[s]),
  );

  // -------------------------------------------------------------------------
  // Animation gating — `key={String(visible)}` forces framer-motion to
  // remount the children when visibility flips, so each entrance plays
  // fresh on every flip back to the chart face.
  // -------------------------------------------------------------------------

  const animate = visible && !reduceMotion;

  return (
    <div
      className={cn("grid gap-5 p-5 md:p-7", className)}
      key={String(visible)}
    >
      <div className="text-xs uppercase tracking-wide text-text-muted">
        Statistics
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Chart 1: 14-day at-risk line                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs uppercase tracking-wide text-text-muted">
            At risk · last 14 days
          </h3>
          <span className="font-mono text-sm tabular-nums text-text-primary">
            {formatMoney(series.at(-1) ?? 0)}
          </span>
        </div>
        {series.length >= 2 ? (
          <motion.div
            initial={animate ? { opacity: 0 } : undefined}
            animate={animate ? { opacity: 1 } : undefined}
            transition={{ duration: 0.32, ease: standardEase }}
            className="text-text-muted"
          >
            <Sparkline
              values={series}
              animate={animate}
              className="h-12 w-full text-text-muted"
            />
          </motion.div>
        ) : (
          <p className="text-xs text-text-muted">
            Not enough history yet.
          </p>
        )}
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Chart 2: Stacked urgency bar                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-xs uppercase tracking-wide text-text-muted">
            By urgency
          </h3>
          <span className="font-mono text-sm tabular-nums text-text-primary">
            {formatMoney(totalAtRisk)}
          </span>
        </div>
        <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-pill bg-border">
          <motion.div
            initial={animate ? { scaleX: 0 } : undefined}
            animate={animate ? { scaleX: 1 } : undefined}
            transition={{
              duration: 0.48,
              ease: emphasizedEase,
              delay: 0.08,
            }}
            style={{
              transformOrigin: "left",
              width: `${Math.max(2, urgencyShares.red * 100)}%`,
              opacity: byUrgency.red > 0 ? 1 : 0,
            }}
            className="h-full rounded-pill bg-danger"
          />
          <motion.div
            initial={animate ? { scaleX: 0 } : undefined}
            animate={animate ? { scaleX: 1 } : undefined}
            transition={{
              duration: 0.48,
              ease: emphasizedEase,
              delay: 0.16,
            }}
            style={{
              transformOrigin: "left",
              width: `${Math.max(2, urgencyShares.yellow * 100)}%`,
              opacity: byUrgency.yellow > 0 ? 1 : 0,
            }}
            className="h-full rounded-pill bg-warning"
          />
          <motion.div
            initial={animate ? { scaleX: 0 } : undefined}
            animate={animate ? { scaleX: 1 } : undefined}
            transition={{
              duration: 0.48,
              ease: emphasizedEase,
              delay: 0.24,
            }}
            style={{
              transformOrigin: "left",
              width: `${Math.max(2, urgencyShares.green * 100)}%`,
              opacity: byUrgency.green > 0 ? 1 : 0,
            }}
            className="h-full rounded-pill bg-success"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-pill bg-danger" />
            Red {formatMoney(byUrgency.red)}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-pill bg-warning" />
            Yellow {formatMoney(byUrgency.yellow)}
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-pill bg-success" />
            Green {formatMoney(byUrgency.green)}
          </span>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Chart 3: Status counts                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <section className="grid gap-2">
        <h3 className="text-xs uppercase tracking-wide text-text-muted">
          By status
        </h3>
        <div className="grid gap-1.5">
          {STATUS_ORDER.map((status, idx) => {
            const count = byStatusCount[status];
            const ratio = count / maxStatusCount;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-20 text-xs text-text-secondary">
                  {STATUS_LABEL[status]}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-border">
                  <motion.div
                    initial={animate ? { scaleX: 0 } : undefined}
                    animate={animate ? { scaleX: ratio } : undefined}
                    transition={{
                      duration: 0.48,
                      ease: emphasizedEase,
                      delay: 0.32 + idx * 0.06,
                    }}
                    style={{ transformOrigin: "left" }}
                    className="absolute inset-y-0 left-0 w-full rounded-pill bg-accent"
                  />
                </div>
                <span className="w-6 text-right font-mono text-xs tabular-nums text-text-primary">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The line-chart entrance animation lives on the shared `<Sparkline>`
// primitive (`components/dashboard/sparkline.tsx`). It accepts an
// `animate` boolean that gates the `pathLength` draw + endpoint dot
// fade. We pass `animate` from the parent's `visible` flag, which the
// dashboard hero flips on after the card-flip transition lands.
// ---------------------------------------------------------------------------
