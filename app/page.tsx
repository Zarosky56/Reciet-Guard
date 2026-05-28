import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Grid } from "@/components/ui/grid";
import { AmbientBackground } from "@/components/visual/ambient-background";

/**
 * Landing page (`/`) — Premium UI Redesign, task 8.1.
 *
 * Composition (per `.kiro/specs/premium-ui-redesign/design.md` →
 * "Screens (Layer 4)" → "Landing"):
 *
 *   - One ambient element only: `<AmbientBackground variant="hero" />`
 *     (Requirement 13.13, 13.14 — at most one decorative element).
 *   - No `FadeIn`/`Stagger` entrance animations on the hero or proof
 *     grid (Requirements 6.2, 13.8). The page renders statically.
 *   - No `bg-grid-faint`, `bg-scene-hero`, `text-gradient-primary`,
 *     or `border-conic-soft` (Requirement 9.2, 13.3, 13.4, 13.6).
 *   - Eyebrow phrase is the approved noun-phrase voice work
 *     ("Receipts. Returns. Deadlines.") replacing the banned
 *     "Quiet deadlines. Loud savings." copy (Requirement 13.11).
 *   - `<main>` is constrained to `max-w-wide` (= `--container-wide`,
 *     72rem) per Requirement 4.4 / 15.7.
 *   - Hero stack: display heading, lede paragraph
 *     (`--text-body-lg` / `text-text-secondary`), two CTAs
 *     (`primary` "Sign up" + `secondary` "Log in"), 3-card proof-points
 *     row via `<Grid cols={3} gap="card">`.
 *
 * Type-scale sizes are referenced via the `--text-*` CSS custom
 * properties defined in `app/globals.css`. Inline `style` is used for
 * font-size / line-height / letter-spacing so the screen consumes the
 * documented tokens directly without introducing arbitrary Tailwind
 * utilities. Font weight maps to existing Tailwind utilities
 * (`font-semibold` = 600 = `--text-display-weight`,
 *  `font-medium` = 500 = `--text-title-sm-weight` / `--text-caption-weight`).
 */

const proofPoints = [
  {
    title: "Forward or paste",
    text: "Send order emails to your intake inbox or drop one in directly.",
  },
  {
    title: "AI reads the deadline",
    text: "Gemini extracts first, Groq covers the edges, you review anything uncertain.",
  },
  {
    title: "Stay in control",
    text: "Edit fields, mark outcomes, and get one quiet three-day warning.",
  },
];

export default function HomePage() {
  return (
    <>
      <AmbientBackground variant="hero" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-wide flex-col px-6 py-8 md:px-8">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
            aria-label="Receipt Guardian home"
          >
            <BrandMark size="md" className="text-accent" />
            <span
              className="font-semibold"
              style={{
                fontSize: "var(--text-title-sm)",
                letterSpacing: "var(--text-title-sm-tracking)",
              }}
            >
              Receipt Guardian
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/signup">
                Sign up
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16 md:py-20">
          <p
            className="font-medium uppercase text-text-muted"
            style={{
              fontSize: "var(--text-caption)",
              lineHeight: "var(--text-caption-line-height)",
              letterSpacing: "var(--text-caption-tracking)",
            }}
          >
            Receipts. Returns. Deadlines.
          </p>

          <h1
            className="mt-5 max-w-3xl text-balance font-semibold text-text-primary"
            style={{
              fontSize: "var(--text-display)",
              lineHeight: "var(--text-display-line-height)",
              letterSpacing: "var(--text-display-tracking)",
            }}
          >
            Never miss a return window again.
          </h1>

          <p
            className="mt-6 max-w-2xl text-text-secondary"
            style={{
              fontSize: "var(--text-body-lg)",
              lineHeight: "var(--text-body-lg-line-height)",
            }}
          >
            Receipt Guardian turns order emails into a calm deadline
            dashboard. Track returns, warranties, and money at risk without a
            spreadsheet.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg">
              <Link href="/signup">
                Sign up
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">Log in</Link>
            </Button>
          </div>

          <Grid cols={3} gap="card" className="mt-16">
            {proofPoints.map((item, idx) => (
              <Card key={item.title} data-interactive="true">
                <CardContent className="flex h-full flex-col">
                  <span
                    className="font-mono font-medium uppercase text-text-muted"
                    style={{
                      fontSize: "var(--text-caption)",
                      lineHeight: "var(--text-caption-line-height)",
                      letterSpacing: "var(--text-caption-tracking)",
                    }}
                  >
                    0{idx + 1}
                  </span>
                  <h2
                    className="mt-4 font-medium text-text-primary"
                    style={{
                      fontSize: "var(--text-title-sm)",
                      lineHeight: "var(--text-title-sm-line-height)",
                      letterSpacing: "var(--text-title-sm-tracking)",
                    }}
                  >
                    {item.title}
                  </h2>
                  <p
                    className="mt-2 text-text-secondary"
                    style={{
                      fontSize: "var(--text-body)",
                      lineHeight: "var(--text-body-line-height)",
                    }}
                  >
                    {item.text}
                  </p>
                </CardContent>
              </Card>
            ))}
          </Grid>
        </section>
      </main>
    </>
  );
}
