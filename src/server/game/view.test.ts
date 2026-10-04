import { describe, expect, it } from "vitest";

import { ROWS } from "./cats";
import { applyAction } from "./match";
import { startRun } from "./run";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";
import { toMatchView, toRunView } from "./view";

const run = startRun({
  seed: "top-secret-seed",
  clanId: "volt",
  pool: poolFromUnlocks(STARTING_UNLOCKS),
});

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
  it("never carries the seed, the deck order, or the rival's deck", () => {
    const view = toRunView(run);
    const json = JSON.stringify(view);
    expect(json).not.toContain("top-secret-seed");
    const seen = keys(view);
    for (const secret of ["seed", "queue", "discard", "pool"]) {
      expect(seen.has(secret)).toBe(false);
    }
    expect(view.match).not.toHaveProperty("deck");
    expect(view.match?.rival).not.toHaveProperty("deck");
    expect(view.match?.deckCount).toBe(run.match!.deck.length);
    expect(view.match?.rival.deckCount).toBe(10);
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
    expect(view.rival.bankValue).toBe(2);
  });

  it("offers a play that only a swap pays for, and not one out of reach", () => {
    const { state } = applyAction(run.match!, {
      type: "keep",
      cats: [0, 1, 2],
      essence: ["volt", "flame"],
    });
    const none = { flame: 0, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 };
    const view = (flame: number) =>
      toMatchView({
        ...state,
        hand: ["mistpaw"],
        essence: { ...none, flame },
      });
    expect(view(2).playable).toEqual([["prowl"]]);
    expect(view(1).playable).toEqual([[]]);
  });

  it("marks a full row as unplayable", () => {
    const cat = { catId: "sparkmew", yarn: 0, cached: 0, tucked: 0 };
    const view = toMatchView({
      ...run.match!,
      board: { hunt: [], den: [cat, cat, cat, cat], prowl: [] },
    });
    expect(view.yarnCosts.den).toBeNull();
    expect(view.rewards.den).toBe(4);
  });
});
