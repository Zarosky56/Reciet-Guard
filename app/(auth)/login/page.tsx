import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AmbientBackground } from "@/components/visual/ambient-background";

export default function LoginPage() {
  return (
    <>
      <AmbientBackground variant="auth" />
      <main className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
      </main>
    </>
  );
}
