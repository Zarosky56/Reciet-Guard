import Image from "next/image";

import { BrandMark } from "@/components/brand/brand-mark";

/**
 * StepCover — the first step of the mobile onboarding flow.
 *
 * Renders the brand mark next to the "Receipt Guardian" wordmark and a
 * single body line. Uses only redesigned tokens. No gradient utility,
 * no bg-clip-text, no aurora layer, no conic border, no backdrop-blur,
 * no Lucide icon in a tile.
 *
 * Requirements: 1.4, 1.12, 7.10
 */
export function StepCover() {
  return (
    <div className="flex flex-1 flex-col justify-center overflow-y-auto px-5 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-md border border-border bg-surface">
          <Image
            src="/onboarding/receipt-setup-visual.svg"
            alt=""
            fill
            priority
            sizes="(max-width: 380px) 80vw, 288px"
            className="object-cover"
          />
        </div>

        <div className="flex items-center gap-2">
          <BrandMark size="md" className="text-accent" />
          <span className="text-xl font-semibold tracking-tight text-text-primary">
            Receipt Guardian
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Set up return protection
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Pick your currency, reminders, and first receipt path in under a minute.
          </p>
        </div>
      </div>
    </div>
  );
}

export default StepCover;
