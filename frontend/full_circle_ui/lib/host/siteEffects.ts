import { GREEN } from "./palette";

const SELF = "fullcircle-demo";

/** The demo's identity as a glow, left to right: its green, the blue of the original title, the purple of its tags. */
export const AMBIENT = { from: GREEN, via: "#3b82f6", to: "#9333ea" } as const;

function post(message: unknown, parent: Window): void {
  if (parent === window) return;
  parent.postMessage(message, location.origin);
}

/** Tells the portfolio which three colours are the demo's own. Only when embedded. */
export function sendAmbient(parent: Window = window.parent): void {
  post({ source: SELF, type: "ambient", glow: AMBIENT }, parent);
}

/** The chosen seed's colour as #rrggbb, or null when no seed is chosen. Only when embedded. */
export function sendTint(color: string | null, parent: Window = window.parent): void {
  post({ source: SELF, type: "tint", color }, parent);
}
