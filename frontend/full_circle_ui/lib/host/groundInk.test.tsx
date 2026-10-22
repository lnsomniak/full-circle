import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGroundInk } from "./groundInk";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Probe() {
  const { ground, ink } = useGroundInk();
  return <p>{`${ground} ${ink}`}</p>;
}

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.documentElement.removeAttribute("style");
});

const flush = () => act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));

describe("useGroundInk", () => {
  it("falls back to the demo's dark colours when the tokens are not set", () => {
    act(() => root.render(<Probe />));
    expect(host.textContent).toBe("#121212 #f3f4f6");
  });

  it("reads the tokens on <html> and follows a theme being applied and cleared", async () => {
    document.documentElement.style.setProperty("--ground", "#ede7da");
    document.documentElement.style.setProperty("--ink", "#1a2a4a");
    act(() => root.render(<Probe />));
    expect(host.textContent).toBe("#ede7da #1a2a4a");
    document.documentElement.style.setProperty("--ground", "#1e2530");
    await flush();
    expect(host.textContent).toBe("#1e2530 #1a2a4a");
    document.documentElement.removeAttribute("style");
    await flush();
    expect(host.textContent).toBe("#121212 #f3f4f6");
  });

  it("ignores a token that is not #rrggbb", () => {
    document.documentElement.style.setProperty("--ground", "rgb(1, 2, 3)");
    act(() => root.render(<Probe />));
    expect(host.textContent).toBe("#121212 #f3f4f6");
  });
});
