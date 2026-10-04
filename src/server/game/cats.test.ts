import { describe, expect, it } from "vitest";

import {
  CAT_LIST,
  catsByElement,
  catsByRarity,
  describePower,
  getCat,
  ROWS,
} from "./cats";
import { ELEMENTS } from "./elements";

describe("cat catalogue", () => {
  it("has 26 cats in the documented rarity split", () => {
    expect(CAT_LIST).toHaveLength(26);
    expect(catsByRarity("common")).toHaveLength(10);
    expect(catsByRarity("uncommon")).toHaveLength(5);
    expect(catsByRarity("rare")).toHaveLength(5);
    expect(catsByRarity("epic")).toHaveLength(3);
    expect(catsByRarity("legendary")).toHaveLength(3);
  });

  it("gives every element two commons, an uncommon and a rare", () => {
    for (const element of ELEMENTS) {
      const cats = catsByElement(element);
      expect(cats.filter((c) => c.rarity === "common")).toHaveLength(2);
      expect(cats.filter((c) => c.rarity === "uncommon")).toHaveLength(1);
      expect(cats.filter((c) => c.rarity === "rare")).toHaveLength(1);
    }
  });

  it("gives every cat playable rules", () => {
    for (const cat of CAT_LIST) {
      expect(cat.rows.length).toBeGreaterThan(0);
      expect(cat.rows.every((row) => ROWS.includes(row))).toBe(true);
      expect(cat.cost.length).toBeGreaterThanOrEqual(1);
      expect(cat.cost.length).toBeLessThanOrEqual(4);
      expect(cat.points).toBeGreaterThan(0);
      expect(cat.yarnCap).toBeGreaterThan(0);
    }
  });

  it("only offers a player choice on the player's own turn", () => {
    for (const cat of CAT_LIST) {
      if (!cat.power) continue;
      const choice =
        cat.power.effect.kind === "tuckHand" ||
        cat.power.effect.kind === "trade";
      if (choice) expect(["played", "activated"]).toContain(cat.power.timing);
    }
  });

  it("writes rules text for every power", () => {
    for (const cat of CAT_LIST) {
      if (!cat.power) continue;
      expect(describePower(cat.power)).toMatch(/^[A-Z].*\.$/);
    }
    expect(describePower(getCat("flameclaw").power!)).toBe(
      "When activated: gain 1 Beef.",
    );
    expect(describePower(getCat("brumefang").power!)).toBe(
      "Between turns: when the rival raids the feeder, gain 1 Fish.",
    );
  });

  it("throws on an unknown id", () => {
    expect(() => getCat("dogmon")).toThrow();
  });
});
