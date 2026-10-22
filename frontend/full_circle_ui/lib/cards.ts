import { COVER_SPECS } from "./cover-specs";
import { coverSvg } from "./covers";

/** Every artist's card as markup, in COVER_SPECS order. */
export const CARDS = COVER_SPECS.map((spec) => coverSvg(spec));

const INDEX = new Map(COVER_SPECS.map((spec, i) => [spec.artist, i]));

/** The card index for an artist's name, or undefined for a name with no card. */
export const cardIndex = (artist: string): number | undefined => INDEX.get(artist);

/** An artist's chips, or an empty list for a name with no card. */
export function paletteOf(artist: string): string[] {
  const i = INDEX.get(artist);
  return i === undefined ? [] : COVER_SPECS[i].palette;
}
