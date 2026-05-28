"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Loader } from "@/components/ui/loaders";

/**
 * `<TestExtractionForm>` — Premium UI Redesign (task 8.7).
 *
 * Two-card flow for the dual-AI extraction tool. The redesigned form
 * keeps the developer-tool tone of the page (mono prompt/output, JSON
 * pretty-printed in a `<pre>` block) but routes every surface, color,
 * and font choice through the redesigned tokens (Requirement 9.7).
 *
 * Behavior is preserved from the pre-redesign component:
 *   - The textarea is pre-filled with `sampleEmail` so the page is
 *     usable without copy-pasting test data.
 *   - Submitting POSTs to `/api/extract` (contract unchanged per
 *     Requirement 14.1) and renders the JSON response in the result
 *     card.
 *   - Toasts surface both success ("Receipt fields extracted") and
 *     review-needed ("Extraction needs review") states.
 *
 * Loading affordance follows the redesigned vocabulary (Requirement
 * 6.8, 8.6): the submit button swaps its label "Extract receipt" →
 * "Extracting receipt" and renders `<Loader size="sm" />` inline. There
 * is no indeterminate scan/rail/step animation; the only allowed
 * indeterminate loop on a screen is `<RouteProgress>`.
 *
 * Removed in this rebuild (vs. the pre-redesign form):
 *   - the `<Sparkles>` icon wrapped in a bordered `bg-bg-elevated`
 *     tile with `text-action shadow-inner-hair` (Requirement 7.4
 *     forbids decorative icon tiles; `text-action` and
 *     `shadow-inner-hair` are deprecated).
 *   - the `<ActionLoader variant="extract" compact />` panel rendered
 *     beneath the form (collapsed onto the inline button loader per
 *     Requirement 8.6's single coherent loading vocabulary).
 *   - the `bg-bg-elevated` recessed tone on the JSON pre block (the
 *     redesigned token equivalent is `bg-canvas`, which sits one step
 *     below `bg-surface` for the same recessed effect).
 */
const sampleEmail = `From: orders@example.com
Subject: Your Example Store order

Thanks for your purchase from Example Store on 2026-05-01.
Item: Trail running shoes
Total: $89.99 USD

Returns are accepted until 2026-05-31.`;

export function TestExtractionForm() {
  const [emailText, setEmailText] = useState(sampleEmail);
  const [result, setResult] = useState<unknown>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setResult(null);
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const json = await response.json().catch(() => null);
      setResult(json);

      if (!response.ok) {
        toast.warning("Extraction needs review");
        return;
      }

      toast.success("Receipt fields extracted");
    });
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-1">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-text-primary">
                <Sparkles className="size-5 text-accent" aria-hidden="true" />
                Order email input
              </h2>
              <p className="text-sm leading-6 text-text-secondary">
                Paste any plain-text order confirmation to watch the pipeline
                parse it.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-medium text-text-primary">
              <span className="sr-only">Email body</span>
              <Textarea
                value={emailText}
                onChange={(event) => setEmailText(event.target.value)}
                className="min-h-72 font-mono text-sm leading-6"
              />
            </label>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPending}
                data-loading={isPending ? "true" : undefined}
              >
                {isPending ? (
                  <>
                    <Loader size="sm" label="" />
                    Extracting receipt
                  </>
                ) : (
                  "Extract receipt"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-text-primary">
              Extraction result
            </h2>
            <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
              JSON
            </span>
          </div>
          <pre
            aria-live="polite"
            tabIndex={0}
            className="min-h-36 overflow-auto rounded-md border border-border bg-canvas p-4 font-mono text-xs leading-5 text-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
