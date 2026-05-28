"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loaders";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

/**
 * Premium UI Redesign — `<AuthForm>` (task 8.2).
 *
 * The form rendered inside `<AuthShell>`. Login and Signup share this
 * component and differ only in: heading copy, body copy, submit button
 * label (idle + pending), and footer link target.
 *
 * Anti-AI-slop clauses honoured (Requirement 9.3, 13):
 *   - Removed the `<ReceiptText>`-in-a-tile mark with `border-conic-soft`
 *     halo and `shadow-inner-hair` highlight. The brand mark moved to
 *     `<AuthShell>` and renders via the typographic `<BrandMark>` SVG.
 *   - Removed the `<FadeIn>` page-level entrance animation.
 *   - Removed `backdrop-blur-[1px]` on the card chrome.
 *   - Removed the `<ActionLoader>` scan-glyph that rendered below the
 *     submit button during pending — the redesigned vocabulary uses a
 *     single static `<Loader size="sm" />` inside the button.
 *   - Removed the `text-action` accent from the footer link in favor
 *     of the redesigned `text-accent` token.
 *
 * Implements Requirements 9.3, 13.13.
 */
export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const authCall =
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
              },
            });

      const { error } = await authCall;

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(mode === "login" ? "Welcome back" : "Account created");
      router.push(next);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignup = mode === "signup";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold leading-tight tracking-[-0.015em] text-text-primary">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          {isSignup
            ? "Use the same email you plan to forward receipts from."
            : "Sign in to open your dashboard."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4" aria-busy={isSubmitting}>
        <label className="grid gap-2 text-sm font-medium text-text-primary">
          Email
          <Input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-text-primary">
          Password
          <Input
            required
            minLength={6}
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={isSubmitting}
          data-loading={isSubmitting ? "true" : undefined}
        >
          {isSubmitting ? (
            <>
              <Loader size="sm" label="" />
              {isSignup ? "Creating account" : "Signing in"}
            </>
          ) : (
            <>
              {isSignup ? "Create account" : "Sign in"}
              <ArrowRight data-icon aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="rounded-sm font-medium text-accent transition-colors duration-quick ease-standard hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
