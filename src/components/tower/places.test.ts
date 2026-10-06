import { describe, expect, it } from "vitest";

import { buildTower } from "~/components/sprites/tower";
import { GAUNTLET, getRival } from "~/server/game/rival";

import { sceneHeight } from "./camera";
import {
  ROOM_ZOOM,
  moveEase,
  moveMs,
  placeFor,
  placeShot,
  roomFloor,
  type Place,
} from "./places";

const tower = buildTower(GAUNTLET.map((rivalId) => getRival(rivalId).boss));
const PLACES: readonly Place[] = ["outside", "door", "room"];

describe("placeFor", () => {
  it("puts the codex in a room, the table at the door, the rest outside", () => {
    expect(placeFor("/codex")).toBe("room");
    expect(placeFor("/codex/cats")).toBe("room");
    expect(placeFor("/run")).toBe("door");
    expect(placeFor("/")).toBe("outside");
    expect(placeFor("/nowhere")).toBe("outside");
    expect(placeFor("/running")).toBe("outside");
    expect(placeFor("/runs")).toBe("room");
    expect(placeFor("/runs/0b6f1c3e-0000-4000-8000-000000000000")).toBe("room");
    expect(placeFor("/players/hadu")).toBe("room");
  });
});

describe("roomFloor", () => {
  it("is the floor of the rival who keeps the files", () => {
    const floor = roomFloor(GAUNTLET);
    expect(GAUNTLET[floor]).toBe("the-archivist");
  });

  it("is the first floor of a tower the keeper is not in", () => {
    expect(roomFloor(["alley-tom", "dockside-twins"])).toBe(0);
  });
});

describe("moves between places", () => {
  it("take no time to go nowhere, and under half a second otherwise", () => {
    for (const from of PLACES) {
      for (const to of PLACES) {
        const ms = moveMs(from, to);
        if (from === to) expect(ms).toBe(0);
        else {
          expect(ms).toBeGreaterThanOrEqual(300);
          expect(ms).toBeLessThanOrEqual(500);
        }
        expect(moveEase(from, to)).toMatch(/^cubic-bezier\(/);
      }
    }
  });

  it("take longest through the window", () => {
    expect(moveMs("outside", "room")).toBeGreaterThan(
      moveMs("outside", "door"),
    );
    expect(moveMs("room", "outside")).toBe(moveMs("outside", "room"));
  });
});

describe("placeShot", () => {
  it("only ever magnifies by a whole number", () => {
    for (const place of PLACES) {
      const { camera } = placeShot(place, 2, tower, roomFloor(GAUNTLET));
      expect(Number.isInteger(camera.zoom)).toBe(true);
    }
    expect(Number.isInteger(ROOM_ZOOM)).toBe(true);
  });

  it("stands the whole tower on the ground from outside", () => {
    const { camera } = placeShot("outside", "ground", tower, 0);
    expect(camera).toEqual({
      x: tower.width / 2,
      y: sceneHeight(tower),
      zoom: 1,
    });
  });

  it("is close on wherever the run stands at the door", () => {
    const foot = placeShot("door", "ground", tower, 0).camera;
    const high = placeShot("door", 4, tower, 0).camera;
    expect(foot.zoom).toBe(high.zoom);
    expect(foot.zoom).toBeGreaterThan(1);
    expect(high.y).toBeLessThan(foot.y);
  });

  it("fills the largest screen with the inside of the window", () => {
    const floor = roomFloor(GAUNTLET);
    const { camera } = placeShot("room", "ground", tower, floor);
    const hole = tower.floors[floor]?.hole;
    expect(hole).toBeDefined();
    if (!hole) return;
    // The tower's pixel is 6px at most, on a window of 2000 by 1370 or more;
    // the widest and tallest that a 4K screen gives it is 3840 by 2160.
    expect(hole.width * 6 * camera.zoom).toBeGreaterThanOrEqual(3840);
    expect(hole.height * 6 * camera.zoom).toBeGreaterThanOrEqual(2160);
    expect(camera.x).toBeGreaterThan(hole.x);
    expect(camera.x).toBeLessThan(hole.x + hole.width);
  });
});
