import { describe, expect, it } from "vitest";

import { getCat } from "~/server/game/cats";
import {
  applyAction,
  createMatch,
  legalActions,
  ROUND_TURNS,
  type Action,
  type MatchState,
} from "~/server/game/match";
import { createRng } from "~/server/game/rng";
import { starterDeck } from "~/server/game/run";
import { toMatchView } from "~/server/game/view";

import { describeEvents } from "./describe";
import { buildSteps, type Frame } from "./playback";

/** A match already in play, with these cats on the board. */
function dealt(
  board: Partial<Record<"hunt" | "den" | "prowl", string[]>> = {},
): MatchState {
  const base = createMatch({
    seed: "playback-test",
    deck: starterDeck("flame"),
    relics: [],
    rivalId: "alley-tom",
  });
  const place = (ids: string[] = []) =>
    ids.map((catId) => ({ catId, yarn: 0, cached: 0, tucked: 0 }));
  return {
    ...base,
    phase: "turn",
    turnsLeft: ROUND_TURNS[0],
    setup: [],
    hand: base.setup,
    board: {
      hunt: place(board.hunt),
      den: place(board.den),
      prowl: place(board.prowl),
    },
  };
}

function play(state: MatchState, action: Action) {
  const { state: next, events } = applyAction(state, action);
  const before = toMatchView(state);
  const after = toMatchView(next);
  return {
    next,
    before,
    after,
    events,
    frames: buildSteps(before, after, action, events),
  };
}

function last(frames: Frame[]): Frame {
  const frame = frames[frames.length - 1];
  if (!frame) throw new Error("no frames");
  return frame;
}

/** Cats whose power fires when their row is activated. */
const ACTIVATED = starterDeck("flame").filter(
  (id, i, all) =>
    all.indexOf(id) === i && getCat(id).power?.timing === "activated",
);

describe("buildSteps", () => {
  it("always ends on the server's view, untouched", () => {
    const state = dealt();
    const { after, frames } = play(state, { type: "hunt", dice: [0] });
    expect(last(frames).view).toBe(after);
    expect(last(frames).firing).toBeNull();
    expect(last(frames).text).toBe("");
  });

  it("is a single frame for the setup keep", () => {
    const state = createMatch({
      seed: "playback-keep",
      deck: starterDeck("flame"),
      relics: [],
      rivalId: "alley-tom",
    });
    const { after, frames } = play(state, {
      type: "keep",
      cats: [0, 1, 2],
      essence: ["flame", "mist"],
    });
    expect(frames).toHaveLength(1);
    expect(frames[0]?.view).toBe(after);
  });

  it("opens with the player's own move: dice leave the feeder for the pool", () => {
    const state = dealt();
    const face = state.feeder[0];
    if (!face) throw new Error("empty feeder");
    const { before, frames } = play(state, { type: "hunt", dice: [0] });
    const first = frames[0];
    expect(first?.view.feeder).toHaveLength(before.feeder.length - 1);
    expect(first?.view.essence[face]).toBe(before.essence[face] + 1);
    expect(first?.lines).toBe(0);
    expect(first?.flipped).toBe(false);
  });

  it("puts a played cat in its space and pays for it on the first frame", () => {
    let state = dealt();
    state = {
      ...state,
      essence: { flame: 3, mist: 3, volt: 3, thorn: 3, shade: 3, wild: 3 },
    };
    const action = legalActions(state).find((a) => a.type === "play");
    if (action?.type !== "play") throw new Error("nothing to play");
    const catId = state.hand[action.hand];
    const { before, frames } = play(state, action);
    const first = frames[0]?.view;
    expect(first?.board[action.row].at(-1)?.catId).toBe(catId);
    expect(first?.hand).toHaveLength(before.hand.length - 1);
    const paid = Object.values(first?.essence ?? {}).reduce((a, b) => a + b, 0);
    expect(paid).toBe(18 - getCat(catId ?? "").cost.length);
  });

  it("fires an activated row from right to left, one frame a power", () => {
    expect(ACTIVATED.length).toBeGreaterThan(0);
    const row = ["hunt", "den", "prowl"] as const;
    for (const lane of row) {
      const cats = ACTIVATED.filter((id) => getCat(id).rows.includes(lane));
      if (cats.length < 2) continue;
      const state = dealt({ [lane]: cats.slice(0, 3) });
      const action = legalActions(state).find((a) => a.type === lane);
      if (!action) throw new Error(`cannot activate ${lane}`);
      const { frames, events } = play(state, action);
      const fired = frames.flatMap((f) => (f.firing ? [f.firing.col] : []));
      const powers = events.flatMap((e) =>
        e.type === "power" && e.row === lane ? [e.col] : [],
      );
      expect(fired.slice(0, powers.length)).toEqual(powers);
      expect(powers).toEqual([...powers].sort((a, b) => b - a));
      return;
    }
    throw new Error("no lane has two activated cats in the starter deck");
  });

  it("flips the rival's card once, after the player's powers", () => {
    const state = dealt();
    const { frames } = play(state, { type: "hunt", dice: [0] });
    const flips = frames.filter((frame) => frame.flipping);
    expect(flips).toHaveLength(1);
    expect(flips[0]?.tone).toBe("rival");
    const at = frames.findIndex((frame) => frame.flipping);
    expect(frames.slice(0, at).every((frame) => !frame.flipped)).toBe(true);
    expect(frames.slice(at).every((frame) => frame.flipped)).toBe(true);
  });

  it("lands one log line a frame and never runs ahead of the log", () => {
    const state = dealt();
    const { before, after, events, frames } = play(state, {
      type: "hunt",
      dice: [0],
    });
    const total = describeEvents(before, after, events).length;
    const counts = frames.map((frame) => frame.lines);
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
    expect(last(frames).lines).toBe(total);
    for (let i = 1; i < frames.length - 1; i++) {
      expect(counts[i]).toBe((counts[i - 1] ?? 0) + 1);
    }
  });

  it("agrees with the server on what the table holds, over whole matches", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      const rng = createRng(`playback-${seed}`);
      let state = createMatch({
        seed: `playback-${seed}`,
        deck: starterDeck("flame"),
        relics: [],
        rivalId: "alley-tom",
      });
      for (let guard = 0; guard < 200 && state.phase !== "over"; guard++) {
        const action = rng.pick(legalActions(state));
        const { next, after, frames } = play(state, action);
        const settled = frames[frames.length - 2]?.view;
        if (settled && after.phase !== "over") {
          const where = `${seed} ${JSON.stringify(action)}`;
          expect(settled.board, where).toEqual(after.board);
          expect(settled.essence, where).toEqual(after.essence);
          expect(settled.hand, where).toEqual(after.hand);
          expect(settled.feeder, where).toEqual(after.feeder);
        }
        state = next;
      }
      expect(state.phase).toBe("over");
    }
  });
});
