import { describe, expect, it } from "vitest";

import { GOAL_IDS, getGoal } from "./goals";
import { createMatch } from "./match";
import { combineMods, NO_MODS, RELIC_LIST, relicScore } from "./relics";
import { GAUNTLET, getRival, RIVAL_LIST } from "./rival";
import { starterDeck } from "./run";

const placed = (catId: string, yarn = 0) => ({
  catId,
  yarn,
  cached: 0,
  tucked: 0,
});

describe("relics", () => {
  it("sums rule changes across relics", () => {
    expect(combineMods([])).toEqual(NO_MODS);
    expect(combineMods(["warm-saucer", "warm-saucer", "bent-whisker"])).toEqual(
      {
        ...NO_MODS,
        startWild: 2,
        huntBonus: 1,
      },
    );
  });

  it("gives every relic exactly one job", () => {
    for (const relic of RELIC_LIST) {
      expect(Boolean(relic.mods) !== Boolean(relic.score)).toBe(true);
      expect(relic.text.endsWith(".")).toBe(true);
    }
  });

  it("scores the board at the end of a match", () => {
    const board = {
      hunt: [placed("flameclaw", 3), placed("thornkit", 1)],
      den: [placed("pyrelynx", 3)],
      prowl: [],
    };
    expect(relicScore("ember-charm", board)).toBe(4);
    expect(relicScore("briar-charm", board)).toBe(2);
    expect(relicScore("quiet-corner", board)).toBe(2);
    expect(relicScore("hoarders-basket", board)).toBe(2);
    expect(relicScore("warm-saucer", board)).toBe(0);
  });
});

describe("goals", () => {
  it("counts from zero on an empty board and has a par for each round", () => {
    const match = createMatch({
      seed: "g",
      deck: starterDeck("mist"),
      relics: [],
      rivalId: "alley-tom",
    });
    expect(GOAL_IDS.length).toBeGreaterThanOrEqual(3);
    for (const id of GOAL_IDS) {
      const goal = getGoal(id);
      expect(goal.count(match)).toBe(0);
      expect(goal.par).toHaveLength(3);
      expect(goal.par.every((n) => n >= 1)).toBe(true);
    }
  });
});

describe("rivals", () => {
  it("runs six matches with bosses at three and six", () => {
    expect(GAUNTLET).toHaveLength(6);
    expect(GAUNTLET.map((id) => getRival(id).boss)).toEqual([
      false,
      false,
      true,
      false,
      false,
      true,
    ]);
  });

  it("gives every rival a ten-card deck that can score", () => {
    for (const rival of RIVAL_LIST) {
      expect(rival.deck).toHaveLength(10);
      expect(rival.deck).toContain("bank");
      expect(rival.bankPoints).toBeGreaterThan(0);
    }
  });
});
