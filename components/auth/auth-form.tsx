"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
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
  const message = searchParams.get("message");
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);

  useEffect(() => {
    if (mode === "login" && message === "account-exists") {
      toast.info("Account already exists. Please sign in.");
    }
  }, [message, mode]);

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

      const { data, error } = await authCall;

      if (error) {
        if (
          mode === "signup" &&
          error.message.toLowerCase().includes("already")
        ) {
          toast.info("Account already exists. Please sign in.");
          router.push(`/login?email=${encodeURIComponent(email)}`);
          return;
        }

        toast.error(error.message);
        return;
      }

      const existingSignup =
        mode === "signup" &&
        data.user &&
        Array.isArray(data.user.identities) &&
        data.user.identities.length === 0;

      if (existingSignup) {
        toast.info("Account already exists. Please sign in.");
        router.push(
          `/login?message=account-exists&email=${encodeURIComponent(email)}`,
        );
        return;
      }

      toast.success(mode === "login" ? "Welcome back" : "Account created");

      // Route admins to /admin, everyone else to `next`. We only
      // override the destination when the user explicitly didn't
      // request a specific `next` target.
      let destination = next;
      if (mode === "login" && next === "/dashboard") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (profile?.role === "admin") {
            destination = "/admin";
          }
        }
      }

      router.push(destination);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onGoogleAuth() {
    setIsOAuthSubmitting(true);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo.toString(),
        },
      });

      if (error) {
        toast.error(error.message);
        setIsOAuthSubmitting(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed.");
      setIsOAuthSubmitting(false);
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

      <div className="grid gap-3">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full"
          disabled={isSubmitting || isOAuthSubmitting}
          data-loading={isOAuthSubmitting ? "true" : undefined}
          onClick={onGoogleAuth}
        >
          {isOAuthSubmitting ? (
            <>
              <Loader size="sm" label="" />
              Redirecting to Google
            </>
          ) : (
            <>
              <span
                aria-hidden="true"
                className="inline-flex size-5 items-center justify-center rounded-xs border border-border bg-canvas font-semibold text-text-primary"
              >
                G
              </span>
              Continue with Google
            </>
          )}
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-text-muted">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4" aria-busy={isSubmitting}>
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
          disabled={isSubmitting || isOAuthSubmitting}
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
