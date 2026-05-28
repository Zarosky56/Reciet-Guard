import { TestExtractionForm } from "@/components/ai/test-extraction-form";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Test Extraction page — Premium UI Redesign (task 8.7).
 *
 * Developer/debugging surface for the dual-AI extraction pipeline. The
 * redesign retains the developer-tool tone (mono code blocks, JSON
 * output area) while routing every color, font, and surface choice
 * through the redesigned tokens.
 *
 * Layout (design-system/test-extraction.md, design.md "Container width
 * tokens"):
 *   - `<main>` constrained by `max-w-content` (56rem). Single-column
 *     stack of two cards (input → output) — no multi-column grid
 *     (Requirement 4.5).
 *   - No `AmbientBackground` — the redesigned `"hero"` band is reserved
 *     for the landing route; app/dev-tool pages render on the bare
 *     canvas (Requirement 5.6, 13.9, 13.10).
 *   - No entrance animation per the page-level spec ("Page Animations:
 *     None. Static render.") and Requirement 6.2 (no page-level enter
 *     animations on any In_Scope_Screen).
 *
 * Vertical rhythm (design.md "Vertical rhythm"):
 *   - Section gap (header → form) : `gap-8`  (32px)
 *   - Card-internal gap           : `gap-4`  (16px)
 *
 * Implements: Requirement 9.7.
 */
export default async function TestExtractionPage() {
  await requireUser();

  return (
    <main className="mx-auto min-h-screen w-full max-w-content px-4 py-8 sm:px-6 md:px-8 md:py-10">
      <div className="grid gap-8">
        <header className="grid gap-2">
          <p className="text-xs uppercase tracking-wider text-text-muted">
            Developer tools
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
            Test email extraction
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            Paste an anonymized order email. Gemini is tried first; Groq is
            used automatically when Gemini is unavailable or low confidence.
          </p>
        </header>

        <TestExtractionForm />
      </div>
    </main>
  );
}
