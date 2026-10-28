import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { applyTypefaces, fontSlug, HOUSE, LABELS, readTypefaces, SERIFS, stack, TYPEFACE_VARS } from "./typefaces";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fontsSource = readFileSync(resolve(root, "lib/fonts.ts"), "utf-8");
const imported = [...fontsSource.matchAll(/^import "@fontsource\/([^/]+)\/([^"]+)";$/gm)].map((m) => ({ slug: m[1], file: m[2] }));

describe("the bundle", () => {
  const allowed = [...SERIFS, ...LABELS];

  it("imports every allowlisted family, and nothing else", () => {
    expect(imported.map((i) => i.slug).sort()).toEqual([...new Set(allowed.map(fontSlug))].sort());
  });

  it("imports only the Latin regular weight", () => {
    for (const { file } of imported) expect(file).toBe("latin-400.css");
  });

  it("finds each imported package's stylesheet on disk", () => {
    for (const { slug, file } of imported) {
      expect(existsSync(resolve(root, "node_modules/@fontsource", slug, file)), slug).toBe(true);
    }
  });

  it("has the house pair on its lists", () => {
    expect(SERIFS).toContain(HOUSE.serif);
    expect(LABELS).toContain(HOUSE.label);
  });

  it("lists no family twice within a role", () => {
    expect(new Set(SERIFS).size).toBe(SERIFS.length);
    expect(new Set(LABELS).size).toBe(LABELS.length);
  });
});

describe("readTypefaces", () => {
  it("accepts a pair that is on the lists", () => {
    expect(readTypefaces({ serif: "Gelasio", label: "Source Code Pro" })).toEqual({ serif: "Gelasio", label: "Source Code Pro" });
  });

  it("falls back to the house family for a name that is not on the list", () => {
    expect(readTypefaces({ serif: "Comic Sans MS", label: "Papyrus" })).toEqual(HOUSE);
  });

  it("falls back role by role when one name is good and one is not", () => {
    expect(readTypefaces({ serif: "Literata", label: "Papyrus" })).toEqual({ serif: "Literata", label: HOUSE.label });
    expect(readTypefaces({ serif: "Papyrus", label: "Victor Mono" })).toEqual({ serif: HOUSE.serif, label: "Victor Mono" });
  });

  it("keeps a family to its own role", () => {
    expect(readTypefaces({ serif: "Space Mono", label: "Gelasio" })).toEqual(HOUSE);
  });

  it("falls back for a missing role, a name of the wrong type, or a different case", () => {
    expect(readTypefaces({ serif: "Cardo" })).toEqual({ serif: "Cardo", label: HOUSE.label });
    expect(readTypefaces({ serif: 5, label: null })).toEqual(HOUSE);
    expect(readTypefaces({ serif: "eb garamond", label: "ibm plex mono" })).toEqual(HOUSE);
  });

  it("never lets a CSS payload through", () => {
    const hostile = "x'; background:url(//evil.example)";
    expect(readTypefaces({ serif: hostile, label: hostile })).toEqual(HOUSE);
  });

  it("is null when the value is not an object", () => {
    for (const bad of [undefined, null, "Gelasio", 5]) expect(readTypefaces(bad)).toBeNull();
  });
});

describe("stack", () => {
  it("ends a voice in a serif and a label in a mono", () => {
    expect(stack("serif", "Gelasio")).toBe("'Gelasio', Georgia, serif");
    expect(stack("label", "JetBrains Mono")).toBe("'JetBrains Mono', ui-monospace, monospace");
  });

  it("ends a sans label (Archivo) in a sans", () => {
    expect(stack("label", "Archivo")).toBe("'Archivo', ui-sans-serif, system-ui, sans-serif");
  });
});

describe("applyTypefaces", () => {
  afterEach(() => applyTypefaces(null));
  const read = () => TYPEFACE_VARS.map((name) => document.documentElement.style.getPropertyValue(name));

  it("sets both roles on <html>", () => {
    applyTypefaces({ serif: "Cardo", label: "DM Mono" });
    expect(read()).toEqual(["'Cardo', Georgia, serif", "'DM Mono', ui-monospace, monospace"]);
  });

  it("leaves nothing behind for plain mode", () => {
    applyTypefaces({ serif: "Cardo", label: "DM Mono" });
    applyTypefaces(null);
    expect(read()).toEqual(["", ""]);
  });
});
