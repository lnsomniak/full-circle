/** The six colours the portfolio sends when a Nexus theme is spread over the site. */
export interface Palette {
  background: string;
  surface: string;
  line: string;
  ink: string;
  muted: string;
  accent: string;
}

const KEYS = ["background", "surface", "line", "ink", "muted", "accent"] as const;
const HEX = /^#[0-9a-f]{6}$/i;
const MIN_TEXT_CONTRAST = 4.5;

/** The palette whole, or null when any of the six is missing or not `#rrggbb`. */
export function readPalette(value: unknown): Palette | null {
  if (typeof value !== "object" || value === null) return null;
  const source = value as Record<string, unknown>;
  const out: Partial<Palette> = {};
  for (const key of KEYS) {
    const color = source[key];
    if (typeof color !== "string" || !HEX.test(color)) return null;
    out[key] = color.toLowerCase();
  }
  return out as Palette;
}

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
}

function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

/** `color-mix(in srgb, a pct%, b)`. */
export function mix(a: string, b: string, pct: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  return toHex(ca.map((c, i) => (c * pct) / 100 + (cb[i] * (100 - pct)) / 100) as Rgb);
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Moves `color` toward `toward` in 5% steps until it reads at `min` on every background. */
function readable(color: string, backgrounds: string[], toward: string, min = MIN_TEXT_CONTRAST): string {
  for (let keep = 100; keep >= 0; keep -= 5) {
    const candidate = mix(color, toward, keep);
    if (backgrounds.every((bg) => contrast(candidate, bg) >= min)) return candidate;
  }
  return toward;
}

/** Text on the accent: the first of ground, ink, black, white that reads, else the strongest. */
function inkOn(accent: string, ground: string, ink: string): string {
  const candidates = [ground, ink, "#000000", "#ffffff"];
  const reads = candidates.find((c) => contrast(c, accent) >= MIN_TEXT_CONTRAST);
  return reads ?? candidates.reduce((best, c) => (contrast(c, accent) > contrast(best, accent) ? c : best));
}

/** CSS custom properties that carry a palette; a no-palette frame sets none of them. */
export const PALETTE_VARS = [
  "--ground",
  "--panel",
  "--line",
  "--field",
  "--ink",
  "--ink-dim",
  "--accent",
  "--accent-text",
  "--accent-soft",
  "--accent-ink",
  "--tag",
  "--tag-ink",
  "--grad-from",
  "--grad-to",
] as const;

/**
 * Maps the palette onto the demo's tokens. Fills take the palette's colours as sent;
 * every colour used as text is moved toward the ink until it reads (4.5:1) on the
 * ground and the panel, because a spread theme's muted and accent need not.
 * Nothing here depends on light or dark: the palette already is one or the other.
 */
export function deriveVars(p: Palette): Record<(typeof PALETTE_VARS)[number], string> {
  const onGroundAndPanel = [p.background, p.surface];
  const accentText = readable(p.accent, onGroundAndPanel, p.ink);
  const accentSoft = readable(mix(accentText, p.ink, 75), onGroundAndPanel, p.ink);
  const tag = mix(p.accent, p.surface, 16);
  return {
    "--ground": p.background,
    "--panel": p.surface,
    "--line": p.line,
    "--field": mix(p.line, p.surface, 60),
    "--ink": p.ink,
    "--ink-dim": readable(p.muted, onGroundAndPanel, p.ink),
    "--accent": p.accent,
    "--accent-text": accentText,
    "--accent-soft": accentSoft,
    "--accent-ink": inkOn(p.accent, p.background, p.ink),
    "--tag": tag,
    "--tag-ink": readable(p.accent, [tag], p.ink),
    "--grad-from": accentText,
    "--grad-to": accentSoft,
  };
}
