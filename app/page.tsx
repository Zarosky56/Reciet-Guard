import Link from "next/link";
import { ArrowRight, MailCheck, ReceiptText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const proofPoints = [
  {
    icon: MailCheck,
    title: "Forward or paste",
    text: "Send order emails to the shared inbox or paste one directly.",
  },
  {
    icon: ReceiptText,
    title: "AI extracts the deadline",
    text: "Gemini reads first, Groq catches failures, and weak results need review.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    text: "Edit fields, mark outcomes, and get one helpful 3-day warning.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-8">
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-text-primary">
          Receipt Guardian
        </Link>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </nav>

      <section className="flex flex-1 flex-col justify-center py-14 md:py-20">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold leading-[1.05] text-text-primary md:text-6xl">
            Never miss a return window again.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-text-secondary md:text-lg">
            Receipt Guardian turns order emails into a calm deadline dashboard.
            Track returns, warranties, and money at risk without a spreadsheet.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">
                Start tracking
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/login">Open dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {proofPoints.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <item.icon className="h-5 w-5 text-action" aria-hidden="true" />
                <h2 className="mt-5 text-base font-medium text-text-primary">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {item.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
