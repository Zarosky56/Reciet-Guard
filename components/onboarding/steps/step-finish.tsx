/**
 * StepFinish — Onboarding step 5 (completion).
 *
 * Displays the headline "You're set" and body copy "Your dashboard is
 * ready below." using redesigned tokens only. No gradient, no
 * bg-clip-text, no aurora layer.
 *
 * The primary action button ("Get started") is rendered by the parent
 * OnboardingFlow container, not by this step component.
 *
 * Requirements: 1.4, 1.6
 */

export function StepFinish() {
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
        You&apos;re set
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
        Your dashboard is ready below.
      </p>
    </div>
  );
}
