import { afterEach, describe, expect, it, vi } from "vitest";
import { applyTheme, initialTheme, readStoredTheme } from "./theme";

function osPrefers(dark: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches: dark, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("initialTheme", () => {
  it("uses the saved sh-theme over the OS preference", () => {
    localStorage.setItem("sh-theme", "light");
    osPrefers(true);
    expect(initialTheme()).toBe("light");
  });

  it("falls back to the OS preference when nothing is saved", () => {
    osPrefers(true);
    expect(initialTheme()).toBe("dark");
    osPrefers(false);
    expect(initialTheme()).toBe("light");
  });

  it("ignores a saved value that is not light or dark", () => {
    localStorage.setItem("sh-theme", "sepia");
    expect(readStoredTheme()).toBeNull();
  });

  it("never writes sh-theme", () => {
    osPrefers(true);
    initialTheme();
    expect(localStorage.getItem("sh-theme")).toBeNull();
  });
});


describe("applyTheme", () => {
  const palette = { background: "#1e2530", surface: "#232c39", line: "#333941", ink: "#f2ecd8", muted: "#888984", accent: "#c4543a" };

  afterEach(() => {
    document.documentElement.removeAttribute("style");
    document.documentElement.removeAttribute("data-theme");
  });

  it("sets the mode alone when there is no palette", () => {
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.getAttribute("style")).toBeNull();
  });

  it("sets the palette's tokens with the mode", () => {
    applyTheme("dark", palette);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--ground")).toBe("#1e2530");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe("#c4543a");
  });

  it("clears the palette's tokens when the theme is cleared", () => {
    applyTheme("dark", palette);
    applyTheme("dark");
    expect(document.documentElement.getAttribute("style") ?? "").toBe("");
  });
});
