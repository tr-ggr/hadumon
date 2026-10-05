import { getRival } from "~/server/game/rival";
import type { RunView } from "~/server/game/view";

import type { Sound } from "./sfx/recipes";

/**
 * The climb between matches, as data. A run is a tower with a rival on every
 * floor: Hadu walks in at the foot, goes up a floor after each win, and ends
 * on the roof. It is shot like a scene: a camera that pushes in and follows
 * him, bars across the top and bottom, and a title card for whoever is met.
 * Nothing here touches the run; it only says what to draw and what to play.
 */

/** Walking in, going up one floor, or reaching the roof. */
export type ClimbKind = "enter" | "ascend" | "summit";

export interface ClimbRecord {
  id: number;
  /** The run the climb belongs to; shown for any other, it is stale. */
  runId: string;
  kind: ClimbKind;
  /** The floor arrived at, as a match index. The roof is one past the last. */
  to: number;
}

/** Where Hadu is: not here yet, at the foot, on a floor's ledge, on the roof. */
export type Spot = "away" | "ground" | "roof" | number;

/**
 * A floor's window: nobody showing, a rival looking over the sill, a rival
 * sitting in it, or shut with the player's pennant on the ledge.
 */
export type WindowState = "dark" | "peek" | "out" | "flag";

/** What the camera frames. */
export interface Shot {
  /**
   * The whole tower, Hadu wherever he is (the foot, before he walks in), one
   * floor's window, or the roof.
   */
  on: "tower" | "hadu" | "floor" | "roof";
  /** The floor framed, for a shot on a floor. */
  floor?: number;
  /** Pushed in, or far enough back to see every floor. */
  close: boolean;
}

/** A jolt of the picture: none, a landing, or a boss. */
export type Shake = "none" | "soft" | "hard";

export interface ClimbFrame {
  hadu: Spot;
  /** Hadu arrived at this spot on this frame. */
  hop: boolean;
  windows: readonly WindowState[];
  /** The floor whose rival the title card names, if any. */
  plate: number | null;
  /** The pennant on the roof, once the last floor is taken. */
  roofFlag: boolean;
  shot: Shot;
  /**
   * The bars across the top and the bottom of the picture are in. They come
   * in with a close shot and go out when the camera is far back again.
   */
  bars: boolean;
  /** The title card is up: the rival on `plate`, or the roof. */
  title: boolean;
  shake: Shake;
  /** What is heard as the frame lands. */
  sounds: readonly Sound[];
  /** The sentence in the rail. */
  text: string;
  /**
   * How long the frame stays up, and how long the camera takes to reach its
   * shot. On the last frame, the rest before leaving.
   */
  ms: number;
}

/** Where a climb starts: the whole tower, held just long enough to be seen. */
const POSE = 240;
/** The camera pushing in, or crossing to a window. */
const PUSH = 400;
/** A beat that should be read: a window shutting, a pennant landing. */
const SETTLE = 400;
/** Hadu going up the wall. The stylesheet's scramble is a little shorter. */
const SCRAMBLE = 600;
/** Coming down on a ledge. */
const LAND = 240;
/** One floor of the tilt up the dark tower. */
const TILT = 220;
/** A boss's window, held dark before anyone comes to it. */
const DREAD = 360;
/** A rival rising into its window. */
const RISE = 420;
/** The roof's pennant going in, and its three notes. */
const PLANT = 480;
/** The camera pulling back from the roof to the whole tower. */
const PULL = 900;
/** The title card coming down. */
const SLAM = 400;
/** The rest on the last frame, as long as a rival's card is held up. */
export const CLIMB_REST = 1400;
/** The rest when nothing moves, so the one still frame can be read. */
export const CLIMB_REST_CALM = 2200;

type Trigger = "start" | "reward" | "act";

/**
 * The climb an answered mutation calls for, if any. Losing a match climbs
 * nowhere, and a win short of the last waits for the reward to be taken.
 */
export function climbAfter(
  trigger: Trigger,
  view: RunView,
): Pick<ClimbRecord, "kind" | "to"> | null {
  if (trigger === "act") {
    return view.phase === "over" && view.outcome === "won"
      ? { kind: "summit", to: view.gauntlet.length }
      : null;
  }
  if (view.phase !== "match" || view.match?.phase !== "setup") return null;
  if (trigger === "start") {
    return view.matchIndex === 0 ? { kind: "enter", to: 0 } : null;
  }
  return view.matchIndex > 0 && view.matchIndex < view.gauntlet.length
    ? { kind: "ascend", to: view.matchIndex }
    : null;
}

/** True while the run is still where the climb was heading. */
export function climbFits(
  climb: ClimbRecord,
  runId: string,
  view: RunView,
): boolean {
  if (climb.runId !== runId) return false;
  if (climb.kind === "summit") return view.outcome === "won";
  return (
    view.phase === "match" &&
    view.match?.phase === "setup" &&
    view.matchIndex === climb.to &&
    (climb.kind === "ascend" || view.results.length === 0)
  );
}

const WIDE: Shot = { on: "tower", close: false };
const ON_HADU: Shot = { on: "hadu", close: true };
const ON_ROOF: Shot = { on: "roof", close: true };

function onFloor(floor: number): Shot {
  return { on: "floor", floor, close: true };
}

function sound(name: Sound["name"], delay = 0, step = 0): Sound {
  return { name, step, delay };
}

/** Paws on the wall, rising, for as long as the scramble lasts. */
const PAWS: readonly Sound[] = [0, 1, 2, 3].map((n) =>
  sound("tick", n * 0.13, n * 2),
);

function meeting(floor: number, gauntlet: readonly string[]): string {
  const rivalId = gauntlet[floor];
  if (rivalId === undefined) return "";
  const rival = getRival(rivalId);
  return `Floor ${floor + 1} of ${gauntlet.length}: ${rival.name}, at the window.${rival.boss ? " A boss." : ""}`;
}

/** Every floor below `floor` taken, the rest looking over their sills. */
function windowsAt(
  floor: number,
  count: number,
  met: WindowState,
): WindowState[] {
  return Array.from({ length: count }, (_, index) =>
    index < floor ? "flag" : index === floor ? met : "peek",
  );
}

function valid(
  kind: ClimbKind,
  to: number,
  gauntlet: readonly string[],
): boolean {
  if (gauntlet.length === 0 || !Number.isInteger(to)) return false;
  if (kind === "enter") return to === 0;
  if (kind === "summit") return to === gauntlet.length;
  return to > 0 && to < gauntlet.length;
}

/**
 * Where a climb comes to rest: close on Hadu and the rival of the floor
 * arrived at, between the bars, with its title card up; or the whole tower
 * from far back, a pennant on every floor and on the roof, and its card.
 */
export function restingFrame(
  kind: ClimbKind,
  to: number,
  gauntlet: readonly string[],
): ClimbFrame | null {
  if (!valid(kind, to, gauntlet)) return null;
  const count = gauntlet.length;
  if (kind === "summit") {
    return {
      hadu: "roof",
      hop: false,
      windows: windowsAt(count, count, "flag"),
      plate: null,
      roofFlag: true,
      shot: WIDE,
      // The whole tower fills the picture; bars would cut the roof off it.
      bars: false,
      title: true,
      shake: "none",
      sounds: [],
      text: `The roof. ${count} floors, all yours. Nobody up here but you.`,
      ms: CLIMB_REST,
    };
  }
  return {
    hadu: to,
    hop: false,
    windows: windowsAt(to, count, "out"),
    plate: to,
    roofFlag: false,
    shot: onFloor(to),
    bars: true,
    title: true,
    shake: "none",
    sounds: [],
    text: meeting(to, gauntlet),
    ms: CLIMB_REST,
  };
}

/**
 * The frames of one climb, in order. Every climb opens on the whole tower
 * with no bars, and its last frame is always `restingFrame`. An impossible
 * climb has no frames.
 */
export function buildClimb(
  kind: ClimbKind,
  to: number,
  gauntlet: readonly string[],
): ClimbFrame[] {
  const rest = restingFrame(kind, to, gauntlet);
  if (!rest) return [];
  const count = gauntlet.length;
  const frames: ClimbFrame[] = [];
  let now: ClimbFrame = { ...rest, title: false, plate: null, bars: false };
  /** The next frame: the last one, changed. A hop, a jolt and a sound last one frame. */
  const push = (change: Partial<ClimbFrame>) => {
    now = { ...now, hop: false, shake: "none", sounds: [], ...change };
    frames.push(now);
  };
  /** Up the wall to a floor, and whoever lives there coming to the window. */
  const arrive = (floor: number) => {
    const rivalId = gauntlet[floor];
    const boss = rivalId !== undefined && getRival(rivalId).boss;
    push({
      hadu: floor,
      hop: true,
      shot: ON_HADU,
      sounds: PAWS,
      text: `Up to floor ${floor + 1}.`,
      ms: SCRAMBLE,
    });
    push({ shake: "soft", sounds: [sound("settle")], ms: LAND });
    if (boss) {
      push({
        shot: onFloor(floor),
        windows: windowsAt(floor, count, "dark"),
        text: `Floor ${floor + 1}. The window is dark.`,
        ms: DREAD,
      });
    }
    push({
      shot: onFloor(floor),
      windows: rest.windows,
      shake: boss ? "hard" : "none",
      text: meeting(floor, gauntlet),
      ms: RISE,
    });
    push({
      plate: floor,
      title: true,
      shake: boss ? "hard" : "soft",
      sounds: [sound("slam")],
      ms: SLAM,
    });
  };

  if (kind === "enter") {
    const empty = `A grey tower, ${count} floors tall. Somebody is home on every one.`;
    const dark = (): WindowState[] =>
      Array.from({ length: count }, () => "dark");
    push({
      hadu: "away",
      windows: dark(),
      roofFlag: false,
      shot: WIDE,
      text: empty,
      ms: POSE,
    });
    push({ bars: true, shot: ON_HADU, ms: PUSH });
    for (let floor = 0; floor < count; floor++) {
      push({
        shot: onFloor(floor),
        windows: dark().map((state, index) =>
          index <= floor ? "peek" : state,
        ),
        sounds: [sound("tick", 0, floor * 2)],
        ms: TILT,
      });
    }
    push({ shot: ON_HADU, ms: PUSH });
    push({
      hadu: "ground",
      hop: true,
      sounds: [sound("settle")],
      text: "In you go.",
      ms: PUSH,
    });
    arrive(0);
  } else {
    const from = to - 1;
    const taken = `Floor ${from + 1} is yours.`;
    push({
      hadu: from,
      windows: windowsAt(from, count, "out"),
      roofFlag: false,
      shot: WIDE,
      text: taken,
      ms: POSE,
    });
    push({ bars: true, shot: ON_HADU, ms: PUSH });
    push({
      windows: windowsAt(from + 1, count, "peek"),
      shake: "soft",
      sounds: [sound("settle")],
      text: `${taken} The window shuts.`,
      ms: SETTLE,
    });
    if (kind === "summit") {
      push({
        hadu: "roof",
        hop: true,
        shot: ON_ROOF,
        sounds: PAWS,
        text: "Up the last of the wall.",
        ms: SCRAMBLE,
      });
      push({
        shake: "soft",
        sounds: [sound("settle")],
        text: "The roof.",
        ms: LAND,
      });
      push({
        roofFlag: true,
        shake: "hard",
        sounds: [sound("goalWon")],
        text: `The roof. ${count} floors, all yours.`,
        ms: PLANT,
      });
      push({ shot: WIDE, bars: false, ms: PULL });
      push({
        title: true,
        shake: "soft",
        sounds: [sound("slam")],
        text: rest.text,
        ms: SLAM,
      });
    } else {
      arrive(to);
    }
  }

  frames.push(rest);
  return frames;
}

/** The whole climb in one sentence, for a reader who cannot watch it. */
export function climbAnnouncement(
  kind: ClimbKind,
  to: number,
  gauntlet: readonly string[],
): string {
  if (!valid(kind, to, gauntlet)) return "";
  const count = gauntlet.length;
  if (kind === "summit") {
    return `You climb to the roof of the tower. All ${count} floors are yours.`;
  }
  const rivalId = gauntlet[to];
  const rival = rivalId === undefined ? null : getRival(rivalId);
  const who = rival ? `${rival.name}${rival.boss ? ", a boss" : ""}` : "";
  return kind === "enter"
    ? `You walk into the tower. Floor 1 of ${count}: ${who}.`
    : `You climb to floor ${to + 1} of ${count}: ${who}.`;
}
