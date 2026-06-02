/**
 * StepUploadDemo — Onboarding step 4: file upload illustration.
 *
 * Renders a static inline SVG of a document with an upward arrow,
 * plus the headline and body copy explaining the upload feature.
 * Uses only redesigned tokens (stroke-border, stroke-accent,
 * text-text-primary, text-text-secondary, currentColor).
 *
 * Constraints (Requirements 1.4, 1.12, 7.5):
 *   - No animation, no gradient, no bg-clip-text, no aurora
 *   - Only redesigned tokens
 *   - Static inline SVG with token-based colors
 */

export function StepUploadDemo() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      {/* Static SVG illustration — document with upload arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={160}
        height={200}
        viewBox="0 0 160 200"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-border"
      >
        {/* Document body with folded corner */}
        <path
          d="M44 24 h52 l20 20 v132 a4 4 0 0 1 -4 4 H48 a4 4 0 0 1 -4 -4 V28 a4 4 0 0 1 4 -4 Z"
          className="stroke-border-strong"
        />

        {/* Folded corner flap */}
        <path d="M96 24 v16 a4 4 0 0 0 4 4 h16" className="stroke-border-strong" />

        {/* Document text lines */}
        <line x1={58} y1={68} x2={102} y2={68} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={80} x2={94} y2={80} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={92} x2={98} y2={92} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={104} x2={86} y2={104} className="stroke-accent" opacity={0.6} />

        {/* Upload arrow */}
        <line x1={80} y1={160} x2={80} y2={128} className="stroke-accent" />
        <polyline points="68,140 80,128 92,140" className="stroke-accent" />
      </svg>

      {/* Headline */}
      <h2 className="mt-8 text-xl font-semibold text-text-primary">
        Upload PDFs and screenshots
      </h2>

      {/* Body */}
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        We accept PNG, JPEG, WEBP, and PDF up to 10 MB.
      </p>
    </div>
  );
}
