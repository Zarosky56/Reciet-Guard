"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ReceiptText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FadeIn } from "@/components/motion/motion-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ActionLoader, ButtonLoader } from "@/components/ui/loaders";

type AuthMode = "login" | "signup";

interface AuthFormProps {
  mode: AuthMode;
}

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
    <FadeIn className="w-full max-w-md" duration={0.5}>
      <div className="mb-8 flex flex-col items-center text-center">
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          aria-label="Receipt Guardian home"
        >
          <span
            className="border-conic-soft relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-action shadow-inner-hair"
            aria-hidden="true"
          >
            <ReceiptText className="size-[18px]" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-text-primary">
            Receipt Guardian
          </span>
        </Link>
      </div>

      <Card className="backdrop-blur-[1px]">
        <CardContent className="p-7">
          <div className="mb-6">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.015em] text-text-primary">
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {isSignup
                ? "Use the same email you plan to forward receipts from."
                : "Sign in to open your quiet deadline dashboard."}
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
                className="h-11"
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
                className="h-11"
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
                  <ButtonLoader variant="auth" />
                  {isSignup ? "Creating account" : "Signing in securely"}
                </>
              ) : (
                <>
                  {isSignup ? "Create account" : "Sign in"}
                  <ArrowRight data-icon aria-hidden="true" />
                </>
              )}
            </Button>
            {isSubmitting ? (
              <ActionLoader
                variant="auth"
                compact
                title={isSignup ? "Creating your account" : "Verifying your account"}
                description={
                  isSignup
                    ? "Email, account, dashboard"
                    : "Account, session, dashboard"
                }
              />
            ) : null}
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {isSignup ? "Already have an account?" : "New here?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="rounded-md font-medium text-action transition-colors hover:text-[#8db0ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </FadeIn>
  );
}
