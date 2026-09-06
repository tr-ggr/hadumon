import { describe, expect, it } from "vitest";

import { ELEMENTS, elementMultiplier, isElement, materialName } from "./elements";

describe("elementMultiplier", () => {
  it("gives +25% around the wheel", () => {
    expect(elementMultiplier("flame", "thorn")).toBe(1.25);
    expect(elementMultiplier("thorn", "volt")).toBe(1.25);
    expect(elementMultiplier("volt", "mist")).toBe(1.25);
    expect(elementMultiplier("mist", "flame")).toBe(1.25);
  });

  it("gives -25% against the wheel", () => {
    expect(elementMultiplier("thorn", "flame")).toBe(0.75);
    expect(elementMultiplier("volt", "thorn")).toBe(0.75);
    expect(elementMultiplier("mist", "volt")).toBe(0.75);
    expect(elementMultiplier("flame", "mist")).toBe(0.75);
  });

  it("is neutral for unrelated non-shade pairs", () => {
    expect(elementMultiplier("flame", "volt")).toBe(1);
    expect(elementMultiplier("mist", "thorn")).toBe(1);
    expect(elementMultiplier("flame", "flame")).toBe(1);
  });

  it("treats shade as +10% both ways, neutral on itself", () => {
    for (const element of ELEMENTS) {
      if (element === "shade") continue;
      expect(elementMultiplier("shade", element)).toBeCloseTo(1.1);
      expect(elementMultiplier(element, "shade")).toBeCloseTo(1.1);
    }
    expect(elementMultiplier("shade", "shade")).toBe(1);
  });

  it("exposes exactly five elements", () => {
    expect(ELEMENTS).toEqual(["flame", "mist", "volt", "thorn", "shade"]);
    expect(isElement("flame")).toBe(true);
    expect(isElement("water")).toBe(false);
    expect(materialName("volt")).toBe("voltShard");
  });
});
