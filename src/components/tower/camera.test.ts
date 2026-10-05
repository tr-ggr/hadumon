import { describe, expect, it } from "vitest";

import { SPRITE_SIZE } from "~/components/sprites/cats";
import { LANE, buildTower } from "~/components/sprites/tower";

import { CLOSE, FOCUS, cameraFor, sceneHeight, windowCentre } from "./camera";

const tower = buildTower([false, false, true, false, false, true]);

describe("cameraFor", () => {
  it("frames the whole tower from far back at life size", () => {
    const wide = cameraFor({ on: "tower", close: false }, 2, tower);
    expect(wide).toEqual({
      x: tower.width / 2,
      y: sceneHeight(tower) * FOCUS,
      zoom: 1,
    });
    // A shot that is not close is the wide one, whatever it names.
    expect(cameraFor({ on: "hadu", close: false }, 2, tower)).toEqual(wide);
  });

  it("only ever magnifies by a whole number", () => {
    const shots = [
      cameraFor({ on: "tower", close: false }, "away", tower),
      cameraFor({ on: "hadu", close: true }, "ground", tower),
      cameraFor({ on: "hadu", close: true }, 3, tower),
      cameraFor({ on: "floor", floor: 5, close: true }, 4, tower),
      cameraFor({ on: "roof", close: true }, "roof", tower),
    ];
    for (const shot of shots) expect(Number.isInteger(shot.zoom)).toBe(true);
    expect(CLOSE).toBeGreaterThan(1);
  });

  it("follows Hadu up the wall, floor by floor", () => {
    const heights = [0, 1, 2, 3, 4, 5].map(
      (floor) => cameraFor({ on: "hadu", close: true }, floor, tower).y,
    );
    for (let floor = 1; floor < heights.length; floor++) {
      expect(heights[floor]).toBeLessThan(heights[floor - 1] ?? 0);
    }
  });

  it("looks at the foot for a cat that is not on a floor yet", () => {
    const ground = cameraFor({ on: "hadu", close: true }, "ground", tower);
    const top = cameraFor({ on: "hadu", close: true }, 5, tower);
    expect(ground.y).toBeGreaterThan(top.y);
    expect(ground.y).toBeLessThan(sceneHeight(tower));
    expect(cameraFor({ on: "hadu", close: true }, "away", tower)).toEqual(
      ground,
    );
  });

  it("looks further right for a window than for a ledge", () => {
    const ledge = cameraFor({ on: "hadu", close: true }, 2, tower);
    const pane = cameraFor({ on: "floor", floor: 2, close: true }, 1, tower);
    expect(pane.x).toBeGreaterThan(ledge.x);
    expect(pane.y).toBe(ledge.y);
    expect(ledge.x).toBeGreaterThan(LANE);
  });

  it("frames the roof above every floor", () => {
    const roof = cameraFor({ on: "roof", close: true }, "roof", tower);
    const top = cameraFor({ on: "hadu", close: true }, 5, tower);
    expect(roof.y).toBeLessThan(top.y);
    expect(cameraFor({ on: "hadu", close: true }, "roof", tower)).toEqual(roof);
  });
});

describe("windowCentre", () => {
  it("is inside the hole of the floor it names", () => {
    tower.floors.forEach((floor, index) => {
      const centre = windowCentre(tower, index);
      expect(centre.x).toBeGreaterThan(floor.hole.x);
      expect(centre.x).toBeLessThan(floor.hole.x + floor.hole.width);
      expect(centre.y).toBeGreaterThan(SPRITE_SIZE + floor.hole.y);
      expect(centre.y).toBeLessThan(
        SPRITE_SIZE + floor.hole.y + floor.hole.height,
      );
    });
  });

  it("falls back to the middle of the picture for a floor that is not there", () => {
    expect(windowCentre(tower, 9)).toEqual({
      x: tower.width / 2,
      y: sceneHeight(tower) / 2,
    });
  });
});
