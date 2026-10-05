/**
 * What every table and tower cosmetic is painted in, keyed by its id in
 * `game/cosmetics.ts`. A skin changes the colours of the board, the cloth,
 * the tower and its sky, and the weave of the cloth; never how anything is
 * built. Flat fills only.
 *
 * Text is printed straight onto the board and the cloth in ink, so every
 * board and cloth here is light enough to carry it.
 */

import { tileImage } from "~/components/tower/tile";
import {
  DEFAULT_LOOK,
  isCosmeticId,
  getCosmetic,
  type Look,
  type TableSlot,
} from "~/server/game/cosmetics";

/** The board the lanes are printed on. */
export interface MatSkin {
  fill: string;
  /** Its paler fields. */
  soft: string;
  /** Its deeper tone: what a piece casts on it, and its ruled lines. */
  line: string;
}

/** The cloth under everything. */
export interface ClothSkin {
  fill: string;
  /** The colour its weave is drawn in. */
  weave: string;
  /** A second thread through it. */
  thread: string;
  /** Mixed into the fill for what a piece casts on the cloth. */
  shade: string;
  /** One repeat of the weave: `1` is the weave, `2` the thread. */
  tile: readonly string[];
}

/** The tower's stone, lit face first. */
export interface TowerSkin {
  light: string;
  stone: string;
  rib: string;
  /** Inside it: the dark a room's wall falls away into. */
  deep: string;
}

/** The sky behind the tower, and the sea under it. */
export interface SkySkin {
  /** From just above the sea to the top of the sky. */
  sky: readonly [palest: string, low: string, high: string, top: string];
  cloud: readonly [lit: string, pale: string, grey: string];
  sea: readonly [sea: string, deep: string, glint: string, bright: string];
}

const MATS: Record<string, MatSkin> = {
  "mat-sky": { fill: "#a9ddf5", soft: "#e7f7fd", line: "#73bde4" },
  "mat-clay": { fill: "#e9b594", soft: "#f6dccb", line: "#c98a63" },
  "mat-moss": { fill: "#b3d69b", soft: "#dcefcd", line: "#86b46b" },
  "mat-slate": { fill: "#b7c3cf", soft: "#dde4eb", line: "#8696a7" },
  "mat-rose": { fill: "#f5bcc8", soft: "#fbe0e5", line: "#e08c9f" },
  "mat-lilac": { fill: "#c9c1f2", soft: "#e6e1fa", line: "#9d91dc" },
  "mat-gilt": { fill: "#f2d478", soft: "#fbecb8", line: "#cba844" },
};

/** The plain weave: two short stitches, staggered. */
const PLAIN = [
  "1111............",
  "1111............",
  "................",
  "................",
  "........1111....",
  "........1111....",
  "................",
  "................",
];
/** Two bands crossing, darker where they cross. */
const CHECK = [
  "....1111",
  "....1111",
  "....1111",
  "....1111",
  "11112222",
  "11112222",
  "11112222",
  "11112222",
];
/** A twill: one diagonal, with a pale thread now and then. */
const TWILL = [
  "1...1...",
  ".1...1..",
  "..1...2.",
  "...1...1",
  "1...1...",
  ".2...1..",
  "..1...1.",
  "...1...1",
];
/** Broad bands and a fine line through each way. */
const PLAID = Array.from({ length: 16 }, (_, y) =>
  Array.from({ length: 16 }, (_, x) => {
    const band = (n: number) => n < 5;
    const line = (n: number) => n === 10;
    if (line(x) || line(y)) return "2";
    return band(x) || band(y) ? "1" : ".";
  }).join(""),
);
/** A rough cloth: flecks of two threads. */
const FLECK = [
  "1.....2.",
  "...1....",
  ".2....1.",
  "....1...",
  "1.....1.",
  "..2.....",
  ".....1.2",
  "..1.....",
];
/** A close nap: a fine dot. */
const NAP = ["1...", "....", "..1.", "...."];
/** A few stars and the dust between them. */
const STARS = [
  "................",
  "...2............",
  "..........1.....",
  "................",
  ".....1..........",
  "............2...",
  "................",
  ".1..............",
  "........1.......",
  "..............1.",
  "....2...........",
  "................",
  "..........2.....",
  ".1..............",
  "......1.........",
  "................",
];

const CLOTHS: Record<string, ClothSkin> = {
  "cloth-cream": {
    fill: "#fff8e7",
    weave: "#f4ead4",
    thread: "#b9a47e",
    shade: "#b9a47e",
    tile: PLAIN,
  },
  "cloth-gingham": {
    fill: "#fff6f3",
    weave: "#fbd9d3",
    thread: "#f3b7ae",
    shade: "#c98a7e",
    tile: CHECK,
  },
  "cloth-denim": {
    fill: "#c3d5ea",
    weave: "#a9c0dc",
    thread: "#e7eff8",
    shade: "#5f7da3",
    tile: TWILL,
  },
  "cloth-tartan": {
    fill: "#e3f0da",
    weave: "#c5deb7",
    thread: "#f2cdc4",
    shade: "#7fa06d",
    tile: PLAID,
  },
  "cloth-tweed": {
    fill: "#efe6d2",
    weave: "#d8c9a5",
    thread: "#b39f73",
    shade: "#9a8a63",
    tile: FLECK,
  },
  "cloth-baize": {
    fill: "#bfe0ba",
    weave: "#a6d3a1",
    thread: "#8cc088",
    shade: "#5f9a5c",
    tile: NAP,
  },
  "cloth-starlit": {
    fill: "#e9e6f7",
    weave: "#cfc8ee",
    thread: "#c9a53f",
    shade: "#7d73b8",
    tile: STARS,
  },
};

const TOWERS: Record<string, TowerSkin> = {
  "tower-stone": {
    light: "#d0dae2",
    stone: "#9aa9b7",
    rib: "#6e7f90",
    deep: "#3a4857",
  },
  "tower-brick": {
    light: "#e9a58f",
    stone: "#c9705a",
    rib: "#8f4435",
    deep: "#4f261d",
  },
  "tower-timber": {
    light: "#e3c08f",
    stone: "#b98d55",
    rib: "#7d5a30",
    deep: "#46321a",
  },
  "tower-sandstone": {
    light: "#f4e2b4",
    stone: "#dcc07e",
    rib: "#a98f52",
    deep: "#5e4f2c",
  },
  "tower-mossy": {
    light: "#c5d6b0",
    stone: "#8fae7c",
    rib: "#5c7d52",
    deep: "#31452d",
  },
  "tower-ice": {
    light: "#e8f6fc",
    stone: "#b5dff0",
    rib: "#6fb1d1",
    deep: "#2f5f78",
  },
  "tower-candy": {
    light: "#ffd9de",
    stone: "#ff9aa8",
    rib: "#c9586a",
    deep: "#6e2d3a",
  },
};

const SKIES: Record<string, SkySkin> = {
  "sky-evening": {
    sky: ["#fff2a8", "#f5c84c", "#f07b4d", "#b7492d"],
    cloud: ["#fff8e7", "#d0dae2", "#9aa9b7"],
    sea: ["#1557d8", "#0d3c9d", "#a9ddf5", "#e7f7fd"],
  },
  "sky-day": {
    sky: ["#e7f7fd", "#c5e9f8", "#a9ddf5", "#73bde4"],
    cloud: ["#ffffff", "#e7f7fd", "#c9dce8"],
    sea: ["#1f7fd0", "#1557d8", "#a9ddf5", "#e7f7fd"],
  },
  "sky-dawn": {
    sky: ["#fff1d6", "#fdd9b5", "#f7b6a3", "#c98bb0"],
    cloud: ["#fff8e7", "#f6d9cf", "#d9b3c0"],
    sea: ["#4a78c2", "#2f559c", "#f7c9b5", "#fff1d6"],
  },
  "sky-overcast": {
    sky: ["#e6ebef", "#cfd8df", "#b3c0cb", "#93a3b1"],
    cloud: ["#f1f4f6", "#c3cdd6", "#9aa9b7"],
    sea: ["#55708a", "#3d566d", "#a9b9c6", "#dbe2e8"],
  },
  "sky-snow": {
    sky: ["#f6fbfd", "#e3f0f6", "#cfe4ee", "#b5d3e2"],
    cloud: ["#ffffff", "#e7f0f5", "#c7d8e2"],
    sea: ["#5b8fb5", "#3f7198", "#cfe4ee", "#ffffff"],
  },
  "sky-night": {
    sky: ["#4a5a8c", "#33426b", "#26335a", "#1a2342"],
    cloud: ["#5b6c9c", "#3f4f7c", "#2c3a63"],
    sea: ["#14285c", "#0c1a40", "#4a5a8c", "#fff0a8"],
  },
  "sky-aurora": {
    sky: ["#7fd6b4", "#3f8f8a", "#2a5f78", "#1d2f4f"],
    cloud: ["#b4efd1", "#5aa79a", "#2f5f6e"],
    sea: ["#123a5c", "#0b2440", "#3f8f8a", "#b4efd1"],
  },
};

/** The skin a slot wears: the one asked for, or the slot's free one. */
function pick<T>(skins: Record<string, T>, slot: TableSlot, id: unknown): T {
  const worn =
    typeof id === "string" &&
    Object.hasOwn(skins, id) &&
    isCosmeticId(id) &&
    getCosmetic(id).slot === slot
      ? skins[id]
      : undefined;
  const free = skins[DEFAULT_LOOK[slot]];
  if (!free) throw new Error(`No skin drawn for ${DEFAULT_LOOK[slot]}`);
  return worn ?? free;
}

export const matSkin = (id: unknown) => pick(MATS, "mat", id);
export const clothSkin = (id: unknown) => pick(CLOTHS, "cloth", id);
export const towerSkin = (id: unknown) => pick(TOWERS, "tower", id);
export const skySkin = (id: unknown) => pick(SKIES, "sky", id);

/** Three colours a skin is known by: its main fill, its second, its mark. */
export type Swatch = readonly [main: string, second: string, mark: string];

/** A skin's three colours, for a tile that stands for it. */
export function skinSwatch(cosmeticId: string): Swatch {
  if (cosmeticId.startsWith("cloth-")) {
    const { fill, weave, thread } = clothSkin(cosmeticId);
    return [fill, weave, thread];
  }
  if (cosmeticId.startsWith("tower-")) {
    const { light, stone, rib } = towerSkin(cosmeticId);
    return [stone, light, rib];
  }
  if (cosmeticId.startsWith("sky-")) {
    const { sky, cloud } = skySkin(cosmeticId);
    return [sky[2], sky[0], cloud[0]];
  }
  const { fill, soft, line } = matSkin(cosmeticId);
  return [fill, soft, line];
}

/** Every skin that has been drawn, by slot, for the tests. */
export const SKIN_IDS: Record<TableSlot, string[]> = {
  mat: Object.keys(MATS),
  cloth: Object.keys(CLOTHS),
  tower: Object.keys(TOWERS),
  sky: Object.keys(SKIES),
};

/** The weave of a cloth as an image a stylesheet can repeat. */
export function clothWeave(cloth: ClothSkin): string {
  return tileImage(cloth.tile, {
    ".": null,
    "1": cloth.weave,
    "2": cloth.thread,
  });
}

/**
 * The custom properties a look sets on the page's body, so the cloth, every
 * board and the tower's stone are in its colours from the first paint, in
 * every dialog as well. A property is only set where the look differs from
 * the stylesheet's own.
 */
export function skinVars(look: Partial<Look>): Record<string, string> {
  const vars: Record<string, string> = {};
  const mat = matSkin(look.mat);
  if (mat !== matSkin(null)) {
    vars["--mat-fill"] = mat.fill;
    vars["--mat-line"] = mat.line;
    vars["--mat-print"] = "none";
  }
  const cloth = clothSkin(look.cloth);
  if (cloth !== clothSkin(null)) {
    vars["--cloth-fill"] = cloth.fill;
    vars["--cloth-shade"] = cloth.shade;
    vars["--cloth-weave"] = clothWeave(cloth);
    vars["--cloth-size"] =
      `${cloth.tile[0]?.length ?? 16}px ${cloth.tile.length}px`;
  }
  const tower = towerSkin(look.tower);
  if (tower !== towerSkin(null)) {
    vars["--color-stone"] = tower.stone;
    vars["--color-stone-light"] = tower.light;
    vars["--color-stone-rib"] = tower.rib;
    vars["--color-stone-deep"] = tower.deep;
  }
  return vars;
}

/** Every property `skinVars` can set, to clear the ones a new look leaves out. */
export const SKIN_VARS = [
  "--mat-fill",
  "--mat-line",
  "--mat-print",
  "--cloth-fill",
  "--cloth-shade",
  "--cloth-weave",
  "--cloth-size",
  "--color-stone",
  "--color-stone-light",
  "--color-stone-rib",
  "--color-stone-deep",
] as const;
