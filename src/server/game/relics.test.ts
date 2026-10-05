import { describe, expect, it } from "vitest";

import { GOAL_IDS, getGoal } from "./goals";
import { ELEMENTS } from "./elements";
import { emptyPool } from "./match";
import { combineMods, NO_MODS, RELIC_LIST, relicScore } from "./relics";
import { GAUNTLET, getRival, RIVAL_LIST } from "./rival";

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

  it("lays extra mods over the relics'", () => {
    expect(combineMods([], { goalBonus: 2 })).toEqual({
      ...NO_MODS,
      goalBonus: 2,
    });
    expect(combineMods(["loud-bell"]).refillTreat).toBe(1);
    expect(combineMods(["warm-saucer"], { startWild: 1 }).startWild).toBe(2);
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
  it("count from zero for a seat with nothing", () => {
    const bare = {
      board: { hunt: [], den: [], prowl: [] },
      hand: [],
      essence: emptyPool(),
    };
    expect(GOAL_IDS.length).toBeGreaterThanOrEqual(3);
    for (const id of GOAL_IDS) {
      const goal = getGoal(id);
      expect(goal.count(bare)).toBe(0);
      expect(goal).not.toHaveProperty("par");
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

  it("gives a rival a clan and a manner, and no numbers", () => {
    for (const rival of RIVAL_LIST) {
      expect(Object.keys(rival).sort()).toEqual(
        ["boss", "flavor", "id", "name", "theme", "trait"].sort(),
      );
      expect(ELEMENTS).toContain(rival.theme);
      expect(rival.trait.length).toBeGreaterThan(0);
    }
    expect(new Set(RIVAL_LIST.map((r) => r.trait)).size).toBe(6);
  });
});
