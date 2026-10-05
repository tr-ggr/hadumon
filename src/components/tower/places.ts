import type { Spot } from "~/components/run/climb";
import type { Tower } from "~/components/sprites/tower";

import { cameraFor, sceneHeight, windowCentre, type Camera } from "./camera";

/**
 * Every page that is not a match is somewhere at the tower. Home is outside,
 * with the whole tower in view. The way to the table is the door: close on
 * wherever the run stands. The codex is a room inside, reached through the
 * window of the rival who keeps everything on file.
 */
export type Place = "outside" | "door" | "room";

export function placeFor(pathname: string): Place {
  if (pathname === "/codex" || pathname.startsWith("/codex/")) return "room";
  if (pathname === "/run" || pathname.startsWith("/run/")) return "door";
  return "outside";
}

/** Whose window the camera goes in through. */
const KEEPER = "the-archivist";

/** The floor of the room, as a match index. The first, if the keeper is away. */
export function roomFloor(gauntlet: readonly string[]): number {
  return Math.max(0, gauntlet.indexOf(KEEPER));
}

/**
 * How many times life size the tower is drawn from inside a window. A whole
 * number, and large enough that the dark of the smallest window fills the
 * largest screen the tower's own pixel is sized for.
 */
export const ROOM_ZOOM = 32;

/** How long the camera takes between two places, in milliseconds. */
export function moveMs(from: Place, to: Place): number {
  if (from === to) return 0;
  return from === "room" || to === "room" ? 480 : 360;
}

/**
 * How the camera gets there. Magnifying by a large number is all over in its
 * first tenth unless it is held back, and all in its last tenth on the way
 * out, so going into the room starts slowly and coming out of it ends slowly.
 */
export function moveEase(from: Place, to: Place): string {
  if (to === "room") return "cubic-bezier(0.85, 0, 1, 0.3)";
  if (from === "room") return "cubic-bezier(0, 0.7, 0.15, 1)";
  return "cubic-bezier(0.45, 0, 0.2, 1)";
}

export interface PlaceShot {
  camera: Camera;
  /** Where on the stage the camera's point is put: across, and down. */
  at: string;
  focus: string;
}

/**
 * Where the tower stands when it is seen whole from outside: its foot far
 * enough above the bottom of the stage to show the rock it stands on, and
 * its right side on the right edge of the page's column. A page that shows
 * it keeps that side of itself clear (`.beside-tower`).
 */
const GROUND = "calc(100cqh - var(--px) * 14)";
const PARKED = "calc(50cqw + min(50cqw, 590px) - 1.25rem - var(--px) * 39)";
const MIDDLE = { at: "50cqw", focus: "50cqh" };

/** What the camera frames at a place. */
export function placeShot(
  place: Place,
  hadu: Spot,
  tower: Tower,
  room: number,
): PlaceShot {
  if (place === "room") {
    return {
      camera: { ...windowCentre(tower, room), zoom: ROOM_ZOOM },
      ...MIDDLE,
    };
  }
  if (place === "door") {
    return {
      camera: cameraFor({ on: "hadu", close: true }, hadu, tower),
      ...MIDDLE,
    };
  }
  return {
    camera: { x: tower.width / 2, y: sceneHeight(tower), zoom: 1 },
    at: PARKED,
    focus: GROUND,
  };
}
