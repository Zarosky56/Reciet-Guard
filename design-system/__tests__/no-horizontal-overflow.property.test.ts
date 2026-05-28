// @vitest-environment jsdom
//
// Feature: premium-ui-redesign — Phase 3 verification.
//
// Property 15 — No horizontal overflow at any documented viewport width.
// Validates: Requirements 15.6
//
// design.md → "Property 15: No horizontal overflow at any documented
// viewport width":
//
//   For any In_Scope_Screen S and for any viewport width W in the
//   documented set { 360, 768, 1024, 1440, 1920 } pixels, when S is
//   rendered in a jsdom environment with `window.innerWidth = W`,
//   `document.documentElement.scrollWidth ≤ W` (i.e., no horizontal
//   scroll is induced and no element extends past the viewport's right
//   edge).
//
// The documented widths align with Requirement 15.6 in `requirements.md`:
//   "WHEN a reviewer renders any In_Scope_Screen at viewport widths
//    360px, 768px, 1024px, 1440px, and 1920px, the layout SHALL remain
//    readable with no horizontal scroll …"
//
// ---------------------------------------------------------------------------
// Approach
// ---------------------------------------------------------------------------
// We render each of the seven In_Scope_Screens via the registry that
// `arbInScopeScreen` consumes, varying `window.innerWidth` across the
// five documented viewport widths supplied by `arbViewport`. The
// property assertion follows the design.md prescription:
//
//   document.documentElement.scrollWidth ≤ window.innerWidth.
//
// jsdom does not perform CSS layout, so `scrollWidth` is reported as 0
// for every render — the documented inequality therefore holds
// trivially in this environment, which is consistent with design.md's
// stated jsdom-based layout strategy. The shape is still useful because:
//
//   1. It enforces that every In_Scope_Screen mounts cleanly at every
//      documented viewport width without throwing (catches missing
//      components, unsatisfied prop contracts, hydration errors).
//   2. It pins the documented viewport set to the property test, so a
//      future change to `arbViewport` propagates here automatically.
//   3. fast-check shrinks on failure to surface the smallest
//      (screen, width) pair that fails.
//
// To catch the kind of regression jsdom would otherwise hide — an
// inline pixel width that exceeds the smallest documented viewport —
// we add a second pass that walks every rendered element and rejects
// any inline `style="width: …px"` (or `min-width: …px`) value larger
// than 360 px. Tailwind utility classes are unaffected; the redesign's
// container tokens (`max-w-auth | narrow | content | wide`) are
// max-width caps and so are safe by construction.
//
// Server-only screens (Dashboard, Profile, Settings, TestExtraction)
// are rendered via their leaf client compositions — the redesigned
// `<DashboardHeader>` chrome plus the page's primary content components
// — with stub data. This honours the task brief's "render only the
// leaf client component" guidance for screens with server-side auth/db
// dependencies. The Login and Signup screens use the same `<AuthShell>`
// + `<AuthForm>` composition that the actual `app/(auth)/{login,signup}/
// page.tsx` files render.
//
// ---------------------------------------------------------------------------

import { createElement, Suspense, type ReactElement } from "react";

import { cleanup, render } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks for next/navigation. The leaf client components used by every
// screen call `useRouter`, `usePathname`, and/or `useSearchParams`; in
// the test environment we return inert stubs so render does not throw.
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  };
  return {
    useRouter: () => router,
    usePathname: () => "/dashboard",
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

// `sonner` is invoked by leaf client components on user interaction; we
// don't trigger interactions here, but the import itself is resolved.
// No mock necessary — sonner ships an SSR-safe entry.

import HomePage from "@/app/page";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ReceiptDashboard } from "@/components/receipts/receipt-dashboard";
import { TestExtractionForm } from "@/components/ai/test-extraction-form";
import { CopyForwardingAddress } from "@/components/receipts/copy-forwarding-address";
import { LogoutSection } from "@/components/settings/logout-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  arbInScopeScreen,
  arbViewport,
  VIEWPORT_WIDTHS,
  type InScopeScreen,
  type ScreenRenderRegistry,
  type ViewportWidth,
} from "./_arbitraries";

// ---------------------------------------------------------------------------
// Screen render registry
//
// Each thunk returns a ReactElement that captures the rendered surface
// of the corresponding In_Scope_Screen. For server-rendered routes, we
// render the leaf client composition with stub data (the page itself is
// `async` and depends on Supabase/auth, neither of which is meaningful
// to Property 15 — the documented containers and grids live in the
// client subtree).
// ---------------------------------------------------------------------------

const STUB_EMAIL = "user@example.com";
const STUB_FORWARDING_ADDRESS = "receipts@example.com";

function landingScreen(): ReactElement {
  // `app/page.tsx` exports a synchronous server component composed
  // entirely from client-safe primitives (BrandMark, Button, Card, Grid,
  // AmbientBackground). We can mount it directly in jsdom.
  return createElement(HomePage);
}

function loginScreen(): ReactElement {
  return createElement(
    AuthShell,
    null,
    createElement(
      Suspense,
      null,
      createElement(AuthForm, { mode: "login" }),
    ),
  );
}

function signupScreen(): ReactElement {
  return createElement(
    AuthShell,
    null,
    createElement(
      Suspense,
      null,
      createElement(AuthForm, { mode: "signup" }),
    ),
  );
}

function dashboardScreen(): ReactElement {
  // Mirrors `app/(dashboard)/dashboard/page.tsx`'s `<main>` shell plus
  // the redesigned chrome and `<ReceiptDashboard>` composition. Uses
  // the documented `max-w-wide` container token (Requirement 4.4).
  return createElement(
    "main",
    {
      className:
        "relative mx-auto min-h-screen w-full max-w-wide px-4 sm:px-6 md:px-8",
    },
    createElement(DashboardHeader, { email: STUB_EMAIL }),
    createElement(ReceiptDashboard, {
      initialReceipts: [],
      forwardingAddress: STUB_FORWARDING_ADDRESS,
    }),
  );
}

function profileScreen(): ReactElement {
  // Mirrors the visible composition of `app/(dashboard)/profile/page.tsx`.
  // Uses the documented `max-w-narrow` container token (Requirement
  // 4.4 / 9.6) and the redesigned single-column stacked sections
  // (Requirement 4.5, 4.6).
  return createElement(
    "main",
    {
      className: "mx-auto min-h-screen w-full max-w-narrow px-4 sm:px-6 md:px-8",
    },
    createElement(DashboardHeader, { email: STUB_EMAIL, current: "profile" }),
    createElement(
      "div",
      { className: "grid w-full gap-8 py-8 md:py-10" },
      createElement(
        "header",
        { className: "grid gap-2" },
        createElement(
          "p",
          { className: "text-xs uppercase tracking-wider text-text-muted" },
          "Profile",
        ),
        createElement(
          "h1",
          {
            className:
              "text-2xl font-semibold tracking-tight text-text-primary md:text-3xl",
          },
          "Your account",
        ),
        createElement(
          "p",
          { className: "text-sm leading-6 text-text-secondary" },
          "A compact view of your identity and receipt activity.",
        ),
      ),
      createElement(
        Card,
        null,
        createElement(
          CardContent,
          null,
          createElement(
            "div",
            {
              className:
                "flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left",
            },
            createElement(
              Avatar,
              { className: "size-20 shrink-0" },
              createElement(
                AvatarFallback,
                { className: "text-accent" },
                "RG",
              ),
            ),
            createElement(
              "div",
              { className: "grid min-w-0 gap-2" },
              createElement(
                "h2",
                {
                  className:
                    "truncate text-xl font-semibold tracking-tight text-text-primary",
                },
                "user",
              ),
              createElement(
                "p",
                { className: "truncate text-sm text-text-secondary" },
                STUB_EMAIL,
              ),
              createElement(
                "div",
                {
                  className:
                    "flex flex-wrap items-center justify-center gap-2 sm:justify-start",
                },
                createElement(Badge, { variant: "success" }, "Active account"),
                createElement(Badge, null, "Member since Jan 1, 2025"),
              ),
            ),
          ),
        ),
      ),
      createElement(
        Card,
        null,
        createElement(
          CardContent,
          null,
          createElement(LogoutSection, { bordered: false }),
        ),
      ),
    ),
  );
}

function settingsScreen(): ReactElement {
  // Mirrors `app/(dashboard)/settings/page.tsx`. Uses the documented
  // `max-w-content` container token and single-column stacked sections.
  return createElement(
    "main",
    {
      className:
        "mx-auto min-h-screen w-full max-w-content px-4 sm:px-6 md:px-8",
    },
    createElement(DashboardHeader, { email: STUB_EMAIL, current: "settings" }),
    createElement(
      "div",
      { className: "grid w-full gap-8 py-8 md:py-10" },
      createElement(
        "header",
        { className: "grid gap-2" },
        createElement(
          "p",
          { className: "text-xs uppercase tracking-wider text-text-muted" },
          "Settings",
        ),
        createElement(
          "h1",
          {
            className:
              "text-2xl font-semibold tracking-tight text-text-primary md:text-3xl",
          },
          "Keep things predictable",
        ),
      ),
      createElement(
        Card,
        null,
        createElement(
          CardContent,
          { className: "grid gap-4" },
          createElement(CopyForwardingAddress, {
            address: STUB_FORWARDING_ADDRESS,
          }),
        ),
      ),
      createElement(
        Card,
        null,
        createElement(
          CardContent,
          { className: "grid gap-4" },
          createElement(
            "label",
            {
              className:
                "grid gap-2 text-sm font-medium text-text-primary",
            },
            "Email",
            createElement(Input, {
              value: STUB_EMAIL,
              readOnly: true,
              "aria-readonly": true,
              onChange: () => {},
            }),
          ),
          createElement(LogoutSection),
        ),
      ),
    ),
  );
}

function testExtractionScreen(): ReactElement {
  // Mirrors `app/test-extraction/page.tsx`. Uses the documented
  // `max-w-content` container token; renders the leaf client form.
  return createElement(
    "main",
    {
      className:
        "mx-auto min-h-screen w-full max-w-content px-4 py-8 sm:px-6 md:px-8 md:py-10",
    },
    createElement(
      "div",
      { className: "grid gap-8" },
      createElement(
        "header",
        { className: "grid gap-2" },
        createElement(
          "p",
          { className: "text-xs uppercase tracking-wider text-text-muted" },
          "Developer tools",
        ),
        createElement(
          "h1",
          {
            className:
              "text-2xl font-semibold tracking-tight text-text-primary md:text-3xl",
          },
          "Test email extraction",
        ),
      ),
      createElement(TestExtractionForm),
    ),
  );
}

const SCREEN_REGISTRY: ScreenRenderRegistry = {
  Landing: landingScreen,
  Login: loginScreen,
  Signup: signupScreen,
  Dashboard: dashboardScreen,
  Profile: profileScreen,
  Settings: settingsScreen,
  TestExtraction: testExtractionScreen,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set jsdom's reported viewport width. jsdom exposes `innerWidth` as a
 * configurable getter on `window`; we redefine it for the duration of a
 * single property iteration so the assertion in the test reads off the
 * value the design.md property text uses.
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

/**
 * Inspect the rendered tree for inline pixel widths that would force
 * horizontal overflow on the smallest documented viewport (360 px).
 *
 * Tailwind utility classes are *not* checked — the design system caps
 * every screen at one of the documented `max-w-*` container tokens
 * (`auth`, `narrow`, `content`, `wide`), each of which is a max-width
 * (i.e. shrinks to fit), so they cannot induce overflow on smaller
 * viewports by construction. Inline `style="width: …px"` and
 * `style="min-width: …px"` *can* induce overflow, so they are flagged
 * here.
 */
function findOverflowingInlineWidths(
  root: HTMLElement,
  smallestViewportPx: number,
): Array<{ tag: string; width: number; property: string }> {
  const offenders: Array<{ tag: string; width: number; property: string }> = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.currentNode;
  while (node) {
    if (node instanceof HTMLElement || node instanceof SVGElement) {
      const style = (node as HTMLElement).getAttribute("style") ?? "";
      // Match `width: 999px` and `min-width: 999px` patterns. Whitespace
      // tolerant; rejects values without an explicit `px` unit since
      // `%`/`em`/`rem` cannot exceed the viewport unconditionally.
      for (const property of ["width", "min-width"] as const) {
        const re = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`, "i");
        const m = re.exec(style);
        if (m) {
          const px = Number(m[1]);
          if (Number.isFinite(px) && px > smallestViewportPx) {
            offenders.push({
              tag: (node as Element).tagName.toLowerCase(),
              width: px,
              property,
            });
          }
        }
      }
    }
    node = walker.nextNode();
  }
  return offenders;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  // Reset to a known viewport between iterations so a previous failure
  // doesn't pollute the next render.
  setViewportWidth(1024);
});

describe("Property 15 — no horizontal overflow at any documented viewport width (Requirement 15.6)", () => {
  it("the documented viewport set is exactly { 360, 768, 1024, 1440, 1920 }", () => {
    // Pin the documented set so any change to `arbViewport` surfaces
    // here — Property 15's correctness depends on exactly these widths.
    expect([...VIEWPORT_WIDTHS]).toEqual([360, 768, 1024, 1440, 1920]);
  });

  it("every In_Scope_Screen renders cleanly at every documented viewport width with no horizontal overflow", () => {
    fc.assert(
      fc.property(
        arbInScopeScreen(SCREEN_REGISTRY),
        arbViewport(),
        (screen: InScopeScreen, width: ViewportWidth) => {
          setViewportWidth(width);
          const { container, unmount } = render(screen.render());

          try {
            // design.md → Property 15 invariant (jsdom reports
            // scrollWidth as 0 because it does not perform layout, so
            // the inequality holds trivially — the meaningful work is
            // (a) successful mount at this width and (b) the inline-
            // pixel-width check below).
            const docScrollWidth = document.documentElement.scrollWidth;
            expect(
              docScrollWidth,
              `documentElement.scrollWidth (${docScrollWidth}) exceeded ` +
                `viewport width ${width} on the ${screen.name} screen.`,
            ).toBeLessThanOrEqual(width);

            // Stronger structural check: no inline pixel width on any
            // rendered element exceeds the smallest documented viewport
            // (360 px). This catches developer-authored
            // `style="width: 800px"` regressions that jsdom's missing
            // layout would otherwise hide.
            const offenders = findOverflowingInlineWidths(
              container as HTMLElement,
              VIEWPORT_WIDTHS[0],
            );
            if (offenders.length > 0) {
              const formatted = offenders
                .map(
                  (o) =>
                    `<${o.tag}> ${o.property}=${o.width}px (> ${VIEWPORT_WIDTHS[0]}px smallest viewport)`,
                )
                .join(", ");
              throw new Error(
                `Inline pixel widths exceed the smallest documented ` +
                  `viewport on the ${screen.name} screen at ${width}px: ${formatted}`,
              );
            }
          } finally {
            unmount();
          }

          return true;
        },
      ),
      // Cover every (screen, width) pair multiple times. fast-check
      // still shrinks on failure to surface the smallest counterexample.
      { numRuns: 100 },
    );
  });
});
