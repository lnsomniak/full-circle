export type Lang = "en" | "es";

export function readLang(): Lang {
  try {
    const stored = localStorage.getItem("sh-lang");
    if (stored === "en" || stored === "es") return stored;
  } catch {
    // Fall through to the browser language.
  }
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}
