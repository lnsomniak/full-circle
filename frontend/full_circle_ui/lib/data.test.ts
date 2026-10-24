import { describe, expect, it } from "vitest";
import { COPY, placeholders, t } from "./copy";
import { DATA } from "./data";

describe("baked data", () => {
  it("has ten unique, ranked recommendations per seed and variant", () => {
    for (const seed of DATA.seeds) {
      for (const list of [seed.weighted, seed.unweighted]) {
        expect(list).toHaveLength(10);
        expect(list.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(new Set(list.map((r) => r.artist)).size).toBe(10);
        expect(list.some((r) => r.artist === seed.seed)).toBe(false);
      }
    }
  });

  it("only holds seeds the model scored at or above its threshold", () => {
    for (const seed of DATA.seeds) expect(seed.probability).toBeGreaterThanOrEqual(DATA.threshold);
  });

  it("orders every list by similarity, highest first", () => {
    for (const seed of DATA.seeds) {
      for (const list of [seed.weighted, seed.unweighted]) {
        const sims = list.map((r) => r.similarity);
        expect(sims).toEqual([...sims].sort((a, b) => b - a));
      }
    }
  });
});

describe("copy", () => {
  it("has both languages for every key", () => {
    for (const entry of Object.values(COPY)) {
      expect(entry.en).not.toBe("");
      expect(entry.es).not.toBe("");
    }
  });

  it("flags every Spanish string and the new English labels as placeholders", () => {
    expect(placeholders("es").sort()).toEqual(
      Object.keys(COPY)
        .filter((k) => k !== "title" && k !== "gridTitle")
        .sort(),
    );
    expect(placeholders("en").sort()).toEqual(["links", "newTab", "tilesLabel"]);
  });

  it("keeps the original English text verbatim", () => {
    expect(t("en", "weighted")).toBe("Enable Weighted Tag Similarity? (Prioritizes niche/rare tags)");
    expect(t("en", "topTen")).toBe("Top 10 Recommendations");
  });

  it("keeps Sergio's five loading lines and the grid title verbatim, in his order", () => {
    expect(["line1", "line2", "line3", "line4", "line5"].map((k) => t("en", k as "line1"))).toEqual([
      "Turning on the engine",
      "Consulting the algorithm",
      "Finding hidden gems",
      "Curating recommendations",
      "Almost there",
    ]);
    expect(t("en", "gridTitle")).toBe("FullCircle");
  });
});
