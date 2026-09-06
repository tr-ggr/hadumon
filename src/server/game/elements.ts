/**
 * Element wheel and damage multipliers.
 *
 * flame → thorn → volt → mist → flame (attacker beats defender, +25%);
 * the reverse match-up is −25%. `shade` sits outside the wheel: it deals +10%
 * to every other element and takes +10% from every other element, and is
 * neutral against itself.
 */

export const ELEMENTS = ["flame", "mist", "volt", "thorn", "shade"] as const;

export type Element = (typeof ELEMENTS)[number];

export const ELEMENT_LABELS: Record<Element, string> = {
  flame: "Flame",
  mist: "Mist",
  volt: "Volt",
  thorn: "Thorn",
  shade: "Shade",
};

/** attacker → the element it is strong against. */
const BEATS: Record<Element, Element> = {
  flame: "thorn",
  thorn: "volt",
  volt: "mist",
  mist: "flame",
  shade: "shade",
};

export function isElement(value: string): value is Element {
  return (ELEMENTS as readonly string[]).includes(value);
}

/** Damage multiplier applied when `attacker` hits `defender`. */
export function elementMultiplier(attacker: Element, defender: Element): number {
  if (attacker === "shade" && defender === "shade") return 1;
  if (attacker === "shade" || defender === "shade") return 1.1;
  if (BEATS[attacker] === defender) return 1.25;
  if (BEATS[defender] === attacker) return 0.75;
  return 1;
}

/** Human-facing id of the upgrade material dropped by an element's zone. */
export function materialName(element: Element): string {
  return `${element}Shard`;
}

export const MATERIAL_LABELS: Record<Element, string> = {
  flame: "Flame Shard",
  mist: "Mist Shard",
  volt: "Volt Shard",
  thorn: "Thorn Shard",
  shade: "Shade Shard",
};
