import { describe, expect, it } from "vitest";
import { contrast, deriveVars, mix, PALETTE_VARS, readPalette, type Palette } from "./palette";

// Six Nexus themes as the portfolio sends them: tokens flattened to #rrggbb over their ground.
// Two light, four dark; Granite's accent and Slate's muted are the weak ones.
const SAMPLES: Record<string, Palette> = {
  paper: { background: "#ede7da", surface: "#f5f1e8", line: "#d2cec7", ink: "#1a2a4a", muted: "#5c6577", accent: "#b33d26" },
  bleachSun: { background: "#f4eee2", surface: "#faf6ec", line: "#d9d3c7", ink: "#241e14", muted: "#6b6252", accent: "#b23a24" },
  slate: { background: "#1e2530", surface: "#232c39", line: "#333941", ink: "#f2ecd8", muted: "#888984", accent: "#c4543a" },
  granite: { background: "#16161a", surface: "#1d1d22", line: "#333335", ink: "#e8e4dc", muted: "#7b7977", accent: "#8c1c13" },
  nord: { background: "#2e3440", surface: "#3b4252", line: "#494e59", ink: "#eceff4", muted: "#81a1c1", accent: "#88c0d0" },
  brass: { background: "#1c1a17", surface: "#24221e", line: "#3a3731", ink: "#f0e6d2", muted: "#827c71", accent: "#c9a227" },
};

describe("readPalette", () => {
  it("accepts six #rrggbb colours and lower-cases them", () => {
    expect(readPalette({ ...SAMPLES.paper, accent: "#B33D26" })).toEqual(SAMPLES.paper);
  });

  it("refuses a missing key", () => {
    const rest: Partial<Palette> = { ...SAMPLES.paper };
    delete rest.muted;
    expect(readPalette(rest)).toBeNull();
  });

  it("refuses anything but #rrggbb", () => {
    for (const bad of ["#fff", "red", "rgb(1,2,3)", "#12345g", "#1234567", "", 5, null]) {
      expect(readPalette({ ...SAMPLES.paper, accent: bad })).toBeNull();
    }
  });

  it("refuses a value that is not an object", () => {
    expect(readPalette(undefined)).toBeNull();
    expect(readPalette(null)).toBeNull();
    expect(readPalette("#ffffff")).toBeNull();
  });

  it("drops keys it does not know", () => {
    expect(readPalette({ ...SAMPLES.paper, themeId: "paper" })).toEqual(SAMPLES.paper);
  });
});

describe("mix", () => {
  it("matches color-mix(in srgb): pct of the first, the rest of the second", () => {
    expect(mix("#000000", "#ffffff", 50)).toBe("#808080");
    expect(mix("#ff0000", "#0000ff", 100)).toBe("#ff0000");
    expect(mix("#ff0000", "#0000ff", 0)).toBe("#0000ff");
  });
});

describe("deriveVars", () => {
  for (const [name, palette] of Object.entries(SAMPLES)) {
    describe(name, () => {
      const vars = deriveVars(palette);
      const on = (fg: keyof typeof vars, bg: string) => contrast(vars[fg], bg);

      it("sets every palette variable", () => {
        expect(Object.keys(vars).sort()).toEqual([...PALETTE_VARS].sort());
      });

      it("passes the palette's own colours through as fills", () => {
        expect(vars["--ground"]).toBe(palette.background);
        expect(vars["--panel"]).toBe(palette.surface);
        expect(vars["--line"]).toBe(palette.line);
        expect(vars["--ink"]).toBe(palette.ink);
        expect(vars["--accent"]).toBe(palette.accent);
      });

      it("reads body text at 4.5:1 on ground, panel and field", () => {
        for (const bg of [palette.background, palette.surface, vars["--field"]]) expect(on("--ink", bg)).toBeGreaterThanOrEqual(4.5);
      });

      it("reads secondary text at 4.5:1 on ground and panel", () => {
        for (const bg of [palette.background, palette.surface]) expect(on("--ink-dim", bg)).toBeGreaterThanOrEqual(4.5);
      });

      it("reads accent text, similarity and the title gradient at 4.5:1 on ground and panel", () => {
        for (const bg of [palette.background, palette.surface]) {
          for (const v of ["--accent-text", "--accent-soft", "--grad-from", "--grad-to"] as const) {
            expect(on(v, bg)).toBeGreaterThanOrEqual(4.5);
          }
        }
      });

      it("reads tag text on the tag and the chip label on the accent at 4.5:1", () => {
        expect(on("--tag-ink", vars["--tag"])).toBeGreaterThanOrEqual(4.5);
        expect(on("--accent-ink", palette.accent)).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it("keeps a palette's accent as sent when it already reads", () => {
    const vars = deriveVars(SAMPLES.nord);
    expect(vars["--accent-text"]).toBe(SAMPLES.nord.accent);
  });

  it("lifts an accent that does not read (Granite's) instead of using it as text", () => {
    const vars = deriveVars(SAMPLES.granite);
    expect(contrast(SAMPLES.granite.accent, SAMPLES.granite.surface)).toBeLessThan(4.5);
    expect(vars["--accent-text"]).not.toBe(SAMPLES.granite.accent);
  });
});
