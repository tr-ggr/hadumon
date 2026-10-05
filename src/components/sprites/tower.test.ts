import { describe, expect, it } from "vitest";

import { SPRITE_SIZE } from "./cats";
import {
  BOSS_TIER,
  FOOT,
  LANE,
  ROOF,
  TIER,
  TOWER_LEGEND,
  TOWER_WIDTH,
  buildTower,
  stackRuns,
} from "./tower";

const LEGEND = Object.keys(TOWER_LEGEND);
const COLORS = { ".": null, o: "ink", "1": "stone", "2": "lit", "3": "rib" };
/** Six floors, the third and the last a boss's, as a run has them. */
const BOSSES = [false, false, true, false, false, true];

describe("tower grids", () => {
  it("draws every part at the tower's width, in legend characters", () => {
    for (const grid of [TIER, BOSS_TIER, ROOF, FOOT]) {
      expect(grid.length).toBeGreaterThan(0);
      for (const row of grid) {
        expect(row).toHaveLength(TOWER_WIDTH);
        for (const pixel of row) expect(LEGEND).toContain(pixel);
      }
    }
  });

  it("stands a boss's floor taller", () => {
    expect(BOSS_TIER.length).toBeGreaterThan(TIER.length);
  });

  it("ribs the body in more than one grey", () => {
    const row = TIER[1] ?? "";
    for (const pixel of ["1", "2", "3"]) expect(row).toContain(pixel);
  });
});

describe("buildTower", () => {
  const tower = buildTower(BOSSES);

  it("stacks the roof, a floor per match and the foot", () => {
    expect(tower.width).toBe(TOWER_WIDTH);
    expect(tower.floors).toHaveLength(BOSSES.length);
    expect(tower.rows).toHaveLength(tower.height);
    expect(tower.height).toBe(
      ROOF.length + 4 * TIER.length + 2 * BOSS_TIER.length + FOOT.length,
    );
    expect(tower.floors.map((floor) => floor.boss)).toEqual(BOSSES);
  });

  it("puts the first match at the bottom and each next one above it", () => {
    tower.floors.forEach((floor, index) => {
      const below = tower.floors[index - 1];
      if (below) expect(floor.top + floor.height).toBe(below.top);
    });
    expect(tower.floors.at(-1)?.top).toBe(ROOF.length);
    const first = tower.floors[0];
    expect((first?.top ?? 0) + (first?.height ?? 0)).toBe(
      tower.height - FOOT.length,
    );
  });

  it("cuts every window big enough for a cat, and nowhere else", () => {
    for (const floor of tower.floors) {
      const { hole } = floor;
      expect(hole.width).toBeGreaterThanOrEqual(SPRITE_SIZE);
      expect(hole.height).toBeGreaterThanOrEqual(SPRITE_SIZE);
      const middle = tower.rows[hole.y + Math.floor(hole.height / 2)] ?? "";
      expect(middle.slice(hole.x, hole.x + hole.width)).toBe(
        ".".repeat(hole.width),
      );
      for (let y = floor.top; y < floor.top + floor.height; y++) {
        const row = tower.rows[y] ?? "";
        for (let x = LANE; x < row.length; x++) {
          if (row[x] !== "." || x >= TOWER_WIDTH - 2) continue;
          const inHole =
            x >= hole.x &&
            x < hole.x + hole.width &&
            y >= hole.y &&
            y < hole.y + hole.height;
          expect(inHole, `${x},${y}`).toBe(true);
        }
      }
    }
  });

  it("gives every floor a ledge with room for a cat to stand on it", () => {
    for (const floor of tower.floors) {
      expect(tower.rows[floor.ledge]?.slice(2, LANE)).toBe(
        "o".repeat(LANE - 2),
      );
      for (let y = floor.ledge - SPRITE_SIZE; y < floor.ledge; y++) {
        expect(tower.rows[y]?.slice(0, LANE), `row ${y}`).toBe(
          ".".repeat(LANE),
        );
      }
    }
  });
});

describe("stackRuns", () => {
  it("draws the same pixels as the rows, in far fewer pieces", () => {
    const { rows } = buildTower(BOSSES);
    const blocks = stackRuns(rows, COLORS);
    const drawn = rows.map((row) => [...row].map((): string | null => null));
    for (const block of blocks) {
      for (let y = block.y; y < block.y + block.height; y++) {
        for (let x = block.x; x < block.x + block.width; x++) {
          expect(drawn[y]?.[x], `${x},${y} drawn twice`).toBeNull();
          const line = drawn[y];
          if (line) line[x] = block.fill;
        }
      }
    }
    rows.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        expect(drawn[y]?.[x], `${x},${y}`).toBe(
          COLORS[pixel as keyof typeof COLORS],
        );
      });
    });
    const pixels = rows.join("").replaceAll(".", "").length;
    expect(blocks.length).toBeLessThan(pixels / 10);
  });

  it("starts a new block where a row stops repeating", () => {
    expect(stackRuns(["11", "11", "1."], COLORS)).toEqual([
      { x: 0, y: 0, width: 2, height: 2, fill: "stone" },
      { x: 0, y: 2, width: 1, height: 1, fill: "stone" },
    ]);
  });
});
