import { describe, expect, it } from "vitest";

import { CAT_LIST } from "../cats";
import type { DifficultyId } from "../difficulty";
import { ELEMENTS } from "../elements";
import { GAUNTLET } from "../rival";
import { RELIC_LIST } from "../relics";
import { poolFromUnlocks, STARTING_UNLOCKS } from "../unlocks";
import { playGauntlet, rivalLevel, type GauntletMatch } from "./arena";
import { standIn } from "./index";
import { LEVELS, TOP_LEVEL } from "./levels";

const NEW_ACCOUNT = poolFromUnlocks(STARTING_UNLOCKS);
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
        clanId: ELEMENTS[i % ELEMENTS.length] ?? "flame",
        pool: NEW_ACCOUNT,
        tier,
      },
      standIn(level),
    ),
  );
  const wins = (run: GauntletMatch[]) => run.filter((m) => m.won).length;
  return {
    results,
    firstMatch: results.filter((run) => run[0]?.won).length / runs,
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
    for (const run of [
      ...rote.results,
      ...points.results,
      ...careful.results,
    ]) {
      expect(run.length).toBeGreaterThan(0);
      expect(run.length).toBeLessThanOrEqual(GAUNTLET.length);
      const last = run[run.length - 1];
      expect(run.slice(0, -1).every((match) => match.won)).toBe(true);
      expect(last?.won === false || run.length === GAUNTLET.length).toBe(true);
      run.forEach((match, i) => expect(match.rivalId).toBe(GAUNTLET[i]));
    }
  });

  it("make the first rival beatable by careful play", () => {
    expect(careful.firstMatch).toBeGreaterThan(0.85);
  });

  it("reward thinking: each better stand-in climbs higher", () => {
    expect(points.matchesWon).toBeGreaterThan(rote.matchesWon + 0.4);
    expect(careful.matchesWon).toBeGreaterThan(points.matchesWon + 1);
  });

  it("seldom hand a run to play by rote", () => {
    expect(rote.matchesWon).toBeLessThan(3);
    const won = rote.results.filter((run) => run.length === 6 && run[5]?.won);
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
        { seed: "level", clanId: "flame", pool: EVERYTHING, tier },
        standIn(0),
      );
      expect(first?.level).toBe(rivalLevel(0, tier));
    }
  });

  it("are reproducible from the seed", () => {
    const config = {
      seed: "same",
      clanId: "thorn" as const,
      pool: EVERYTHING,
      tier: "stray" as const,
    };
    expect(playGauntlet(config, standIn(3))).toEqual(
      playGauntlet(config, standIn(3)),
    );
  });
});
