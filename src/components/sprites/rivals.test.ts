import { describe, expect, it } from "vitest";

import { CAT_LIST } from "~/server/game/cats";
import { GAUNTLET, RIVAL_LIST, getRival } from "~/server/game/rival";

import { BASE_SPRITE, SPRITE_LEGEND, SPRITE_SIZE, catSprite } from "./cats";
import { RIVAL_PALETTE, rivalColors } from "./palettes";
import { RIVAL_SPRITES, rivalSprite } from "./rivals";

const LEGEND = Object.keys(SPRITE_LEGEND);

/** `[row, from, to)`: both eyes on rows 6 and 7, the muzzle on rows 8 and 9. */
const FACE: readonly (readonly [number, number, number])[] = [
  [6, 3, 5],
  [6, 11, 13],
  [7, 3, 5],
  [7, 11, 13],
  [8, 5, 11],
  [9, 5, 11],
];

/** Rivals drawn with a face of their own: two small ones, and a shut eye. */
const OWN_FACE = new Set(["dockside-twins", "old-nine-lives"]);

function pixelsChanged(rows: readonly string[]): number {
  let changed = 0;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== BASE_SPRITE[y]?.[x]) changed++;
    }
  });
  return changed;
}

describe("rival sprites", () => {
  it("draws every rival of the gauntlet, and nobody else", () => {
    expect(Object.keys(RIVAL_SPRITES).sort()).toEqual([...GAUNTLET].sort());
    expect(RIVAL_LIST).toHaveLength(GAUNTLET.length);
  });

  it("resolves every rival to 16 rows of 16 legend characters", () => {
    for (const rivalId of GAUNTLET) {
      const rows = rivalSprite(rivalId);
      expect(rows, rivalId).toHaveLength(SPRITE_SIZE);
      for (const row of rows) {
        expect(row, rivalId).toHaveLength(SPRITE_SIZE);
        for (const pixel of row) expect(LEGEND, rivalId).toContain(pixel);
      }
    }
  });

  it("returns the base for a rival not drawn yet", () => {
    expect(rivalSprite("not-drawn-yet")).toBe(BASE_SPRITE);
  });

  it("draws every rival as more than a stray pixel on the base", () => {
    for (const rivalId of GAUNTLET) {
      expect(pixelsChanged(rivalSprite(rivalId)), rivalId).toBeGreaterThan(8);
    }
  });

  it("gives no two rivals the same grid, and no rival a cat's", () => {
    const owners = new Map<string, string>();
    for (const cat of CAT_LIST)
      owners.set(catSprite(cat.id).join("\n"), cat.id);
    for (const rivalId of GAUNTLET) {
      const grid = rivalSprite(rivalId).join("\n");
      expect(owners.get(grid), `${rivalId} repeats a grid`).toBeUndefined();
      owners.set(grid, rivalId);
    }
  });

  it("leaves the base's eyes and muzzle alone, bar two with their own", () => {
    for (const rivalId of GAUNTLET) {
      if (OWN_FACE.has(rivalId)) continue;
      const grid = rivalSprite(rivalId);
      for (const [row, from, to] of FACE) {
        expect(grid[row]?.slice(from, to), `${rivalId} row ${row}`).toBe(
          BASE_SPRITE[row]?.slice(from, to),
        );
      }
    }
  });

  it("gives every rival eyes", () => {
    for (const rivalId of GAUNTLET) {
      expect(rivalSprite(rivalId).join(""), rivalId).toContain("e");
    }
  });

  it("lets only a boss reach the top row", () => {
    for (const rivalId of GAUNTLET) {
      const crowned = rivalSprite(rivalId)[0] !== BASE_SPRITE[0];
      expect(crowned, rivalId).toBe(getRival(rivalId).boss);
    }
  });

  it("colours every legend character, in coral and never in lime", () => {
    const colors = rivalColors();
    for (const pixel of LEGEND) expect(colors, pixel).toHaveProperty(pixel);
    expect(colors["."]).toBeNull();
    expect(RIVAL_PALETTE["1"]).toBe("#ff7163");
    expect(Object.values(colors)).not.toContain("#d8ff4f");
  });
});
