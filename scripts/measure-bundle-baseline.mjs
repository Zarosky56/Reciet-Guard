#!/usr/bin/env node
/**
 * One-shot helper for task 1.4: snapshot the pre-redesign bundle baseline.
 *
 * Reads .next/app-build-manifest.json to find every JS chunk loaded for
 * /dashboard's first paint, sums their gzipped + raw sizes, then sums the
 * gzipped + raw sizes of every CSS file under .next/static/css. Writes the
 * result to design-system/__tests__/bundle-baseline.json.
 *
 * Run after `next build` completes successfully.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const NEXT_DIR = join(ROOT, ".next");
const STATIC_DIR = join(NEXT_DIR, "static");
const OUT_PATH = join(ROOT, "design-system", "__tests__", "bundle-baseline.json");

function gzipBytes(buf) {
  return gzipSync(buf, { level: 9 }).length;
}

function readChunk(relPath) {
  // app-build-manifest entries are relative to .next/, e.g. "static/chunks/foo.js"
  const abs = join(NEXT_DIR, relPath);
  if (!existsSync(abs)) {
    throw new Error(`Chunk not found on disk: ${abs}`);
  }
  return readFileSync(abs);
}

function measureDashboardFirstLoadJs() {
  const manifestPath = join(NEXT_DIR, "app-build-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  // The dashboard route is grouped under (dashboard); the manifest key
  // includes the route group, e.g. "(dashboard)/dashboard/page".
  const candidates = [
    "(dashboard)/dashboard/page",
    "/dashboard/page",
    "dashboard/page",
  ];
  let chunks = null;
  let matchedKey = null;
  for (const key of candidates) {
    if (manifest.pages[key]) {
      chunks = manifest.pages[key];
      matchedKey = key;
      break;
    }
  }
  if (!chunks) {
    // Fallback: search any key ending in "dashboard/page"
    const found = Object.entries(manifest.pages).find(([k]) =>
      k.endsWith("dashboard/page"),
    );
    if (found) {
      [matchedKey, chunks] = found;
    }
  }
  if (!chunks) {
    throw new Error("Could not locate dashboard page entry in app-build-manifest.json");
  }
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
  return { manifestKey: matchedKey, chunks: perChunk, rawBytes: raw, gzippedBytes: gz };
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

function main() {
  if (!existsSync(NEXT_DIR)) {
    throw new Error(".next/ does not exist; run `next build` first.");
  }
  const dashboard = measureDashboardFirstLoadJs();
  const css = measureTotalCss();
  const baseline = {
    generatedAt: new Date().toISOString(),
    nextVersion: JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).dependencies.next,
    dashboardFirstLoadJsBytes: dashboard.gzippedBytes,
    dashboardFirstLoadJsBytesRaw: dashboard.rawBytes,
    totalCssBytes: css.gzippedBytes,
    totalCssBytesRaw: css.rawBytes,
    notes:
      "Captured before the premium-ui-redesign begins. dashboardFirstLoadJsBytes and totalCssBytes are gzip-compressed sizes (level 9). Consumed by scripts/check-bundle-size.mjs in task 13.1.",
    detail: {
      dashboard,
      css,
    },
  };
  writeFileSync(OUT_PATH, JSON.stringify(baseline, null, 2) + "\n", "utf8");
  console.log(`Wrote ${OUT_PATH}`);
  console.log(
    `  dashboard first-load JS: ${dashboard.gzippedBytes} B gzipped (${dashboard.rawBytes} B raw, ${dashboard.chunks.length} chunks)`,
  );
  console.log(
    `  total CSS:               ${css.gzippedBytes} B gzipped (${css.rawBytes} B raw, ${css.files.length} files)`,
  );
}

main();
