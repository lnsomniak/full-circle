import { useMemo, useSyncExternalStore } from "react";

const HEX = /^#[0-9a-f]{6}$/i;
const FALLBACK = { ground: "#121212", ink: "#f3f4f6" };

function read(): string {
  const style = getComputedStyle(document.documentElement);
  return `${style.getPropertyValue("--ground").trim()}|${style.getPropertyValue("--ink").trim()}`;
}

function subscribe(onChange: () => void): () => void {
  const watch = new MutationObserver(onChange);
  watch.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "data-theme"] });
  return () => watch.disconnect();
}

/** The ground and ink colours showing now, as #rrggbb; they change when a theme is applied. */
export function useGroundInk(): { ground: string; ink: string } {
  const key = useSyncExternalStore(subscribe, read, () => `${FALLBACK.ground}|${FALLBACK.ink}`);
  return useMemo(() => {
    const [ground, ink] = key.split("|");
    return { ground: HEX.test(ground) ? ground : FALLBACK.ground, ink: HEX.test(ink) ? ink : FALLBACK.ink };
  }, [key]);
}
