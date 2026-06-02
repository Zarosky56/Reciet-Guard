"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Command, Inbox } from "lucide-react";
import { useEffect, useState } from "react";

import { HeroBackChart } from "@/components/dashboard/hero-back-chart";
import { Sparkline } from "@/components/dashboard/sparkline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loaders";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { FoldingCard, type FoldingCardFace } from "@/components/receipts/folding-card";
import type { ReceiptWithUrgency } from "@/types/receipt";

/**
 * `<DashboardHero>` — flippable hero card with synchronised
 * entrance animations on both faces.
 *
 * Front face: today's at-risk total, status badge, sparkline,
 * counts, primary CTAs, and the forwarding-address chip. Each
 * element fades + slides in with a stagger after the card flips
 * back from the Stats face.
 *
 * Back face: three small charts (line, urgency split, status
 * counts) that animate in after the flip lands.
 *
 * Both faces share one choreography vocabulary so the card feels
 * like a single physical surface that "comes back to life" on
 * every flip — not a static panel that swaps in.
 *
 * The flip uses CSS 3D transforms (perspective + rotateY) inside
 * `<FoldingCard>`, with a 600ms `--ease-emphasized` duration. After
 * the flip lands on either face, the `visible` flag for that face
 * flips true and kicks the entrance animations. Reduced-motion
 * users see both faces snap without animation.
 *
 * Visual contract: token-only. No glow, no gradient, no aurora.
 */

interface DashboardHeroProps {
  totalAtRisk: string;
  activeCount: number;
  totalCount: number;
  expiringSoon: number;
  todayLabel: string;
  /** 14-day at-risk series for the sparkline + back-face line chart. */
  series: number[];
  /** Full receipt list for the back-face urgency / status charts. */
  receipts: ReceiptWithUrgency[];
  isInboxPending: boolean;
  isBusy: boolean;
  onCheckInbox: () => void;
  onOpenPalette: () => void;
  forwardingAddress: string;
}

// Aligned with FoldingCard's flip duration so the entrance
// animations kick in only after the rotation has visually completed.
const FLIP_DURATION_MS = 600;

const standardEase = [0.2, 0, 0, 1] as const;
const emphasizedEase = [0.3, 0, 0.1, 1] as const;

export function DashboardHero({
  totalAtRisk,
  activeCount,
  totalCount,
  expiringSoon,
  todayLabel,
  series,
  receipts,
  isInboxPending,
  isBusy,
  onCheckInbox,
  onOpenPalette,
  forwardingAddress,
}: DashboardHeroProps) {
  const showSparkline = series.length >= 2;
  const reduceMotion = useReducedMotion();

  // Track the current face. The visibility flags only flip true after
  // the flip lands so entrance animations don't race the rotation.
  const [face, setFace] = useState<FoldingCardFace>("front");
  const [chartsVisible, setChartsVisible] = useState(false);
  // The front starts visible on first mount (no flip has happened yet),
  // then flips false → true again every time the user flips back from
  // the stats face. The `key` on the motion subtree is bound to a
  // counter that increments on every visit so framer-motion remounts
  // the elements and replays their entrance.
  const [frontVisitId, setFrontVisitId] = useState(0);

  useEffect(() => {
    if (face === "back") {
      setChartsVisible(false);
      const id = window.setTimeout(() => setChartsVisible(true), FLIP_DURATION_MS);
      return () => window.clearTimeout(id);
    }
    // Returning to the front face — bump the visit counter so the
    // motion subtree remounts and replays its entrance after the flip
    // lands.
    const id = window.setTimeout(() => {
      setFrontVisitId((v) => v + 1);
    }, FLIP_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [face]);

  // First-mount entrance: the very first render also animates so the
  // hero feels alive on initial page load (matches dashboards like
  // Linear and Stripe). After mount, `frontVisitId` increments only
  // when returning from the back face.
  const animateFront = !reduceMotion;

  // ──────────────────────────────────────────────────────────────────
  // Choreography (from research) — identical timing on both faces:
  //   beat 0: hero number / line chart       (lead, 0–700ms)
  //   beat 1: badge / urgency-bar segments   (80ms after lead)
  //   beat 2: sparkline / urgency legend     (160ms after lead)
  //   beat 3: counts caption / status row    (240ms after lead)
  //   beat 4: CTA row / —                    (320ms after lead)
  //   beat 5: forwarding chip / —            (400ms after lead)
  // ──────────────────────────────────────────────────────────────────
  const baseDuration = 0.42;
  const beat = (delaySec: number) => ({
    duration: baseDuration,
    ease: emphasizedEase,
    delay: delaySec,
  });

  const front = (
    <motion.div
      key={`front-${frontVisitId}`}
      className="grid gap-6 p-5 md:p-7"
    >
      <div className="flex flex-col gap-5 pr-24 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Eyebrow — fades in first as a quick stage-setter. */}
          <motion.p
            initial={animateFront ? { opacity: 0, y: 4 } : undefined}
            animate={animateFront ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.24, ease: standardEase }}
            className="text-xs uppercase tracking-wide text-text-muted"
          >
            Today · {todayLabel}
          </motion.p>

          {/* Hero number + status badge */}
          <motion.div
            initial={animateFront ? { opacity: 0, y: 8 } : undefined}
            animate={animateFront ? { opacity: 1, y: 0 } : undefined}
            transition={beat(0.08)}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-2"
          >
            <span
              className="font-mono font-semibold leading-none tracking-tight text-text-primary tabular-nums"
              style={{
                fontSize: "var(--text-display)",
                lineHeight: "var(--text-display-line-height)",
                letterSpacing: "var(--text-display-tracking)",
              }}
            >
              {totalAtRisk}
            </span>
            <motion.span
              initial={animateFront ? { opacity: 0, scale: 0.92 } : undefined}
              animate={animateFront ? { opacity: 1, scale: 1 } : undefined}
              transition={beat(0.16)}
              style={{ display: "inline-flex" }}
            >
              {expiringSoon > 0 ? (
                <Badge variant="warning">
                  <AlertTriangle className="size-3" aria-hidden="true" />
                  {expiringSoon} due soon
                </Badge>
              ) : (
                <Badge variant="success">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  All calm
                </Badge>
              )}
            </motion.span>
          </motion.div>

          {/* Sparkline — same draw animation as the back-face line. */}
          {showSparkline ? (
            <motion.div
              initial={animateFront ? { opacity: 0 } : undefined}
              animate={animateFront ? { opacity: 1 } : undefined}
              transition={beat(0.24)}
              className="text-text-muted"
            >
              <Sparkline
                values={series}
                animate={animateFront}
                className="h-10 w-48 text-text-muted"
                label={`Money at risk over the last ${series.length} days`}
              />
            </motion.div>
          ) : null}

          {/* Counts caption */}
          <motion.p
            initial={animateFront ? { opacity: 0, y: 4 } : undefined}
            animate={animateFront ? { opacity: 1, y: 0 } : undefined}
            transition={beat(0.32)}
            className="text-sm text-text-secondary"
          >
            {activeCount} active · {totalCount} total
          </motion.p>
        </div>

        {/* CTA row */}
        <motion.div
          initial={animateFront ? { opacity: 0, y: 8 } : undefined}
          animate={animateFront ? { opacity: 1, y: 0 } : undefined}
          transition={beat(0.4)}
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            type="button"
            size="lg"
            onClick={onCheckInbox}
            disabled={isBusy}
            data-loading={isInboxPending ? "true" : undefined}
          >
            {isInboxPending ? (
              <Loader size="sm" label="" />
            ) : (
              <Inbox data-icon aria-hidden="true" />
            )}
            {isInboxPending ? "Scanning" : "Check inbox"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onOpenPalette}
            disabled={isBusy}
            aria-label="Open command palette"
            className="gap-2"
          >
            <Command data-icon aria-hidden="true" />
            <kbd className="hidden font-mono text-xs text-text-muted sm:inline">
              ⌘K
            </kbd>
            <span className="sm:hidden">Commands</span>
          </Button>
        </motion.div>
      </div>

      {/* Forwarding chip — final beat, mirrors the back's last
          status row so the cadence reads identical on both faces. */}
      <motion.div
        initial={animateFront ? { opacity: 0, y: 4 } : undefined}
        animate={animateFront ? { opacity: 1, y: 0 } : undefined}
        transition={beat(0.48)}
        className="border-t border-border pt-4"
      >
        <CopyForwardingAddress address={forwardingAddress} />
      </motion.div>
    </motion.div>
  );

  const back = (
    <HeroBackChart
      receipts={receipts}
      series={series}
      visible={chartsVisible}
    />
  );

  return (
    <FoldingCard
      front={front}
      back={back}
      onFaceChange={(next) => setFace(next)}
    />
  );
}
