/**
 * StepValue — Onboarding step 2 (value proposition).
 *
 * Displays the headline "Track every return window" and body copy
 * "We watch the deadlines so you don't have to." using redesigned
 * tokens only. No gradient, no bg-clip-text, no aurora layer.
 *
 * Requirements: 1.4, 1.12
 */

export function StepValue() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h2
        className="text-text-primary font-semibold tracking-tight"
        style={{
          fontSize: "var(--text-display)",
          lineHeight: "var(--text-display-line-height)",
          letterSpacing: "var(--text-display-tracking)",
          fontWeight: "var(--text-display-weight)",
        }}
      >
        Track every return window
      </h2>
      <p
        className="mt-4 text-text-secondary"
        style={{
          fontSize: "var(--text-body-lg)",
          lineHeight: "var(--text-body-lg-line-height)",
          letterSpacing: "var(--text-body-lg-tracking)",
          fontWeight: "var(--text-body-lg-weight)",
        }}
      >
        We watch the deadlines so you don&apos;t have to.
      </p>
    </div>
  );
}
