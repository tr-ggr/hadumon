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
} as const satisfies Record<string, readonly string[]>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
