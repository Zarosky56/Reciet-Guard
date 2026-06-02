"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * Landing page (`/`) — wisprflow.ai-inspired structure and motion language.
 *
 * This recreates the *feel* of a calm, premium AI product landing page
 * (full-bleed dark hero, oversized display type, soft scroll-reveal motion,
 * a single product showcase, restrained proof points) using Receipt
 * Guardian's own design tokens, original copy, and original assets.
 *
 * Motion is transform/opacity only and honours `prefers-reduced-motion`.
 */

const standardEase = [0.2, 0, 0, 1] as const;

const reveal: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: standardEase },
  },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/** Wraps a section in a scroll-triggered reveal (or static for reduced motion). */
function Section({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const canObserve =
    typeof window !== "undefined" && "IntersectionObserver" in window;
  if (reduce || !canObserve) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

const proofPoints = [
  {
    icon: Mail,
    title: "Forward or paste",
    text: "Send order emails to your intake inbox, or drop one straight into the app.",
  },
  {
    icon: Sparkles,
    title: "AI reads the deadline",
    text: "Gemini extracts the return window first, Groq covers the edges, you review anything uncertain.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    text: "Edit any field, mark outcomes, and get one quiet warning three days before a window closes.",
  },
];

const steps = [
  { k: "01", title: "Capture", text: "Snap a paper receipt or upload a PDF — the camera and file picker live right on your dashboard." },
  { k: "02", title: "Extract", text: "The free-tier provider chain reads the store, amount, and return window automatically." },
  { k: "03", title: "Relax", text: "Your deadlines sort themselves by urgency. We watch the clock so you don't have to." },
];

export function LandingPage() {
  const reduce = useReducedMotion();
  const canObserve =
    typeof window !== "undefined" && "IntersectionObserver" in window;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-canvas text-text-primary">
      {/* Single ambient tonal band — the only decorative element */}
      <div
        aria-hidden="true"
        data-decorative="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden bg-canvas-raised"
      >
        <div
          className="absolute inset-x-0 top-0 h-[640px] bg-canvas-raised"
          style={{
            maskImage: "radial-gradient(120% 80% at 50% 0%, black 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(120% 80% at 50% 0%, black 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Sticky header */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-colors duration-default ease-standard",
          scrolled
            ? "border-b border-border bg-canvas/80 backdrop-blur-sm"
            : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-wide items-center justify-between px-6 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label="Receipt Guardian home"
          >
            <BrandMark size="md" className="text-accent" />
            <span className="text-base font-semibold tracking-tight">Receipt Guardian</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/signup">
                Get started
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative mx-auto w-full max-w-wide px-6 md:px-8">
        <section className="flex flex-col items-center pt-20 text-center md:pt-28">
          <motion.div
            variants={reduce ? undefined : stagger}
            initial={reduce ? undefined : "hidden"}
            animate={reduce ? undefined : "show"}
            className="flex flex-col items-center"
          >
            <motion.div variants={reduce ? undefined : reveal}>
              <span className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-text-secondary">
                <span className="inline-block size-1.5 rounded-full bg-accent" aria-hidden="true" />
                Receipts. Returns. Deadlines.
              </span>
            </motion.div>

            <motion.h1
              variants={reduce ? undefined : reveal}
              className="mt-7 max-w-4xl text-balance font-semibold text-text-primary"
              style={{
                fontSize: "var(--text-display)",
                lineHeight: "var(--text-display-line-height)",
                letterSpacing: "var(--text-display-tracking)",
              }}
            >
              Never miss a return window again.
            </motion.h1>

            <motion.p
              variants={reduce ? undefined : reveal}
              className="mt-6 max-w-2xl text-text-secondary"
              style={{
                fontSize: "var(--text-body-lg)",
                lineHeight: "var(--text-body-lg-line-height)",
              }}
            >
              Receipt Guardian turns order emails and paper receipts into a calm deadline
              dashboard. Track returns, warranties, and money at risk — quietly, reliably,
              without a spreadsheet.
            </motion.p>

            <motion.div
              variants={reduce ? undefined : reveal}
              className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
            >
              <Button asChild variant="primary" size="lg">
                <Link href="/signup">
                  Get started free
                  <ArrowRight data-icon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </motion.div>

            <motion.p
              variants={reduce ? undefined : reveal}
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-text-muted"
            >
              <Check className="size-3.5 text-success" aria-hidden="true" />
              Free tier. No card required.
            </motion.p>
          </motion.div>

          {/* Product showcase mock */}
          <Section className="mt-16 w-full md:mt-20" delay={0.1}>
            <ShowcaseMock />
          </Section>
        </section>

        {/* Proof points */}
        <section className="py-24 md:py-32">
          <Section className="mx-auto max-w-2xl text-center">
            <h2
              className="font-semibold text-text-primary"
              style={{
                fontSize: "var(--text-title-lg)",
                lineHeight: "var(--text-title-lg-line-height)",
                letterSpacing: "var(--text-title-lg-tracking)",
              }}
            >
              Three steps. Zero spreadsheets.
            </h2>
            <p className="mt-3 text-text-secondary" style={{ fontSize: "var(--text-body)" }}>
              From inbox to deadline in seconds — and it stays out of your way.
            </p>
          </Section>

          <motion.div
            variants={reduce || !canObserve ? undefined : stagger}
            initial={reduce || !canObserve ? undefined : "hidden"}
            whileInView={reduce || !canObserve ? undefined : "show"}
            viewport={reduce || !canObserve ? undefined : { once: true, amount: 0.2 }}
            className="mt-12 grid gap-4 md:grid-cols-3"
          >
            {proofPoints.map((p) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  variants={reduce ? undefined : reveal}
                  className="group rounded-lg border border-border bg-surface p-6 transition-transform duration-default ease-standard hover:-translate-y-0.5 hover:border-border-strong"
                >
                  <span className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-canvas-raised text-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-base font-medium text-text-primary">{p.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{p.text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* How it works strip */}
        <section className="pb-24 md:pb-32">
          <div className="rounded-lg border border-border bg-surface/50 p-8 md:p-12">
            <motion.div
              variants={reduce || !canObserve ? undefined : stagger}
              initial={reduce || !canObserve ? undefined : "hidden"}
              whileInView={reduce || !canObserve ? undefined : "show"}
              viewport={reduce || !canObserve ? undefined : { once: true, amount: 0.2 }}
              className="grid gap-8 md:grid-cols-3"
            >
              {steps.map((s) => (
                <motion.div key={s.k} variants={reduce ? undefined : reveal}>
                  <span className="font-mono text-sm font-medium text-accent">{s.k}</span>
                  <h3 className="mt-3 text-lg font-medium text-text-primary">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{s.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="pb-28">
          <Section className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <BrandMark size="lg" className="text-accent" />
            <h2
              className="mt-6 text-balance font-semibold text-text-primary"
              style={{
                fontSize: "var(--text-title-lg)",
                lineHeight: "var(--text-title-lg-line-height)",
                letterSpacing: "var(--text-title-lg-tracking)",
              }}
            >
              Stop losing money to missed deadlines.
            </h2>
            <p className="mt-3 text-text-secondary" style={{ fontSize: "var(--text-body)" }}>
              Set it up in two minutes. Receipt Guardian watches the windows for you.
            </p>
            <Button asChild variant="primary" size="lg" className="mt-8">
              <Link href="/signup">
                Create your account
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
          </Section>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-wide flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-text-muted sm:flex-row md:px-8">
          <div className="inline-flex items-center gap-2">
            <BrandMark size="sm" className="text-text-muted" />
            <span>Receipt Guardian</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/pricing" className="rounded-sm transition-colors hover:text-text-secondary">Pricing</Link>
            <Link href="/login" className="rounded-sm transition-colors hover:text-text-secondary">Log in</Link>
            <Link href="/signup" className="rounded-sm transition-colors hover:text-text-secondary">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * A static, token-built mock of the dashboard hero card. No real data,
 * no screenshots — just a faithful, original representation rendered with
 * the same primitives so the landing previews the product honestly.
 */
function ShowcaseMock() {
  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <div className="relative overflow-hidden rounded-lg border border-border bg-surface shadow-overlay">
        {/* top chrome */}
        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <span className="size-2.5 rounded-full bg-border-strong" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-border-strong" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-border-strong" aria-hidden="true" />
          <span className="ml-3 text-xs text-text-muted">Your return dashboard</span>
        </div>

        <div className="grid gap-5 p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-muted">Money at risk</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-text-primary">
                $1,240
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-pill border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
              <Clock className="size-3" aria-hidden="true" />2 due soon
            </span>
          </div>

          <div className="grid gap-3">
            {[
              { store: "Nike", item: "Air Max 270", days: "2 days left", tone: "warning" as const },
              { store: "Apple", item: "USB-C Adapter", days: "9 days left", tone: "success" as const },
              { store: "IKEA", item: "Desk lamp", days: "21 days left", tone: "success" as const },
            ].map((r) => (
              <div
                key={r.store}
                className="flex items-center justify-between rounded-md border border-border bg-canvas-raised px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{r.store}</p>
                  <p className="truncate text-xs text-text-secondary">{r.item}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-pill px-2.5 py-1 text-xs font-medium",
                    r.tone === "warning"
                      ? "bg-warning/10 text-warning"
                      : "bg-success/10 text-success",
                  )}
                >
                  {r.days}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
