import { describe, expect, it } from "vitest";

import {
  CLOUDS_FAR,
  CLOUDS_NEAR,
  LANDING,
  ROCK_DEPTH,
  SCENERY_COLORS,
  SCENERY_LEGEND,
  SEA,
  SEA_WIDTH,
  SHORE_REACH,
  SKY,
  SKY_WIDTH,
  landing,
  rock,
  shore,
} from "./scenery";
import { TOWER_WIDTH } from "./tower";

const LEGEND = Object.keys(SCENERY_LEGEND);

function share(rows: readonly string[], pixel: string): number {
  const all = rows.join("");
  return [...all].filter((p) => p === pixel).length / all.length;
}

describe("scenery grids", () => {
  it("draws every tile in legend characters, every row the same width", () => {
    const tiles: [readonly string[], number][] = [
      [SKY, SKY_WIDTH],
      [SEA, SEA_WIDTH],
      [CLOUDS_FAR, CLOUDS_FAR[0]?.length ?? 0],
      [CLOUDS_NEAR, CLOUDS_NEAR[0]?.length ?? 0],
    ];
    for (const [rows, width] of tiles) {
      expect(rows.length).toBeGreaterThan(0);
      expect(width).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row).toHaveLength(width);
        for (const pixel of row) expect(LEGEND).toContain(pixel);
      }
    }
  });

  it("has a colour for every character but the clear one", () => {
    for (const pixel of LEGEND) {
      const color = SCENERY_COLORS[pixel as keyof typeof SCENERY_COLORS];
      if (pixel === ".") expect(color).toBeNull();
      else expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("the sky", () => {
  it("is ember at the top and palest over the sea", () => {
    expect(SKY[0]).toBe("d".repeat(SKY_WIDTH));
    expect(SKY.at(-1)).toBe("a".repeat(SKY_WIDTH));
  });

  it("goes through its colours in order, never back", () => {
    const order = "dcba";
    let reached = 0;
    for (const row of SKY) {
      const lowest = Math.min(...[...row].map((p) => order.indexOf(p)));
      const highest = Math.max(...[...row].map((p) => order.indexOf(p)));
      expect(lowest).toBeGreaterThanOrEqual(reached - 1);
      expect(highest - lowest).toBeLessThanOrEqual(1);
      reached = Math.max(reached, lowest);
    }
    expect(reached).toBe(order.length - 1);
  });

  it("changes colour in a dither, not a line", () => {
    const mixed = SKY.filter((row) => new Set(row).size > 1);
    expect(mixed.length).toBeGreaterThan(24);
  });
});

describe("the clouds", () => {
  it("are clear along the top and solid along the foot", () => {
    for (const bank of [CLOUDS_FAR, CLOUDS_NEAR]) {
      expect(bank[0]).toContain(".");
      expect(bank.at(-1)).not.toContain(".");
    }
  });

  it("meet themselves where the tile repeats, with no step it has nowhere else", () => {
    for (const bank of [CLOUDS_FAR, CLOUDS_NEAR]) {
      const width = bank[0]?.length ?? 0;
      const top = (x: number) => bank.findIndex((row) => row[x] !== ".");
      const step = (x: number) => Math.abs(top(x) - top((x + 1) % width));
      const within = Math.max(
        ...Array.from({ length: width - 1 }, (_, x) => step(x)),
      );
      expect(step(width - 1)).toBeLessThanOrEqual(within);
    }
  });

  it("are lit along their upper edge only", () => {
    expect(share(CLOUDS_FAR, "l")).toBeLessThan(share(CLOUDS_FAR, "g"));
    expect(share(CLOUDS_NEAR, "w")).toBeLessThan(share(CLOUDS_NEAR, "l"));
  });
});

describe("the sea", () => {
  it("glints most under the horizon and deepens below", () => {
    const glints = (rows: readonly string[]) =>
      share(rows, "f") + share(rows, "h");
    expect(glints(SEA.slice(0, 8))).toBeGreaterThan(glints(SEA.slice(-8)) * 4);
    expect(share(SEA.slice(0, 8), "n")).toBe(0);
    expect(share(SEA.slice(-4), "n")).toBeGreaterThan(0.6);
  });
});

describe("the rock and the shore", () => {
  it("holds the whole tower and widens as it goes down", () => {
    const rows = rock(TOWER_WIDTH);
    expect(rows).toHaveLength(ROCK_DEPTH);
    expect(rows[0]?.left).toBeLessThanOrEqual(0);
    expect(rows[0]?.right).toBeGreaterThanOrEqual(TOWER_WIDTH);
    expect(rows[0]?.pixel).toBe("t");
    const last = rows.at(-1);
    expect(last?.pixel).toBe("r");
    expect(last?.left).toBeLessThan((rows[0]?.left ?? 0) - 100);
    expect(last?.right).toBeGreaterThan((rows[0]?.right ?? 0) + 60);
  });

  it("keeps the shore to the left of the rock, higher the further left", () => {
    const rows = shore();
    const top = rows[0];
    const ground = rows.find((row) => row.y === 0);
    expect(top?.y).toBeLessThan(-40);
    for (const row of rows) {
      expect(row.left).toBe(-SHORE_REACH);
      expect(row.right).toBeLessThan(0);
    }
    // The top of the slope is far to the left; at the water it is nearly at the rock.
    expect(top?.right).toBeLessThan((ground?.right ?? 0) - 150);
    expect(rows.at(-1)?.right).toBeGreaterThan(-45);
  });

  it("joins the shore to the rock with a landing to walk on", () => {
    const shelf = landing();
    const top = shelf[0];
    const shoreAtGround = shore().find((row) => row.y === 0);
    const rockTop = rock(TOWER_WIDTH)[0];
    expect(top?.y).toBe(0);
    expect(top?.pixel).toBe("t");
    expect(top?.left).toBe(-LANDING);
    // It runs in under the shore at one end and meets the rock at the other.
    expect(top?.left).toBeLessThan(shoreAtGround?.right ?? 0);
    expect(top?.right).toBeGreaterThanOrEqual(rockTop?.left ?? 0);
    for (const row of shelf) expect(row.right).toBeLessThanOrEqual(0);
  });
});
