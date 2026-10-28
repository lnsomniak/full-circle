import { describe, expect, it } from "vitest";
import { coverSvg, type CoverSpec } from "./covers";
import { COVER_SPECS } from "./cover-specs";
import { DATA } from "./data";

const unescape = (text: string) => text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const texts = (svg: string) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => unescape(m[1]));
const chipRects = (svg: string) => [...svg.matchAll(/<rect x="([\d.]+)" y="40" width="([\d.]+)"[^>]*fill="(#[0-9a-f]{6})"/g)].map((m) => ({ x: Number(m[1]), w: Number(m[2]), color: m[3] }));

describe.each(COVER_SPECS)("cover for $artist", (spec) => {
  const svg = coverSvg(spec);

  it("is the same markup every time", () => {
    expect(coverSvg(spec)).toBe(svg);
  });

  it("is a square svg", () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">')).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("carries no raster, link, script, id or outside reference", () => {
    const body = svg.replace('xmlns="http://www.w3.org/2000/svg"', "");
    for (const forbidden of ["<image", "<a ", "<script", "<foreignObject", "<use", "<defs", " id=", "url(", "href", "http://", "https://", "@import"]) {
      expect(body).not.toContain(forbidden);
    }
  });

  it("sets each chip's hex value, then the artist's name, as its only text", () => {
    expect(texts(svg)).toEqual([...spec.palette, spec.artist]);
  });

  it("draws one chip per palette colour, in the palette's order", () => {
    expect(chipRects(svg).map((chip) => chip.color)).toEqual(spec.palette);
  });

  it("keeps the chips inside the card's margins", () => {
    for (const { x, w } of chipRects(svg)) {
      expect(x).toBeGreaterThanOrEqual(40);
      expect(x + w).toBeLessThanOrEqual(560.05);
    }
  });
});

describe("coverSvg", () => {
  const long: CoverSpec = { artist: "A Name Far Longer Than Any Card Could Hold", palette: ["#000000", "#555555", "#aaaaaa"] };

  it("shrinks the name so it fits the card's width", () => {
    const size = Number(coverSvg(long).match(/<text x="40" y="534" font-size="(\d+)"/)?.[1]);
    expect(size * 0.62 * long.artist.length).toBeLessThanOrEqual(520);
    expect(size).toBeLessThan(64);
  });

  it("escapes markup in a name", () => {
    expect(coverSvg({ artist: "A & B <C>", palette: ["#000000", "#555555", "#aaaaaa"] })).toContain("A &amp; B &lt;C&gt;");
  });

  it("fills the card's width with three, four and five chips", () => {
    const colors = ["#000000", "#111111", "#222222", "#333333", "#444444"];
    for (const count of [3, 4, 5]) {
      const chips = chipRects(coverSvg({ artist: "X", palette: colors.slice(0, count) }));
      const last = chips[chips.length - 1];
      expect(last.x + last.w).toBeCloseTo(560, 0);
    }
  });
});

describe("COVER_SPECS", () => {
  const seeds = DATA.seeds.map((s) => s.seed);
  const recommended = DATA.seeds.flatMap((s) => [...s.weighted, ...s.unweighted].map((r) => r.artist));
  const shown = [...new Set([...seeds, ...recommended])];
  const named = COVER_SPECS.map((spec) => spec.artist);

  it("covers every artist the demo can show, and no one else", () => {
    expect([...named].sort()).toEqual([...shown].sort());
  });

  it("lists the seeds first, in the demo's order", () => {
    expect(named.slice(0, seeds.length)).toEqual(seeds);
  });

  it("names each artist once", () => {
    expect(new Set(named).size).toBe(named.length);
  });

  it("gives each card three to five distinct #rrggbb chips", () => {
    for (const { artist, palette } of COVER_SPECS) {
      expect(palette.length, artist).toBeGreaterThanOrEqual(3);
      expect(palette.length, artist).toBeLessThanOrEqual(5);
      expect(new Set(palette).size, artist).toBe(palette.length);
      for (const color of palette) expect(color, artist).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
