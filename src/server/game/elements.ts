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

export function isElement(value: string): value is Element {
  return (ELEMENTS as readonly string[]).includes(value);
}
