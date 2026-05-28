#!/usr/bin/env node
/**
 * Performance-budget enforcement for the premium-ui-redesign (task 13.1).
 *
 * Validates Requirements 12.1 and 12.2:
 *   • The redesign SHALL NOT increase the gzipped first-load JavaScript for
 *     `/dashboard` by more than 10 KB compared to the pre-redesign baseline.
 *   • The redesign SHALL NOT increase the gzipped CSS bundle by more than
 *     5 KB compared to the pre-redesign baseline.
 *
 * How it works:
 *   1. Reads `.next/app-build-manifest.json` (the App Router manifest, since
 *      `/dashboard` is an App-Router route under `app/(dashboard)/dashboard`).
 *      The task brief refers to this as `.next/build-manifest.json`; the
 *      App-Router equivalent is `app-build-manifest.json`, which is what the
 *      baseline at `design-system/__tests__/bundle-baseline.json` was captured
 *      against. Falls back to `.next/build-manifest.json` if the App manifest
 *      is missing (older Next.js or pages-router builds).
 *   2. Walks `.next/static/css/**` to gather every emitted CSS file.
 *   3. Gzips each chunk/file (level 9) and sums the bytes.
 *   4. Compares the totals against the baseline; exits non-zero when the
 *      `/dashboard` first-load JS delta exceeds +10 KB or the total CSS delta
 *      exceeds +5 KB.
 *
 * Usage:
 *   npm run build                      # produce a fresh `.next/`
 *   node scripts/check-bundle-size.mjs # verify budgets
 *
 * Exit codes:
 *   0 — all budgets satisfied (or current size is below baseline).
 *   1 — at least one budget exceeded; details printed to stderr.
 *   2 — fatal: missing `.next/`, missing manifest, or missing baseline.
 */

import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const NEXT_DIR = join(ROOT, ".next");
const STATIC_DIR = join(NEXT_DIR, "static");
const BASELINE_PATH = join(
  ROOT,
  "design-system",
  "__tests__",
  "bundle-baseline.json",
);

// Per Requirements 12.1 and 12.2.
const JS_DELTA_LIMIT_BYTES = 10 * 1024; // +10 KB
const CSS_DELTA_LIMIT_BYTES = 5 * 1024; // +5 KB

function fatal(message) {
  console.error(`✗ ${message}`);
  process.exit(2);
}

function gzipBytes(buf) {
  return gzipSync(buf, { level: 9 }).length;
}

function readChunk(relPath) {
  // Manifest entries are relative to `.next/`, e.g. "static/chunks/foo.js".
  const abs = join(NEXT_DIR, relPath);
  if (!existsSync(abs)) {
    fatal(`Chunk listed in manifest is missing on disk: ${abs}`);
  }
  return readFileSync(abs);
}

function loadDashboardChunks() {
  // Prefer the App Router manifest (matches the baseline-capture script).
  const appManifestPath = join(NEXT_DIR, "app-build-manifest.json");
  const pagesManifestPath = join(NEXT_DIR, "build-manifest.json");

  if (existsSync(appManifestPath)) {
    const manifest = JSON.parse(readFileSync(appManifestPath, "utf8"));
    const candidates = [
      "/(dashboard)/dashboard/page",
      "(dashboard)/dashboard/page",
      "/dashboard/page",
      "dashboard/page",
    ];
    for (const key of candidates) {
      if (manifest.pages?.[key]) {
        return { manifestKey: key, chunks: manifest.pages[key], source: "app-build-manifest.json" };
      }
    }
    // Fallback: any key ending in `dashboard/page`.
    const found = Object.entries(manifest.pages ?? {}).find(([k]) =>
      k.endsWith("dashboard/page"),
    );
    if (found) {
      return { manifestKey: found[0], chunks: found[1], source: "app-build-manifest.json" };
    }
  }

  if (existsSync(pagesManifestPath)) {
    const manifest = JSON.parse(readFileSync(pagesManifestPath, "utf8"));
    if (manifest.pages?.["/dashboard"]) {
      return {
        manifestKey: "/dashboard",
        chunks: manifest.pages["/dashboard"],
        source: "build-manifest.json",
      };
    }
  }

  fatal(
    "Could not locate `/dashboard` chunks in `.next/app-build-manifest.json` " +
      "or `.next/build-manifest.json`. Did `next build` complete successfully?",
  );
  return null; // unreachable
}

function measureDashboardFirstLoadJs() {
  const { manifestKey, chunks, source } = loadDashboardChunks();
  let raw = 0;
  let gz = 0;
  const perChunk = [];
  for (const rel of chunks) {
    const buf = readChunk(rel);
    const g = gzipBytes(buf);
    perChunk.push({ chunk: rel, rawBytes: buf.length, gzippedBytes: g });
    raw += buf.length;
    gz += g;
  }
  return {
    manifestSource: source,
    manifestKey,
    chunks: perChunk,
    rawBytes: raw,
    gzippedBytes: gz,
  };
}

function measureTotalCss() {
  const cssDir = join(STATIC_DIR, "css");
  if (!existsSync(cssDir)) {
    return { files: [], rawBytes: 0, gzippedBytes: 0 };
  }
  const files = [];
  let raw = 0;
  let gz = 0;
  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const abs = join(dir, entry);
      const s = statSync(abs);
      if (s.isDirectory()) {
        walk(abs);
      } else if (entry.endsWith(".css")) {
        const buf = readFileSync(abs);
        const g = gzipBytes(buf);
        files.push({
          file: abs.slice(NEXT_DIR.length + 1).replace(/\\/g, "/"),
          rawBytes: buf.length,
          gzippedBytes: g,
        });
        raw += buf.length;
        gz += g;
      }
    }
  }
  walk(cssDir);
  return { files, rawBytes: raw, gzippedBytes: gz };
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  return `${(n / 1024).toFixed(2)} KB (${n} B)`;
}

function formatDelta(delta) {
  const sign = delta >= 0 ? "+" : "−";
  return `${sign}${formatBytes(Math.abs(delta))}`;
}

function main() {
  if (!existsSync(NEXT_DIR)) {
    fatal("`.next/` does not exist. Run `npm run build` first.");
  }
  if (!existsSync(BASELINE_PATH)) {
    fatal(
      `Baseline not found at ${BASELINE_PATH}. ` +
        "Run scripts/measure-bundle-baseline.mjs to capture it.",
    );
  }

  const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
  const baselineJs = baseline.dashboardFirstLoadJsBytes;
  const baselineCss = baseline.totalCssBytes;

  if (typeof baselineJs !== "number" || typeof baselineCss !== "number") {
    fatal(
      "Baseline file is missing `dashboardFirstLoadJsBytes` or `totalCssBytes` (numeric, gzipped).",
    );
  }

  const dashboard = measureDashboardFirstLoadJs();
  const css = measureTotalCss();

  const jsDelta = dashboard.gzippedBytes - baselineJs;
  const cssDelta = css.gzippedBytes - baselineCss;

  const jsLimit = baselineJs + JS_DELTA_LIMIT_BYTES;
  const cssLimit = baselineCss + CSS_DELTA_LIMIT_BYTES;

  const jsOver = dashboard.gzippedBytes > jsLimit;
  const cssOver = css.gzippedBytes > cssLimit;

  // Pretty report.
  console.log("Bundle-size check (gzipped, level 9)");
  console.log("─".repeat(56));
  console.log(`Manifest source:   ${dashboard.manifestSource}`);
  console.log(`Dashboard key:     ${dashboard.manifestKey}`);
  console.log(`Dashboard chunks:  ${dashboard.chunks.length}`);
  console.log(`CSS files:         ${css.files.length}`);
  console.log("");
  console.log("                        baseline       current        delta        cap");
  console.log(
    `/dashboard first-load JS  ${formatBytes(baselineJs).padEnd(13)}  ${formatBytes(
      dashboard.gzippedBytes,
    ).padEnd(13)} ${formatDelta(jsDelta).padEnd(12)} +${formatBytes(JS_DELTA_LIMIT_BYTES)}`,
  );
  console.log(
    `total CSS                 ${formatBytes(baselineCss).padEnd(13)}  ${formatBytes(
      css.gzippedBytes,
    ).padEnd(13)} ${formatDelta(cssDelta).padEnd(12)} +${formatBytes(CSS_DELTA_LIMIT_BYTES)}`,
  );
  console.log("");

  if (jsOver) {
    console.error(
      `✗ /dashboard first-load JS exceeds baseline + ${formatBytes(JS_DELTA_LIMIT_BYTES)}.`,
    );
    console.error(
      `  baseline ${formatBytes(baselineJs)} → current ${formatBytes(
        dashboard.gzippedBytes,
      )} (${formatDelta(jsDelta)}, cap ${formatBytes(jsLimit)}).`,
    );
  }
  if (cssOver) {
    console.error(
      `✗ Total CSS exceeds baseline + ${formatBytes(CSS_DELTA_LIMIT_BYTES)}.`,
    );
    console.error(
      `  baseline ${formatBytes(baselineCss)} → current ${formatBytes(
        css.gzippedBytes,
      )} (${formatDelta(cssDelta)}, cap ${formatBytes(cssLimit)}).`,
    );
  }

  if (jsOver || cssOver) {
    process.exit(1);
  }

  console.log("✓ All bundle-size budgets satisfied.");
}

main();
