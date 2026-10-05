import { describe, expect, it } from "vitest";

import type { DifficultyId } from "./difficulty";
import { ELEMENTS } from "./elements";
import { summarizeRun } from "./run";
import { greedyBot, playRun, randomBot, type Bot } from "./sim";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";

const pool = poolFromUnlocks(STARTING_UNLOCKS);

function simulate(
  bot: Bot,
  runs: number,
  label: string,
  difficulty?: DifficultyId,
) {
  const results = Array.from({ length: runs }, (_, i) =>
    playRun(
      {
        seed: `${label}-${i}`,
        clanId: ELEMENTS[i % ELEMENTS.length]!,
        pool,
        difficulty,
      },
      bot,
    ),
  );
  const firstWins = results.filter((run) => run.results[0]?.won).length;
  const wins = results.map((run) => summarizeRun(run).matchesWon);
  return {
    results,
    firstMatchWinRate: firstWins / runs,
    averageWins: wins.reduce((sum, n) => sum + n, 0) / runs,
  };
}

describe("simulated runs", () => {
  const greedy = simulate(greedyBot, 200, "greedy");
  const random = simulate(randomBot, 200, "random");

  it("always terminate with a decided outcome", () => {
    for (const run of [...greedy.results, ...random.results]) {
      expect(run.phase).toBe("over");
      expect(["won", "lost"]).toContain(run.outcome);
      expect(run.results.length).toBeGreaterThan(0);
    }
  });

  it("make the first rival beatable by sensible play", () => {
    expect(greedy.firstMatchWinRate).toBeGreaterThan(0.75);
  });

  it("do not hand the first rival to random play", () => {
    expect(random.firstMatchWinRate).toBeLessThan(0.3);
  });

  it("get harder: a simple bot rarely clears the gauntlet", () => {
    expect(greedy.averageWins).toBeGreaterThan(1.5);
    expect(greedy.averageWins).toBeLessThan(4);
    expect(greedy.averageWins).toBeGreaterThan(random.averageWins + 1);
  });

  describe("by tier", () => {
    // The same seeds as the Kitten runs above, so only the head start differs.
    const stray = simulate(greedyBot, 200, "greedy", "stray");
    const apex = simulate(greedyBot, 200, "greedy", "apex");

    it("leave Kitten exactly as the game was", () => {
      expect(simulate(greedyBot, 20, "greedy", "kitten").results).toEqual(
        greedy.results.slice(0, 20),
      );
    });

    it("get harder with each tier", () => {
      expect(stray.averageWins).toBeLessThan(greedy.averageWins);
      expect(apex.averageWins).toBeLessThan(stray.averageWins);
      expect(stray.firstMatchWinRate).toBeLessThan(greedy.firstMatchWinRate);
      expect(apex.firstMatchWinRate).toBeLessThan(stray.firstMatchWinRate);
    });

    it("keep the first rival of the hardest tier beatable", () => {
      expect(apex.firstMatchWinRate).toBeGreaterThan(0.55);
    });

    it("always terminate with a decided outcome", () => {
      for (const run of [...stray.results, ...apex.results]) {
        expect(run.phase).toBe("over");
        expect(["won", "lost"]).toContain(run.outcome);
      }
    });
  });

  it("are reproducible from the seed", () => {
    const config = { seed: "same", clanId: "thorn" as const, pool };
    expect(playRun(config, greedyBot)).toEqual(playRun(config, greedyBot));
  });
});
