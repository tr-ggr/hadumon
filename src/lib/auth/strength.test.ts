import { describe, expect, it } from "vitest";

import { describeStrength, loadStrength } from "./strength";

describe("describeStrength", () => {
  it("says nothing about an empty field", () => {
    expect(describeStrength("", null)).toEqual({ filled: 0, label: "" });
    expect(describeStrength("", 4)).toEqual({ filled: 0, label: "" });
  });

  it("calls anything under 8 characters too short, whatever it scored", () => {
    expect(describeStrength("Zq7!x", 4)).toEqual({
      filled: 0,
      label: "Too short",
    });
    expect(describeStrength("1234567", null).label).toBe("Too short");
  });

  it("waits for a score once the length is there", () => {
    expect(describeStrength("12345678", null)).toEqual({
      filled: 0,
      label: "",
    });
  });

  it("fills one segment more for each step", () => {
    const password = "long enough";
    expect(describeStrength(password, 0)).toEqual({ filled: 1, label: "Weak" });
    expect(describeStrength(password, 1)).toEqual({ filled: 1, label: "Weak" });
    expect(describeStrength(password, 2)).toEqual({ filled: 2, label: "Fair" });
    expect(describeStrength(password, 3)).toEqual({ filled: 3, label: "Good" });
    expect(describeStrength(password, 4)).toEqual({
      filled: 4,
      label: "Strong",
    });
  });
});

describe("loadStrength", () => {
  it("knows the common passwords", async () => {
    const estimate = await loadStrength();
    expect(estimate("password1")).toBeLessThanOrEqual(1);
    expect(estimate("qwertyuiop")).toBeLessThanOrEqual(1);
    expect(describeStrength("password1", estimate("password1")).label).toBe(
      "Weak",
    );
  });

  it("rates a long random phrase at the top", async () => {
    const estimate = await loadStrength();
    expect(estimate("vexing-otter-plinth-74-marble")).toBe(4);
  });

  it("marks a password down for being the player's own name", async () => {
    const estimate = await loadStrength();
    const name = "flameclawfan";
    expect(estimate(name, [name])).toBeLessThan(estimate(name));
  });

  it("loads once", () => {
    expect(loadStrength()).toBe(loadStrength());
  });
});
