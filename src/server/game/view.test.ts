import { describe, expect, it } from "vitest";

import { ROWS } from "./cats";
import { applyAction, type MatchState, type Side } from "./match";
import { startRun } from "./run";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";
import { toMatchView, toRunView } from "./view";

const run = startRun({
  seed: "top-secret-seed",
  clanId: "volt",
  pool: poolFromUnlocks(STARTING_UNLOCKS),
});

/** The match with the player's seat changed. */
function withPlayer(state: MatchState, seat: Partial<Side>): MatchState {
  return {
    ...state,
    sides: { ...state.sides, player: { ...state.sides.player, ...seat } },
  };
}

function keys(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => keys(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      out.add(k);
      keys(v, out);
    }
  }
  return out;
}

describe("player view", () => {
  it("never carries the seed, a deck's order, or the rival's hand", () => {
    const view = toRunView(run);
    const json = JSON.stringify(view);
    expect(json).not.toContain("top-secret-seed");
    const seen = keys(view);
    for (const secret of [
      "seed",
      "queue",
      "discard",
      "pool",
      "sides",
      "under",
    ]) {
      expect(seen.has(secret)).toBe(false);
    }
    const { player, rival } = run.match!.sides;
    expect(view.match).not.toHaveProperty("deck");
    expect(view.match?.deckCount).toBe(player.deck.length);
    expect(Object.keys(view.match!.rival).sort()).toEqual(
      [
        "board",
        "deckCount",
        "discardCount",
        "essence",
        "handCount",
        "last",
        "level",
        "relics",
        "score",
        "tray",
        "turnsLeft",
      ].sort(),
    );
    expect(view.match?.rival.deckCount).toBe(rival.deck.length);
    // The rival has kept: its hand is counted, and none of it is named.
    expect(rival.hand.length).toBeGreaterThan(0);
    expect(view.match?.rival.handCount).toBe(rival.hand.length);
  });

  it("shows the rival's board with its tucked cats face down", () => {
    const state = structuredClone(run.match!);
    state.sides.rival.board.den.push({
      catId: "duskmew",
      yarn: 1,
      cached: 0,
      tucked: 2,
      under: ["flameclaw", "hadu"],
    });
    const view = toMatchView(state);
    expect(view.rival.board.den).toEqual([
      { catId: "duskmew", yarn: 1, cached: 0, tucked: 2 },
    ]);
    expect(JSON.stringify(view.rival)).not.toContain("hadu");
    expect(view.rival.score.total).toBe(1 + 1 + 2);
    expect(view.rival.level).toBe(0);
    expect(view.rival.relics).toEqual(["briar-charm"]);
  });

  it("lists the run deck in a fixed order", () => {
    const view = toRunView(run);
    expect(view.deck).toEqual([...run.deck].sort());
    expect(view.deck).toHaveLength(run.deck.length);
    expect(view.gauntlet).toHaveLength(6);
  });

  it("offers nothing playable during setup", () => {
    const view = toMatchView(run.match!);
    expect(view.phase).toBe("setup");
    expect(view.playable).toEqual([]);
    expect(view.canReroll).toBe(false);
  });

  it("carries what the UI needs to offer legal moves", () => {
    const { state } = applyAction(run.match!, {
      type: "keep",
      cats: [0, 1, 2],
      essence: ["volt", "flame"],
    });
    const view = toMatchView(state);
    expect(view.playable).toHaveLength(3);
    expect(view.playable.flat().every((row) => ROWS.includes(row))).toBe(true);
    expect(view.rewards).toEqual({ hunt: 1, den: 2, prowl: 1 });
    expect(view.yarnCosts).toEqual({ hunt: 0, den: 0, prowl: 0 });
    expect(view.prowlPicks).toBe(1);
    expect(view.standing).toMatchObject({ goalId: state.goals[0], player: 0 });
    expect(view.score.total).toBe(0);
    expect(view.lead).toBe("player");
    expect(view.turnsLeft).toBe(5);
    expect(view.rival.turnsLeft).toBe(5);
  });

  it("offers a play that only a swap pays for, and not one out of reach", () => {
    const { state } = applyAction(run.match!, {
      type: "keep",
      cats: [0, 1, 2],
      essence: ["volt", "flame"],
    });
    const none = { flame: 0, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 };
    const view = (flame: number) =>
      toMatchView(
        withPlayer(state, { hand: ["mistpaw"], essence: { ...none, flame } }),
      );
    expect(view(2).playable).toEqual([["prowl"]]);
    expect(view(1).playable).toEqual([[]]);
  });

  it("marks a full row as unplayable", () => {
    const cat = { catId: "sparkmew", yarn: 0, cached: 0, tucked: 0 };
    const view = toMatchView(
      withPlayer(run.match!, {
        board: { hunt: [], den: [cat, cat, cat, cat], prowl: [] },
      }),
    );
    expect(view.yarnCosts.den).toBeNull();
    expect(view.rewards.den).toBe(4);
  });
});
