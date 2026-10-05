/**
 * How a match lays itself out for its window. The stylesheet decides, with
 * media queries (`fit-wide`, `fit-compact` and `turn-phone` in
 * `globals.css`); this says the same thing in numbers, so it can be tested
 * and so a script can ask which one is in force.
 */

import { stored, useStored } from "./stored";

/**
 * - `wide`: everything on one screen, the rail down the left.
 * - `compact`: everything on one screen, three columns over a strip of hand.
 * - `turn`: a phone held upright, which is asked to turn.
 * - `scroll`: the table as a page that scrolls.
 */
export type MatchLayout = "wide" | "compact" | "turn" | "scroll";

const REM = 16;
/** The least a window can be for the wide table to fit it. */
export const WIDE_MIN = { width: 64 * REM, height: 37.5 * REM } as const;
/** The least a window on its side can be for the compact table to fit it. */
export const COMPACT_MIN = { width: 45 * REM, height: 17.5 * REM } as const;
/** A window wider than this is no phone held upright. */
export const PHONE_MAX_WIDTH = 37.5 * REM;

/**
 * The layout a window of this size gets. `coarse` is a touch screen with no
 * mouse, which is the only kind asked to turn. `longSide` is the longer
 * side of the screen itself: a phone's browser keeps some of an upright
 * window for its own bars, so the window's height says less than the room
 * there is once the phone is turned. A phone too small to fit the compact
 * table on its side is never asked.
 */
export function matchLayout(
  width: number,
  height: number,
  coarse: boolean,
  longSide: number = Math.max(width, height),
): MatchLayout {
  if (width >= WIDE_MIN.width && height >= WIDE_MIN.height) return "wide";
  const landscape = width > height;
  if (
    landscape &&
    width >= COMPACT_MIN.width &&
    height >= COMPACT_MIN.height &&
    height < WIDE_MIN.height
  ) {
    return "compact";
  }
  if (
    coarse &&
    !landscape &&
    width < PHONE_MAX_WIDTH &&
    longSide >= COMPACT_MIN.width
  ) {
    return "turn";
  }
  return "scroll";
}

/** The layout of the window as it is now. Only in a browser. */
export function windowLayout(): MatchLayout {
  return matchLayout(
    window.innerWidth,
    window.innerHeight,
    window.matchMedia("(hover: none) and (pointer: coarse)").matches,
    Math.max(window.screen.width, window.screen.height),
  );
}

/**
 * Which fitted layout the match is in right now, or `null` for the page
 * that scrolls: read from `--match-fit`, which the stylesheet sets on
 * `[data-match]` under the same media queries that lay the table out.
 */
export function matchFit(root: Element | null): "wide" | "compact" | null {
  if (!root) return null;
  const fit = getComputedStyle(root).getPropertyValue("--match-fit").trim();
  return fit === "wide" || fit === "compact" ? fit : null;
}

/** Whether a phone held upright is asked to turn, or plays as it is. */
export const UPRIGHT = ["ask", "upright"] as const;
export type Upright = (typeof UPRIGHT)[number];

export function parseUpright(raw: string | null): Upright {
  return raw === "upright" ? "upright" : "ask";
}

export const uprightSetting = stored<Upright>("hadumon:upright", parseUpright);

export function useUpright(): Upright {
  return useStored(uprightSetting);
}
