import { Loader } from "@/components/ui/loaders";

/**
 * Settings route loading state — Premium UI Redesign (task 8.6).
 *
 * Renders the single redesigned `<Loader>` vocabulary (a static accent
 * dot + label) per Requirements 6.8 and 8.6. The pre-redesign
 * `ledger-scan` glyph and `ProcessRail` indeterminate loop are removed.
 */
export default function SettingsLoading() {
  return (
    <div className="fixed inset-x-0 top-16 bottom-16 z-20 flex items-center justify-center md:bottom-0">
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <Loader size="md" label="Loading settings" />
        <p className="text-xs text-text-muted">Preparing your preferences</p>
      </div>
    </div>
  );
}
