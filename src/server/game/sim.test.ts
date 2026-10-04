import { describe, expect, it } from "vitest";

import { ELEMENTS } from "./elements";
import { summarizeRun } from "./run";
import { greedyBot, playRun, randomBot, type Bot } from "./sim";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";

const pool = poolFromUnlocks(STARTING_UNLOCKS);

function simulate(bot: Bot, runs: number, label: string) {
  const results = Array.from({ length: runs }, (_, i) =>
    playRun(
      { seed: `${label}-${i}`, clanId: ELEMENTS[i % ELEMENTS.length]!, pool },
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

  it("are reproducible from the seed", () => {
    const config = { seed: "same", clanId: "thorn" as const, pool };
    expect(playRun(config, greedyBot)).toEqual(playRun(config, greedyBot));
  });
});
