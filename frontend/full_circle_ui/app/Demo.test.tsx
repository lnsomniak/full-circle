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

  it("gives every seed chip the themed focus ring, and the selected one the accent fill", () => {
    act(() => button("Laufey").click());
    const chips = [...host.querySelectorAll("button[aria-pressed]")];
    expect(chips).toHaveLength(8);
    for (const chip of chips) expect(chip.className).toContain("focus-visible:outline-accent-text");
    expect(chips.filter((c) => c.className.includes("bg-accent-fill")).map((c) => c.textContent)).toEqual(["Laufey"]);
  });

  it("keeps the seed panel's vertical rhythm tight, so the longer Spanish weighted label still fits 700px", () => {
    act(() => button("Laufey").click());
    const panel = host.querySelector("main section > div.rounded-xl")!;
    expect(panel.className).toContain("py-3");
    expect(panel.className).not.toMatch(/(^|\s)p-4(\s|$)/);
    expect(panel.querySelector("div.space-y-3")).not.toBeNull();
    expect(panel.querySelector("div.flex-wrap")?.className).toContain("mb-3");
    expect(panel.querySelector("textarea")?.rows).toBe(5);
    expect(host.querySelector("main")?.className).toContain("py-3");
    expect(host.querySelector("main")?.className).not.toMatch(/(^|\s)p-5(\s|$)/);
    expect(host.querySelector("main > div:last-child")?.className).toContain("mt-2");
  });

  it("puts the weighted note on its own line by the checkbox, which the checkbox is described by", () => {
    act(() => button("Laufey").click());
    const box = host.querySelector("input[type=checkbox]")!;
    const note = host.querySelector("#weighted-note")!;
    expect(box.getAttribute("aria-describedby")).toBe("weighted-note");
    expect(note.tagName).toBe("P");
    expect(note.textContent).toBe("Rare tags count for more, so the list leans toward niche artists.");
    expect(note.closest("label")).toBeNull();
    expect(note.className).not.toContain("pl-");
    expect(box.closest("label")?.textContent).toContain("Enable Weighted Tag Similarity?");
  });

  it("gives the seed column 300px, so the weighted label and the note beside it wrap less", () => {
    act(() => button("Laufey").click());
    expect(host.querySelector("main > div:first-child")?.className).toContain("grid-cols-[300px_minmax(0,1fr)]");
  });

  it("keeps the covers note for the grid, where the cards turn over", () => {
    expect(host.textContent).toContain("The covers you see as the tiles turn over are color cards loosely based and heavily inspired by David Marsh");
    act(() => button("Laufey").click());
    expect(host.textContent).not.toContain("color cards loosely based");
  });

  it("ends in one line: the test accuracy, the About control and the links", () => {
    act(() => button("Laufey").click());
    const footer = host.querySelector("main > div:last-child")!;
    expect(footer.textContent).toContain("Model test accuracy: 76.2%.");
    expect(footer.querySelector("button[aria-expanded]")?.textContent).toBe("About this model");
    expect(footer.querySelectorAll("nav a")).toHaveLength(4);
    expect(footer.textContent).not.toContain("museum");
  });
});

describe("About this model", () => {
  const about = () => host.querySelector("button[aria-expanded]") as HTMLButtonElement;
  const open = () => {
    act(() => button("Laufey").click());
    act(() => about().click());
  };

  it("opens Sergio's note and the history, and closes on the same control", () => {
    act(() => button("Laufey").click());
    expect(about().getAttribute("aria-expanded")).toBe("false");
    expect(host.querySelector("[role=region]")).toBeNull();
    act(() => about().click());
    expect(about().getAttribute("aria-expanded")).toBe("true");
    const panel = host.querySelector("[role=region]")!;
    expect(panel.id).toBe(about().getAttribute("aria-controls"));
    expect(panel.textContent).toContain("is a series of results, a museum, if you will, of my first attempt at properly training an Ai model");
    expect(panel.textContent).toContain("something I wasn't new to hearing about but was new to actually doing unsupervised.");
    expect(panel.textContent).toContain("since there was no score to beat – simply an average");
    expect(panel.textContent).toContain("I opted for the process of elimination");
    expect(panel.textContent).toContain("a different XGBoost shaped wall");
    act(() => about().click());
    expect(host.querySelector("[role=region]")).toBeNull();
  });

  it("swaps the history between the two eras, labelling the old feature set", () => {
    open();
    const panel = () => host.querySelector("[role=region]")!.textContent!;
    expect(panel()).toContain("Current feature set: TF-IDF tags plus listening behavior, 307 features.");
    expect(panel()).not.toContain("167 features");
    act(() => button("Random Forest").click());
    expect(button("Random Forest").getAttribute("aria-pressed")).toBe("true");
    expect(button("XGBoost").getAttribute("aria-pressed")).toBe("false");
    expect(panel()).toContain("Old feature set: raw Last.fm tag counts, 167 features.");
    expect(panel()).not.toContain("307 features");
  });

  it("closes on Escape and gives the focus back to the control", () => {
    open();
    act(() => void window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(host.querySelector("[role=region]")).toBeNull();
    expect(document.activeElement).toBe(about());
  });
});
