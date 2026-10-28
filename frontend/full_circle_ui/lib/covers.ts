export interface CoverSpec {
  artist: string;
  /** Three to five #rrggbb chips; the first is the artist's dominant colour. */
  palette: string[];
}

const SIZE = 600;
const PAPER = "#f4f1ea";
const INK = "#1b1b1b";
const MARGIN = 40;
const GAP = 10;
const CHIPS_TOP = 40;
const CHIPS_HEIGHT = 360;
const HEX_BASELINE = 432;
const RULE_Y = 456;
const NAME_BASELINE = 534;
const NAME_MAX_SIZE = 64;
/** Advance width of a monospace glyph, as a fraction of its font size. */
const MONO_ADVANCE = 0.62;
const FONT = "font-family:'Space Mono',ui-monospace,Menlo,Consolas,monospace";

const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Chip widths: the first chip counts double, the rest once each. */
function widths(count: number): number[] {
  const units = count + 1;
  const unit = (SIZE - 2 * MARGIN - GAP * (count - 1)) / units;
  return Array.from({ length: count }, (_, i) => (i === 0 ? 2 * unit : unit));
}

/** A swatch card: the artist's colours as chips, their hex values, and the name set in mono. */
export function coverSvg(spec: CoverSpec): string {
  const widthOf = widths(spec.palette.length);
  const size = Math.min(NAME_MAX_SIZE, Math.floor((SIZE - 2 * MARGIN) / (spec.artist.length * MONO_ADVANCE)));
  const parts: string[] = [
    `<rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>`,
    `<rect x="0.75" y="0.75" width="${SIZE - 1.5}" height="${SIZE - 1.5}" fill="none" stroke="${INK}" stroke-opacity="0.14" stroke-width="1.5"/>`,
  ];
  let x = MARGIN;
  spec.palette.forEach((color, i) => {
    const w = widthOf[i];
    parts.push(`<rect x="${x.toFixed(1)}" y="${CHIPS_TOP}" width="${w.toFixed(1)}" height="${CHIPS_HEIGHT}" rx="3" fill="${color}"/>`);
    parts.push(
      `<text x="${(x + w / 2).toFixed(1)}" y="${HEX_BASELINE}" text-anchor="middle" font-size="15" fill="${INK}" fill-opacity="0.7" style="${FONT}">${color}</text>`,
    );
    x += w + GAP;
  });
  parts.push(`<rect x="${MARGIN}" y="${RULE_Y}" width="${SIZE - 2 * MARGIN}" height="1.5" fill="${INK}" fill-opacity="0.2"/>`);
  parts.push(`<text x="${MARGIN}" y="${NAME_BASELINE}" font-size="${size}" fill="${INK}" style="${FONT}">${escape(spec.artist)}</text>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">${parts.join("")}</svg>`;
}
