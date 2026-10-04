/**
 * The five elements. Each one is a cat's typing and a kind of essence.
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

/**
 * The cat food each element's cats eat. Food is what cats cost; the code
 * calls it essence and keys it by element.
 */
export const FOOD_LABELS: Record<Element, string> = {
  flame: "Beef",
  mist: "Fish",
  volt: "Chicken",
  thorn: "Dry food",
  shade: "Pork",
};

/** The food that pays for anything; `wild` in the code. */
export const TREAT_LABEL = "Treat";

export function isElement(value: string): value is Element {
  return (ELEMENTS as readonly string[]).includes(value);
}
