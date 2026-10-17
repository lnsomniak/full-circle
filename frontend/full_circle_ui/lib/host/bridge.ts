import { isThemeMode, type ThemeMode } from "./theme";

const PORTFOLIO = "sh-portfolio";
const SELF = "fullcircle-demo";

export type ParentMessage = { type: "theme"; mode: ThemeMode } | { type: "reset" };

/** Accepts a message only from the portfolio page that embeds this one. */
export function readParentMessage(event: MessageEvent, parent: Window): ParentMessage | null {
  if (event.origin !== location.origin) return null;
  if (event.source !== parent) return null;
  const data: unknown = event.data;
  if (typeof data !== "object" || data === null) return null;
  const message = data as { source?: unknown; type?: unknown; mode?: unknown };
  if (message.source !== PORTFOLIO) return null;
  if (message.type === "reset") return { type: "reset" };
  if (message.type === "theme" && isThemeMode(message.mode)) return { type: "theme", mode: message.mode };
  return null;
}

interface Handlers {
  onTheme: (mode: ThemeMode) => void;
  onReset: () => void;
}

/** Listens for the portfolio's messages, then tells the parent the page has mounted. */
export function startBridge({ onTheme, onReset }: Handlers): () => void {
  const listener = (event: MessageEvent) => {
    const message = readParentMessage(event, window.parent);
    if (message?.type === "theme") onTheme(message.mode);
    if (message?.type === "reset") {
      onReset();
      window.parent.postMessage({ source: SELF, type: "reset", ok: true }, location.origin);
    }
  };
  window.addEventListener("message", listener);
  if (window.parent !== window) {
    window.parent.postMessage({ source: SELF, type: "ready" }, location.origin);
  }
  return () => window.removeEventListener("message", listener);
}
