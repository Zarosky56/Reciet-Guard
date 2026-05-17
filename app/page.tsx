import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  MailCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  FadeIn,
  Stagger,
  StaggerItem,
} from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AmbientBackground } from "@/components/visual/ambient-background";

const proofPoints = [
  {
    icon: MailCheck,
    title: "Forward or paste",
    text: "Send order emails to your intake inbox or drop one in directly.",
  },
  {
    icon: Sparkles,
    title: "AI reads the deadline",
    text: "Gemini extracts first, Groq covers the edges, you review anything uncertain.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    text: "Edit fields, mark outcomes, and get one quiet three-day warning.",
  },
];

const metrics = [
  { label: "Avg. extraction", value: "1.4s" },
  { label: "Providers", value: "2" },
  { label: "Reminder window", value: "3 days" },
];

export default function HomePage() {
  return (
    <>
      <AmbientBackground variant="hero" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 md:px-8 md:py-8">
        <FadeIn
          as="header"
          className="flex items-center justify-between"
          duration={0.45}
        >
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label="Receipt Guardian home"
          >
            <span
              className="border-conic-soft relative flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-action shadow-inner-hair"
              aria-hidden="true"
            >
              <ReceiptText className="size-4" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-text-primary">
              Receipt Guardian
            </span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">
                Sign up
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </FadeIn>

        <section className="flex flex-1 flex-col justify-center py-16 md:py-24">
          <FadeIn delay={0.08} y={14}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-text-secondary shadow-inner-hair">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-glow-pulse rounded-full bg-action" />
                <span className="relative rounded-full bg-action" />
              </span>
              Quiet deadlines. Loud savings.
            </span>
          </FadeIn>

          <FadeIn delay={0.16} y={18} className="mt-5 max-w-3xl">
            <h1 className="text-balance text-[42px] font-semibold leading-[1.02] tracking-[-0.025em] md:text-[68px] md:leading-[1.02]">
              <span className="text-gradient-primary">
                Never miss a return window again.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.24} className="mt-6 max-w-2xl">
            <p className="text-[15px] leading-7 text-text-secondary md:text-lg md:leading-8">
              Receipt Guardian turns order emails into a calm deadline
              dashboard. Track returns, warranties, and money at risk without a
              spreadsheet.
            </p>
          </FadeIn>

          <FadeIn delay={0.32} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-[15px]">
              <Link href="/signup">
                Start tracking
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-12 px-6 text-[15px]"
            >
              <Link href="/login">Open dashboard</Link>
            </Button>
          </FadeIn>

          <FadeIn
            delay={0.42}
            className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-3 text-sm text-text-muted"
          >
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className="flex items-baseline gap-2.5 border-l border-border/70 pl-4 first:border-l-0 first:pl-0"
              >
                <span className="font-mono text-base font-semibold tracking-tight text-text-primary tabular-nums">
                  {m.value}
                </span>
                <span className="text-[11px] uppercase tracking-wider">
                  {m.label}
                </span>
                <span className="sr-only">{i + 1}</span>
              </div>
            ))}
          </FadeIn>

          <Stagger className="mt-16 grid gap-4 md:mt-20 md:grid-cols-3">
            {proofPoints.map((item, idx) => (
              <StaggerItem key={item.title}>
                <Card data-interactive="true" className="h-full">
                  <CardContent className="flex h-full flex-col p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-bg-elevated text-action shadow-inner-hair">
                        <item.icon className="size-[18px]" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-[11px] text-text-muted">
                        0{idx + 1}
                      </span>
                    </div>
                    <h2 className="mt-6 text-[15px] font-medium text-text-primary">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {item.text}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <FadeIn
            delay={0.55}
            className="mt-16 flex items-center justify-center gap-2 text-xs text-text-muted md:mt-24"
          >
            <CalendarClock className="size-3.5" aria-hidden="true" />
            Built for the week your return window quietly closes.
          </FadeIn>
        </section>
      </main>
    </>
  );
}
