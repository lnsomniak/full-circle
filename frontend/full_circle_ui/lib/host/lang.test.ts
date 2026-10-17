import { afterEach, describe, expect, it, vi } from "vitest";
import { readLang } from "./lang";

function browserLanguage(value: string) {
  vi.spyOn(navigator, "language", "get").mockReturnValue(value);
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("readLang", () => {
  it("uses the saved sh-lang over the browser language", () => {
    localStorage.setItem("sh-lang", "es");
    browserLanguage("en-US");
    expect(readLang()).toBe("es");
  });

  it("uses Spanish when the browser language starts with es", () => {
    browserLanguage("es-MX");
    expect(readLang()).toBe("es");
  });

  it("uses English otherwise", () => {
    browserLanguage("fr-FR");
    expect(readLang()).toBe("en");
  });

  it("ignores a saved value that is not en or es", () => {
    localStorage.setItem("sh-lang", "fr");
    browserLanguage("en-US");
    expect(readLang()).toBe("en");
  });

  it("never writes sh-lang", () => {
    browserLanguage("es-ES");
    readLang();
    expect(localStorage.getItem("sh-lang")).toBeNull();
  });
});
