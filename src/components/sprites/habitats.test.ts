import { describe, expect, it } from "vitest";

import { ROWS } from "~/server/game/cats";

import {
  HABITAT_COLORS,
  HABITAT_LEGEND,
  HABITAT_SCENES,
  drawHabitats,
  type HabitatScene,
} from "./habitats";

const LEGEND = Object.keys(HABITAT_LEGEND);

/** A scene's tiles by name; the glow may be empty. */
function bands(scene: HabitatScene): [string, readonly string[]][] {
  return [
    ["sky", scene.sky],
    ["glow", scene.glow],
    ["horizon", scene.horizon],
    ["ground", scene.ground],
  ];
}

describe("habitat grids", () => {
  it("draws every band in legend characters, every row the same width", () => {
    for (const row of ROWS) {
      for (const [name, tile] of bands(HABITAT_SCENES[row])) {
        const width = tile[0]?.length ?? 0;
        for (const line of tile) {
          expect(line, `${row} ${name}`).toHaveLength(width);
          for (const pixel of line) expect(LEGEND).toContain(pixel);
        }
      }
    }
  });

  it("has a sky, a horizon and a ground for every lane", () => {
    for (const row of ROWS) {
      const scene = HABITAT_SCENES[row];
      expect(scene.sky.length, row).toBeGreaterThan(0);
      expect(scene.horizon.length, row).toBeGreaterThan(0);
      expect(scene.ground.length, row).toBeGreaterThan(0);
    }
  });

  it("makes every tile a multiple of four wide, so a dither wraps", () => {
    for (const row of ROWS) {
      for (const [name, tile] of bands(HABITAT_SCENES[row])) {
        expect((tile[0]?.length ?? 0) % 4, `${row} ${name}`).toBe(0);
      }
    }
  });

  it("has a colour for every character but the clear one", () => {
    for (const pixel of LEGEND) {
      const color = HABITAT_COLORS[pixel as keyof typeof HABITAT_COLORS];
      if (pixel === ".") expect(color).toBeNull();
      else expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("draws each scene in its own colours and no other scene's", () => {
    for (const row of ROWS) {
      const scene = HABITAT_SCENES[row];
      const own = new Set<string>([...scene.pixels, "."]);
      for (const [name, tile] of bands(scene)) {
        for (const pixel of tile.join("")) {
          expect(own.has(pixel), `${row} ${name} uses ${pixel}`).toBe(true);
        }
      }
      expect(own.has(scene.backdrop), row).toBe(true);
      expect(own.has(scene.cast), row).toBe(true);
      for (const other of ROWS) {
        if (other === row) continue;
        for (const pixel of HABITAT_SCENES[other].pixels) {
          expect(scene.pixels, `${row} and ${other}`).not.toContain(pixel);
        }
      }
    }
  });

  it("uses every colour it lists", () => {
    for (const row of ROWS) {
      const scene = HABITAT_SCENES[row];
      const drawn = new Set(
        bands(scene).flatMap(([, tile]) => [...tile.join("")]),
      );
      for (const pixel of scene.pixels) {
        expect(drawn.has(pixel), `${row} never draws ${pixel}`).toBe(true);
      }
    }
  });

  it("draws the same rows every time", () => {
    expect(drawHabitats()).toEqual(HABITAT_SCENES);
    expect(drawHabitats()).toEqual(drawHabitats());
  });
});

describe("the bands", () => {
  it("leaves the sky and the ground with nothing clear in them", () => {
    for (const row of ROWS) {
      const scene = HABITAT_SCENES[row];
      expect(scene.sky.join(""), row).not.toContain(".");
      expect(scene.ground.join(""), row).not.toContain(".");
    }
  });

  it("lets the sky show over the horizon, which is solid along its foot", () => {
    for (const row of ROWS) {
      const { horizon } = HABITAT_SCENES[row];
      expect(horizon[0], row).toContain(".");
      expect(horizon.at(-1), row).not.toContain(".");
    }
  });

  it("makes a glow one block of the dither wide and as tall as its horizon", () => {
    for (const row of ROWS) {
      const { glow, horizon } = HABITAT_SCENES[row];
      if (glow.length === 0) continue;
      expect(glow[0], row).toHaveLength(4);
      expect(glow, row).toHaveLength(horizon.length);
    }
  });

  it("changes the garden's sky and the night's in a dither, not a line", () => {
    for (const row of ["hunt", "prowl"] as const) {
      const mixed = HABITAT_SCENES[row].glow.filter(
        (line) => new Set(line).size > 1,
      );
      expect(mixed.length, row).toBeGreaterThan(4);
    }
  });
});
