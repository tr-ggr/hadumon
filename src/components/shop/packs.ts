/**
 * A pack on the shop's shelf as a sealed booster: what is printed on each
 * wrapper, where a pack stands in the row of them, and how many things come
 * out of one.
 */

import type { IconName } from "~/components/sprites/icons";
import { CAT_PALETTES, ELEMENT_PALETTES } from "~/components/sprites/palettes";
import type { Element } from "~/server/game/elements";
import {
  CAT_PACKS,
  COSMETIC_PACKS,
  PACK_CARDS,
  PACK_PIECES,
  type Pack,
} from "~/server/game/packs";

/** What each character of a wrapper's print means. */
export const PRINT_LEGEND = {
  ".": "wrapper",
  "1": "print",
} as const;

/** A print is a square tile, this many pattern units to a side. */
export const PRINT_SIZE = 16;

/** What stands on the front of a wrapper, as a sticker. */
export type PackFront =
  /** A cat, by its sprite. */
  | { kind: "cat"; catId: string }
  /** A drawing on the cats' 16x16 grid, in the icons' legend, with one fill. */
  | { kind: "emblem"; rows: readonly string[]; fill: string };

export interface PackArt {
  /** The wrapper's colour, and the lighter one its print and bands are in. */
  ground: string;
  light: string;
  /** The wrapper's pattern: one tile, repeated. No two packs share one. */
  print: readonly string[];
  front: PackFront;
  /** The word on the wrapper's plate: "Cinder" of "Cinder Pack". */
  word: string;
  /** The small mark beside the word, and where the row says which pack is shown. */
  mark: IconName;
  /** What that mark is filled with. */
  markFill: string;
}

/** A cat pack's wrapper is its element's own: its print and a common cat of it. */
const ELEMENT_ART: Record<Element, { mascot: string; print: string[] }> = {
  /** Rising stripes. */
  flame: {
    mascot: "flameclaw",
    print: [
      "11......11......",
      "1......11......1",
      "......11......11",
      ".....11......11.",
      "....11......11..",
      "...11......11...",
      "..11......11....",
      ".11......11.....",
      "11......11......",
      "1......11......1",
      "......11......11",
      ".....11......11.",
      "....11......11..",
      "...11......11...",
      "..11......11....",
      ".11......11.....",
    ],
  },
  /** Waves, one line and then the next the other way up. */
  mist: {
    mascot: "mistpaw",
    print: [
      "..11......11....",
      ".1..1....1..1...",
      "1....1..1....1..",
      "......11......11",
      "................",
      "................",
      "................",
      "................",
      "......11......11",
      "1....1..1....1..",
      ".1..1....1..1...",
      "..11......11....",
      "................",
      "................",
      "................",
      "................",
    ],
  },
  /** Bolts. */
  volt: {
    mascot: "voltwhisk",
    print: [
      "................",
      "....11..........",
      "...11...........",
      "..1111..........",
      "...11...........",
      "..11............",
      ".11.............",
      "................",
      "................",
      "............11..",
      "...........11...",
      "..........1111..",
      "...........11...",
      "..........11....",
      ".........11.....",
      "................",
    ],
  },
  /** Scattered leaves. */
  thorn: {
    mascot: "thornkit",
    print: [
      "................",
      "...11...........",
      "..111...........",
      ".111............",
      ".1........11....",
      "..........111...",
      "...........111..",
      ".............1..",
      "................",
      "................",
      ".......11.......",
      "......111.......",
      ".....111........",
      ".....1..........",
      "................",
      "................",
    ],
  },
  /** Crescents and dots. */
  shade: {
    mascot: "shadewhisker",
    print: [
      "................",
      "...11...........",
      "..11........1...",
      "..1.............",
      "..11............",
      "...11...........",
      "................",
      ".......1........",
      "................",
      "...........11...",
      "....1.....11....",
      "..........1.....",
      "..........11....",
      "...........11...",
      "................",
      "...............1",
    ],
  },
};

/** Hadu's own pink and white: the wardrobe is his. */
const HADU = CAT_PALETTES.hadu ?? {
  "1": "#2f2838",
  "2": "#ffffff",
  "3": "#f4a6b7",
};
/** The tower's stone and its lit side, which are the tower's alone. */
const STONE = "#9aa9b7";
const STONE_LIGHT = "#d0dae2";

/** A tower with its battlements and a window, on the cats' grid. */
const TOWER_EMBLEM = [
  "................",
  ".oooo.oooo.oooo.",
  ".o11o.o11o.o11o.",
  ".o11ooo11ooo11o.",
  ".o111111111111o.",
  ".oooooooooooooo.",
  "..o1111111111o..",
  "..o1111oo1111o..",
  "..o111oooo111o..",
  "..o111oooo111o..",
  "..o111oooo111o..",
  "..o1111111111o..",
  "..o1111111111o..",
  "..o1111111111o..",
  "..oooooooooooo..",
  "................",
] as const;

/** Bows, for a wrapper of things to wear. */
const BOWS = [
  "................",
  "..1...1.........",
  "..11.11.........",
  "..11111.........",
  "..11.11.........",
  "..1...1.........",
  "................",
  "................",
  "................",
  "..........1...1.",
  "..........11.11.",
  "..........11111.",
  "..........11.11.",
  "..........1...1.",
  "................",
  "................",
] as const;

/** Courses of stone, each laid half a block along from the one under it. */
const MASONRY = [
  "1111111111111111",
  ".......1.......1",
  ".......1.......1",
  ".......1.......1",
  "1111111111111111",
  "...1.......1....",
  "...1.......1....",
  "...1.......1....",
  "1111111111111111",
  ".......1.......1",
  ".......1.......1",
  ".......1.......1",
  "1111111111111111",
  "...1.......1....",
  "...1.......1....",
  "...1.......1....",
] as const;

const COSMETIC_ART: Record<string, Omit<PackArt, "word">> = {
  "wardrobe-pack": {
    ground: HADU["3"],
    light: HADU["2"],
    print: BOWS,
    front: { kind: "cat", catId: "hadu" },
    mark: "paw",
    markFill: HADU["3"],
  },
  "table-pack": {
    ground: STONE,
    light: STONE_LIGHT,
    print: MASONRY,
    front: { kind: "emblem", rows: TOWER_EMBLEM, fill: STONE_LIGHT },
    mark: "home",
    markFill: STONE_LIGHT,
  },
};

/** The word printed on the wrapper's plate: "Cinder" of "Cinder Pack". */
export function packWord(name: string): string {
  return name.split(" ")[0] ?? name;
}

/** Every pack's wrapper, by pack id. */
export const PACK_ART: Readonly<Record<string, PackArt>> = Object.fromEntries([
  ...CAT_PACKS.map((pack): [string, PackArt] => {
    const tones = ELEMENT_PALETTES[pack.element];
    const art = ELEMENT_ART[pack.element];
    return [
      pack.id,
      {
        ground: tones["1"],
        light: tones["2"],
        print: art.print,
        front: { kind: "cat", catId: art.mascot },
        word: packWord(pack.name),
        mark: pack.element,
        markFill: tones["1"],
      },
    ];
  }),
  ...COSMETIC_PACKS.map((pack): [string, PackArt] => {
    const art = COSMETIC_ART[pack.id];
    if (!art) throw new Error(`No wrapper is drawn for ${pack.id}`);
    return [pack.id, { ...art, word: packWord(pack.name) }];
  }),
]);

export function packArt(packId: string): PackArt {
  const art = PACK_ART[packId];
  if (!art || !Object.hasOwn(PACK_ART, packId)) {
    throw new Error(`No wrapper is drawn for ${packId}`);
  }
  return art;
}

/**
 * How many things come out of a pack: five cats, or two pieces while the
 * account still lacks that many. `left` is what a cosmetic pack has left to
 * find, and `null` for a cat pack.
 */
export function packHolds(pack: Pack, left: number | null): number {
  if (pack.kind === "cats") return PACK_CARDS;
  return Math.max(0, Math.min(PACK_PIECES, left ?? PACK_PIECES));
}

/** The pack `by` places along a row of `count` from `index`, round the end. */
export function turned(index: number, by: number, count: number): number {
  if (count <= 0) return 0;
  return (((index + by) % count) + count) % count;
}

/**
 * Where the pack at `index` stands while the one at `shown` is in the
 * middle: 0 for the middle, negative to its left. The row is a ring, so a
 * pack is on whichever side it is nearer by.
 */
export function slotOf(index: number, shown: number, count: number): number {
  const ahead = turned(index, -shown, count);
  return ahead > count / 2 ? ahead - count : ahead;
}

/** The table's ink, which a spent wrapper's colours are darkened with. */
const INK_RGB = [0x17, 0x21, 0x2b] as const;
/** How far a spent wrapper's colour goes toward its own grey, and toward ink. */
const DULL_GREY = 0.6;
const DULL_INK = 0.2;

/**
 * A wrapper colour as it is printed on a pack with nothing left in it: most
 * of the way to the grey of its own lightness, then a little toward ink.
 * Still the pack's colour, with the life taken out of it; `hex` is `#rrggbb`.
 */
export function dulled(hex: string): string {
  const rgb = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  const [r = 0, g = 0, b = 0] = rgb;
  const grey = 0.299 * r + 0.587 * g + 0.114 * b;
  return `#${rgb
    .map((tone, index) => {
      const flat = tone + (grey - tone) * DULL_GREY;
      const dark = flat + ((INK_RGB[index] ?? 0) - flat) * DULL_INK;
      return Math.round(dark).toString(16).padStart(2, "0");
    })
    .join("")}`;
}
