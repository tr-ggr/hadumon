import { describe, expect, it } from "vitest";

import { CAT_LIST, CATS } from "~/server/game/cats";
import {
  BASE_SPRITE,
  SPRITE_LEGEND,
  SPRITE_PATCHES,
  SPRITE_SIZE,
  catSprite,
} from "./cats";

const LEGEND = new Set(Object.keys(SPRITE_LEGEND));

/** `[row, from, to)`: both eyes on rows 6 and 7, the muzzle on rows 8 and 9. */
const FACE: readonly (readonly [number, number, number])[] = [
  [6, 3, 5],
  [6, 11, 13],
  [7, 3, 5],
  [7, 11, 13],
  [8, 5, 11],
  [9, 5, 11],
];

function pixelsChanged(rows: readonly string[]): number {
  let changed = 0;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== BASE_SPRITE[y]?.[x]) changed++;
    }
  });
  return changed;
}

function expectValidGrid(rows: readonly string[]) {
  expect(rows).toHaveLength(SPRITE_SIZE);
  for (const row of rows) {
    expect(row).toHaveLength(SPRITE_SIZE);
    for (const pixel of row) expect(LEGEND.has(pixel)).toBe(true);
  }
}

describe("cat sprites", () => {
  it("has a 16x16 base made of legend characters", () => {
    expectValidGrid(BASE_SPRITE);
  });

  it("resolves every cat to 16 rows of 16 legend characters", () => {
    expect(CAT_LIST.length).toBeGreaterThan(0);
    for (const cat of CAT_LIST) expectValidGrid(catSprite(cat.id));
  });

  it("keeps every patch in bounds and on the legend", () => {
    for (const [catId, patches] of Object.entries(SPRITE_PATCHES)) {
      for (const [row, column, pixels] of patches) {
        const where = `${catId} [${row}, ${column}, "${pixels}"]`;
        expect(Number.isInteger(row), where).toBe(true);
        expect(Number.isInteger(column), where).toBe(true);
        expect(row, where).toBeGreaterThanOrEqual(0);
        expect(row, where).toBeLessThan(SPRITE_SIZE);
        expect(column, where).toBeGreaterThanOrEqual(0);
        expect(pixels.length, where).toBeGreaterThan(0);
        expect(column + pixels.length, where).toBeLessThanOrEqual(SPRITE_SIZE);
        for (const pixel of pixels) expect(LEGEND.has(pixel), where).toBe(true);
      }
    }
  });

  it("only patches cats that exist", () => {
    for (const catId of Object.keys(SPRITE_PATCHES)) {
      expect(CATS[catId], catId).toBeDefined();
    }
  });

  it("applies a cat's patches to the base", () => {
    const flameclaw = catSprite("flameclaw");
    expect(flameclaw[1]).toBe(".oo...o33o...oo.");
    expect(flameclaw[3]).toBe("o121oo3333oo121o");
    expect(flameclaw).not.toEqual(BASE_SPRITE);
  });

  it("returns the base unchanged for a cat with no patches", () => {
    expect(catSprite("not-drawn-yet")).toBe(BASE_SPRITE);
  });

  it("has patches for every cat", () => {
    for (const cat of CAT_LIST) {
      expect(SPRITE_PATCHES[cat.id]?.length ?? 0, cat.id).toBeGreaterThan(0);
    }
  });

  it("draws every cat as more than a stray pixel on the base", () => {
    for (const cat of CAT_LIST) {
      expect(pixelsChanged(catSprite(cat.id)), cat.id).toBeGreaterThanOrEqual(
        8,
      );
    }
  });

  it("gives no two cats the same grid", () => {
    const owners = new Map<string, string>();
    for (const cat of CAT_LIST) {
      const grid = catSprite(cat.id).join("\n");
      expect(owners.get(grid), `${cat.id} repeats a grid`).toBeUndefined();
      owners.set(grid, cat.id);
    }
    expect(owners.size).toBe(CAT_LIST.length);
  });

  it("leaves the eyes and the muzzle of the base where they are", () => {
    for (const cat of CAT_LIST) {
      const grid = catSprite(cat.id);
      for (const [row, from, to] of FACE) {
        expect(grid[row]?.slice(from, to), `${cat.id} row ${row}`).toBe(
          BASE_SPRITE[row]?.slice(from, to),
        );
      }
    }
  });
});
