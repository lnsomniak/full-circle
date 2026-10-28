/** The original grid's numbers, plus the wave's. */
export const GRID = {
  tile: 120,
  gap: 16,
  rowStep: 0.7,
  radius: 100,
  flipMs: 400,
  flipBackMs: 800,
  waveSpreadMs: 700,
  waveHoldMs: 900,
  /** The card on a tile's back, as a fraction of the tile: the largest that keeps every chip inside the diamond. */
  cardScale: 0.8,
} as const;

export interface Tile {
  id: number;
  row: number;
  col: number;
  x: number;
  y: number;
  cx: number;
  cy: number;
  /** The tile's centre is inside the frame; only these take focus. */
  inView: boolean;
}

/** Offset rows of tiles, one row and one column past each edge so no gap shows at the frame's border. */
export function layoutTiles(width: number, height: number): Tile[] {
  const pitch = GRID.tile + GRID.gap;
  const cols = Math.ceil(width / pitch) + 2;
  const rows = Math.ceil(height / pitch) + 2;
  const tiles: Tile[] = [];
  for (let row = -1; row < rows; row++) {
    const offset = row % 2 === 0 ? 0 : pitch / 2;
    for (let col = -1; col < cols; col++) {
      const x = col * pitch + offset;
      const y = row * pitch * GRID.rowStep;
      const cx = x + GRID.tile / 2;
      const cy = y + GRID.tile / 2;
      tiles.push({ id: tiles.length, row, col, x, y, cx, cy, inView: cx >= 0 && cx <= width && cy >= 0 && cy <= height });
    }
  }
  return tiles;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const inside = (tile: Tile, rect: Rect, pad: number) =>
  tile.cx >= rect.x - pad && tile.cx <= rect.x + rect.w + pad && tile.cy >= rect.y - pad && tile.cy <= rect.y + rect.h + pad;

/**
 * Which artist each tile shows: `seeds` seed artists (indices 0..seeds-1) on tiles spread as far
 * apart as they go and clear of `reserved` areas, then the recommended artists in order, repeating.
 */
export function assignArtists(tiles: Tile[], artists: number, seeds: number, reserved: Rect[]): number[] {
  const clear = tiles.filter((t) => t.inView && !reserved.some((r) => inside(t, r, GRID.tile / 2)));
  const pool = clear.length >= seeds ? clear : tiles.filter((t) => t.inView).length >= seeds ? tiles.filter((t) => t.inView) : tiles;
  const chosen: Tile[] = [];
  if (pool.length > 0) {
    const anchor = { x: Math.min(...pool.map((t) => t.cx)), y: Math.min(...pool.map((t) => t.cy)) };
    const dist = (a: { x: number; y: number }, b: Tile) => Math.hypot(a.x - b.cx, a.y - b.cy);
    chosen.push(pool.reduce((best, t) => (dist(anchor, t) < dist(anchor, best) ? t : best)));
    while (chosen.length < Math.min(seeds, pool.length)) {
      let next = pool[0];
      let nextGap = -1;
      for (const t of pool) {
        if (chosen.includes(t)) continue;
        const gap = Math.min(...chosen.map((c) => Math.hypot(c.cx - t.cx, c.cy - t.cy)));
        if (gap > nextGap) {
          next = t;
          nextGap = gap;
        }
      }
      chosen.push(next);
    }
  }
  const seedTile = new Map(chosen.map((t, i) => [t.id, i]));
  const recommended = artists - seeds;
  let k = 0;
  return tiles.map((t) => seedTile.get(t.id) ?? seeds + (k++ % recommended));
}

/** The tiles whose centre is within `radius` of a point. */
export function tilesInRadius(tiles: Tile[], x: number, y: number, radius: number): Tile[] {
  return tiles.filter((t) => Math.hypot(t.cx - x, t.cy - y) < radius);
}

/** Each tile's delay, 0..spread, by its distance from the frame's centre, the farthest tile taking the whole spread. */
export function waveDelays(tiles: Tile[], width: number, height: number, spread: number): number[] {
  const away = (t: Tile) => Math.hypot(t.cx - width / 2, t.cy - height / 2);
  const far = Math.max(1, ...tiles.map(away));
  return tiles.map((t) => Math.round((away(t) / far) * spread));
}

export type MoveKey = "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End";

export const MOVE_KEYS: readonly string[] = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

/** The tile a move key leads to from `from`, among tiles in view; null when there is none that way. */
export function moveFocus(tiles: Tile[], from: Tile, key: MoveKey): Tile | null {
  const live = tiles.filter((t) => t.inView && t.id !== from.id);
  const nearestTo = (list: Tile[]) => list.reduce<Tile | null>((best, t) => (best === null || Math.abs(t.cx - from.cx) < Math.abs(best.cx - from.cx) ? t : best), null);
  const sameRow = live.filter((t) => t.row === from.row);
  switch (key) {
    case "ArrowLeft":
      return sameRow.filter((t) => t.cx < from.cx).reduce<Tile | null>((best, t) => (best === null || t.cx > best.cx ? t : best), null);
    case "ArrowRight":
      return sameRow.filter((t) => t.cx > from.cx).reduce<Tile | null>((best, t) => (best === null || t.cx < best.cx ? t : best), null);
    case "ArrowUp":
      return nearestTo(live.filter((t) => t.row === from.row - 1));
    case "ArrowDown":
      return nearestTo(live.filter((t) => t.row === from.row + 1));
    case "Home":
      return sameRow.filter((t) => t.cx < from.cx).reduce<Tile | null>((best, t) => (best === null || t.cx < best.cx ? t : best), null);
    case "End":
      return sameRow.filter((t) => t.cx > from.cx).reduce<Tile | null>((best, t) => (best === null || t.cx > best.cx ? t : best), null);
  }
}
