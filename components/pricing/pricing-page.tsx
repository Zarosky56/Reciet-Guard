"use client";

import Link from "next/link";
import { ArrowRight, Check, Info } from "lucide-react";
import { useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const plans = [
  {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "For light personal tracking.",
    cta: "Start free",
    href: "/signup?plan=free",
    features: [
      "Manual receipt tracking",
      "Basic return reminders",
      "Limited monthly imports",
      "PWA install prompt",
    ],
  },
  {
    name: "Plus",
    monthly: 4,
    yearly: 39,
    description: "For regular shoppers who want reminders to run quietly.",
    cta: "Choose Plus",
    href: "/signup?plan=plus",
    featured: true,
    features: [
      "Unlimited manual receipts",
      "Gmail import",
      "Email and app notifications",
      "Attachment storage",
      "Warranty tracking",
    ],
  },
  {
    name: "Pro",
    monthly: 9,
    yearly: 89,
    description: "For families and power users with higher volume.",
    cta: "Choose Pro",
    href: "/signup?plan=pro",
    features: [
      "Family/shared usage",
      "Higher storage limits",
      "Priority extraction",
      "Export tools",
      "Advanced warranty history",
    ],
  },
];

export function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  return (
    <main className="min-h-screen bg-canvas text-text-primary">
      <header className="border-b border-border bg-canvas-raised">
        <div className="mx-auto flex h-16 w-full max-w-wide items-center justify-between px-6 md:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            <BrandMark size="md" className="text-accent" />
            <span className="text-base font-semibold tracking-tight">
              Receipt Guardian
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-wide px-6 py-14 md:px-8 md:py-20">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Pricing
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary md:text-6xl">
            Simple plans for keeping receipts useful.
          </h1>
          <p className="mt-4 text-sm leading-6 text-text-secondary md:text-base">
            Prices are a first public draft based on comparable receipt,
            expense, and productivity tools. Payment processing is not connected
            yet, so plan buttons route to account creation for now.
          </p>
        </div>

        <div className="mt-8 inline-flex rounded-md border border-border bg-surface p-1">
          {(["monthly", "yearly"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setBilling(mode)}
              className={cn(
                "h-9 rounded-sm px-4 text-sm font-medium capitalize transition-colors",
                billing === mode
                  ? "bg-accent-tint text-text-primary"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const price = billing === "monthly" ? plan.monthly : plan.yearly;
            const suffix = billing === "monthly" ? "/mo" : "/yr";
            return (
              <article
                key={plan.name}
                className={cn(
                  "flex min-h-full flex-col rounded-lg border bg-surface p-6",
                  plan.featured ? "border-accent" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      {plan.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {plan.description}
                    </p>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full border border-accent bg-accent-tint px-2.5 py-1 text-xs text-text-primary">
                      Popular
                    </span>
                  ) : null}
                </div>

                <div className="mt-6">
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    ${price}
                  </span>
                  <span className="ml-1 text-sm text-text-muted">{suffix}</span>
                  {billing === "yearly" && plan.monthly > 0 ? (
                    <p className="mt-1 text-xs text-success">
                      Saves ${plan.monthly * 12 - plan.yearly} yearly
                    </p>
                  ) : null}
                </div>

                <ul className="mt-6 grid gap-3 text-sm text-text-secondary">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-6 w-full" variant={plan.featured ? "primary" : "secondary"}>
                  <Link href={plan.href}>
                    {plan.cta}
                    <ArrowRight data-icon aria-hidden="true" />
                  </Link>
                </Button>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-text-secondary">
          <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <p>
            Stripe Checkout should be connected before charging customers. Until
            then, upgrade actions are intentionally non-billing routes.
          </p>
        </div>
      </section>
    </main>
  );
}
