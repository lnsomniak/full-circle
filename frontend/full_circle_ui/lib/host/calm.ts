import { useSyncExternalStore } from "react";
import { readFlags } from "./flags";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** True under `?still` or when the visitor asks for reduced motion: nothing animates, the final state shows. */
export function isCalm(): boolean {
  return readFlags(location.search).still || window.matchMedia(REDUCED).matches;
}

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useCalm(): boolean {
  return useSyncExternalStore(subscribe, isCalm, () => false);
}
