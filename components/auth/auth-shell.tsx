import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Premium UI Redesign — `<AuthShell>` composition (task 8.2).
 *
 * Shared layout wrapper for `/login` and `/signup`. Renders a centered
 * `<Card>` at `--container-auth` with the `<BrandMark>` and wordmark
 * stacked above the card. The two auth screens differ only in heading
 * copy, submit button label, and footer link — all of which live in
 * the form rendered as `children`.
 *
 * Anti-AI-slop clauses honoured (Requirement 9.3, 13):
 *   - No `bg-scene-auth` ambient background.
 *   - No `border-conic-soft` halo on the brand mark.
 *   - No FadeIn / page-level entrance animation.
 *   - No backdrop-blur on the card chrome.
 *   - No decorative tile around the brand mark.
 *
 * Implements Requirements 9.3, 13.13.
 * Spec: design.md → "Login (`/login`) and Signup (`/signup`)" section.
 */
export interface AuthShellProps {
  /**
   * Form content rendered inside the centered card. Typically the
   * `<AuthForm>` component, optionally wrapped in `<Suspense>` to
   * satisfy `useSearchParams`.
   */
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-auth flex-col items-center">
        <Link
          href="/"
          aria-label="Receipt Guardian home"
          className="mb-6 inline-flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          <BrandMark size="md" className="text-accent" />
          <span className="text-base font-semibold tracking-tight text-text-primary">
            Receipt Guardian
          </span>
        </Link>
        <Card className="w-full">
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
