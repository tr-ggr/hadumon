import type { Element } from "~/server/game/elements";
import type { Rarity } from "~/server/game/cats";
import { getRelic } from "~/server/game/relics";
import { SPRITE_RECIPES } from "./cats";

export interface FurPalette {
  /** `1` primary fur */
  "1": string;
  /** `2` secondary fur / pattern */
  "2": string;
  /** `3` accent — hood, armour, tails, hat */
  "3": string;
}

/** Fur and accent colours per element. */
export const ELEMENT_PALETTES: Record<Element, FurPalette> = {
  flame: { "1": "#f07b4d", "2": "#ffd36b", "3": "#b7492d" },
  mist: { "1": "#8acbe7", "2": "#e7f7fd", "3": "#3c83a8" },
  volt: { "1": "#f5c84c", "2": "#fff2a8", "3": "#1557d8" },
  thorn: { "1": "#77bd70", "2": "#c9ec9b", "3": "#39734a" },
  shade: { "1": "#8275c6", "2": "#c9c1f2", "3": "#40336d" },
};

/**
 * The coats a cat of each element can wear, so that twenty cats of one
 * element do not all share three colours. The first is the element's own
 * palette, which every cat drawn by hand wears. The others stay in its hue
 * and move the fur lighter, deeper or to one side, with an accent to match.
 * A recipe in `sprites/cats.ts` picks one by its place in this list.
 */
export const ELEMENT_COATS: Record<Element, readonly FurPalette[]> = {
  flame: [
    ELEMENT_PALETTES.flame,
    { "1": "#d9502e", "2": "#ffb45e", "3": "#7d2416" },
    { "1": "#f7a35a", "2": "#ffe9ad", "3": "#c9412a" },
    { "1": "#a8412b", "2": "#f59a52", "3": "#ffd36b" },
  ],
  mist: [
    ELEMENT_PALETTES.mist,
    { "1": "#5f9fd6", "2": "#cfe6f9", "3": "#274f8a" },
    { "1": "#bfe3f2", "2": "#f4fbfe", "3": "#4f95b8" },
    { "1": "#6fc4cf", "2": "#dff7f6", "3": "#2f7f8f" },
  ],
  volt: [
    ELEMENT_PALETTES.volt,
    { "1": "#e4ad2c", "2": "#ffe590", "3": "#0f3fa3" },
    { "1": "#fbe975", "2": "#fffbd9", "3": "#4a86f0" },
    { "1": "#c2952f", "2": "#f8d867", "3": "#7fb0ff" },
  ],
  thorn: [
    ELEMENT_PALETTES.thorn,
    { "1": "#6a9f4a", "2": "#c4e08a", "3": "#2f5a2c" },
    { "1": "#a6d46a", "2": "#e6f7b4", "3": "#4f8f3f" },
    { "1": "#4fa67c", "2": "#b4e8c4", "3": "#1f5a48" },
  ],
  shade: [
    ELEMENT_PALETTES.shade,
    { "1": "#5f55a8", "2": "#b9b0ee", "3": "#2f2561" },
    { "1": "#ab94dd", "2": "#e3daf9", "3": "#5a3f96" },
    { "1": "#8f66b8", "2": "#d6bfee", "3": "#47265f" },
  ],
};

/**
 * Cats drawn from life, in their own colours rather than their element's.
 * Hadu is a tuxedo: black fur, white fur, and a pink nose and ears.
 */
export const CAT_PALETTES: Partial<Record<string, FurPalette>> = {
  hadu: { "1": "#2f2838", "2": "#ffffff", "3": "#f4a6b7" },
};

export interface RarityPalette {
  /** Card border / sprite frame colour. */
  outline: string;
  /** Glow used for rarity flashes and legendary borders. */
  glow: string;
  /** `e` eye tint. */
  eye: string;
}

export const RARITY_PALETTES: Record<Rarity, RarityPalette> = {
  common: { outline: "#9aa9b7", glow: "#d0dae2", eye: "#5cbf89" },
  uncommon: { outline: "#5cbf89", glow: "#b4efd1", eye: "#5cbf89" },
  rare: { outline: "#1557d8", glow: "#9ac4ff", eye: "#9ac4ff" },
  epic: { outline: "#ff7163", glow: "#ffc0b8", eye: "#ffd7d2" },
  legendary: { outline: "#f5c84c", glow: "#fff0a8", eye: "#fff0a8" },
};

/** Hard outline shared by every sprite. */
export const OUTLINE_COLOR = "#1a1120";
export const WHITE_COLOR = "#ffffff";
/** The lime the lane marks are printed in. */
export const LIME_COLOR = "#d8ff4f";

/**
 * The fur a cat wears: its own colours if it was drawn from life, else the
 * coat its recipe names, else its element's first coat.
 */
export function catFur(element: Element, catId?: string): FurPalette {
  const own = catId ? CAT_PALETTES[catId] : undefined;
  if (own) return own;
  const coat = catId ? SPRITE_RECIPES[catId]?.coat : undefined;
  return ELEMENT_COATS[element][coat ?? 0] ?? ELEMENT_PALETTES[element];
}

/**
 * The legend character → CSS colour map of one fur and one rarity's eyes.
 * Holds `null` for transparent pixels.
 */
export function furColors(
  fur: FurPalette,
  rarity: Rarity,
): Record<string, string | null> {
  return {
    ".": null,
    o: OUTLINE_COLOR,
    "1": fur["1"],
    "2": fur["2"],
    "3": fur["3"],
    e: RARITY_PALETTES[rarity].eye,
    w: WHITE_COLOR,
  };
}

/**
 * Resolves the legend character → CSS colour map for one cat.
 * Returns `null` for transparent pixels.
 */
export function spriteColors(
  element: Element,
  rarity: Rarity,
  catId?: string,
): Record<string, string | null> {
  return furColors(catFur(element, catId), rarity);
}

/**
 * Every rival is the rival coral, whoever it is: a lighter coral for the
 * belly and a deeper one for what it wears.
 */
export const RIVAL_PALETTE: FurPalette = {
  "1": "#ff7163",
  "2": "#ffc0b8",
  "3": "#c2463a",
};

/** The legend character → CSS colour map every rival sprite is drawn with. */
export function rivalColors(): Record<string, string | null> {
  return {
    ".": null,
    o: OUTLINE_COLOR,
    ...RIVAL_PALETTE,
    e: OUTLINE_COLOR,
    w: WHITE_COLOR,
  };
}

/**
 * The fill of a relic's art, read off its own rule: a charm is its element's
 * colour, a relic that works on a lane is the lane marks' lime, and anything
 * else is white.
 */
export function relicFill(relicId: string): string {
  const { score, mods } = getRelic(relicId);
  if (score?.per === "element") return ELEMENT_PALETTES[score.element]["1"];
  const lane =
    score?.per === "row" ||
    Boolean(mods?.huntBonus ?? mods?.denBonus ?? mods?.prowlBonus);
  return lane ? LIME_COLOR : WHITE_COLOR;
}
