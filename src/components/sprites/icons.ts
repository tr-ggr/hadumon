/**
 * Pixel icons for the tabletop, drawn in the same grid language as the cats:
 * one character per pixel, resolved to colours by `PixelIcon`.
 */

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
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
