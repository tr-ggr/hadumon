import type { Element } from "~/server/game/elements";
import type { Rarity } from "~/server/game/cats";
import { getRelic } from "~/server/game/relics";

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
 * Resolves the legend character → CSS colour map for one cat.
 * Returns `null` for transparent pixels.
 */
export function spriteColors(
  element: Element,
  rarity: Rarity,
  catId?: string,
): Record<string, string | null> {
  const own = catId ? CAT_PALETTES[catId] : undefined;
  const fur = own ?? ELEMENT_PALETTES[element];
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
