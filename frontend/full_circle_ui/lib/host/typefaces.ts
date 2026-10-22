/** The two roles a spread Nexus theme can name a typeface for. */
export interface Typefaces {
  serif: string;
  label: string;
}

export const HOUSE: Typefaces = { serif: "Libre Baskerville", label: "IBM Plex Mono" };

/**
 * Families this page will set, per role, each bundled in `lib/fonts.ts`. A name from the
 * portfolio that is not on its role's list is never written into CSS.
 */
export const SERIFS = [
  "Libre Baskerville",
  "EB Garamond",
  "Gelasio",
  "Old Standard TT",
  "Source Serif 4",
  "Bodoni Moda",
  "Literata",
  "Cardo",
  "Alegreya",
  "Newsreader",
  "Crimson Pro",
  "Zen Old Mincho",
] as const;

export const LABELS = [
  "IBM Plex Mono",
  "Courier Prime",
  "JetBrains Mono",
  "Space Mono",
  "PT Mono",
  "DM Mono",
  "M PLUS 1 Code",
  "Source Code Pro",
  "Victor Mono",
  "Geist Mono",
  "Archivo",
] as const;

/** The @fontsource package name for a family. */
export const fontSlug = (family: string) => family.toLowerCase().replace(/ /g, "-");

const SANS_LABELS: readonly string[] = ["Archivo"];

/** The CSS stack for a role: the family, then a generic of its kind. */
export function stack(role: keyof Typefaces, family: string): string {
  if (role === "serif") return `'${family}', Georgia, serif`;
  return SANS_LABELS.includes(family) ? `'${family}', ui-sans-serif, system-ui, sans-serif` : `'${family}', ui-monospace, monospace`;
}

const isOn = (list: readonly string[], name: unknown): name is string => typeof name === "string" && list.includes(name);

/**
 * The theme message's `typefaces`, role by role: a role whose family is missing or not on
 * its list gets the house family. Null when the value is not an object (plain mode).
 */
export function readTypefaces(value: unknown): Typefaces | null {
  if (typeof value !== "object" || value === null) return null;
  const { serif, label } = value as Record<string, unknown>;
  return {
    serif: isOn(SERIFS, serif) ? serif : HOUSE.serif,
    label: isOn(LABELS, label) ? label : HOUSE.label,
  };
}

export const TYPEFACE_VARS = ["--fc-font-voice", "--fc-font-label"] as const;

/** Sets the two roles on <html>; with none, the demo's house pair shows. */
export function applyTypefaces(typefaces: Typefaces | null): void {
  const root = document.documentElement;
  for (const name of TYPEFACE_VARS) root.style.removeProperty(name);
  if (!typefaces) return;
  root.style.setProperty("--fc-font-voice", stack("serif", typefaces.serif));
  root.style.setProperty("--fc-font-label", stack("label", typefaces.label));
}
