import { describe, expect, it, vi } from "vitest";
import { COVER_SPECS } from "../cover-specs";
import { tintFor } from "../tint";
import { AMBIENT, sendAmbient, sendTint } from "./siteEffects";

const embedded = () => ({ postMessage: vi.fn() }) as unknown as Window & { postMessage: ReturnType<typeof vi.fn> };
const HEX = /^#[0-9a-f]{6}$/;

describe("sendAmbient", () => {
  it("posts the demo's three stops to the parent, to this origin", () => {
    const parent = embedded();
    sendAmbient(parent);
    expect(parent.postMessage).toHaveBeenCalledOnce();
    expect(parent.postMessage).toHaveBeenCalledWith({ source: "fullcircle-demo", type: "ambient", glow: AMBIENT }, location.origin);
  });

  it("sends three strictly #rrggbb stops, green first", () => {
    expect(Object.keys(AMBIENT)).toEqual(["from", "via", "to"]);
    for (const stop of Object.values(AMBIENT)) expect(stop).toMatch(HEX);
    expect(AMBIENT.from).toBe("#1db954");
  });

  it("does nothing when the page is not embedded", () => {
    const own = vi.spyOn(window, "postMessage");
    sendAmbient();
    expect(own).not.toHaveBeenCalled();
    own.mockRestore();
  });
});

describe("sendTint", () => {
  it("posts a colour, then null when it is dropped", () => {
    const parent = embedded();
    sendTint("#cf8f93", parent);
    sendTint(null, parent);
    expect(parent.postMessage).toHaveBeenNthCalledWith(1, { source: "fullcircle-demo", type: "tint", color: "#cf8f93" }, location.origin);
    expect(parent.postMessage).toHaveBeenNthCalledWith(2, { source: "fullcircle-demo", type: "tint", color: null }, location.origin);
  });

  it("sends a #rrggbb colour for every artist's card", () => {
    for (const { artist, palette } of COVER_SPECS) expect(tintFor(palette), artist).toMatch(HEX);
  });

  it("does nothing when the page is not embedded", () => {
    const own = vi.spyOn(window, "postMessage");
    sendTint("#cf8f93");
    sendTint(null);
    expect(own).not.toHaveBeenCalled();
    own.mockRestore();
  });
});
