// Feature: premium-ui-redesign
// Custom fast-check arbitraries for the redesign's property tests.
//
// This module is referenced by every property test under
// `design-system/__tests__/*.property.test.ts`. It provides the five
// generators called out in `design.md` → "Generators":
//
//   - arbInScopeScreen   — picks one of the 7 In_Scope_Screen identifiers
//                          and yields a `render` factory.
//   - arbButtonProps     — generates valid (variant, size, children, disabled)
//                          tuples for the redesigned <Button>.
//   - arbReceipt         — generates ReceiptWithUrgency values with realistic
//                          field distributions for <ReceiptCard> rendering.
//   - arbViewport        — picks a width from the documented set
//                          { 360, 768, 1024, 1440, 1920 }.
//   - arbTextContent     — generates short and long strings (incl. unicode
//                          and whitespace) for headings, labels, descriptions.
//
// The render function on `arbInScopeScreen` is wired through an injectable
// registry so this module does not import any not-yet-redesigned screen
// components. Property tests provide the registry once the screens exist
// (Phase 3, tasks 8.1–8.7).

import type { ReactElement } from "react";
import fc from "fast-check";
import type { Receipt, ReceiptStatus, ReceiptWithUrgency, Urgency } from "@/types/receipt";

// ---------------------------------------------------------------------------
// In-scope screens
// ---------------------------------------------------------------------------

export type InScopeScreenName =
  | "Landing"
  | "Login"
  | "Signup"
  | "Dashboard"
  | "Profile"
  | "Settings"
  | "TestExtraction";

export interface InScopeScreen {
  name: InScopeScreenName;
  /** Route path under `app/` for this screen. */
  route: string;
  /**
   * Lazily render the screen as a React element. Property tests inject
   * a registry mapping screen names to render thunks; in the absence of
   * a registry, calling `render()` throws so a forgotten wire-up surfaces
   * loudly instead of silently passing.
   */
  render: () => ReactElement;
}

export type ScreenRenderRegistry = Partial<
  Record<InScopeScreenName, () => ReactElement>
>;

const IN_SCOPE_SCREENS: ReadonlyArray<Omit<InScopeScreen, "render">> = [
  { name: "Landing", route: "/" },
  { name: "Login", route: "/login" },
  { name: "Signup", route: "/signup" },
  { name: "Dashboard", route: "/dashboard" },
  { name: "Profile", route: "/profile" },
  { name: "Settings", route: "/settings" },
  { name: "TestExtraction", route: "/test-extraction" },
];

/**
 * Generate one of the 7 In_Scope_Screen identifiers along with a render
 * factory. `registry` lets a property test inject the actual render thunks
 * once the redesigned screens exist; without one, `render()` throws.
 */
export function arbInScopeScreen(
  registry: ScreenRenderRegistry = {},
): fc.Arbitrary<InScopeScreen> {
  return fc.constantFrom(...IN_SCOPE_SCREENS).map((screen) => ({
    ...screen,
    render: () => {
      const factory = registry[screen.name];
      if (!factory) {
        throw new Error(
          `arbInScopeScreen: no render factory registered for "${screen.name}". ` +
            `Pass a ScreenRenderRegistry to arbInScopeScreen() in your property test.`,
        );
      }
      return factory();
    },
  }));
}

// ---------------------------------------------------------------------------
// Button props (redesigned <Button>, see design.md → "Components and
// Interfaces" → "Button" and tasks.md → 5.7).
// ---------------------------------------------------------------------------

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "default" | "lg" | "icon";

export interface ButtonPropsArb {
  variant: ButtonVariant;
  size: ButtonSize;
  children: string;
  disabled: boolean;
}

const BUTTON_VARIANTS: ReadonlyArray<ButtonVariant> = [
  "primary",
  "secondary",
  "ghost",
  "danger",
];
const BUTTON_SIZES: ReadonlyArray<ButtonSize> = ["sm", "default", "lg", "icon"];

export function arbButtonProps(): fc.Arbitrary<ButtonPropsArb> {
  return fc.record({
    variant: fc.constantFrom(...BUTTON_VARIANTS),
    size: fc.constantFrom(...BUTTON_SIZES),
    // Keep label content short and renderable. Avoid empty strings so that
    // a11y assertions (accessible name) hold by default.
    children: fc.string({ minLength: 1, maxLength: 24 }),
    disabled: fc.boolean(),
  });
}

// ---------------------------------------------------------------------------
// Receipt (ReceiptWithUrgency)
// ---------------------------------------------------------------------------

const RECEIPT_STATUSES: ReadonlyArray<ReceiptStatus> = [
  "active",
  "returned",
  "kept",
  "expired",
];
const URGENCIES: ReadonlyArray<Urgency> = ["green", "yellow", "red"];
const CURRENCIES: ReadonlyArray<string> = ["USD", "EUR", "GBP", "CAD", "AUD"];

/**
 * Generate an ISO-8601 date string within ±365 days of `2025-01-01` so the
 * value is deterministic and fits realistic receipt timeframes.
 */
const arbIsoDate: fc.Arbitrary<string> = fc
  .integer({ min: -365, max: 365 })
  .map((offsetDays) => {
    const base = Date.UTC(2025, 0, 1);
    const ms = base + offsetDays * 24 * 60 * 60 * 1000;
    return new Date(ms).toISOString();
  });

const arbDateOnly: fc.Arbitrary<string> = arbIsoDate.map((iso) =>
  iso.slice(0, 10),
);

const arbNullable = <T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T | null> =>
  fc.oneof(
    { weight: 4, arbitrary: arb },
    { weight: 1, arbitrary: fc.constant(null) },
  );

export function arbReceipt(): fc.Arbitrary<ReceiptWithUrgency> {
  return fc
    .record({
      id: fc.uuid(),
      user_id: fc.uuid(),
      store_name: arbNullable(fc.string({ minLength: 1, maxLength: 40 })),
      item_name: arbNullable(fc.string({ minLength: 1, maxLength: 60 })),
      price: arbNullable(
        fc
          .double({
            min: 0.01,
            max: 9999.99,
            noNaN: true,
            noDefaultInfinity: true,
          })
          .map((n) => Math.round(n * 100) / 100),
      ),
      currency: arbNullable(fc.constantFrom(...CURRENCIES)),
      purchase_date: arbNullable(arbDateOnly),
      return_deadline: arbNullable(arbDateOnly),
      warranty_deadline: arbNullable(arbDateOnly),
      ai_confidence: arbNullable(fc.double({ min: 0, max: 1, noNaN: true })),
      status: fc.constantFrom(...RECEIPT_STATUSES),
      notification_sent_7d: fc.boolean(),
      notification_sent_3d: fc.boolean(),
      notification_sent_1d: fc.boolean(),
      created_at: arbIsoDate,
      updated_at: arbIsoDate,
      days_remaining: arbNullable(fc.integer({ min: -90, max: 365 })),
      urgency: fc.constantFrom(...URGENCIES),
    })
    .map((receipt): ReceiptWithUrgency => receipt satisfies ReceiptWithUrgency);
}

/**
 * Convenience: drop the urgency-derived fields to obtain a plain `Receipt`.
 */
export function arbReceiptBase(): fc.Arbitrary<Receipt> {
  return arbReceipt().map(({ days_remaining, urgency, ...rest }) => {
    void days_remaining;
    void urgency;
    return rest;
  });
}

// ---------------------------------------------------------------------------
// Viewport widths (Property 15 — no horizontal overflow)
// ---------------------------------------------------------------------------

export const VIEWPORT_WIDTHS = [360, 768, 1024, 1440, 1920] as const;
export type ViewportWidth = (typeof VIEWPORT_WIDTHS)[number];

export function arbViewport(): fc.Arbitrary<ViewportWidth> {
  return fc.constantFrom(...VIEWPORT_WIDTHS);
}

// ---------------------------------------------------------------------------
// Text content (headings, labels, descriptions)
// ---------------------------------------------------------------------------

/**
 * Generate strings that exercise short labels, long paragraphs, unicode, and
 * whitespace runs. Empty strings are excluded — heading/label slots in the
 * redesign always carry content.
 */
export function arbTextContent(): fc.Arbitrary<string> {
  return fc.oneof(
    // Short label (e.g. button child, badge text).
    fc.string({ minLength: 1, maxLength: 16 }),
    // Long description / paragraph body.
    fc.string({ minLength: 32, maxLength: 240 }),
    // Unicode-heavy strings (CJK, emoji, RTL).
    fc.fullUnicodeString({ minLength: 1, maxLength: 40 }),
    // Whitespace-laden strings (tabs, newlines, multiple spaces).
    fc
      .array(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 8 }),
          fc.constantFrom(" ", "  ", "\t", "\n", " \n "),
        ),
        { minLength: 1, maxLength: 12 },
      )
      .map((parts) => parts.join("")),
  );
}
