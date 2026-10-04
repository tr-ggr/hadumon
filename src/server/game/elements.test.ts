import { describe, expect, it } from "vitest";

import { ELEMENTS, ELEMENT_LABELS, isElement } from "./elements";

describe("elements", () => {
  it("exposes exactly five elements", () => {
    expect(ELEMENTS).toEqual(["flame", "mist", "volt", "thorn", "shade"]);
  });

  it("labels every element", () => {
    for (const element of ELEMENTS) {
      expect(ELEMENT_LABELS[element]).toMatch(/^[A-Z][a-z]+$/);
    }
    expect(Object.keys(ELEMENT_LABELS)).toHaveLength(ELEMENTS.length);
  });

  it("recognises element ids and nothing else", () => {
    expect(isElement("flame")).toBe(true);
    expect(isElement("shade")).toBe(true);
    expect(isElement("water")).toBe(false);
    expect(isElement("wild")).toBe(false);
    expect(isElement("Flame")).toBe(false);
  });
});
