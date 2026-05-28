// @vitest-environment jsdom
//
// Feature: premium-ui-redesign — Phase 3 verification.
//
// Property 16 — Each screen carries at most one decorative element.
// Validates: Requirements 13.13, 13.14, 15.8
//
// Property 16 (design.md → "Property 16", verbatim):
//   For any In_Scope_Screen S, when S is rendered in its default state,
//   the count of nodes in S's DOM tree carrying `data-decorative="true"`
//   (the marker placed on AmbientBackground, structural rule lines, and
//   standalone typographic marks) is ≤ 1.
//
// The companion check from the task brief — "forbid the AI-slop pattern
// stack (no element with both gradient bg AND grid AND glow on the same
// hero, etc. — Requirement 13.13)" — is encoded as a second property:
// no single rendered element may stack two or more of the documented
// AI-slop decorative pattern categories (tile-bordered icon, gradient
// text or fill, conic halo, aurora background, dotted grid, glow
// shadow).
//
// ---------------------------------------------------------------------------
// Approach
// ---------------------------------------------------------------------------
// `arbInScopeScreen` (in `_arbitraries.ts`) yields a `render` factory
// that throws unless a registry maps each `InScopeScreenName` to a
// thunk. We construct that registry once here, then drive both
// properties with `fc.assert` over the 7-element domain.
//
// Most of the In_Scope_Screens are async server components that depend
// on `requireUser`, `ensureProfile`, `createClient` (the supabase
// server client), `next/headers.cookies`, and `next/navigation`. Each
// of those is stubbed at module scope via `vi.mock` so the test runs
// hermetically with no network or environment access.
//
// Async server components cannot be rendered synchronously by React's
// renderToDOM, so we pre-resolve each one to a `ReactElement` in
// `beforeAll` and the registry returns the resolved element via a
// sync thunk. The thunk also re-attaches the registry to fc each
// time so the property's render shape is always live.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";

import { cleanup, render } from "@testing-library/react";
import fc from "fast-check";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

// ---------------------------------------------------------------------------
// jsdom shim — framer-motion's `useReducedMotion()` reads `matchMedia`,
// which jsdom does not implement by default. The redesigned `<Reveal>`
// (the only retained motion primitive) calls `useReducedMotion()` on
// every render, so we pin a no-op stub here. The shim returns
// `matches: false` so the screens render their motion variants — the
// property check is on the rendered DOM and is orthogonal to which
// motion branch fired.
// ---------------------------------------------------------------------------
if (typeof window !== "undefined" && !window.matchMedia) {
  // Assigning a stub onto the jsdom Window. jsdom's Window type allows
  // matchMedia, so no @ts-expect-error directive is needed.
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// ---------------------------------------------------------------------------
// Hermetic mocks for the auth/db/router seam.
// ---------------------------------------------------------------------------
//
// Keep the surface minimal: every page in the In_Scope_Screen set
// touches at most these four modules. Stubbing them at module scope
// (rather than inside the test bodies) lets us pre-resolve the async
// server components in `beforeAll` and reuse the resolved tree on
// every fast-check iteration.

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  redirect: (url: string) => {
    throw new Error(`unexpected redirect to ${url}`);
  },
  notFound: () => {
    throw new Error("unexpected notFound()");
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
    get: vi.fn(),
  }),
}));

const FAKE_USER = {
  id: "user-1",
  email: "tester@example.com",
  created_at: "2024-01-15T00:00:00.000Z",
} as const;

const FAKE_PROFILE = {
  id: FAKE_USER.id,
  forwarding_address: "tester+intake@example.com",
  created_at: FAKE_USER.created_at,
  updated_at: FAKE_USER.created_at,
} as const;

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(async () => FAKE_USER),
  requireUser: vi.fn(async () => FAKE_USER),
  ensureProfile: vi.fn(async () => FAKE_PROFILE),
}));

/**
 * Build a thenable Supabase query builder. `await builder` resolves to
 * `{ data: [], error: null }` so `dashboard/page.tsx`'s
 * `await supabase.from("receipts").select("*").eq("user_id", id)` chain
 * yields an empty receipt list — which is the "default state" the
 * property test cares about (no receipt-card content, no editor open).
 */
function makeFakeSupabaseClient() {
  type Builder = {
    select: (..._args: unknown[]) => Builder;
    eq: (..._args: unknown[]) => Builder;
    insert: (..._args: unknown[]) => Builder;
    update: (..._args: unknown[]) => Builder;
    maybeSingle: () => Promise<{ data: null; error: null }>;
    single: () => Promise<{ data: null; error: null }>;
    then: (
      resolve: (value: { data: never[]; error: null }) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise<unknown>;
  };

  const builder: Builder = {
    select: () => builder,
    eq: () => builder,
    insert: () => builder,
    update: () => builder,
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    single: () => Promise.resolve({ data: null, error: null }),
    then: (resolve, reject) =>
      Promise.resolve({ data: [] as never[], error: null }).then(
        resolve,
        reject,
      ),
  };

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: FAKE_USER },
        error: null,
      })),
    },
    from: vi.fn(() => builder),
  };
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => makeFakeSupabaseClient()),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => makeFakeSupabaseClient()),
}));

// ---------------------------------------------------------------------------
// Imports that depend on the mocks above.
// ---------------------------------------------------------------------------
//
// All page modules and arbitraries are imported AFTER `vi.mock` so the
// hoisted mocks intercept their dependencies cleanly.

import HomePage from "@/app/page";
import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import ProfilePage from "@/app/(dashboard)/profile/page";
import SettingsPage from "@/app/(dashboard)/settings/page";
import TestExtractionPage from "@/app/test-extraction/page";

import {
  arbInScopeScreen,
  type InScopeScreenName,
  type ScreenRenderRegistry,
} from "./_arbitraries";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const AMBIENT_SOURCE_PATH = path.join(
  REPO_ROOT,
  "components",
  "visual",
  "ambient-background.tsx",
);

const DECORATIVE_BUDGET_MAX = 1;

/**
 * AI-slop decorative pattern categories drawn from Requirement 13.
 * The pattern-stack property fires when a single rendered element
 * carries class fragments matching ≥ 2 of these categories.
 *
 * Word boundaries (`\b`) prevent `bg-grid-faint` from matching against
 * the redesigned `border-border-strong` token, which contains "border"
 * but is not in any of these forbidden families.
 */
const AI_SLOP_PATTERN_CATEGORIES: ReadonlyArray<{
  name: string;
  pattern: RegExp;
}> = [
  // Tile-bordered icon — `bg-card-elevated` / `bg-bg-elevated` recess.
  { name: "tile", pattern: /\bbg-(?:card|bg)-elevated\b/ },
  // Aurora / scene-* full-bleed gradient backgrounds.
  { name: "aurora", pattern: /\bbg-(?:aurora|scene-)[\w-]*/ },
  // Dotted-grid mesh.
  { name: "grid-mesh", pattern: /\bbg-grid(?:-[\w-]+)?\b/ },
  // Conic halo on the brand mark / icon tile.
  { name: "conic-halo", pattern: /\bborder-conic[\w-]*/ },
  // Glow shadow (action / soft).
  { name: "glow", pattern: /\bshadow-glow[\w-]*/ },
  // Gradient text or any visible-color linear-gradient utility.
  { name: "gradient-text", pattern: /\btext-gradient[\w-]*/ },
];

// ---------------------------------------------------------------------------
// Pre-resolved server-component pages.
// ---------------------------------------------------------------------------
//
// `arbInScopeScreen`'s registry expects sync thunks. The async server
// components (`Dashboard`, `Profile`, `Settings`, `TestExtraction`) are
// invoked once in `beforeAll` and the resolved `ReactElement` is held
// in this map; the thunks below close over it.

const resolvedScreens: Partial<Record<InScopeScreenName, ReactElement>> = {};

beforeAll(async () => {
  // Sync server components — wrap their JSX in a fresh element.
  resolvedScreens.Landing = HomePage();
  resolvedScreens.Login = LoginPage();
  resolvedScreens.Signup = SignupPage();
  // Async server components — await once, reuse the rendered tree.
  resolvedScreens.Dashboard = await DashboardPage();
  resolvedScreens.Profile = await ProfilePage();
  resolvedScreens.Settings = await SettingsPage();
  resolvedScreens.TestExtraction = await TestExtractionPage();
});

afterEach(() => cleanup());
afterAll(() => cleanup());

const RENDER_REGISTRY: ScreenRenderRegistry = {
  Landing: () => resolvedScreens.Landing!,
  Login: () => resolvedScreens.Login!,
  Signup: () => resolvedScreens.Signup!,
  Dashboard: () => resolvedScreens.Dashboard!,
  Profile: () => resolvedScreens.Profile!,
  Settings: () => resolvedScreens.Settings!,
  TestExtraction: () => resolvedScreens.TestExtraction!,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countDecorativeNodes(container: HTMLElement): number {
  return container.querySelectorAll('[data-decorative="true"]').length;
}

interface PatternStackFinding {
  className: string;
  categoriesHit: ReadonlyArray<string>;
}

function findPatternStack(
  container: HTMLElement,
): PatternStackFinding | null {
  const elements = container.querySelectorAll<HTMLElement>("*");
  for (const el of elements) {
    const className = el.getAttribute("class") ?? "";
    if (className.length === 0) continue;
    const hits = AI_SLOP_PATTERN_CATEGORIES.filter((cat) =>
      cat.pattern.test(className),
    ).map((cat) => cat.name);
    if (hits.length >= 2) {
      return { className, categoriesHit: hits };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 16 — per-screen decorative-element budget (Requirements 13.13, 13.14, 15.8)", () => {
  // -------------------------------------------------------------------------
  // Anchor check: the `data-decorative` marker exists in source.
  //
  // If `<AmbientBackground>` ever stops emitting `data-decorative="true"`
  // on the hero band node, every screen in the registry would silently
  // report "0 decorative elements", and the ≤ 1 property would pass
  // vacuously. Pin the marker's existence at the source level.
  // -------------------------------------------------------------------------
  it("AmbientBackground source emits the data-decorative marker (parser sanity)", () => {
    const source = readFileSync(AMBIENT_SOURCE_PATH, "utf8");
    expect(
      source,
      "components/visual/ambient-background.tsx must mark the hero band with data-decorative=\"true\" so Property 16 has something to count",
    ).toMatch(/data-decorative\s*=\s*["']true["']/);
  });

  it("the registry resolves all 7 In_Scope_Screen render thunks (registry sanity)", () => {
    const screenNames: InScopeScreenName[] = [
      "Landing",
      "Login",
      "Signup",
      "Dashboard",
      "Profile",
      "Settings",
      "TestExtraction",
    ];
    for (const name of screenNames) {
      expect(
        resolvedScreens[name],
        `screen "${name}" was not pre-resolved in beforeAll`,
      ).toBeDefined();
    }
  });

  // -------------------------------------------------------------------------
  // Property 16 (headline) — count of `[data-decorative="true"]` ≤ 1.
  // -------------------------------------------------------------------------
  it("for any In_Scope_Screen S, the rendered DOM contains ≤ 1 [data-decorative=\"true\"] node", () => {
    fc.assert(
      fc.property(arbInScopeScreen(RENDER_REGISTRY), (screen) => {
        const { container } = render(screen.render());
        const count = countDecorativeNodes(container);
        if (count > DECORATIVE_BUDGET_MAX) {
          // List the offending nodes so the failure message is actionable.
          const offenders = Array.from(
            container.querySelectorAll<HTMLElement>(
              '[data-decorative="true"]',
            ),
          )
            .slice(0, 5)
            .map((el) => `<${el.tagName.toLowerCase()} class="${el.getAttribute("class") ?? ""}">`)
            .join("\n  ");
          cleanup();
          throw new Error(
            `Property 16: screen "${screen.name}" carries ${count} ` +
              `decorative elements (budget = ${DECORATIVE_BUDGET_MAX}). ` +
              `Per Requirement 13.13/13.14/15.8 each screen may render at ` +
              `most one of: ambient tonal background, structural rule, or ` +
              `standalone typographic mark. Offenders:\n  ${offenders}`,
          );
        }
        cleanup();
        return true;
      }),
      // The domain is the 7-element In_Scope_Screen set; cycle through
      // it many times so fast-check shrinks to the smallest offending
      // screen on failure.
      { numRuns: 50 },
    );
  });

  // -------------------------------------------------------------------------
  // Companion check (Requirement 13.13) — no AI-slop pattern stack on
  // any single rendered element.
  // -------------------------------------------------------------------------
  it("for any In_Scope_Screen S, no single rendered element stacks ≥ 2 AI-slop pattern categories (Requirement 13.13)", () => {
    fc.assert(
      fc.property(arbInScopeScreen(RENDER_REGISTRY), (screen) => {
        const { container } = render(screen.render());
        const finding = findPatternStack(container);
        if (finding) {
          cleanup();
          throw new Error(
            `Requirement 13.13: screen "${screen.name}" stacks ` +
              `${finding.categoriesHit.length} AI-slop pattern categories ` +
              `(${finding.categoriesHit.join(" + ")}) on a single element. ` +
              `Class string: "${finding.className}". The redesign forbids ` +
              `combining more than one of: tile, aurora, grid-mesh, ` +
              `conic-halo, glow, gradient-text on the same composition.`,
          );
        }
        cleanup();
        return true;
      }),
      { numRuns: 50 },
    );
  });

  // -------------------------------------------------------------------------
  // Positive verification — Landing carries exactly the one allowed
  // decorative element (the AmbientBackground hero band). This guards
  // against a future edit that deletes the band entirely (which would
  // technically still pass the ≤ 1 budget but would also delete the
  // single approved hero-decoration intent of Requirement 13.14).
  // -------------------------------------------------------------------------
  it("the Landing screen renders exactly the one approved decorative element (the AmbientBackground hero band)", () => {
    const { container } = render(RENDER_REGISTRY.Landing!());
    const decoratives = container.querySelectorAll<HTMLElement>(
      '[data-decorative="true"]',
    );
    expect(
      decoratives.length,
      "Landing must render the single AmbientBackground hero band as its only decorative element (Requirement 13.14)",
    ).toBe(1);
    // The marker lives on the band node, which paints `bg-canvas-raised`
    // per the redesigned `<AmbientBackground variant="hero" />`. Pin
    // that token on the offending node so a future swap to a different
    // surface color surfaces here.
    const band = decoratives[0];
    expect(
      band.getAttribute("class") ?? "",
      "the Landing decorative element must be the canvas-raised tonal band",
    ).toMatch(/\bbg-canvas-raised\b/);
  });
});
