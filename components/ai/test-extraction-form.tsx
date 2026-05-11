"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

  function onSubmit() {
    startTransition(async () => {
      setResult(null);
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText }),
      });
      const json = await response.json();
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
        <CardContent className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium text-text-primary">
            Email body
            <textarea
              value={emailText}
              onChange={(event) => setEmailText(event.target.value)}
              className="min-h-72 rounded-lg border border-border bg-bg p-4 text-sm leading-6 text-text-primary outline-none transition focus:border-border-focus"
            />
          </label>
          <div className="flex justify-end">
            <Button onClick={onSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Extract receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="mb-3 text-base font-medium text-text-primary">
            Extraction result
          </h2>
          <pre className="min-h-36 overflow-auto rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-5 text-text-secondary">
            {result ? JSON.stringify(result, null, 2) : "No result yet."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
