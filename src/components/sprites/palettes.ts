import type { Element } from "~/server/game/elements";
import type { Rarity } from "~/server/game/species";

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
  flame: { "1": "#f2762e", "2": "#ffcf5c", "3": "#8f2416" },
  mist: { "1": "#7fc7e8", "2": "#dff3ff", "3": "#31678f" },
  volt: { "1": "#f5d33a", "2": "#fff5b0", "3": "#6d4bd6" },
  thorn: { "1": "#5cc46a", "2": "#c6f08a", "3": "#2f6b3c" },
  shade: { "1": "#8b6ecb", "2": "#c9a9ff", "3": "#2b1d4a" },
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
  common: { outline: "#7b8ba6", glow: "#9fb0c9", eye: "#5ef2b2" },
  uncommon: { outline: "#5ef2b2", glow: "#8dffd2", eye: "#5ef2b2" },
  rare: { outline: "#4fa8ff", glow: "#9ad2ff", eye: "#9ad2ff" },
  epic: { outline: "#ff6fb5", glow: "#ffa8d6", eye: "#ffd0ea" },
  legendary: { outline: "#f5c542", glow: "#fff0a8", eye: "#fff0a8" },
};

/** Hard outline shared by every sprite. */
export const OUTLINE_COLOR = "#1a1120";
export const WHITE_COLOR = "#ffffff";

/**
 * Resolves the legend character → CSS colour map for one creature.
 * Returns `null` for transparent pixels.
 */
export function spriteColors(
  element: Element,
  rarity: Rarity,
): Record<string, string | null> {
  const fur = ELEMENT_PALETTES[element];
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
