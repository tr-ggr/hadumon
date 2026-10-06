/**
 * Pixel icons for the tabletop, drawn in the same grid language as the cats:
 * one character per pixel, resolved to colours by `PixelIcon`.
 */

import type { Row } from "~/server/game/cats";

/** What each grid character means. */
export const ICON_LEGEND = {
  ".": "transparent",
  o: "outline",
  "1": "fill",
  w: "white",
} as const;

export type IconPixel = keyof typeof ICON_LEGEND;

/** Icons are square, at one of these edge lengths. */
export const ICON_SIZES = [8, 16] as const;

export const ICONS = {
  /** A ball of yarn: what cats hold, and what the Den lays. */
  yarn: [
    ".ooooo..",
    "o11o11o.",
    "o1o11oo.",
    "oo11o1o.",
    "o11o11o.",
    "o1o11oo.",
    ".ooooo.o",
    "......oo",
  ],
  /** A coin: what a run pays, and what a pack costs. */
  coin: [
    "..oooo..",
    ".o1111o.",
    "o11oo11o",
    "o1o1111o",
    "o1o1111o",
    "o11oo11o",
    ".o1111o.",
    "..oooo..",
  ],
  /** A sealed pack, crimped top and bottom: the shop. */
  pack: [
    "o.o.o.o.",
    "oooooooo",
    "o111111o",
    "o11oo11o",
    "o11oo11o",
    "o111111o",
    "oooooooo",
    ".o.o.o.o",
  ],
  /** A chest, shut: what waits at the foot of the tower. */
  chest: [
    "................",
    "................",
    "...oooooooooo...",
    "..o1111111111o..",
    ".o111111111111o.",
    ".o111111111111o.",
    ".oooooooooooooo.",
    ".o11111oo11111o.",
    ".o1111owwo1111o.",
    ".o1111owwo1111o.",
    ".o11111oo11111o.",
    ".o111111111111o.",
    ".o111111111111o.",
    ".oooooooooooooo.",
    "................",
    "................",
  ],
  /** The same chest with its lid thrown back. */
  chestOpen: [
    "..oooooooooooo..",
    ".o111111111111o.",
    ".o111111111111o.",
    ".oooooooooooooo.",
    "..o..........o..",
    ".oooooooooooooo.",
    ".owwwwwwwwwwwwo.",
    ".oooooooooooooo.",
    ".o11111oo11111o.",
    ".o1111owwo1111o.",
    ".o1111owwo1111o.",
    ".o11111oo11111o.",
    ".o111111111111o.",
    ".o111111111111o.",
    ".oooooooooooooo.",
    "................",
  ],
  /** A feeder die: what the Hunt takes. */
  die: [
    "oooooooo",
    "o111111o",
    "o1o11o1o",
    "o111111o",
    "o111111o",
    "o1o11o1o",
    "o111111o",
    "oooooooo",
  ],
  /** The Hunt lane. */
  paw: [
    ".o.oo.o.",
    ".o.oo.o.",
    "o......o",
    "o.oooo.o",
    "..oooo..",
    ".oooooo.",
    ".oooooo.",
    "..oooo..",
  ],
  /** The Den lane. */
  den: [
    "...oo...",
    "..o11o..",
    ".o1111o.",
    "o111111o",
    "o11oo11o",
    "o1o..o1o",
    "o1o..o1o",
    "oooooooo",
  ],
  /** A cat card: what the Prowl draws, and the Prowl lane. */
  card: [
    ".oooooo.",
    ".o1111o.",
    ".o1oo1o.",
    ".o1oo1o.",
    ".o1111o.",
    ".o1111o.",
    ".o1111o.",
    ".oooooo.",
  ],
  /** Essence cached on a cat. */
  cached: [
    "........",
    ".oooo...",
    ".o11o...",
    ".o11ooo.",
    ".ooo11o.",
    "...o11o.",
    "...oooo.",
    "........",
  ],
  /** A cat tucked under another. */
  tucked: [
    ".ooooo..",
    ".o111o..",
    ".o111ooo",
    ".o111o1o",
    ".ooooo1o",
    "..o1111o",
    "..oooooo",
    "........",
  ],
  /** A round goal. */
  goal: [
    ".oooooo.",
    ".o1111o.",
    ".o111o..",
    ".o1111o.",
    ".oooooo.",
    ".o......",
    ".o......",
    ".o......",
  ],
  /** The Flame element, as a mark beside its name. */
  flame: [
    "....o...",
    "...o1o..",
    ".o.o1o..",
    "o1o111o.",
    "o11111o.",
    "o111111o",
    ".o1111o.",
    "..oooo..",
  ],
  /** The Mist element: a drop. */
  mist: [
    "...oo...",
    "..o11o..",
    "..o11o..",
    ".o1111o.",
    "o1w1111o",
    "o1w1111o",
    ".o1111o.",
    "..oooo..",
  ],
  /** The Volt element: a bolt. */
  volt: [
    "....ooo.",
    "...o11o.",
    "..o11o..",
    ".o111oo.",
    ".oo111o.",
    "..o11o..",
    ".o11o...",
    ".ooo....",
  ],
  /** The Thorn element: a leaf. */
  thorn: [
    ".....ooo",
    "...oo11o",
    "..o1111o",
    ".o1111o.",
    ".o111o..",
    "o1ooo...",
    "oo......",
    "........",
  ],
  /** The Shade element: a crescent. */
  shade: [
    "..ooo...",
    ".o111o..",
    "o11oo...",
    "o11o....",
    "o11o....",
    "o11oo...",
    ".o111o..",
    "..ooo...",
  ],
  /** Beef, the food Flame cats eat: a steak with its bone. */
  beef: [
    "........",
    ".ooooo..",
    "o11111oo",
    "o1ww111o",
    "o1ww111o",
    "o111111o",
    ".oooooo.",
    "........",
  ],
  /** Fish, the food Mist cats eat. */
  fish: [
    "........",
    "..ooo.oo",
    ".o111o1o",
    "o1o1111o",
    "o111111o",
    ".o111o1o",
    "..ooo.oo",
    "........",
  ],
  /** Chicken, the food Volt cats eat: a drumstick. */
  chicken: [
    ".oooo...",
    "o1111o..",
    "o11111o.",
    "o11111o.",
    ".o1111o.",
    "..ooowo.",
    ".....owo",
    "......oo",
  ],
  /** Dry food, the food Thorn cats eat: a full bowl. */
  dryFood: [
    "..oooo..",
    ".o1111o.",
    "o111111o",
    "oooooooo",
    "owwwwwwo",
    ".owwwwo.",
    "..oooo..",
    "........",
  ],
  /** Pork, the food Shade cats eat: a rasher. */
  pork: [
    "..oo....",
    "oo11o..o",
    "o1ww1ooo",
    "ow11w11o",
    "o1oo1wwo",
    "oo..o11o",
    ".....oo.",
    "........",
  ],
  /** A treat, which pays for anything. */
  treat: [
    "...oo...",
    "..o11o..",
    ".oo11oo.",
    "o111111o",
    "o111111o",
    ".oo11oo.",
    "..o11o..",
    "...oo...",
  ],
  /** A cost that any food pays. */
  any: [
    ".oooooo.",
    "o11oo11o",
    "o1o11o1o",
    "o111o11o",
    "o11o111o",
    "o111111o",
    "o11o111o",
    ".oooooo.",
  ],
  /** Points left: the way powers fire along a lane. */
  chevron: [
    "....oo..",
    "...oo...",
    "..oo....",
    ".oo.....",
    "..oo....",
    "...oo...",
    "....oo..",
    "........",
  ],
  /** Points right: what is paid, and then what it buys. */
  arrow: [
    "........",
    "....o...",
    "....oo..",
    "ooooooo.",
    "ooooooo.",
    "....oo..",
    "....o...",
    "........",
  ],
  /** The way home from the table. */
  home: [
    "...oo.o.",
    "..o11oo.",
    ".o1111o.",
    "o111111o",
    "oo1111oo",
    ".o1oo1o.",
    ".o1oo1o.",
    ".oooooo.",
  ],
  /** The codex: every cat, relic and clan. */
  book: [
    ".oooooo.",
    "o1o1111o",
    "o1o1oo1o",
    "o1o1111o",
    "o1o1111o",
    "o1o1111o",
    "o1oooooo",
    ".oooooo.",
  ],
  /** Play: the way to the table. */
  play: [
    "oo......",
    "o1oo....",
    "o111oo..",
    "o11111oo",
    "o11111oo",
    "o111oo..",
    "o1oo....",
    "oo......",
  ],
  /** Logging out: a door, and the way through it. */
  exit: [
    "oooo....",
    "o11o.o..",
    "o11o..o.",
    "o11ooooo",
    "o11o..o.",
    "o11o.o..",
    "o11o....",
    "oooo....",
  ],
  /** Sound at full: a speaker and two waves. */
  sound: [
    "...o....",
    "..oo..o.",
    "oo1o...o",
    "o11o.o.o",
    "o11o.o.o",
    "oo1o...o",
    "..oo..o.",
    "...o....",
  ],
  /** Sound turned down: a speaker and one wave. */
  quiet: [
    "...o....",
    "..oo....",
    "oo1o....",
    "o11o.o..",
    "o11o.o..",
    "oo1o....",
    "..oo....",
    "...o....",
  ],
  /** Sound off: a speaker, crossed out. */
  mute: [
    "...o....",
    "..oo....",
    "oo1o.o.o",
    "o11o..o.",
    "o11o..o.",
    "oo1o.o.o",
    "..oo....",
    "...o....",
  ],
  /** Music on: two notes under one beam. */
  note: [
    "..ooooo.",
    "..o111o.",
    "..ooooo.",
    "..o...o.",
    "..o...o.",
    "ooo.ooo.",
    "o1o.o1o.",
    "ooo.ooo.",
  ],
  /** Music off: one note, crossed out. */
  noteOff: [
    "..ooo...",
    "..o1o...",
    "..ooo...",
    "..o..o.o",
    "..o...o.",
    "ooo..o.o",
    "o1o.....",
    "ooo.....",
  ],
  /** An achievement: a medal on its ribbon. */
  medal: [
    "o1o..o1o",
    "o1o..o1o",
    ".o1oo1o.",
    "..oooo..",
    ".o1111o.",
    "o11oo11o",
    ".o1111o.",
    "..oooo..",
  ],
  /** The other players: a cat's face, ears up. */
  players: [
    "o......o",
    "oo....oo",
    "o1oooo1o",
    "o111111o",
    "o1o11o1o",
    "o111111o",
    ".o1111o.",
    "..oooo..",
  ],
  /** Scissors, open: what takes the top off a pack. */
  scissors: [
    "oo....oo",
    "o1o..oo.",
    "oooooo..",
    "...oo...",
    "oooooo..",
    "o1o..oo.",
    "oo....oo",
    "........",
  ],
  /** The same scissors, shut on the cut. */
  scissorsShut: [
    "oo......",
    "o1o.....",
    "ooooooo.",
    "...ooooo",
    "ooooooo.",
    "o1o.....",
    "oo......",
    "........",
  ],
  /**
   * A row of fire in three frames. Each is one tile of the row and meets
   * itself at its sides; its foot is solid, to stand behind an edge. The
   * white is the fire's core.
   */
  fire1: [
    "...o....",
    "..o1o...",
    "..o1o...",
    ".o111o.o",
    "oo1w1oo1",
    "11ww1111",
    "1www11w1",
    "11111111",
  ],
  fire2: [
    "........",
    "....o..o",
    "o..o1oo1",
    "o.o11oo1",
    "1o111o11",
    "111w11w1",
    "1ww1www1",
    "11111111",
  ],
  fire3: [
    "........",
    "..o.....",
    ".o1o....",
    ".o11o...",
    "o111o.o.",
    "o1w11o1o",
    "11ww1w11",
    "11111111",
  ],
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** The mark a lane goes by: on its own tile, and on every cat that lives there. */
export const ROW_ICONS: Record<Row, IconName> = {
  hunt: "paw",
  den: "den",
  prowl: "card",
};
