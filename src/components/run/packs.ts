/**
 * A clan's starter deck as a booster pack: what is printed on each wrapper,
 * where a pack stands in the row of them, and how its cards stack.
 */

import type { IconName } from "~/components/sprites/icons";
import type { Element } from "~/server/game/elements";

/** What each character of a pack's print means. */
export const PRINT_LEGEND = {
  ".": "wrapper",
  "1": "print",
} as const;

/** A print is a square tile, this many pattern units to a side. */
export const PRINT_SIZE = 16;

export interface ClanPack {
  /** The common cat on the front of the wrapper. */
  mascot: string;
  /** The element's own shape, printed beside the clan's name. */
  motif: IconName;
  /** The wrapper's pattern: one tile, repeated. No two clans share one. */
  print: readonly string[];
}

export const CLAN_PACKS: Record<Element, ClanPack> = {
  /** Rising stripes. */
  flame: {
    mascot: "flameclaw",
    motif: "flame",
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
    motif: "mist",
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
    motif: "volt",
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
    motif: "thorn",
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
    motif: "shade",
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

/** The common cat that fronts each clan's starter deck. */
export const CLAN_MASCOTS: Record<Element, string> = {
  flame: CLAN_PACKS.flame.mascot,
  mist: CLAN_PACKS.mist.mascot,
  volt: CLAN_PACKS.volt.mascot,
  thorn: CLAN_PACKS.thorn.mascot,
  shade: CLAN_PACKS.shade.mascot,
};

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

/** A pack's name as it is read out, with what state it is in. */
export function packTitle(
  name: string,
  state: { chosen?: boolean; locked?: boolean } = {},
): string {
  if (state.locked) return `${name}, locked`;
  return state.chosen ? `${name}, chosen` : name;
}

/** The table's ink, which a locked wrapper's colours are darkened with. */
const INK_RGB = [0x17, 0x21, 0x2b] as const;
/** How far a locked wrapper's colour goes toward its own grey, and toward ink. */
const DULL_GREY = 0.6;
const DULL_INK = 0.2;

/**
 * A wrapper colour as it is printed on a locked pack: most of the way to
 * the grey of its own lightness, then a little toward ink. Still the
 * clan's colour, with the life taken out of it; `hex` is `#rrggbb`.
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

/** The word printed on the wrapper's plate: "Cinder" of "Cinder Clan". */
export function packWord(name: string): string {
  return name.split(" ")[0] ?? name;
}

/**
 * How thick a stack of `copies` of one card stands, in pixels: a card's own
 * 3px, and 1px for every copy under it.
 */
export function stackEdge(copies: number): number {
  return Math.min(6, 2 + Math.max(1, copies));
}

/** A deck as `[catId, copies]`, most copies first. */
export function countCats(deck: readonly string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const catId of deck) counts.set(catId, (counts.get(catId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
