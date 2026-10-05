import { describe, expect, it } from "vitest";

import { CAT_LIST } from "../cats";
import { DECK_SIZE, defaultDeck, STOLEN } from "../deck";
import { rivalLevel, type DifficultyId } from "../difficulty";
import { GAUNTLET } from "../rival";
import { RELIC_LIST } from "../relics";
import { summarizeRun } from "../run";
import { startingPool } from "../unlocks";
import { playGauntlet, type Gauntlet } from "./arena";
import { standIn } from "./index";
import { LEVELS, TOP_LEVEL } from "./levels";

const NEW_ACCOUNT = startingPool();
const EVERYTHING = {
  cats: CAT_LIST.map((cat) => cat.id),
  relics: RELIC_LIST.map((relic) => relic.id),
};

/** The same runs `scripts/selfplay.ts` measures, a stand-in at `level`. */
function climb(level: number, tier: DifficultyId, runs: number) {
  const results = Array.from({ length: runs }, (_, i) =>
    playGauntlet(
      {
        seed: `gauntlet-${i}`,
        deck: defaultDeck(),
        pool: NEW_ACCOUNT,
        tier,
      },
      standIn(level),
    ),
  );
  const wins = (run: Gauntlet) => run.matches.filter((m) => m.won).length;
  return {
    results,
    firstMatch: results.filter((run) => run.matches[0]?.won).length / runs,
    matchesWon: results.reduce((sum, run) => sum + wins(run), 0) / runs,
  };
}

describe("the level a rival plays at", () => {
  it("is its place in the gauntlet plus the tier's rank", () => {
    expect(GAUNTLET.map((_, i) => rivalLevel(i, "kitten"))).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
    expect(GAUNTLET.map((_, i) => rivalLevel(i, "stray"))).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
    expect(GAUNTLET.map((_, i) => rivalLevel(i, "apex"))).toEqual([
      2, 3, 4, 5, 6, 7,
    ]);
  });

  it("is always one the table has", () => {
    expect(LEVELS).toHaveLength(8);
    expect(rivalLevel(GAUNTLET.length - 1, "apex")).toBe(TOP_LEVEL);
  });
});

describe("simulated runs", () => {
  // Bounds are taken from `sprints/data/14-ladder.json`, with room for the
  // smaller sample here.
  const rote = climb(0, "kitten", 60);
  const points = climb(2, "kitten", 60);
  const careful = climb(4, "kitten", 60);

  it("always end decided: a loss, or six wins", () => {
    for (const { matches, run } of [
      ...rote.results,
      ...points.results,
      ...careful.results,
    ]) {
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.length).toBeLessThanOrEqual(GAUNTLET.length);
      const last = matches[matches.length - 1];
      expect(matches.slice(0, -1).every((match) => match.won)).toBe(true);
      expect(last?.won === false || matches.length === GAUNTLET.length).toBe(
        true,
      );
      matches.forEach((match, i) => expect(match.rivalId).toBe(GAUNTLET[i]));
      expect(run.phase).toBe("over");
      expect(run.outcome).toBe(last?.won ? "won" : "lost");
    }
  });

  it("are the run itself: the same record, deck and stolen cards", () => {
    for (const { matches, run } of careful.results) {
      expect(run.results.map((r) => [r.player, r.rival, r.won])).toEqual(
        matches.map((m) => [m.player, m.rival, m.won]),
      );
      const summary = summarizeRun(run);
      expect(summary.matchesWon).toBe(matches.filter((m) => m.won).length);
      // A card comes back with every reward taken, and none is made up.
      expect(run.deck.length + run.stolen.length).toBe(DECK_SIZE);
      expect(summary.reclaimed).toBe(STOLEN - run.stolen.length);
      expect(run.relics.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("make the first rival beatable by careful play", () => {
    expect(careful.firstMatch).toBeGreaterThan(0.75);
  });

  it("reward thinking: each better stand-in climbs higher", () => {
    expect(points.matchesWon).toBeGreaterThan(rote.matchesWon + 0.4);
    expect(careful.matchesWon).toBeGreaterThan(points.matchesWon + 1);
  });

  it("seldom hand a run to play by rote", () => {
    expect(rote.matchesWon).toBeLessThan(3);
    const won = rote.results.filter((run) => run.run.outcome === "won");
    // The relics a run gathers carry even a fixed list through, now and then.
    expect(won.length).toBeLessThanOrEqual(6);
  });

  it("get harder with each tier, by the rival's play alone", () => {
    const stray = climb(2, "stray", 60);
    const apex = climb(2, "apex", 60);
    expect(stray.matchesWon).toBeLessThan(points.matchesWon);
    expect(apex.matchesWon).toBeLessThanOrEqual(stray.matchesWon);
    expect(apex.firstMatch).toBeLessThan(points.firstMatch);
    // No tier gives the rival a point: its first match starts level.
    for (const tier of ["kitten", "stray", "apex"] as const) {
      const [first] = playGauntlet(
        { seed: "level", deck: defaultDeck(), pool: EVERYTHING, tier },
        standIn(0),
      ).matches;
      expect(first?.level).toBe(rivalLevel(0, tier));
    }
  }, 30_000);

  it("are reproducible from the seed", () => {
    const config = {
      seed: "same",
      deck: defaultDeck(),
      pool: EVERYTHING,
      tier: "stray" as const,
    };
    expect(playGauntlet(config, standIn(3))).toEqual(
      playGauntlet(config, standIn(3)),
    );
  });
});
