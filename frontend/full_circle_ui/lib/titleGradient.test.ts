import { describe, expect, it } from "vitest";
import { COVER_SPECS } from "./cover-specs";
import { contrast, mix } from "./host/palette";
import { titleStops } from "./titleGradient";

// The demo's own ground, then three Nexus palettes as the portfolio sends them: one light, two dark.
const GROUNDS = [
  { name: "demo dark", ground: "#121212", ink: "#ededed" },
  { name: "paper", ground: "#ede7da", ink: "#1a2a4a" },
  { name: "slate", ground: "#1e2530", ink: "#f2ecd8" },
  { name: "granite", ground: "#16161a", ink: "#e8e4dc" },
];

describe("titleStops", () => {
  it("takes the first two chips that already read, in the card's order", () => {
    const laufey = COVER_SPECS.find((spec) => spec.artist === "Laufey")!.palette;
    expect(titleStops(laufey, "#121212", "#ededed")).toEqual(["#cf8f93", "#efd9a8"]);
    expect(titleStops(laufey, "#ede7da", "#1a2a4a")).toEqual(["#1d2347", "#6a3b63"]);
  });

  it("lifts chips that do not read toward the ink when fewer than two do", () => {
    const dark = ["#111111", "#1a1a1a", "#222222", "#2a2a2a"];
    const [a, b] = titleStops(dark, "#121212", "#ededed");
    expect(contrast(a, "#121212")).toBeGreaterThanOrEqual(3);
    expect(contrast(b, "#121212")).toBeGreaterThanOrEqual(3);
  });

  it("never returns the same stop twice", () => {
    const [a, b] = titleStops(["#ededed", "#121212", "#131313", "#141414"], "#121212", "#ededed");
    expect(a).not.toBe(b);
  });

  describe.each(GROUNDS)("on $name", ({ ground, ink }) => {
    it("reads at 3:1 at both stops and along the gradient, for every artist", () => {
      for (const { artist, palette } of COVER_SPECS) {
        const [from, to] = titleStops(palette, ground, ink);
        for (let pct = 0; pct <= 100; pct += 10) {
          expect(contrast(mix(from, to, pct), ground), `${artist} at ${pct}%`).toBeGreaterThanOrEqual(3);
        }
        expect(contrast(from, ground), artist).toBeGreaterThanOrEqual(3);
        expect(contrast(to, ground), artist).toBeGreaterThanOrEqual(3);
      }
    });
  });
});
