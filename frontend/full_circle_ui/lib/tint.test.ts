import { describe, expect, it } from "vitest";
import { COVER_SPECS } from "./cover-specs";
import { lightnessAndSaturation, readsAsColour, tintFor } from "./tint";

const palette = (artist: string) => COVER_SPECS.find((spec) => spec.artist === artist)!.palette;

describe("lightnessAndSaturation", () => {
  it("reads pure and grey colours", () => {
    expect(lightnessAndSaturation("#ff0000")).toEqual({ lightness: 0.5, saturation: 1 });
    expect(lightnessAndSaturation("#808080").saturation).toBe(0);
    expect(lightnessAndSaturation("#000000")).toEqual({ lightness: 0, saturation: 0 });
    expect(lightnessAndSaturation("#ffffff")).toEqual({ lightness: 1, saturation: 0 });
  });
});

describe("readsAsColour", () => {
  it("refuses near-black, near-white and grey", () => {
    for (const hex of ["#1d2347", "#111111", "#efd9a8", "#ffffff", "#808080", "#6a3b63"]) expect(readsAsColour(hex), hex).toBe(false);
  });

  it("accepts a mid-tone, saturated colour", () => {
    for (const hex of ["#cf8f93", "#d98a2b", "#4c1d95", "#14b8a6", "#ff0000"]) expect(readsAsColour(hex), hex).toBe(true);
  });
});

describe("tintFor", () => {
  it("takes the first chip when it already reads", () => {
    expect(tintFor(palette("Tame Impala"))).toBe("#4c1d95");
  });

  it("skips chips that are near-black or too dull to read as a colour", () => {
    expect(tintFor(palette("Laufey"))).toBe("#cf8f93");
    expect(tintFor(palette("Arctic Monkeys"))).toBe("#d98a2b");
  });

  it("falls back to the first chip when none reads", () => {
    expect(tintFor(["#111111", "#222222", "#333333"])).toBe("#111111");
  });

  it("always sends one of the card's own chips, one that reads whenever any does", () => {
    for (const { artist, palette: chips } of COVER_SPECS) {
      const tint = tintFor(chips);
      expect(chips, artist).toContain(tint);
      if (chips.some(readsAsColour)) expect(readsAsColour(tint), artist).toBe(true);
      else expect(tint, artist).toBe(chips[0]);
    }
  });

  it("keeps the first chip for the four cards with no chip that reads as a colour", () => {
    const keepsFirst = COVER_SPECS.filter(({ palette: chips }) => !chips.some(readsAsColour)).map((spec) => spec.artist);
    expect(keepsFirst).toEqual(["juju<3", "Lamp", "Saga Faye", "The Neighbourhood"]);
  });
});
