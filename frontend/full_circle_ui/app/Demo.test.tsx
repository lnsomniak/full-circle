import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const effects = vi.hoisted(() => ({ sendAmbient: vi.fn(), sendTint: vi.fn() }));
vi.mock("@/lib/host/siteEffects", () => effects);

import Demo from "./Demo";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const palette = { background: "#16161a", surface: "#1d1d22", line: "#333335", ink: "#e8e4dc", muted: "#7b7977", accent: "#8c1c13" };

let host: HTMLDivElement;
let root: Root;

const fromPortfolio = (data: object) =>
  act(() => void window.dispatchEvent(new MessageEvent("message", { origin: location.origin, source: window, data: { source: "sh-portfolio", ...data } })));
const button = (label: string) => [...host.querySelectorAll("button")].find((b) => b.textContent === label)!;
const frame = () => act(() => void vi.advanceTimersByTime(20));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  effects.sendAmbient.mockClear();
  effects.sendTint.mockClear();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(<Demo />));
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.documentElement.removeAttribute("style");
  document.documentElement.removeAttribute("data-theme");
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("site effects from the demo", () => {
  it("starts on the grid with no tint", () => {
    expect(host.querySelector(".tile")).not.toBeNull();
    expect(effects.sendTint).toHaveBeenLastCalledWith(null);
  });

  it("sends ambient after each theme message, spread or plain, once the theme is applied", () => {
    fromPortfolio({ type: "theme", mode: "dark", palette, typefaces: { serif: "Cardo", label: "DM Mono" } });
    expect(effects.sendAmbient).not.toHaveBeenCalled();
    frame();
    expect(effects.sendAmbient).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue("--ground")).toBe("#16161a");
    fromPortfolio({ type: "theme", mode: "light" });
    frame();
    expect(effects.sendAmbient).toHaveBeenCalledTimes(2);
    expect(document.documentElement.getAttribute("style") ?? "").toBe("");
  });

  it("sends the seed's tint when a seed is picked, and null when it is dropped", () => {
    act(() => button("Laufey").click());
    expect(effects.sendTint).toHaveBeenLastCalledWith("#cf8f93");
    act(() => button("Back to grid").click());
    expect(effects.sendTint).toHaveBeenLastCalledWith(null);
    act(() => button("Arctic Monkeys").click());
    expect(effects.sendTint).toHaveBeenLastCalledWith("#d98a2b");
  });

  it("changes the tint when another seed is picked on the results screen", () => {
    act(() => button("Tame Impala").click());
    expect(effects.sendTint).toHaveBeenLastCalledWith("#4c1d95");
    act(() => button("Dave").click());
    expect(effects.sendTint).toHaveBeenLastCalledWith("#b3392f");
  });

  it("on reset returns to the grid, clears the tint and sends ambient again", () => {
    act(() => button("Cuco").click());
    effects.sendTint.mockClear();
    fromPortfolio({ type: "reset" });
    frame();
    expect(host.querySelector(".tile")).not.toBeNull();
    expect(effects.sendTint).toHaveBeenCalledWith(null);
    expect(effects.sendAmbient).toHaveBeenCalledTimes(1);
  });
});

describe("reset on the grid", () => {
  it("still sends a null tint, so the portfolio's margin is never stale", () => {
    effects.sendTint.mockClear();
    fromPortfolio({ type: "reset" });
    expect(effects.sendTint).toHaveBeenCalledWith(null);
  });
});

describe("the results screen", () => {
  it("shows a palette strip for every recommended artist and the seed's card", () => {
    act(() => button("Laufey").click());
    expect(host.querySelectorAll("ol > li")).toHaveLength(10);
    expect(host.querySelectorAll("ol > li [aria-hidden=true].flex")).toHaveLength(10);
    expect(host.querySelector("svg text")?.textContent).toBe("#1d2347");
  });

  it("links to the four profiles, each in a new tab with no opener", () => {
    act(() => button("Laufey").click());
    const links = [...host.querySelectorAll("nav a")] as HTMLAnchorElement[];
    expect(links.map((a) => a.textContent?.replace(" (opens in a new tab)", ""))).toEqual(["github", "linkedin", "instagram", "spotify"]);
    for (const a of links) {
      expect(a.target).toBe("_blank");
      expect(a.rel).toBe("noopener noreferrer");
      expect(a.href).toMatch(/^https:\/\//);
    }
  });

  it("says why there are no real covers", () => {
    act(() => button("Laufey").click());
    expect(host.textContent).toContain("Covers here are original colour cards.");
  });
});
