"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { ActionLoader, ButtonLoader } from "@/components/ui/loaders";

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
        <CardContent className="p-6">
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="flex items-start gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-bg-elevated text-action shadow-inner-hair">
                <Sparkles className="size-[18px]" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
                  Order email input
                </h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  Paste any plain-text order confirmation to watch the pipeline
                  parse it.
                </p>
              </div>
            </div>

            <label className="grid gap-2 text-sm font-medium text-text-primary">
              <span className="sr-only">Email body</span>
              <Textarea
                value={emailText}
                onChange={(event) => setEmailText(event.target.value)}
                className="min-h-64 p-4"
              />
            </label>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isPending}
                data-loading={isPending ? "true" : undefined}
              >
                {isPending ? (
                  <ButtonLoader variant="extract" />
                ) : null}
                {isPending ? "Extracting receipt" : "Extract receipt"}
              </Button>
            </div>
            {isPending ? <ActionLoader variant="extract" compact /> : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-text-primary">
              Extraction result
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
              JSON
            </span>
          </div>
          <pre
            aria-live="polite"
            tabIndex={0}
            className="min-h-36 overflow-auto rounded-lg border border-border bg-bg-elevated p-4 font-mono text-xs leading-5 text-text-secondary shadow-inner-hair focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
          >
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
