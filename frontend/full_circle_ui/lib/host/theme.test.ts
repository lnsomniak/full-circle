import { afterEach, describe, expect, it, vi } from "vitest";
import { initialTheme, readStoredTheme } from "./theme";

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
