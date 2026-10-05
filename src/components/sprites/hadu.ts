/**
 * The hadu: the player's own Hadu, dressed in the cosmetics they wear. He is
 * drawn on the cats' 16x16 grid from his own sprite and one drawing for each
 * of the four slots worn on him (hat, eyes, body, tail). The fifth slot, the
 * aura, is a layer of its own drawn behind him on a larger grid, and never
 * shares a cell with the cat.
 *
 * Every drawing is keyed by its id in `game/cosmetics.ts`. The free piece of
 * every slot draws nothing, so the default look is `catSprite("hadu")` as it
 * stands.
 */

import { getCat } from "~/server/game/cats";
import { DEFAULT_LOOK, type Look } from "~/server/game/cosmetics";

import {
  SPRITE_SIZE,
  catSprite,
  type SpritePatch,
  type SpriteSpan,
} from "./cats";
import { OUTLINE_COLOR, WHITE_COLOR, spriteColors } from "./palettes";

/** The slots worn on the cat itself, in the order they are laid on him. */
export const HADU_WORN_SLOTS = ["hat", "eyes", "body", "tail"] as const;
export type HaduWornSlot = (typeof HADU_WORN_SLOTS)[number];

/**
 * How a piece carries colours Hadu's fur does not have. A drawing writes its
 * own colours as `a`, `b`, `c` and `d`, the first four of its `ink`, beside
 * the cats' legend (`o` outline, `1` `2` `3` fur, `e` eye, `w` white, `.`
 * clear). `_` leaves the cell as it was.
 */
export const PIECE_INK = "abcd";
export const PIECE_SKIP = "_";

/**
 * The characters each slot's own colours become on the composed grid. No two
 * slots share one, so a red collar and a green hat keep their colours side by
 * side in one legend and the grid still draws through `buildRuns`.
 */
export const HADU_SLOT_INK: Record<HaduWornSlot, string> = {
  hat: "ABCD",
  eyes: "EFGH",
  body: "IJKL",
  tail: "MNOP",
};

/**
 * The cells each slot may draw in. No two share a cell, so any hat goes with
 * any eyes, body and tail. The brow, the cheeks and the muzzle belong to
 * nobody: the face under the hat is always Hadu's own.
 */
export const HADU_SLOT_CELLS: Record<HaduWornSlot, readonly SpriteSpan[]> = {
  // The ears, the crown between them and the forehead's first row.
  hat: [
    [0, 0, 16],
    [1, 0, 16],
    [2, 0, 16],
    [3, 0, 16],
    [4, 0, 16],
  ],
  // Both eyes, with a cell either side and the row above for a shape.
  eyes: [
    [5, 2, 6],
    [5, 10, 14],
    [6, 2, 6],
    [6, 10, 14],
    [7, 2, 6],
    [7, 10, 14],
  ],
  // The neck, the chest, the paws and the ground to the left of them.
  body: [
    [10, 0, 14],
    [11, 0, 12],
    [12, 0, 12],
    [13, 0, 12],
    [14, 0, 12],
    [15, 0, 12],
  ],
  // The tail on the right, and the air above and below it.
  tail: [
    [9, 15, 16],
    [10, 14, 16],
    [11, 12, 16],
    [12, 12, 16],
    [13, 12, 16],
    [14, 12, 16],
    [15, 12, 16],
  ],
};

/** One piece worn on the cat. */
export interface HaduPiece {
  /** Its own colours: `a` is the first, `b` the second, and so on. */
  readonly ink: readonly string[];
  /** Laid over Hadu's grid in order. */
  readonly art: readonly SpritePatch[];
}

/** The piece that draws nothing: the free one of every slot. */
const BARE: HaduPiece = { ink: [], art: [] };

/** `lines` as patches, the first on `row`, each starting at `column`. */
function block(
  row: number,
  column: number,
  lines: readonly string[],
): SpritePatch[] {
  return lines.map((pixels, i): SpritePatch => [row + i, column, pixels]);
}

/** Both eyes in one colour, keeping the white glint. */
function eyes(...ink: string[]): HaduPiece {
  const right = ink.length > 1 ? "b" : "a";
  return {
    ink,
    art: [
      [6, 3, "wa"],
      [7, 3, "aa"],
      [6, 11, `w${right}`],
      [7, 11, `${right}${right}`],
    ],
  };
}

const RED = "#e0483b";
const RED_DEEP = "#a82f28";
const PINK = "#ff7fb0";
const PINK_DEEP = "#d1477c";
const GOLD = "#ffd23f";
const GOLD_DEEP = "#e8991c";
const CREAM = "#ffe9c7";
const PURPLE = "#7a4fd0";
const PURPLE_DEEP = "#55349c";
const BLUE = "#3b82d6";

/**
 * Every piece worn on the cat, by cosmetic id. A hat sits between the ears
 * and may come down to the forehead; the ears stay out at either side of it,
 * since they are what makes him a cat at 16 pixels.
 */
export const HADU_PIECES: Readonly<Record<string, HaduPiece>> = {
  "hat-none": BARE,
  // A red knitted cap with a cream rib and a bobble.
  "hat-wool-cap": {
    ink: [RED, CREAM],
    art: block(0, 0, [
      "_____oobboo_____",
      "____oaaaaaao____",
      "____aaaaaaaa____",
      "____aaaaaaaa____",
      "__bbbbbbbbbbbb__",
    ]),
  },
  // A pink bow tied on top of the head.
  "hat-ribbon-bow": {
    ink: [PINK, PINK_DEEP],
    art: block(0, 3, ["_oo____oo_", "oaao__oaao", "oaaabbaaao", "_aaooooaa_"]),
  },
  // One green leaf on its stem, lying across the crown.
  "hat-leaf-sprig": {
    ink: ["#6fc25a", "#3d8a3f"],
    art: [...block(0, 5, ["__oooo_", "_oaabao", "oabaaao"]), [3, 6, "bb"]],
  },
  // A red band round the forehead with one tall feather in it.
  "hat-feather-plume": {
    ink: ["#3fb6a8", "#c8f4ea", RED],
    art: [
      ...block(0, 6, ["_oaao_", "oaabao", "_oabao", "__obao"]),
      [4, 1, "cccccccccccccc"],
    ],
  },
  // A grey topper with a red band.
  "hat-top-hat": {
    ink: ["#77728f", "#a9a4bf", RED],
    art: [
      ...block(0, 5, ["oooooo", "oabaao", "oabaao", "occcco"]),
      [4, 2, "oaaaaaaaaaao"],
    ],
  },
  // Two red horns, curling out.
  "hat-little-horns": {
    ink: ["#d9342b", "#ff9a7a"],
    art: block(0, 3, ["_oo____oo_", "oabo__obao", "_oaa__aao_", "__aa__aa__"]),
  },
  // A purple cone on a wide brim, with a gold band and one star.
  "hat-wizard-hat": {
    ink: [PURPLE, PURPLE_DEEP, GOLD, "#fff0a8"],
    art: [
      ...block(0, 3, ["____oaao__", "___oaaabo_", "__oaadaabo", "occccccccc"]),
      [4, 1, "oaaaaaaaaaaaao"],
    ],
  },
  // Three points of yellow tissue paper, out of a cracker.
  "hat-paper-crown": {
    ink: [GOLD, GOLD_DEEP],
    art: block(0, 3, ["_o__oo__o_", "oaooaaooao", "_aaaaaaaa_", "_bbbbbbbb_"]),
  },

  "eyes-gold": BARE,
  "eyes-green": eyes("#7ddc6a"),
  "eyes-blue": eyes("#6fc3ff"),
  "eyes-amber": eyes("#ff9f2e"),
  "eyes-rose": eyes("#ff86b0"),
  // Half shut: the lids are his own fur.
  "eyes-sleepy": {
    ink: [],
    art: [
      [6, 3, "11"],
      [6, 11, "11"],
    ],
  },
  // One blue, one amber.
  "eyes-odd": eyes("#6fc3ff", "#ff9f2e"),
  // One eye open, the other shut in an arch.
  "eyes-wink": {
    ink: [],
    art: [
      [6, 10, "1ee1"],
      [7, 10, "e11e"],
    ],
  },
  // Each eye a four-pointed star with a white heart.
  "eyes-star": {
    ink: [GOLD],
    art: [
      [5, 3, "a"],
      [6, 2, "awa"],
      [7, 3, "a1"],
      [5, 12, "a"],
      [6, 11, "awa"],
      [7, 11, "1a"],
    ],
  },

  "body-bell": BARE,
  // A red band round the neck, with his own bell hanging from it.
  "body-red-collar": {
    ink: [RED],
    art: [[10, 5, "aaaaaa"]],
  },
  // A mustard scarf wound once, one striped end hanging.
  "body-wool-scarf": {
    ink: ["#f2b43c", "#c26a2a"],
    art: [
      [10, 3, "abaabaabaa"],
      [11, 5, "aa2222"],
      [12, 5, "bb"],
      [13, 5, "aa"],
    ],
  },
  // A blue neckerchief with white spots, knotted behind.
  "body-bandana": {
    ink: [BLUE],
    art: [
      [10, 4, "aaaaaaaa"],
      [11, 5, "awaawa"],
      [12, 6, "aaaa"],
      [13, 7, "aa"],
    ],
  },
  // A red bow tie on the white of his chest.
  "body-bow-tie": {
    ink: [RED, RED_DEEP],
    art: [
      [11, 5, "aa22aa"],
      [12, 5, "aabbaa"],
      [13, 5, "aa22aa"],
    ],
  },
  // Navy and cream hoops, with a ribbed neck.
  "body-striped-jumper": {
    ink: ["#2f4f9e", "#fff3d6"],
    art: [
      [10, 6, "aaaa"],
      [11, 5, "bbbbbb"],
      [12, 5, "aaaaaa"],
      [13, 5, "bbbbbb"],
    ],
  },
  // A green waistcoat over his shirt front, with two gold buttons.
  "body-waistcoat": {
    ink: ["#2f7d5b", GOLD],
    art: [
      [11, 5, "aa22aa"],
      [12, 5, "aaabaa"],
      [13, 5, "aaabaa"],
    ],
  },
  // A yellow slicker with its fold down the front, and blue boots.
  "body-raincoat": {
    ink: [GOLD, GOLD_DEEP, BLUE],
    art: [
      [10, 4, "aaaaaaaa"],
      [11, 5, "aaabaa"],
      [12, 5, "aaabaa"],
      [13, 5, "aaabaa"],
      [14, 5, "cc"],
      [14, 9, "cc"],
    ],
  },
  // A purple cape on a gold clasp, blown out to his right.
  "body-cape": {
    ink: [PURPLE, PURPLE_DEEP, GOLD],
    art: [
      [10, 3, "aaaaccaaaa"],
      [11, 2, "oa"],
      [11, 7, "22"],
      [12, 1, "oab"],
      [13, 0, "oaab"],
      [14, 0, "oaaa"],
      [15, 0, "oooo"],
    ],
  },

  "tail-plain": BARE,
  "tail-white-tip": {
    ink: [],
    art: [[12, 13, "22"]],
  },
  // A longer tail with two grey rings.
  "tail-ringed": {
    ink: ["#a59fb8"],
    art: [
      [10, 14, "o"],
      [11, 12, "oaao"],
      [13, 13, "aa"],
    ],
  },
  // A stub with a white pom on the end.
  "tail-bobtail": {
    ink: [],
    art: block(11, 12, ["....", "oo..", "12o.", "oo.."]),
  },
  // Twice as thick, all the way up.
  "tail-bushy": {
    ink: [],
    art: [
      [10, 14, "oo"],
      ...block(11, 12, ["o11o", "o111", "1111", "111o", "ooo."]),
    ],
  },
  // A longer tail with a pink bow tied round it.
  "tail-ribbon": {
    ink: [PINK, PINK_DEEP],
    art: [
      [10, 14, "o"],
      [11, 12, "o11o"],
      [12, 12, "abba"],
    ],
  },
  // A yellow zigzag where the tail was.
  "tail-bolt": {
    ink: [GOLD],
    art: [[10, 14, "ao"], ...block(11, 12, ["oaao", "oaoo", "aaao"])],
  },
  // His own tail, alight at the tip.
  "tail-flame": {
    ink: ["#ff8a2a", GOLD],
    art: [[10, 14, "ao"], ...block(11, 12, ["oaao", "obbo"])],
  },
  // A tail forked in two, one prong up and one down.
  "tail-twin": {
    ink: [],
    art: block(13, 12, ["11o.", "o11o", ".oo."]),
  },
};

/** The aura's grid: the cat's, and four cells of air on every side. */
export const AURA_SIZE = 24;
/** How far in from the aura's corner the cat's grid starts. */
export const AURA_INSET = (AURA_SIZE - SPRITE_SIZE) / 2;

/** An aura: marks in the air round the cat, drawn behind him. */
export interface HaduAura {
  /** Its own colours: `a` is the first, `b` the second, and so on. */
  readonly ink: readonly string[];
  /** `AURA_SIZE` rows of `AURA_SIZE` cells: `.`, `o`, `w` and its ink. */
  readonly rows: readonly string[];
}

/**
 * The marks an aura is stamped from. `#` is the mark's fill and `+` its
 * second colour; `.` is clear. Each carries the sprites' outline, so it
 * reads on the cloth, on a mat and on the lid alike.
 */
const STAMPS = {
  spark: ["..o..", ".o#o.", "o#+#o", ".o#o.", "..o.."],
  glint: [".o.", "o#o", ".o."],
  heart: [".o.o.", "o#o#o", "o###o", ".o#o.", "..o.."],
  bubble: [".oo.", "o+#o", "o##o", ".oo."],
  bigBubble: [".ooo.", "o+##o", "o###o", "o###o", ".ooo."],
  leaf: ["..ooo", ".o##o", "o#+#o", "o##o.", "ooo.."],
  star: ["...o...", ".oo#oo.", "o#####o", ".o###o.", ".o#o#o.", "..o.o.."],
  flame: ["..o..", ".o#o.", "o#+#o", "o#+#o", ".ooo."],
  drop: [".o.", "o#o", "o#o", ".o."],
  cloud: [
    ".....ooooo........",
    "..ooo+++++oooooo..",
    ".o+++#####++++++o.",
    "o################o",
    ".oooooooooooooooo.",
  ],
  strike: [
    "....oo..",
    "...o##o.",
    "..o##o..",
    ".o####o.",
    "..o##o..",
    ".o##o...",
    ".o#o....",
    "..o.....",
  ],
  pip: [".oo.", "o+#o", "o##o", ".oo."],
} as const;

type Stamp = readonly [
  shape: keyof typeof STAMPS,
  row: number,
  column: number,
  fill: string,
  second?: string,
  mirrored?: boolean,
];

/** An aura's rows, from the marks stamped on its grid. */
function aura(ink: readonly string[], stamps: readonly Stamp[]): HaduAura {
  const grid = Array.from({ length: AURA_SIZE }, () =>
    Array.from({ length: AURA_SIZE }, () => "."),
  );
  for (const [shape, row, column, fill, second = "w", mirrored] of stamps) {
    STAMPS[shape].forEach((line, y) => {
      const cells = mirrored ? [...line].reverse() : [...line];
      cells.forEach((cell, x) => {
        const target = grid[row + y];
        if (cell === "." || !target || column + x >= AURA_SIZE) return;
        target[column + x] = cell === "#" ? fill : cell === "+" ? second : cell;
      });
    });
  }
  return { ink, rows: grid.map((cells) => cells.join("")) };
}

/** Every aura, by cosmetic id. `halo-none` draws nothing. */
export const HADU_AURAS: Readonly<Record<string, HaduAura | null>> = {
  "halo-none": null,
  "halo-sparkles": aura(
    ["#fff0a8"],
    [
      ["spark", 0, 2, "a"],
      ["spark", 2, 19, "a"],
      ["spark", 17, 0, "a"],
      ["spark", 19, 17, "a"],
      ["glint", 0, 11, "w"],
      ["glint", 10, 0, "w"],
      ["glint", 10, 21, "w"],
      ["glint", 21, 8, "w"],
    ],
  ),
  "halo-leaves": aura(
    ["#f08a24", GOLD, "#b5531a"],
    [
      ["leaf", 0, 1, "a", "c"],
      ["leaf", 0, 15, "b", "c", true],
      ["leaf", 8, 0, "b", "c", true],
      ["leaf", 16, 2, "a", "c"],
      ["leaf", 19, 17, "a", "c", true],
      ["glint", 11, 21, "b"],
    ],
  ),
  "halo-bubbles": aura(
    ["#9fdcf7"],
    [
      ["bigBubble", 0, 15, "a"],
      ["bubble", 1, 3, "a"],
      ["bigBubble", 16, 1, "a"],
      ["bubble", 9, 20, "a"],
      ["bubble", 20, 10, "a"],
      ["glint", 8, 0, "a"],
      ["glint", 0, 10, "a"],
      ["glint", 19, 20, "a"],
    ],
  ),
  "halo-hearts": aura(
    ["#ff7fa8", "#ff4d6d"],
    [
      ["heart", 0, 3, "a"],
      ["heart", 0, 16, "b"],
      ["heart", 16, 1, "b"],
      ["heart", 19, 18, "a"],
      ["glint", 9, 0, "a"],
      ["glint", 11, 21, "b"],
    ],
  ),
  "halo-stars": aura(
    [GOLD, "#fff0a8"],
    [
      ["star", 0, 0, "a"],
      ["star", 0, 16, "a"],
      ["star", 17, 0, "a"],
      ["spark", 19, 18, "b"],
      ["glint", 10, 21, "b"],
      ["glint", 10, 0, "b"],
      ["glint", 0, 10, "b"],
    ],
  ),
  "halo-embers": aura(
    ["#ff7a2a", GOLD],
    [
      ["flame", 18, 1, "a", "b"],
      ["flame", 19, 18, "a", "b"],
      ["flame", 12, 0, "a", "b"],
      ["glint", 6, 1, "b"],
      ["glint", 1, 4, "a"],
      ["glint", 12, 21, "a"],
      ["glint", 6, 20, "b"],
      ["glint", 0, 15, "a"],
      ["glint", 1, 10, "b"],
    ],
  ),
  "halo-storm": aura(
    ["#5d6680", "#8e96b0", GOLD, "#5fa8e8"],
    [
      ["cloud", 0, 3, "a", "b"],
      ["strike", 15, 0, "c"],
      ["drop", 8, 0, "d"],
      ["drop", 6, 21, "d"],
      ["drop", 12, 20, "d"],
      ["drop", 19, 20, "d"],
      ["drop", 20, 11, "d"],
    ],
  ),
  // Nine gold bells in an arch, one for each life.
  "halo-nine-lives": aura(
    [GOLD],
    [
      ["pip", 16, 0, "a"],
      ["pip", 10, 0, "a"],
      ["pip", 4, 0, "a"],
      ["pip", 0, 4, "a"],
      ["pip", 0, 10, "a"],
      ["pip", 0, 16, "a"],
      ["pip", 4, 20, "a"],
      ["pip", 10, 20, "a"],
      ["pip", 16, 20, "a"],
    ],
  ),
};

/** A grid, and the colour of each character on it. */
export interface SpriteLayer {
  readonly rows: readonly string[];
  readonly colors: Readonly<Record<string, string | null>>;
}

/** A hadu, ready to draw: the cat, and the aura behind him if he has one. */
export interface HaduDrawing {
  /** `SPRITE_SIZE` rows: Hadu, with what he wears laid on him. */
  readonly cat: SpriteLayer;
  /** `AURA_SIZE` rows, the cat's grid `AURA_INSET` cells in from its corner. */
  readonly aura: SpriteLayer | null;
}

/** The id worn in a slot of the cat: the look's, or the free one's. */
export function wornPiece(
  slot: HaduWornSlot | "halo",
  look: Partial<Look> = {},
): string {
  const id = look[slot];
  const drawn = slot === "halo" ? HADU_AURAS : HADU_PIECES;
  return id !== undefined &&
    id.startsWith(`${slot}-`) &&
    Object.hasOwn(drawn, id)
    ? id
    : DEFAULT_LOOK[slot];
}

/** Hadu's own colours, by legend character. */
function haduColors(): Record<string, string | null> {
  const hadu = getCat("hadu");
  return spriteColors(hadu.element, hadu.rarity, hadu.id);
}

/** `rows` with one piece of `slot` laid on it, in the slot's own characters. */
function wear(
  rows: readonly string[],
  slot: HaduWornSlot,
  piece: HaduPiece,
): readonly string[] {
  if (piece.art.length === 0) return rows;
  const grid = rows.map((row) => [...row]);
  for (const [row, column, pixels] of piece.art) {
    [...pixels].forEach((pixel, i) => {
      const line = grid[row];
      if (pixel === PIECE_SKIP || !line || column + i >= line.length) return;
      const own = PIECE_INK.indexOf(pixel);
      line[column + i] = own < 0 ? pixel : (HADU_SLOT_INK[slot][own] ?? pixel);
    });
  }
  return grid.map((cells) => cells.join(""));
}

/**
 * The drawing of a hadu wearing `look`. A slot the look leaves out, or fills
 * with an id that has no drawing in that slot, wears the free piece, so the
 * empty look is Hadu exactly as his sprite draws him.
 */
export function haduDrawing(look: Partial<Look> = {}): HaduDrawing {
  const colors = haduColors();
  let rows = catSprite("hadu");

  for (const slot of HADU_WORN_SLOTS) {
    const piece = HADU_PIECES[wornPiece(slot, look)] ?? BARE;
    rows = wear(rows, slot, piece);
    piece.ink.forEach((color, i) => {
      const character = HADU_SLOT_INK[slot][i];
      if (character) colors[character] = color;
    });
  }

  const worn = HADU_AURAS[wornPiece("halo", look)];
  return {
    cat: { rows, colors },
    aura: worn ? { rows: worn.rows, colors: auraColors(worn) } : null,
  };
}

/** An aura's colours, by legend character. */
function auraColors(worn: HaduAura): Record<string, string | null> {
  const colors: Record<string, string | null> = {
    ".": null,
    o: OUTLINE_COLOR,
    w: WHITE_COLOR,
  };
  worn.ink.forEach((color, i) => {
    const character = PIECE_INK[i];
    if (character) colors[character] = color;
  });
  return colors;
}
