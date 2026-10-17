export type ThemeMode = "light" | "dark";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark";
}

/** The portfolio's saved pick. Read only: this page never writes `sh-*`. */
export function readStoredTheme(): ThemeMode | null {
  try {
    const stored = localStorage.getItem("sh-theme");
    return isThemeMode(stored) ? stored : null;
  } catch {
    // Storage can throw in a sandboxed or private context.
    return null;
  }
}

export function osTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initialTheme(): ThemeMode {
  return readStoredTheme() ?? osTheme();
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.setAttribute("data-theme", mode);
}

/** Opened on its own with no saved pick, the page follows the OS live. */
export function followOsWhileUnsaved(onChange: (mode: ThemeMode) => void): () => void {
  if (window.parent !== window) return () => {};
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => {
    if (readStoredTheme() === null) onChange(osTheme());
  };
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
