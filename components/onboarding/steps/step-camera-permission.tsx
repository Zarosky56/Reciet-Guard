import { Camera } from "lucide-react";

export function StepCameraPermission() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Camera className="size-12 text-accent" aria-hidden="true" />
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-text-primary">
        Camera stays optional
      </h2>
      <p className="mt-3 max-w-xs text-sm leading-6 text-text-secondary">
        You can scan paper receipts when needed. Browser permission appears only
        after you tap camera capture.
      </p>
    </div>
  );
}
