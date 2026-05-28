// @vitest-environment jsdom

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BrandMark } from "@/components/brand/brand-mark";

const WORKSPACE_ROOT = resolve(__dirname, "..", "..");
const MARK_SVG_PATH = resolve(WORKSPACE_ROOT, "public", "brand", "mark.svg");

afterEach(() => {
  cleanup();
});

describe("Brand_Mark — example test (Requirements 1.4, 1.5)", () => {
  it("ships the brand-mark SVG asset at public/brand/mark.svg", () => {
    expect(existsSync(MARK_SVG_PATH)).toBe(true);
  });

  it("uses a 24x24 viewBox in the brand-mark SVG asset", () => {
    const svg = readFileSync(MARK_SVG_PATH, "utf8");
    expect(svg).toMatch(/viewBox=["']0 0 24 24["']/);
  });

  it("renders an <svg> element (not a Lucide icon component)", () => {
    const { container } = render(
      createElement(BrandMark, {
        size: "md",
        "aria-label": "Receipt Guardian",
      }),
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("does not emit any lucide-* className substring", () => {
    const { container } = render(
      createElement(BrandMark, {
        size: "md",
        "aria-label": "Receipt Guardian",
      }),
    );

    // Walk every element rendered by <BrandMark> and assert no class contains
    // the `lucide-` prefix that lucide-react attaches to its icon SVGs (e.g.
    // class="lucide lucide-receipt-text"). This is the structural signal that
    // the brand mark is a custom SVG, not a Lucide icon.
    const allElements = container.querySelectorAll("*");
    for (const el of allElements) {
      const className = el.getAttribute("class") ?? "";
      expect(className).not.toMatch(/\blucide-[\w-]+/);
    }

    // Also assert the rendered HTML does not contain the substring anywhere
    // (covers className applied via attributes, props, or data-* leakage).
    expect(container.innerHTML).not.toMatch(/lucide-[\w-]+/);
  });

  it("renders with role='img' and the provided aria-label when labeled", () => {
    const { container } = render(
      createElement(BrandMark, {
        size: "md",
        "aria-label": "Receipt Guardian",
      }),
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Receipt Guardian");
  });

  it("renders as decorative (aria-hidden='true') when no aria-label is provided", () => {
    const { container } = render(
      createElement(BrandMark, {
        size: "md",
      }),
    );

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    // A decorative mark must not also claim a role="img" identity.
    expect(svg?.getAttribute("role")).toBeNull();
    expect(svg?.getAttribute("aria-label")).toBeNull();
  });
});
