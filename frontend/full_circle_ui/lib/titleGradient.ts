import { contrast, readable } from "./host/palette";

/** WCAG 1.4.3 for large text; the title is 36px bold. */
const LARGE_TEXT_CONTRAST = 3;

/**
 * The title gradient's two stops from an artist's chips: the first two, in the card's order,
 * that read on the ground. When fewer than two do, the first chips that don't are moved
 * toward the ink until they read, so the title is never lost on any theme.
 */
export function titleStops(palette: string[], ground: string, ink: string): [string, string] {
  const reads = palette.filter((color) => contrast(color, ground) >= LARGE_TEXT_CONTRAST);
  const lifted = palette
    .filter((color) => !reads.includes(color))
    .map((color) => readable(color, [ground], ink, LARGE_TEXT_CONTRAST));
  const [first, second] = [...reads, ...lifted];
  return [first, second === first ? ink : second];
}
