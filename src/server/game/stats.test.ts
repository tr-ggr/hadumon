import { describe, expect, it } from "vitest";

import { careerOf } from "./achievements";
import { deckElements } from "./run";
import { percent, playerStats, rate } from "./stats";

describe("rate", () => {
  it("is nothing before anything is played", () => {
    expect(rate(0, 0)).toBeNull();
  });

  it("is the share won, kept between 0 and 1", () => {
    expect(rate(1, 4)).toBe(0.25);
    expect(rate(5, 4)).toBe(1);
  });
});

describe("percent", () => {
  it("rounds to a whole percentage, or shows a dash", () => {
    expect(percent(null)).toBe("–");
    expect(percent(2 / 3)).toBe("67%");
    expect(percent(0)).toBe("0%");
  });
});

describe("playerStats", () => {
  it("gives win rates for runs and for matches", () => {
    const base = {
      difficulty: "kitten" as const,
      bestMatchScore: 50,
      totalScore: 100,
      deckElements: deckElements([]),
      goalsSwept: 0,
      reclaimed: 0,
    };
    const stats = playerStats(
      careerOf(
        [
          { ...base, won: true, matchesWon: 6, matchesPlayed: 6 },
          { ...base, won: false, matchesWon: 1, matchesPlayed: 2 },
        ],
        { catsOwned: 0, packsOpened: 0, cosmeticsOwned: 0 },
      ),
    );
    expect(stats).toMatchObject({
      runsFinished: 2,
      runsWon: 1,
      runWinRate: 0.5,
      matchesWon: 7,
      matchesPlayed: 8,
      matchWinRate: 7 / 8,
    });
  });
});
