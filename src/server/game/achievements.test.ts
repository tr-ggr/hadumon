import { describe, expect, it } from "vitest";

import {
  ACHIEVEMENTS,
  careerOf,
  earnedAchievements,
  MAX_RECLAIMED,
  RUN_SCORE,
  type CareerRun,
  type CareerStats,
} from "./achievements";
import { CAT_LIST } from "./cats";
import { deckElements } from "./run";
import { ELEMENT_DECK, HIGH_SCORE, TOP_SCORE } from "./unlocks";

const NONE = { catsOwned: 0, packsOpened: 0, cosmeticsOwned: 0 };

function run(over: Partial<CareerRun> = {}): CareerRun {
  return {
    difficulty: "kitten",
    matchesWon: 0,
    matchesPlayed: 1,
    won: false,
    bestMatchScore: 40,
    totalScore: 40,
    deckElements: deckElements([]),
    goalsSwept: 0,
    reclaimed: 0,
    ...over,
  };
}

const keysOf = (stats: CareerStats, held: string[] = []) =>
  earnedAchievements(stats, held).map((a) => a.key);

describe("careerOf", () => {
  it("adds runs up and keeps the best of each", () => {
    const career = careerOf(
      [
        run({
          matchesWon: 2,
          matchesPlayed: 3,
          bestMatchScore: 70,
          totalScore: 180,
          goalsSwept: 1,
          reclaimed: 2,
        }),
        run({
          matchesWon: 6,
          matchesPlayed: 6,
          won: true,
          difficulty: "stray",
          bestMatchScore: 66,
          totalScore: 390,
          goalsSwept: 2,
          reclaimed: 5,
        }),
      ],
      { catsOwned: 30, packsOpened: 4, cosmeticsOwned: 2 },
    );
    expect(career).toMatchObject({
      runsFinished: 2,
      runsWon: 1,
      runsWonOn: { kitten: 0, stray: 1, apex: 0 },
      matchesWon: 8,
      matchesPlayed: 9,
      bestMatch: 70,
      bestRun: 390,
      mostWins: 6,
      sweeps: 3,
      mostReclaimed: 5,
      catsOwned: 30,
      packsOpened: 4,
    });
  });

  it("is all zeros with no runs", () => {
    expect(careerOf([], NONE)).toMatchObject({
      runsFinished: 0,
      runsWon: 0,
      bestMatch: 0,
      elementRunWon: false,
    });
  });

  it("counts a deck built on one element only for a run that was won", () => {
    const shade = { ...deckElements([]), shade: ELEMENT_DECK };
    expect(careerOf([run({ deckElements: shade })], NONE).elementRunWon).toBe(
      false,
    );
    expect(
      careerOf([run({ deckElements: shade, won: true })], NONE).elementRunWon,
    ).toBe(true);
    const thin = { ...deckElements([]), shade: ELEMENT_DECK - 1 };
    expect(
      careerOf([run({ deckElements: thin, won: true })], NONE).elementRunWon,
    ).toBe(false);
  });
});

describe("earnedAchievements", () => {
  it("gives nothing to a new account", () => {
    expect(keysOf(careerOf([], NONE))).toEqual([]);
  });

  it("pays a first match won", () => {
    expect(keysOf(careerOf([run({ matchesWon: 1 })], NONE))).toEqual([
      "first-win",
    ]);
  });

  it("never pays one the account already holds", () => {
    const career = careerOf([run({ matchesWon: 1 })], NONE);
    expect(keysOf(career, ["first-win"])).toEqual([]);
  });

  it("holds a score at the line, not under it", () => {
    const at = (score: number) =>
      keysOf(careerOf([run({ bestMatchScore: score })], NONE));
    expect(at(HIGH_SCORE - 1)).not.toContain("high-score");
    expect(at(HIGH_SCORE)).toContain("high-score");
    expect(at(TOP_SCORE - 1)).not.toContain("top-score");
    expect(at(TOP_SCORE)).toEqual(["high-score", "top-score"]);
    expect(keysOf(careerOf([run({ totalScore: RUN_SCORE })], NONE))).toContain(
      "run-score",
    );
  });

  it("counts a harder tier's win towards an easier tier's", () => {
    const apex = keysOf(
      careerOf([run({ won: true, matchesWon: 6, difficulty: "apex" })], NONE),
    );
    expect(apex).toEqual(
      expect.arrayContaining(["run-won", "stray-won", "apex-won"]),
    );
    const stray = keysOf(
      careerOf([run({ won: true, matchesWon: 6, difficulty: "stray" })], NONE),
    );
    expect(stray).toContain("stray-won");
    expect(stray).not.toContain("apex-won");
  });

  it("asks for every card a run can take back, which is one a win but the last", () => {
    expect(MAX_RECLAIMED).toBe(5);
    expect(
      keysOf(careerOf([run({ reclaimed: MAX_RECLAIMED })], NONE)),
    ).toContain("reclaim-all");
  });

  it("reads the collection, the packs and the cosmetics", () => {
    const keys = keysOf(
      careerOf([], {
        catsOwned: CAT_LIST.length,
        packsOpened: 50,
        cosmeticsOwned: 10,
      }),
    );
    expect(keys).toEqual(
      expect.arrayContaining([
        "cats-50",
        "cats-all",
        "packs-10",
        "packs-50",
        "wardrobe-10",
      ]),
    );
  });

  it("can be earned all at once by a career that has done everything", () => {
    const everything: CareerStats = {
      runsFinished: 100,
      runsWon: 100,
      runsWonOn: { kitten: 0, stray: 0, apex: 100 },
      matchesWon: 600,
      matchesPlayed: 600,
      bestMatch: TOP_SCORE,
      bestRun: RUN_SCORE,
      mostWins: 6,
      sweeps: 10,
      mostReclaimed: MAX_RECLAIMED,
      elementRunWon: true,
      catsOwned: CAT_LIST.length,
      packsOpened: 50,
      cosmeticsOwned: 10,
    };
    expect(keysOf(everything)).toHaveLength(ACHIEVEMENTS.length);
  });
});

describe("the catalogue", () => {
  it("has a unique key, a hint and a positive payment for each", () => {
    const keys = ACHIEVEMENTS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.hint.length, a.key).toBeGreaterThan(0);
      expect(a.coins, a.key).toBeGreaterThan(0);
      expect(Number.isInteger(a.coins), a.key).toBe(true);
    }
  });
});
