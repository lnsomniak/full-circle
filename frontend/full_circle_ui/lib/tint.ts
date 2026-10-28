const toRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];

/** Lightness and saturation in HSL, both 0..1. */
export function lightnessAndSaturation(hex: string): { lightness: number; saturation: number } {
  const [r, g, b] = toRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const spread = max - min;
  const saturation = spread === 0 ? 0 : spread / (1 - Math.abs(2 * lightness - 1));
  return { lightness, saturation };
}

const LIGHTNESS = [0.25, 0.75] as const;
const MIN_SATURATION = 0.3;

/** Reads as a colour on a wash: neither near-black nor near-white, and not grey. */
export function readsAsColour(hex: string): boolean {
  const { lightness, saturation } = lightnessAndSaturation(hex);
  return lightness >= LIGHTNESS[0] && lightness <= LIGHTNESS[1] && saturation >= MIN_SATURATION;
}

/** The colour a card sends the portfolio as its tint: its first chip that reads as a colour, else its first chip. */
export function tintFor(palette: string[]): string {
  return palette.find(readsAsColour) ?? palette[0];
}
