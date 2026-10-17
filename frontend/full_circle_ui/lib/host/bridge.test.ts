import { afterEach, describe, expect, it, vi } from "vitest";
import { readParentMessage, startBridge } from "./bridge";

const parent = {} as Window;
const stranger = {} as Window;

function message(init: { origin?: string; source?: Window | null; data?: unknown }): MessageEvent {
  return {
    origin: init.origin ?? location.origin,
    source: init.source === undefined ? parent : init.source,
    data: init.data,
  } as MessageEvent;
}

const good = { source: "sh-portfolio", type: "theme", mode: "dark" };
const reset = { source: "sh-portfolio", type: "reset" };

describe("readParentMessage", () => {
  it("accepts a theme message from the parent on the same origin", () => {
    expect(readParentMessage(message({ data: good }), parent)).toEqual({ type: "theme", mode: "dark" });
  });

  it("accepts a reset message from the parent on the same origin", () => {
    expect(readParentMessage(message({ data: reset }), parent)).toEqual({ type: "reset" });
  });

  it("refuses another origin", () => {
    expect(readParentMessage(message({ origin: "https://evil.example", data: good }), parent)).toBeNull();
    expect(readParentMessage(message({ origin: "https://evil.example", data: reset }), parent)).toBeNull();
  });

  it("refuses a sender that is not the parent window", () => {
    expect(readParentMessage(message({ source: stranger, data: good }), parent)).toBeNull();
    expect(readParentMessage(message({ source: stranger, data: reset }), parent)).toBeNull();
  });

  it("refuses a message with the wrong source tag", () => {
    expect(readParentMessage(message({ data: { ...good, source: "other" } }), parent)).toBeNull();
    expect(readParentMessage(message({ data: { ...reset, source: "other" } }), parent)).toBeNull();
  });

  it("refuses a mode that is not light or dark", () => {
    expect(readParentMessage(message({ data: { ...good, mode: "sepia" } }), parent)).toBeNull();
  });

  it("refuses data that is not an object", () => {
    expect(readParentMessage(message({ data: "dark" }), parent)).toBeNull();
    expect(readParentMessage(message({ data: null }), parent)).toBeNull();
  });
});

describe("startBridge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resets on the parent's request and replies ok to the same origin", () => {
    const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const onReset = vi.fn();
    const stop = startBridge({ onTheme: vi.fn(), onReset });
    window.dispatchEvent(new MessageEvent("message", { origin: location.origin, source: window, data: reset }));
    stop();
    expect(onReset).toHaveBeenCalledOnce();
    expect(post).toHaveBeenCalledWith({ source: "fullcircle-demo", type: "reset", ok: true }, location.origin);
  });

  it("ignores a reset from another origin", () => {
    const post = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const onReset = vi.fn();
    const stop = startBridge({ onTheme: vi.fn(), onReset });
    window.dispatchEvent(new MessageEvent("message", { origin: "https://evil.example", source: window, data: reset }));
    stop();
    expect(onReset).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
