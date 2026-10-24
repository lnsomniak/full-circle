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
    es: "¿Activar la similitud ponderada de etiquetas? (Da prioridad a las etiquetas de nicho o poco comunes)",
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
    es: "Artista semilla. Presiona Enter o toca para ver sus recomendaciones.",
    ph: "es",
  },
  recHint: { en: "Recommended artist.", es: "Artista recomendado.", ph: "es" },
  back: { en: "Back to grid", es: "Volver a la cuadrícula", ph: "es" },
  links: { en: "Links", es: "Enlaces", ph: "both" },
  newTab: { en: "(opens in a new tab)", es: "(se abre en una pestaña nueva)", ph: "both" },
  coversNote: {
    en: "The covers you see as the tiles turn over are color cards loosely based and heavily inspired by David Marsh and his pantone swatch album covers. The real album art belongs to the artists and labels, this seemed like a fun alternative.",
    es: "Las portadas que ves mientras las fichas se voltean son tarjetas de color vagamente basadas en las portadas de álbumes de David Marsh hechas con muestras Pantone, y muy inspiradas en ellas. El arte real de los álbumes pertenece a los artistas y a los sellos; esto me pareció una alternativa divertida.",
    ph: "es",
  },
  seeds: { en: "Seed artists", es: "Artistas semilla", ph: "es" },
  accuracy: { en: "Model test accuracy", es: "Precisión del modelo en la prueba", ph: "es" },
  precomputed: {
    en: "What you're seeing here is essentially a museum of my first attempt at properly training an Ai model, something I wasn't new to hearing about but was new to actually doing unsupervised. I thought of it as a large science fair project, not expecting perfection since there was no score to beat – simply an average that I could get based on the hardware I had.",
    es: "Lo que ves aquí es una serie de resultados, un museo si se quiere, de mi primer intento de entrenar bien un modelo de IA, algo de lo que ya había oído hablar, pero que nunca había hecho realmente sin supervisión. Lo pensé como un gran proyecto de feria de ciencias, sin esperar perfección, ya que no había un puntaje que superar; solo el promedio que pudiera lograr con el hardware que tenía.",
    ph: "es",
  },
  aboutModel: { en: "About this model", es: "Sobre este modelo", ph: "both" },
  historyHeading: { en: "Model history", es: "Historia del modelo", ph: "both" },
  historyStory: {
    en: "With no other first hand experience, I opted for the process of elimination. I was able to get it down to two models and ran Random Forest first. Random Forest sat at 60%, then 61.9%, then 62.6%, which frustrated me. A wall can only be run into so many times, so I tried a different XGBoost shaped wall. The results you see displayed are such.",
    es: "Sin ninguna experiencia previa de primera mano, opté por el proceso de eliminación. Logré reducirlo a dos modelos y probé primero Random Forest. Random Forest se quedó en 60%, luego 61.9%, luego 62.6%, lo cual me frustró. Uno solo puede chocar contra una pared cierto número de veces, así que probé una pared distinta con forma de XGBoost. Los resultados que ves son estos.",
    ph: "es",
  },
  eraRf: { en: "Random Forest", es: "Random Forest", ph: "both" },
  eraXgb: { en: "XGBoost", es: "XGBoost", ph: "both" },
  historyRf: {
    en: "Old feature set: raw Last.fm tag counts, 167 features.",
    es: "Conjunto de características anterior: conteos de etiquetas de Last.fm sin procesar, 167 características.",
    ph: "both",
  },
  historyXgb: {
    en: "Current feature set: TF-IDF tags plus listening behavior, 307 features.",
    es: "Conjunto de características actual: etiquetas TF-IDF más comportamiento de escucha, 307 características.",
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
