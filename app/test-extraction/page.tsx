import { TestExtractionForm } from "@/components/ai/test-extraction-form";

export const dynamic = "force-dynamic";

export default function TestExtractionPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-8 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-text-primary">
          Test email extraction
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          Paste an anonymized order email. Gemini is tried first; Groq is used
          automatically when Gemini is unavailable or low confidence.
        </p>
      </div>
      <TestExtractionForm />
    </main>
  );
}
