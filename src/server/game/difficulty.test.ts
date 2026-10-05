import { describe, expect, it } from "vitest";

import {
  DIFFICULTIES,
  DIFFICULTY,
  DIFFICULTY_LIST,
  difficultyOf,
  isAtLeast,
  isDifficulty,
} from "./difficulty";
import { combineMods, NO_MODS } from "./relics";

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

  it("leaves Kitten as the game with no mods at all", () => {
    expect(DIFFICULTY.kitten.mods).toEqual({});
    expect(combineMods([], DIFFICULTY.kitten.mods)).toEqual(NO_MODS);
  });

  it("gives the rival a head start that grows with the tier", () => {
    expect(DIFFICULTY.stray.mods).toEqual({ rivalStartYarn: 2 });
    expect(DIFFICULTY.apex.mods).toEqual({ rivalStartYarn: 4 });
  });

  it("prints the number it applies", () => {
    for (const tier of DIFFICULTY_LIST) {
      const yarn = tier.mods.rivalStartYarn ?? 0;
      if (yarn > 0) expect(tier.text).toContain(`${yarn} points`);
      expect(tier.text.length).toBeLessThan(60);
    }
  });

  it("only changes mods the engine knows", () => {
    for (const tier of DIFFICULTY_LIST) {
      for (const key of Object.keys(tier.mods))
        expect(NO_MODS).toHaveProperty(key);
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
