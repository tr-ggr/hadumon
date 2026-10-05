import { describe, expect, it } from "vitest";

import {
  DIFFICULTIES,
  DIFFICULTY,
  DIFFICULTY_LIST,
  difficultyOf,
  isAtLeast,
  isDifficulty,
  LEVEL_COUNT,
  rivalLevel,
} from "./difficulty";
import { LEVELS } from "./bot/levels";

describe("difficulty", () => {
  it("lists three tiers, easiest first", () => {
    expect(DIFFICULTY_LIST.map((tier) => tier.id)).toEqual([
      "kitten",
      "stray",
      "apex",
    ]);
    expect(DIFFICULTY_LIST.map((tier) => tier.rank)).toEqual([0, 1, 2]);
    for (const id of DIFFICULTIES) expect(DIFFICULTY[id].id).toBe(id);
  });

  it("gives no tier a thing but its rank", () => {
    for (const tier of DIFFICULTY_LIST) {
      expect(Object.keys(tier).sort()).toEqual(["id", "name", "rank", "text"]);
    }
  });

  it("moves every rival up the table of levels by the tier's rank", () => {
    const levels = (tier: string) =>
      [0, 1, 2, 3, 4, 5].map((i) => rivalLevel(i, tier));
    expect(levels("kitten")).toEqual([0, 1, 2, 3, 4, 5]);
    expect(levels("stray")).toEqual([1, 2, 3, 4, 5, 6]);
    expect(levels("apex")).toEqual([2, 3, 4, 5, 6, 7]);
    expect(levels("nonsense")).toEqual(levels("kitten"));
    expect(rivalLevel(5, "apex")).toBe(LEVEL_COUNT - 1);
    expect(LEVEL_COUNT).toBe(LEVELS.length);
  });

  it("prints the levels it asks for, counted from one", () => {
    expect(DIFFICULTY.kitten.text).toContain("levels 1 to 6 of 8");
    expect(DIFFICULTY.stray.text).toContain("levels 2 to 7 of 8");
    expect(DIFFICULTY.apex.text).toContain("levels 3 to 8 of 8");
    for (const tier of DIFFICULTY_LIST) {
      expect(tier.text).toContain("head start");
      expect(tier.text.length).toBeLessThan(80);
    }
  });

  it("reads anything that is not a tier as Kitten", () => {
    expect(isDifficulty("apex")).toBe(true);
    expect(isDifficulty("feral")).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
    expect(difficultyOf(undefined).id).toBe("kitten");
    expect(difficultyOf("feral").id).toBe("kitten");
    expect(difficultyOf(2).id).toBe("kitten");
    expect(difficultyOf("stray").id).toBe("stray");
  });

  it("orders the tiers", () => {
    expect(isAtLeast("apex", "stray")).toBe(true);
    expect(isAtLeast("stray", "stray")).toBe(true);
    expect(isAtLeast("kitten", "stray")).toBe(false);
    expect(isAtLeast(undefined, "kitten")).toBe(true);
    expect(isAtLeast("stray", "apex")).toBe(false);
  });
});
