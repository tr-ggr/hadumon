/**
 * The fifteen relics as pixel art, one drawing each. They are drawn on the
 * cats' 16x16 grid in the icons' legend (`ICON_LEGEND`), and shown at twice
 * that, so a relic is as large as a deck chip's cat. `relicFill` in
 * `palettes.ts` says what colour a relic's `1` is.
 */

import type { Element } from "~/server/game/elements";

import { ICONS } from "./icons";

/** Relic art is square, at this edge length. */
export const RELIC_SIZE = 16;

/** The pendant every charm is: a blank face on a cord. */
const PENDANT: readonly string[] = [
  "..o..........o..",
  "...o........o...",
  "....oo....oo....",
  "......o..o......",
  "......oooo......",
  "....oowwwwoo....",
  "...owwwwwwwwo...",
  "...owwwwwwwwo...",
  "..owwwwwwwwwwo..",
  "..owwwwwwwwwwo..",
  "..owwwwwwwwwwo..",
  "..owwwwwwwwwwo..",
  "...owwwwwwwwo...",
  "...owwwwwwwwo...",
  "....oowwwwoo....",
  "......oooo......",
];

/** Where an element's 8x8 mark sits on the pendant's face. */
const MARK_ROW = 6;
const MARK_COL = 4;

/** A charm: the pendant, holding its element's own mark. */
function charm(element: Element): readonly string[] {
  const mark: readonly string[] = ICONS[element];
  return PENDANT.map((row, y) => {
    const line = mark[y - MARK_ROW];
    if (!line) return row;
    return [...row]
      .map((pixel, x) => {
        const inked = line[x - MARK_COL];
        return inked && inked !== "." ? inked : pixel;
      })
      .join("");
  });
}

export const RELIC_GRIDS: Record<string, readonly string[]> = {
  "ember-charm": charm("flame"),
  "tide-charm": charm("mist"),
  "spark-charm": charm("volt"),
  "briar-charm": charm("thorn"),
  "dusk-charm": charm("shade"),
  // A saucer of milk, and two curls of steam off it.
  "warm-saucer": [
    "................",
    ".....o.....o....",
    "....o.....o.....",
    "....o.....o.....",
    ".....o.....o....",
    ".....o.....o....",
    "....o.....o.....",
    "................",
    "...oooooooooo...",
    ".oowwwwwwwwwwoo.",
    "o11owwwwwwwwo11o",
    "o111oooooooo111o",
    ".o111111111111o.",
    "..oo11111111oo..",
    "....oooooooo....",
    "................",
  ],
  // Wound across itself, with a long end come loose.
  "ball-of-twine": [
    "................",
    "...ooooo........",
    ".oo1o11ooo......",
    ".oo11oo11o......",
    "o11o1o11o1o.....",
    "oo11o11o11o.....",
    "o1oo11o11oo.....",
    "o1o11o11o1o.....",
    "oo11o11o11o.....",
    ".o1o11o11o......",
    ".oo11o11ooo.....",
    "...ooooo..o.....",
    "..........o....o",
    "...........o...o",
    "............ooo.",
    "................",
  ],
  // A whisker pad and its three whiskers, the lowest with a kink in it.
  "bent-whisker": [
    "................",
    ".............ooo",
    "..oooo....ooo...",
    ".o1111o.oo......",
    "o11111ooo.......",
    "o1111o1o........",
    "o111111o........",
    "o111oooooooooooo",
    "o111111o........",
    "o1111o1o........",
    "o11111ooo.......",
    ".o1111o..oo.....",
    "..oooo.....o..oo",
    "...........o.o..",
    "............o...",
    "................",
  ],
  // Folded in three, with a dotted way to an X.
  "night-map": [
    "................",
    ".....oooooo.....",
    "ooooow1111wooooo",
    "o1111w1111w1111o",
    "o1111w1111wo1o1o",
    "o1111w1111w1o11o",
    "o1111w11o1wo1o1o",
    "o1111w1111w1111o",
    "o1111wo111w1111o",
    "o11o1w1111w1111o",
    "o1111w1111w1111o",
    "o1o11w1111w1111o",
    "o1111oooooo1111o",
    "ooooo......ooooo",
    "................",
    "................",
  ],
  // A plump cushion, buttoned in the middle.
  "soft-landing": [
    "................",
    "................",
    ".oo..........oo.",
    "o11oooooooooo11o",
    "o11111111111111o",
    ".o111111111111o.",
    ".o1111o11o1111o.",
    ".o11111oo11111o.",
    ".o11111oo11111o.",
    ".o1111o11o1111o.",
    ".o111111111111o.",
    "o11111111111111o",
    "o11oooooooooo11o",
    ".oo..........oo.",
    "................",
    "................",
  ],
  // The sun half over the horizon.
  "early-riser": [
    "................",
    ".......oo.......",
    ".......oo.......",
    "...o...oo...o...",
    "....o......o....",
    "................",
    "o.....oooo.....o",
    ".o..oo1111oo..o.",
    "...o11111111o...",
    "..o1111111111o..",
    "..o1111111111o..",
    "oooooooooooooooo",
    "................",
    "...ooooo..ooo...",
    "................",
    "................",
  ],
  // A collar, and the tag that hangs from it.
  "lucky-collar": [
    "................",
    "....oooooooo....",
    "..oo11111111oo..",
    ".o111oooooo111o.",
    "o11oo......oo11o",
    "o1o..........o1o",
    "o1o..........o1o",
    "o11oo......oo11o",
    ".o111oooooo111o.",
    "..oo11111111oo..",
    "....oooooooo....",
    "......o11o......",
    ".....o1111o.....",
    ".....o1oo1o.....",
    ".....o1111o.....",
    "......oooo......",
  ],
  // A bell mid-ring: the clapper out, a tick of sound either side.
  "loud-bell": [
    ".......oo.......",
    "......o11o......",
    ".o....oooo....o.",
    "..o..o1111o..o..",
    "....o111111o....",
    "oo..o1w1111o..oo",
    "....o1w1111o....",
    "....o111111o....",
    "...o11111111o...",
    "...o11111111o...",
    "..o1111111111o..",
    "..oooooooooooo..",
    "......o11o......",
    "......o11o......",
    ".......oo.......",
    "................",
  ],
  // Woven, and too full: yarn over the rim.
  "hoarders-basket": [
    "......oooo......",
    ".....o1o11o.....",
    "..oooo11o1oooo..",
    ".o11oo1o11oo11o.",
    ".o1o1oo111o1o1o.",
    ".oo11o1111o11oo.",
    "oooooooooooooooo",
    "o11111111111111o",
    "oooooooooooooooo",
    ".o11o111o111o1o.",
    ".oooooooooooooo.",
    "..o111o111o11o..",
    "..oooooooooooo..",
    "...o1o111o11o...",
    "...oooooooooo...",
    "................",
  ],
  // Two walls meeting, and a bed where they do.
  "quiet-corner": [
    "................",
    "......oooo......",
    "....oo1oo1oo....",
    "..oo111oo111oo..",
    "oo11111oo11111oo",
    "o111111oo111111o",
    "o11111owwo11111o",
    "o111oowwwwoo111o",
    "o1oowwoooowwoo1o",
    "oowwwo1111owwwoo",
    "oowwwo1111owwwoo",
    "..oowwoooowwoo..",
    "....oowwwwoo....",
    "......oooo......",
    "................",
    "................",
  ],
};

/** The grid for one relic. Throws on an id nothing is drawn for. */
export function relicGrid(relicId: string): readonly string[] {
  const grid = RELIC_GRIDS[relicId];
  if (!grid) throw new Error(`No art for relic: ${relicId}`);
  return grid;
}
