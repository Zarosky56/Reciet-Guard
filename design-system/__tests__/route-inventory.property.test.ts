// Feature: premium-ui-redesign
// Property 14: The redesign does not add or remove user-facing routes or
// API endpoints.
//
// Validates: Requirements 9.8, 14.1
//
// For any file path matching `app/**/page.tsx` or `app/api/**/route.ts` in
// the post-redesign repository, the corresponding URL path is present in
// the pre-redesign route-inventory snapshot at
// `design-system/__tests__/route-inventory.snapshot.json`; AND for any
// path in the snapshot, the path is still present in the repository.
//
// In other words: the live route inventory and the snapshotted route
// inventory MUST be equal as sets. fast-check enumerates the assertion
// over both directions so a counterexample shrinks to a single offending
// route, and the surrounding test reports the full added/removed diff.
//
// Path-conversion conventions (mirroring Next.js App Router):
//   - Parenthesized route-group segments (e.g. `(auth)`, `(dashboard)`)
//     are stripped from the URL path.
//   - Dynamic segments such as `[id]` are preserved verbatim.
//   - `app/page.tsx` resolves to `/`.
//   - The scope is exactly `app/**/page.tsx` and `app/api/**/route.ts`,
//     matching the snapshot's `scope` field. Files outside that scope
//     (e.g. `app/auth/callback/route.ts`, layout/loading/error files) are
//     NOT part of the inventory.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";

import fc from "fast-check";
import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// File-path constants
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(__dirname, "..", "..");
const APP_DIR = resolve(REPO_ROOT, "app");
const API_DIR = resolve(APP_DIR, "api");
const SNAPSHOT_PATH = resolve(
  REPO_ROOT,
  "design-system",
  "__tests__",
  "route-inventory.snapshot.json",
);

// ---------------------------------------------------------------------------
// Filesystem walk
// ---------------------------------------------------------------------------

function toPosix(p: string): string {
  return p.split(sep).join("/");
}

/**
 * Recursively walk `root` and return every regular file whose POSIX-style
 * path *relative to `root`* satisfies `predicate`. Returns absolute paths.
 */
function walkFiles(
  root: string,
  predicate: (relPosixPath: string) => boolean,
): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: import("node:fs").Dirent[];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = `${dir}${sep}${entry.name}`;
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        const rel = toPosix(full.slice(root.length + 1));
        if (predicate(rel)) {
          out.push(full);
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Path-conversion (Next.js App Router → URL route)
// ---------------------------------------------------------------------------

const ROUTE_GROUP_RE = /^\(.*\)$/;

/**
 * Convert a path like `(auth)/login/page.tsx` (relative to `app/`) into
 * its URL route (`/login`). Parenthesized route groups are stripped.
 * `page.tsx` directly under `app/` becomes `/`.
 */
function pageRelToRoute(relUnderApp: string): string {
  const noFile = relUnderApp.replace(/(?:^|\/)page\.tsx$/, "");
  const segments = noFile
    .split("/")
    .filter((seg) => seg.length > 0 && !ROUTE_GROUP_RE.test(seg));
  return segments.length === 0 ? "/" : "/" + segments.join("/");
}

/**
 * Convert a path like `api/receipts/[id]/route.ts` (relative to `app/`)
 * into its URL route (`/api/receipts/[id]`). Parenthesized route groups
 * are stripped; dynamic segments are preserved verbatim.
 */
function apiRouteRelToRoute(relUnderApp: string): string {
  const noFile = relUnderApp.replace(/\/route\.ts$/, "");
  const segments = noFile
    .split("/")
    .filter((seg) => seg.length > 0 && !ROUTE_GROUP_RE.test(seg));
  return "/" + segments.join("/");
}

// ---------------------------------------------------------------------------
// Live inventory
// ---------------------------------------------------------------------------

interface RouteInventory {
  pages: string[];
  apiRoutes: string[];
  all: string[];
}

function uniqueSorted(values: ReadonlyArray<string>): string[] {
  return Array.from(new Set(values)).sort();
}

function buildLiveInventory(): RouteInventory {
  // Pages: every `**/page.tsx` under `app/`, EXCLUDING anything under
  // `app/api/` (Next.js doesn't put `page.tsx` under api, but exclude
  // defensively to keep the two scopes disjoint).
  const pageFiles = walkFiles(APP_DIR, (rel) =>
    rel === "page.tsx" || rel.endsWith("/page.tsx"),
  )
    .map((abs) => toPosix(abs.slice(APP_DIR.length + 1)))
    .filter((rel) => !rel.startsWith("api/"));

  const pages = uniqueSorted(pageFiles.map(pageRelToRoute));

  // API routes: every `**/route.ts` under `app/api/`.
  let apiFiles: string[] = [];
  try {
    statSync(API_DIR);
    apiFiles = walkFiles(API_DIR, (rel) =>
      rel === "route.ts" || rel.endsWith("/route.ts"),
    ).map((abs) => toPosix(abs.slice(APP_DIR.length + 1)));
  } catch {
    apiFiles = [];
  }

  const apiRoutes = uniqueSorted(apiFiles.map(apiRouteRelToRoute));

  const all = uniqueSorted([...pages, ...apiRoutes]);

  return { pages, apiRoutes, all };
}

// ---------------------------------------------------------------------------
// Snapshot loading
// ---------------------------------------------------------------------------

interface SnapshotShape {
  pages: string[];
  apiRoutes: string[];
  all: string[];
}

function loadSnapshot(): SnapshotShape {
  const raw = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")) as Partial<SnapshotShape>;
  if (
    !Array.isArray(raw.pages) ||
    !Array.isArray(raw.apiRoutes) ||
    !Array.isArray(raw.all)
  ) {
    throw new Error(
      `route-inventory.snapshot.json is missing one of the required arrays ` +
        `"pages", "apiRoutes", "all".`,
    );
  }
  return {
    pages: uniqueSorted(raw.pages),
    apiRoutes: uniqueSorted(raw.apiRoutes),
    all: uniqueSorted(raw.all),
  };
}

// ---------------------------------------------------------------------------
// One-shot capture (executed once at module load).
// ---------------------------------------------------------------------------

const snapshot = loadSnapshot();
const live = buildLiveInventory();

const snapshotAllSet = new Set(snapshot.all);
const liveAllSet = new Set(live.all);

/** Routes in the snapshot but missing from the live tree (i.e. removed). */
const removed: string[] = snapshot.all.filter((p) => !liveAllSet.has(p));
/** Routes in the live tree but missing from the snapshot (i.e. added). */
const added: string[] = live.all.filter((p) => !snapshotAllSet.has(p));

function diffSummary(): string {
  return (
    `Removed (in snapshot, missing from codebase): ${JSON.stringify(removed)}; ` +
    `Added (in codebase, missing from snapshot): ${JSON.stringify(added)}.`
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Property 14: route-inventory preservation", () => {
  it("loads a non-empty pre-redesign snapshot", () => {
    expect(snapshot.all.length).toBeGreaterThan(0);
    expect(snapshot.pages.length).toBeGreaterThan(0);
    expect(snapshot.apiRoutes.length).toBeGreaterThan(0);
  });

  it("discovers a non-empty live route inventory under app/", () => {
    // Sanity: the property below would be vacuously true if either side
    // were empty. If this assertion ever fails, the walker or path
    // converter is broken.
    expect(live.all.length).toBeGreaterThan(0);
    expect(live.pages.length).toBeGreaterThan(0);
    expect(live.apiRoutes.length).toBeGreaterThan(0);
  });

  it("∀ snapshot path P, the live inventory contains P (no route was removed by the redesign)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...snapshot.all), (snapshotPath) => {
        if (liveAllSet.has(snapshotPath)) return true;
        throw new Error(
          `Route "${snapshotPath}" was present in the pre-redesign route-inventory ` +
            `snapshot but is missing from the live codebase. ${diffSummary()}`,
        );
      }),
      { numRuns: Math.max(50, snapshot.all.length * 2) },
    );
  });

  it("∀ live path P, the snapshot contains P (no route was added by the redesign)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...live.all), (livePath) => {
        if (snapshotAllSet.has(livePath)) return true;
        throw new Error(
          `Route "${livePath}" exists in the live codebase but is absent from the ` +
            `pre-redesign route-inventory snapshot. ${diffSummary()}`,
        );
      }),
      { numRuns: Math.max(50, live.all.length * 2) },
    );
  });

  it("set-equality: live and snapshot inventories are identical (pages, apiRoutes, all)", () => {
    // Sorted equality. If either of the per-direction property tests
    // above fails, this assertion will fail too with a full diff that
    // Vitest renders side-by-side — useful when several routes drift at
    // once (e.g. a directory rename adds and removes simultaneously).
    expect(live.pages).toEqual(snapshot.pages);
    expect(live.apiRoutes).toEqual(snapshot.apiRoutes);
    expect(live.all).toEqual(snapshot.all);
  });
});
