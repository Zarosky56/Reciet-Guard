import { dirname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Custom rules live under `eslint-rules/` (CJS so they can be authored as
// plain ESLint rule modules without a build step).
const noRawColorRule = require("./eslint-rules/no-raw-color.js");
const noArbitrarySpacingRule = require("./eslint-rules/no-arbitrary-spacing.js");

const localRules = {
  rules: {
    "no-raw-color": noRawColorRule,
    "no-arbitrary-spacing": noArbitrarySpacingRule,
  },
};

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "dist/**",
      "out/**",
    ],
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  // Custom plugin registration:
  //   - `local/no-raw-color` flags raw color literals (hex, rgb, hsl,
  //     oklch, oklab) in user-facing source. Requirement 2.4.
  //   - `local/no-arbitrary-spacing` flags Tailwind arbitrary-value
  //     utilities for spacing/sizing/positioning/typography/grid.
  //     Requirements 3.5, 4.2, 4.5.
  // See `.kiro/specs/premium-ui-redesign/requirements.md`.
  {
    plugins: {
      local: localRules,
    },
  },
  {
    files: [
      "app/**/*.{ts,tsx,js,jsx}",
      "components/**/*.{ts,tsx,js,jsx}",
      "lib/**/*.{ts,tsx,js,jsx}",
    ],
    rules: {
      "local/no-raw-color": "error",
      "local/no-arbitrary-spacing": "error",
    },
  },
  // Token-source allow-list for `local/no-arbitrary-spacing`. These
  // files own the canonical type-scale (`text-*`/`leading-*`/
  // `tracking-*`), grid-track (`grid-cols-*`/`grid-rows-*`), and
  // container/spacing tokens. Arbitrary-value utilities are permitted
  // here because they define the scale rather than consume it.
  // Per-file disable is intentional and survives the Phase 4 cleanup.
  // (`tailwind.config.ts` is already outside the rule's `app/components/lib`
  // scope, but listing it makes the intent explicit and survives any
  // future re-scoping.) Created by tasks 5.2 (grid.tsx) and 12.x docs.
  {
    files: [
      "components/ui/typography.tsx",
      "components/ui/grid.tsx",
      "tailwind.config.ts",
    ],
    rules: {
      "local/no-arbitrary-spacing": "off",
    },
  },
  // ---------------------------------------------------------------------
  // PRE-REDESIGN LEGACY OVERRIDES — `local/no-raw-color`
  //
  // These files contain raw hex/rgb literals from the pre-redesign
  // codebase that will be migrated to tokens during the redesign's
  // Phase 2 (primitives) and Phase 3 (screens) tasks. The rule is
  // suppressed file-locally so `npm run lint` stays green during the
  // migration; the override block is deleted in task 11.x once the
  // tokens have landed and every file references them.
  //
  // Tracking task: see `.kiro/specs/premium-ui-redesign/tasks.md`
  //   - 5.7 Rebuild the <Button> primitive (button.tsx)
  //   - 8.2 Re-skin Login and Signup via shared <AuthShell> (auth-form.tsx)
  //   - 2.3 Replace Inter with Geist Sans in app/layout.tsx
  //   - 11.x Phase 4 cleanup (send-deadline-email.ts — transactional
  //          email HTML; tokens may not be inlinable, may keep
  //          // allow:color markers permanently)
  // ---------------------------------------------------------------------
  {
    files: [
      "app/layout.tsx",
      "components/ui/button.tsx",
      "components/auth/auth-form.tsx",
      "lib/notifications/send-deadline-email.ts",
    ],
    rules: {
      "local/no-raw-color": "off",
    },
  },
  // ---------------------------------------------------------------------
  // PRE-REDESIGN LEGACY OVERRIDES — `local/no-arbitrary-spacing`
  //
  // These files contain Tailwind arbitrary-value utilities for
  // spacing/sizing/positioning/typography/grid that pre-date the
  // redesign's token scale. The rule is suppressed file-locally so
  // `npm run lint` stays green during the migration. Each entry is
  // tagged with the task that will migrate it onto the new scale and
  // remove the override.
  //
  // Tracking task: see `.kiro/specs/premium-ui-redesign/tasks.md`
  //
  // Phase 2 — primitives:
  //   - 5.3  Loaders refactor   (page-loader.tsx, *
  //                              loading.tsx ProcessRail consumers)
  //   - 5.4  Badge primitive    (badge.tsx)
  //   - 5.6  AmbientBackground  (ambient-background.tsx)
  //   - 5.10 Dialog primitive   (dialog.tsx)
  //   - 5.11 PageLoader/RouteProgress
  //                             (page-loader.tsx, route-progress.tsx)
  //   - 5.12 MobileBottomNav    (mobile-bottom-nav.tsx)
  //   - 5.13 DashboardHeader    (dashboard-header.tsx)
  //
  // Phase 2 — auth shell:
  //   - 8.2  Auth shell        (auth-form.tsx)
  //
  // Phase 3 — screens:
  //   - 8.1  Landing           (app/page.tsx)
  //   - 8.3  Dashboard hero    (receipt-dashboard.tsx)
  //   - 8.4  Receipt surfaces  (receipt-card.tsx,
  //                             receipt-empty-state.tsx,
  //                             copy-forwarding-address.tsx)
  //   - 8.6  Settings          (app/(dashboard)/settings/page.tsx,
  //                             app/(dashboard)/settings/loading.tsx)
  //   - 8.7  Test Extraction   (app/test-extraction/page.tsx,
  //                             test-extraction-form.tsx)
  //
  // Plus app/layout.tsx (Toaster `text-[13px]` toast title; will be
  // replaced with the type-scale step `--text-meta` in task 2.3 /
  // 5.x toast styling) and dashboard/loading.tsx (ProcessRail
  // consumer, removed in task 5.3).
  // ---------------------------------------------------------------------
  {
    files: [
      // Layout chrome
      "app/layout.tsx",
      // Landing
      "app/page.tsx",
      // Dashboard / Profile / Settings shells and loading states
      "app/(dashboard)/dashboard/loading.tsx",
      "app/(dashboard)/profile/page.tsx",
      "app/(dashboard)/settings/page.tsx",
      "app/(dashboard)/settings/loading.tsx",
      // Test Extraction route
      "app/test-extraction/page.tsx",
      // AI primitives
      "components/ai/test-extraction-form.tsx",
      // Auth
      "components/auth/auth-form.tsx",
      // Dashboard chrome
      "components/dashboard/dashboard-header.tsx",
      "components/dashboard/mobile-bottom-nav.tsx",
      // Receipts surfaces
      "components/receipts/copy-forwarding-address.tsx",
      "components/receipts/receipt-card.tsx",
      "components/receipts/receipt-dashboard.tsx",
      "components/receipts/receipt-empty-state.tsx",
      // UI primitives that ship arbitrary values today
      "components/ui/badge.tsx",
      "components/ui/dialog.tsx",
      "components/ui/page-loader.tsx",
      "components/ui/route-progress.tsx",
      // Ambient/visual background
      "components/visual/ambient-background.tsx",
    ],
    rules: {
      "local/no-arbitrary-spacing": "off",
    },
  },
];

export default eslintConfig;
