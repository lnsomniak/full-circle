import type { Lang } from "@/lib/host/lang";

/**
 * `en` strings that existed in the app are verbatim. `ph` marks what is still
 * a PLACEHOLDER for Sergio to write: "es" = only the Spanish, "both" = a new label.
 */
interface Entry {
  en: string;
  es: string;
  ph?: "es" | "both";
}

export const COPY = {
  title: { en: "Full-Circle", es: "Full-Circle" },
  artistName: { en: "Artist Name", es: "Nombre del artista", ph: "es" },
  tags: { en: "Tags (comma separated)", es: "Etiquetas (separadas por comas)", ph: "es" },
  weighted: {
    en: "Enable Weighted Tag Similarity? (Prioritizes niche/rare tags)",
    es: "¿Activar similitud ponderada de etiquetas? (Prioriza etiquetas poco comunes)",
    ph: "es",
  },
  confidence: { en: "Prediction Confidence: ", es: "Confianza de la predicción: ", ph: "es" },
  topTen: { en: "Top 10 Recommendations", es: "Las 10 mejores recomendaciones", ph: "es" },
  similarity: { en: "Similarity", es: "Similitud", ph: "es" },
  matched: { en: "Matched:", es: "Coincidencias:", ph: "es" },
  seeds: { en: "Seed artists", es: "Artistas semilla", ph: "both" },
  accuracy: { en: "Model test accuracy", es: "Precisión del modelo en la prueba", ph: "both" },
  precomputed: {
    en: "Precomputed by the real FullCircle model for fixed seed artists. Nothing here runs live.",
    es: "Calculado de antemano con el modelo real de FullCircle para artistas semilla fijos. Nada aquí se ejecuta en vivo.",
    ph: "both",
  },
} satisfies Record<string, Entry>;

export type CopyKey = keyof typeof COPY;

export function t(lang: Lang, key: CopyKey): string {
  return COPY[key][lang];
}

/** Keys still marked PLACEHOLDER in the given language. */
export function placeholders(lang: Lang): CopyKey[] {
  return (Object.keys(COPY) as CopyKey[]).filter((key) => {
    const entry: Entry = COPY[key];
    return entry.ph === "both" || (entry.ph === "es" && lang === "es");
  });
}
