"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

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
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
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
    });
  }

  const isSignup = mode === "signup";

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-primary">
            {isSignup ? "Create your account" : "Log in"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {isSignup
              ? "Use the same email you will forward receipts from."
              : "Open your receipt dashboard."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-text-primary">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-primary">
            Password
            <input
              required
              minLength={6}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-lg border border-border bg-bg px-3 text-sm text-text-primary outline-none transition focus:border-border-focus"
            />
          </label>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isSignup
                ? "Creating..."
                : "Logging in..."
              : isSignup
                ? "Sign up"
                : "Log in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          {isSignup ? "Already have an account?" : "New here?"}{" "}
          <Link
            href={isSignup ? "/login" : "/signup"}
            className="text-action transition hover:text-blue-300"
          >
            {isSignup ? "Log in" : "Create an account"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
