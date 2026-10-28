import { describe, expect, it } from "vitest";
import { assignArtists, GRID, layoutTiles, moveFocus, tilesInRadius, waveDelays, type Rect } from "./grid";

const W = 1024;
const H = 700;
const tiles = layoutTiles(W, H);
const title: Rect = { x: W / 2 - 240, y: H / 2 - 130, w: 480, h: 260 };

describe("layoutTiles", () => {
  it("fills the frame with offset rows, one row and column past each edge", () => {
    expect(tiles).toHaveLength(11 * 9);
    expect(tiles.map((t) => t.id)).toEqual(tiles.map((_, i) => i));
  });

  it("shifts odd rows by half a pitch and steps rows by 0.7 of it", () => {
    const pitch = GRID.tile + GRID.gap;
    const at = (row: number, col: number) => tiles.find((t) => t.row === row && t.col === col)!;
    expect(at(0, 0).x).toBe(0);
    expect(at(1, 0).x).toBe(pitch / 2);
    expect(at(2, 3).x).toBe(3 * pitch);
    expect(at(1, 0).y - at(0, 0).y).toBeCloseTo(pitch * GRID.rowStep, 6);
  });

  it("marks a tile in view by its centre", () => {
    expect(tiles.find((t) => t.row === -1 && t.col === -1)!.inView).toBe(false);
    expect(tiles.find((t) => t.row === 2 && t.col === 3)!.inView).toBe(true);
    for (const t of tiles) expect(t.inView).toBe(t.cx >= 0 && t.cx <= W && t.cy >= 0 && t.cy <= H);
  });
});

describe("assignArtists", () => {
  const artists = 79;
  const seeds = 8;
  const assigned = assignArtists(tiles, artists, seeds, [title]);
  const seedTiles = tiles.filter((t) => assigned[t.id] < seeds);

  it("gives every tile an artist", () => {
    expect(assigned).toHaveLength(tiles.length);
    for (const a of assigned) expect(a).toBeGreaterThanOrEqual(0);
    for (const a of assigned) expect(a).toBeLessThan(artists);
  });

  it("puts each seed on exactly one tile, in view and clear of the title", () => {
    expect(seedTiles).toHaveLength(seeds);
    expect(new Set(seedTiles.map((t) => assigned[t.id])).size).toBe(seeds);
    for (const t of seedTiles) {
      expect(t.inView).toBe(true);
      const hidden = t.cx > title.x - 60 && t.cx < title.x + title.w + 60 && t.cy > title.y - 60 && t.cy < title.y + title.h + 60;
      expect(hidden).toBe(false);
    }
  });

  it("spreads the seeds apart", () => {
    for (const a of seedTiles) {
      for (const b of seedTiles) if (a !== b) expect(Math.hypot(a.cx - b.cx, a.cy - b.cy)).toBeGreaterThan(250);
    }
  });

  it("shows every recommended artist at least once, and no seed twice", () => {
    const shown = new Set(assigned);
    for (let i = 0; i < artists; i++) expect(shown.has(i), `artist ${i}`).toBe(true);
    for (let s = 0; s < seeds; s++) expect(assigned.filter((a) => a === s)).toHaveLength(1);
  });

  it("is the same every time", () => {
    expect(assignArtists(tiles, artists, seeds, [title])).toEqual(assigned);
  });

  it("still places every seed on a small frame", () => {
    const small = layoutTiles(300, 300);
    const result = assignArtists(small, artists, seeds, [{ x: 50, y: 50, w: 200, h: 200 }]);
    for (let s = 0; s < seeds; s++) expect(result.filter((a) => a === s)).toHaveLength(1);
  });
});

describe("tilesInRadius", () => {
  const target = tiles.find((t) => t.row === 3 && t.col === 4)!;

  it("includes the tile under the point and excludes far ones", () => {
    const near = tilesInRadius(tiles, target.cx, target.cy, GRID.radius);
    expect(near).toContain(target);
    expect(near.length).toBeLessThan(10);
    for (const t of near) expect(Math.hypot(t.cx - target.cx, t.cy - target.cy)).toBeLessThan(GRID.radius);
  });

  it("excludes a tile exactly at the radius", () => {
    expect(tilesInRadius([target], target.cx + GRID.radius, target.cy, GRID.radius)).toHaveLength(0);
  });
});

describe("waveDelays", () => {
  const delays = waveDelays(tiles, W, H, GRID.waveSpreadMs);

  it("starts at the centre and ends at the corners, within the spread", () => {
    expect(Math.min(...delays)).toBeLessThan(40);
    expect(Math.max(...delays)).toBeLessThanOrEqual(GRID.waveSpreadMs);
    expect(Math.max(...delays)).toBeGreaterThan(GRID.waveSpreadMs * 0.9);
  });

  it("grows with distance from the centre", () => {
    const byDistance = tiles.map((t) => ({ d: Math.hypot(t.cx - W / 2, t.cy - H / 2), delay: delays[t.id] })).sort((a, b) => a.d - b.d);
    for (let i = 1; i < byDistance.length; i++) expect(byDistance[i].delay).toBeGreaterThanOrEqual(byDistance[i - 1].delay);
  });
});

describe("moveFocus", () => {
  const from = tiles.find((t) => t.row === 3 && t.col === 4)!;

  it("moves along a row", () => {
    const right = moveFocus(tiles, from, "ArrowRight")!;
    const left = moveFocus(tiles, from, "ArrowLeft")!;
    expect(right.row).toBe(from.row);
    expect(right.col).toBe(from.col + 1);
    expect(left.col).toBe(from.col - 1);
  });

  it("moves to the nearest tile in the next row, whose rows are offset by half a pitch", () => {
    const down = moveFocus(tiles, from, "ArrowDown")!;
    const up = moveFocus(tiles, from, "ArrowUp")!;
    expect(down.row).toBe(from.row + 1);
    expect(up.row).toBe(from.row - 1);
    expect(Math.abs(down.cx - from.cx)).toBeLessThanOrEqual((GRID.tile + GRID.gap) / 2);
  });

  it("goes to the ends of the row with Home and End", () => {
    const home = moveFocus(tiles, from, "Home")!;
    const end = moveFocus(tiles, from, "End")!;
    const row = tiles.filter((t) => t.row === from.row && t.inView);
    expect(home.cx).toBe(Math.min(...row.map((t) => t.cx)));
    expect(end.cx).toBe(Math.max(...row.map((t) => t.cx)));
  });

  it("stays put at an edge", () => {
    const first = tiles.filter((t) => t.row === 3 && t.inView).sort((a, b) => a.cx - b.cx)[0];
    expect(moveFocus(tiles, first, "ArrowLeft")).toBeNull();
    expect(moveFocus(tiles, first, "Home")).toBeNull();
    const top = tiles.filter((t) => t.inView).sort((a, b) => a.row - b.row)[0];
    expect(moveFocus(tiles, top, "ArrowUp")).toBeNull();
  });

  it("never lands on a tile outside the frame", () => {
    for (const from of tiles.filter((t) => t.inView)) {
      for (const key of ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"] as const) {
        const to = moveFocus(tiles, from, key);
        if (to) expect(to.inView).toBe(true);
      }
    }
  });
});
