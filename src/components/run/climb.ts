import { getRival } from "~/server/game/rival";
import type { RunView } from "~/server/game/view";

/**
 * The climb between matches, as data. A run is a tower with a rival on every
 * floor: Hadu walks in at the foot, goes up a floor after each win, and ends
 * on the roof. Nothing here touches the run; it only says what to draw.
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

export interface ClimbFrame {
  hadu: Spot;
  /** Hadu arrived at this spot on this frame. */
  hop: boolean;
  windows: readonly WindowState[];
  /** The floor whose rival's nameplate is down, if any. */
  plate: number | null;
  /** The pennant on the roof, once the last floor is taken. */
  roofFlag: boolean;
  /** The sentence in the rail. */
  text: string;
  /** How long the frame stays up. On the last frame, the rest before leaving. */
  ms: number;
}

/** One beat of the climb, the same length as a step of a turn. */
const STEP = 380;
/** A window opening down the line, quicker than a beat. */
const QUICK = 160;
/** A beat that should be read: a window shutting, a pennant landing. */
const SETTLE = 480;
/** Where a climb starts, held just long enough to be seen. */
const POSE = 300;
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
 * Where a climb comes to rest: Hadu arrived, the rival of that floor in its
 * window with its nameplate down, or the roof with the pennant on it.
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
    text: meeting(to, gauntlet),
    ms: CLIMB_REST,
  };
}

/**
 * The frames of one climb, in order. The last is always `restingFrame`. An
 * impossible climb has no frames.
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
  let now: ClimbFrame = { ...rest, ms: STEP };
  const push = (change: Partial<ClimbFrame>) => {
    now = { ...now, hop: false, ...change };
    frames.push(now);
  };

  if (kind === "enter") {
    const empty = `A grey tower, ${count} floors tall. Somebody is home on every one.`;
    const dark = (): WindowState[] =>
      Array.from({ length: count }, () => "dark");
    push({
      hadu: "away",
      windows: dark(),
      plate: null,
      text: empty,
      ms: SETTLE,
    });
    push({ hadu: "ground", hop: true, ms: STEP });
    for (let lit = 2; lit < count + 2; lit += 2) {
      push({
        windows: dark().map((state, index) => (index < lit ? "peek" : state)),
        ms: QUICK,
      });
    }
    push({ hadu: 0, hop: true, text: meeting(0, gauntlet), ms: STEP });
    push({ windows: rest.windows, ms: STEP });
  } else {
    const from = to - 1;
    const taken = `Floor ${from + 1} is yours.`;
    push({
      hadu: from,
      windows: windowsAt(from, count, "out"),
      plate: null,
      roofFlag: false,
      text: taken,
      ms: POSE,
    });
    push({
      windows: windowsAt(from + 1, count, "peek"),
      text: `${taken} The window shuts.`,
      ms: SETTLE,
    });
    if (kind === "summit") {
      push({ hadu: "roof", hop: true, text: "The roof.", ms: STEP });
      push({
        roofFlag: true,
        text: `The roof. ${count} floors, all yours.`,
        ms: SETTLE,
      });
    } else {
      push({ hadu: to, hop: true, text: meeting(to, gauntlet), ms: STEP });
      push({ windows: rest.windows, ms: STEP });
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
