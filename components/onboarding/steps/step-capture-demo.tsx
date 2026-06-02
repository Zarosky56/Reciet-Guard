/**
 * StepCaptureDemo — Onboarding step 3: camera capture illustration.
 *
 * Renders a static inline SVG of a phone outline with a receipt/document
 * frame inside, plus the headline and body copy explaining the capture
 * feature. Uses only redesigned tokens (stroke-border, text-text-primary,
 * text-text-secondary, currentColor).
 *
 * Constraints (Requirements 1.4, 1.12, 7.5, 7.12):
 *   - No media elements, no animated GIF
 *   - No gradient utility, no bg-clip-text, no aurora layer
 *   - Only transform/opacity animations allowed (none used here — static)
 *   - Token-coloured outline drawing only
 */

export function StepCaptureDemo() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      {/* Static SVG illustration — phone with receipt frame */}
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
        {/* Phone body */}
        <rect x={32} y={8} width={96} height={184} rx={16} ry={16} />

        {/* Screen area */}
        <rect x={40} y={28} width={80} height={144} rx={4} ry={4} className="stroke-border-strong" />

        {/* Top speaker notch */}
        <line x1={68} y1={18} x2={92} y2={18} strokeLinecap="round" />

        {/* Receipt inside screen */}
        <rect x={52} y={44} width={56} height={72} rx={2} ry={2} className="stroke-accent" />

        {/* Receipt lines (text placeholders) */}
        <line x1={58} y1={56} x2={96} y2={56} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={66} x2={88} y2={66} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={76} x2={92} y2={76} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={86} x2={80} y2={86} className="stroke-accent" opacity={0.6} />
        <line x1={58} y1={100} x2={96} y2={100} className="stroke-accent" opacity={0.5} />

        {/* Camera shutter button */}
        <circle cx={80} cy={148} r={12} className="stroke-text-primary" />
        <circle cx={80} cy={148} r={8} className="stroke-text-primary" />
      </svg>

      {/* Headline */}
      <h2 className="mt-8 text-xl font-semibold text-text-primary">
        Snap any paper receipt
      </h2>

      {/* Body */}
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
        Tap Capture, point your camera, and we read the receipt for you.
      </p>
    </div>
  );
}
