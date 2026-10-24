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
  gridTitle: { en: "FullCircle", es: "FullCircle" },
  line1: { en: "Turning on the engine", es: "Encendiendo el motor", ph: "es" },
  line2: { en: "Consulting the algorithm", es: "Consultando el algoritmo", ph: "es" },
  line3: { en: "Finding hidden gems", es: "Buscando joyas ocultas", ph: "es" },
  line4: { en: "Curating recommendations", es: "Curando recomendaciones", ph: "es" },
  line5: { en: "Almost there", es: "Casi listo", ph: "es" },
  ripple: { en: "Ripple", es: "Onda", ph: "es" },
  tilesLabel: {
    en: "Artist tiles. Move between them with the arrow keys.",
    es: "Fichas de artistas. Muévete entre ellas con las flechas del teclado.",
    ph: "both",
  },
  seedHint: {
    en: "Seed artist. Press Enter or tap to see its recommendations.",
    es: "Artista semilla. Pulsa Enter o toca para ver sus recomendaciones.",
    ph: "es",
  },
  recHint: { en: "Recommended artist.", es: "Artista recomendado.", ph: "es" },
  back: { en: "Back to grid", es: "Volver a la cuadrícula", ph: "es" },
  links: { en: "Links", es: "Enlaces", ph: "both" },
  newTab: { en: "(opens in a new tab)", es: "(se abre en una pestaña nueva)", ph: "both" },
  coversNote: {
    en: "The covers you see as the tiles turn over are color cards loosely based and heavily inspired by David Marsh and his pantone swatch album covers. The real album art belongs to the artists and labels, this seemed like a fun alternative.",
    es: "Aquí las portadas son tarjetas de color originales. El arte real de los álbumes pertenece a sus artistas y sellos, así que la demo muestra la paleta de cada artista.",
    ph: "es",
  },
  seeds: { en: "Seed artists", es: "Artistas semilla", ph: "es" },
  accuracy: { en: "Model test accuracy", es: "Precisión del modelo en la prueba", ph: "es" },
  precomputed: {
    en: "What you're seeing here is essentially a museum of my first attempt at properly training an Ai model, something I wasn't new to hearing about, but new to actually doing unsupervised. I thought of it as a large science fair project, not expecting perfection since there was no score to beat - simply an average that I could get based on the hardware I had.",
    es: "Calculado de antemano con el modelo real de FullCircle para artistas semilla fijos. Nada aquí se ejecuta en vivo.",
    ph: "es",
  },
  aboutModel: { en: "About this model", es: "Sobre este modelo", ph: "both" },
  historyHeading: { en: "Model history", es: "Historia del modelo", ph: "both" },
  historyStory: {
    en: "With no other first hand experience, I opted for the process of elimination. I was able to get it down to two models and ran Random Forest first. Random Forest sat at 60%, then 61.9%, then 62.6%, which frustrated me. A wall can only be run into so many times, so I tried a different XGBoost shaped wall. The results you see displayed are such.",
    es: "Sin otra experiencia propia, opté por el proceso de eliminación. Logré reducirlo a dos modelos y probé primero Random Forest. Random Forest se quedó en 60%, luego 61.9%, luego 62.6%, lo que me frustró. Uno solo puede chocar contra una pared cierto número de veces, así que probé una pared distinta con forma de XGBoost. Los resultados que ves son estos.",
    ph: "es",
  },
  eraRf: { en: "Random Forest", es: "Random Forest", ph: "both" },
  eraXgb: { en: "XGBoost", es: "XGBoost", ph: "both" },
  historyRf: {
    en: "Old feature set: raw Last.fm tag counts, 167 features. A Random Forest scored 60.00% on 500 liked and 500 not-liked artists, 61.90% with all 734 liked artists, and 62.59% after tuning. It had stopped improving.",
    es: "Conjunto de características anterior: conteos de etiquetas de Last.fm, 167 características. Un Random Forest obtuvo 60.00% con 500 artistas que me gustan y 500 que no, 61.90% con los 734 que me gustan y 62.59% tras ajustarlo. Había dejado de mejorar.",
    ph: "both",
  },
  historyXgb: {
    en: "Current feature set: TF-IDF tags plus listening behaviour, 307 features. The new features lifted accuracy to 76.53%; a 95.92% result was data leakage and was removed. XGBoost with grid search finished at 76.19% test accuracy.",
    es: "Conjunto de características actual: etiquetas TF-IDF más comportamiento de escucha, 307 características. Las nuevas características subieron la precisión a 76.53%; un resultado de 95.92% era fuga de datos y se eliminó. XGBoost con búsqueda en cuadrícula terminó con 76.19% de precisión en la prueba.",
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
