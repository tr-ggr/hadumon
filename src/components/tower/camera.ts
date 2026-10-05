import type { Shot, Spot } from "~/components/run/climb";
import { SPRITE_SIZE } from "~/components/sprites/cats";
import { LANE, type Tower } from "~/components/sprites/tower";

/**
 * Where a camera on the tower looks. The tower is one picture, drawn in its
 * own pixels; a camera is a point of that picture and a whole number to
 * magnify it by, and the stage puts that point where it is told to.
 */
export interface Camera {
  /** Across the picture, in tower pixels, from its left edge. */
  x: number;
  /** Down the picture, in tower pixels, from the top of the roof's headroom. */
  y: number;
  /** How many times life size. A whole number, so a pixel stays square. */
  zoom: number;
}

/**
 * How far down the stage the climb puts what it frames. A little above the
 * middle, so the title card has the lower part to itself.
 */
export const FOCUS = 0.44;
/** How much larger the tower is drawn in a close shot. */
export const CLOSE = 2;
/** Where Hadu and the pennant stand on the roof, in from its left edge. */
export const ROOF_STAND = LANE + 6;
export const ROOF_PENNANT = LANE + 36;
/** Where a close shot looks, across the tower: toward the ledge, or the window. */
const LEDGE_SIDE = LANE + 18;
const WINDOW_SIDE = LANE + 26;

/** The picture's height: the tower, and room above the roof for a cat on it. */
export function sceneHeight(tower: Tower): number {
  return tower.height + SPRITE_SIZE;
}

/** The point of the tower a shot looks at, and how close. */
export function cameraFor(shot: Shot, hadu: Spot, tower: Tower): Camera {
  const height = sceneHeight(tower);
  if (!shot.close || shot.on === "tower") {
    return { x: tower.width / 2, y: height * FOCUS, zoom: 1 };
  }
  const spot = shot.on === "floor" ? (shot.floor ?? 0) : hadu;
  if (shot.on === "roof" || spot === "roof") {
    return { x: ROOF_STAND + 18, y: SPRITE_SIZE + 6, zoom: CLOSE };
  }
  const floor = typeof spot === "number" ? tower.floors[spot] : undefined;
  return {
    x: shot.on === "floor" ? WINDOW_SIDE : LEDGE_SIDE,
    // Off a floor he is at the foot, or about to be.
    y: floor ? SPRITE_SIZE + floor.top + floor.height / 2 : height - 26,
    zoom: CLOSE,
  };
}

/** The middle of a floor's window, for a camera that goes in through it. */
export function windowCentre(
  tower: Tower,
  floor: number,
): { x: number; y: number } {
  const hole = tower.floors[floor]?.hole;
  if (!hole) return { x: tower.width / 2, y: sceneHeight(tower) / 2 };
  return {
    x: hole.x + hole.width / 2,
    y: SPRITE_SIZE + hole.y + hole.height / 2,
  };
}
