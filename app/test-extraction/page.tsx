import { FadeIn } from "@/components/motion/motion-primitives";
import { TestExtractionForm } from "@/components/ai/test-extraction-form";
import { AmbientBackground } from "@/components/visual/ambient-background";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function TestExtractionPage() {
  await requireUser();

  return (
    <>
      <AmbientBackground variant="app" />
      <main className="relative mx-auto min-h-screen w-full max-w-4xl px-6 py-10 md:px-8 md:py-14">
        <FadeIn>
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-text-muted">
              Developer tools
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.015em] text-text-primary md:text-4xl">
              Test email extraction
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary md:text-[15px]">
              Paste an anonymized order email. Gemini is tried first; Groq is
              used automatically when Gemini is unavailable or low confidence.
            </p>
          </div>
        </FadeIn>
        <FadeIn delay={0.08}>
          <TestExtractionForm />
        </FadeIn>
      </main>
    </>
  );
}
