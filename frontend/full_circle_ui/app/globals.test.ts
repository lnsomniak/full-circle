import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrast } from "@/lib/host/palette";

// jsdom gives import.meta.url a scheme readFileSync refuses, so the stylesheet is found from the package root, where vitest runs.
const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

function block(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`no rule for ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}

function token(selector: string, name: string): string {
  const match = block(selector).match(new RegExp(`${name}:\\s*(#[0-9a-f]{6});`, "i"));
  if (!match) throw new Error(`${selector} has no ${name}`);
  return match[1];
}

describe("the plain light tokens", () => {
  it("fill the selected chip and the checkbox at 3:1 on the panel and on an unselected chip", () => {
    const fill = token('[data-theme="light"]', "--accent-fill");
    for (const bg of ["--panel", "--field"]) expect(contrast(fill, token('[data-theme="light"]', bg))).toBeGreaterThanOrEqual(3);
  });

  it("read the chip label on that fill at 4.5:1", () => {
    expect(contrast(token('[data-theme="light"]', "--accent-ink"), token('[data-theme="light"]', "--accent-fill"))).toBeGreaterThanOrEqual(4.5);
  });
});

describe("the grid's caption layer", () => {
  it("is opaque, so the note and the links read at 4.5:1 over any card", () => {
    expect(block(".grid-caption")).toMatch(/background:\s*var\(--ground\);/);
  });
});
