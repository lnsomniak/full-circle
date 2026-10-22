import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COVER_SPECS } from "@/lib/cover-specs";
import { DATA } from "@/lib/data";
import Grid from "./Grid";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

function mount(props: { calm: boolean }) {
  const onPick = vi.fn<(seed: number) => void>();
  act(() => root.render(<Grid lang="en" calm={props.calm} onPick={onPick} />));
  return onPick;
}

const tiles = () => [...host.querySelectorAll<HTMLButtonElement>(".tile")];
const stops = () => tiles().filter((t) => t.tabIndex === 0);
const key = (el: Element, k: string) => act(() => void el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })));
const nameOf = (tile: Element) => tile.getAttribute("aria-label")!.replace(/\. (Seed artist|Recommended artist)\..*$/, "");
const caption = () => host.querySelector("[aria-live]")!.textContent;
const status = () => host.querySelector(".status-dot")!.nextElementSibling!.textContent;

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe("Grid", () => {
  it("lays out one button per tile, one of them a tab stop, on a seed", () => {
    mount({ calm: false });
    expect(tiles().length).toBeGreaterThan(60);
    expect(stops()).toHaveLength(1);
    expect(stops()[0].getAttribute("aria-label")).toMatch(/^Laufey\. Seed artist/);
  });

  it("shows each seed on exactly one tile and every artist somewhere", () => {
    mount({ calm: false });
    const names = tiles().map(nameOf);
    for (const seed of DATA.seeds) expect(names.filter((n) => n === seed.seed)).toHaveLength(1);
    const view = tiles().filter((t) => t.getAttribute("aria-hidden") !== "true").map(nameOf);
    expect(new Set(view).size).toBeGreaterThan(50);
    for (const n of names) expect(COVER_SPECS.map((s) => s.artist)).toContain(n);
  });

  it("moves focus with the arrow keys, keeps one tab stop, and names the focused artist", () => {
    mount({ calm: false });
    const first = stops()[0];
    act(() => first.focus());
    expect(caption()).toContain("Laufey");
    key(first, "ArrowRight");
    const second = document.activeElement as HTMLElement;
    expect(second).not.toBe(first);
    expect(second.classList.contains("tile")).toBe(true);
    expect(stops()).toHaveLength(1);
    expect(stops()[0]).toBe(second);
    expect(caption()).toContain(nameOf(second));
    expect(second.hasAttribute("data-flipped")).toBe(true);
  });

  it("picks a seed with a click on its tile and ignores a recommended tile", () => {
    const onPick = mount({ calm: false });
    const tile = (name: string) => tiles().find((t) => nameOf(t) === name)!;
    act(() => tile("Dave").click());
    expect(onPick).toHaveBeenCalledWith(2);
    onPick.mockClear();
    act(() => tile("Gorillaz").click());
    expect(onPick).not.toHaveBeenCalled();
  });

  it("picks a seed from its chip", () => {
    const onPick = mount({ calm: false });
    const chip = [...host.querySelectorAll("button")].find((b) => b.textContent === "Tame Impala")!;
    act(() => chip.click());
    expect(onPick).toHaveBeenCalledWith(7);
  });

  it("flips tiles near a touch and lets them go on release, keeping the caption", () => {
    mount({ calm: false });
    act(() => void vi.advanceTimersByTime(6000));
    const group = host.querySelector("[role=group]")!;
    act(() => void group.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientX: 300, clientY: 400 })));
    expect(host.querySelectorAll(".tile[data-flipped]").length).toBeGreaterThan(0);
    const label = caption();
    expect(label).not.toBe("");
    act(() => void group.dispatchEvent(Object.assign(new MouseEvent("pointerup", { bubbles: true }), { pointerType: "touch" })));
    act(() => void vi.advanceTimersByTime(900));
    expect(host.querySelectorAll(".tile[data-flipped]")).toHaveLength(0);
    expect(caption()).toBe(label);
  });

  it("plays the wave from the Ripple button: every tile turns, then turns back", () => {
    mount({ calm: false });
    act(() => void vi.advanceTimersByTime(5000));
    expect(host.querySelectorAll(".tile[data-flipped]")).toHaveLength(0);
    const button = [...host.querySelectorAll("button")].find((b) => b.textContent === "Ripple")!;
    act(() => button.click());
    expect(host.querySelectorAll(".tile[data-flipped]")).toHaveLength(tiles().length);
    expect(tiles().every((t) => t.style.transitionDelay !== "")).toBe(true);
    act(() => void vi.advanceTimersByTime(6000));
    expect(host.querySelectorAll(".tile[data-flipped]")).toHaveLength(0);
    expect(tiles().every((t) => t.style.transitionDelay === "")).toBe(true);
  });

  it("plays the five lines once, 1.2 s apart, ending on Almost there inside five seconds", () => {
    mount({ calm: false });
    const seen = [status()];
    for (let ms = 0; ms < 6000; ms += 100) {
      act(() => void vi.advanceTimersByTime(100));
      if (status() !== seen[seen.length - 1]) seen.push(status());
      if (ms < 4700) expect(status()).not.toBe("Almost there");
    }
    expect(seen).toEqual(["Turning on the engine...", "Consulting the algorithm...", "Finding hidden gems...", "Curating recommendations...", "Almost there"]);
    act(() => void vi.advanceTimersByTime(20000));
    expect(status()).toBe("Almost there");
  });

  it("under calm shows the final line at once, with no Ripple, no wave and no flips", () => {
    mount({ calm: true });
    expect(status()).toBe("Almost there");
    expect([...host.querySelectorAll("button")].some((b) => b.textContent === "Ripple")).toBe(false);
    const group = host.querySelector("[role=group]")!;
    act(() => void vi.advanceTimersByTime(5000));
    act(() => void group.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 300, clientY: 400 })));
    expect(host.querySelectorAll(".tile[data-flipped]")).toHaveLength(0);
  });
});
