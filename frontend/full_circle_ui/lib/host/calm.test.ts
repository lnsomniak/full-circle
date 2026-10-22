import { afterEach, describe, expect, it, vi } from "vitest";
import { isCalm } from "./calm";

function reducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: matches && query.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
}

describe("isCalm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    history.replaceState(null, "", "/");
  });

  it("is false by default", () => {
    reducedMotion(false);
    expect(isCalm()).toBe(false);
  });

  it("is true under ?still", () => {
    reducedMotion(false);
    history.replaceState(null, "", "/?still");
    expect(isCalm()).toBe(true);
  });

  it("is true when the visitor prefers reduced motion", () => {
    reducedMotion(true);
    expect(isCalm()).toBe(true);
  });
});
