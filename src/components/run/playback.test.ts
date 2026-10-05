import { describe, expect, it } from "vitest";

import { rivalPolicy } from "~/server/game/bot";
import { CAT_LIST, getCat } from "~/server/game/cats";
import { advance, openMatch } from "~/server/game/duel";
import {
  legalActions,
  ROUND_TURNS,
  type Action,
  type MatchState as Match,
} from "~/server/game/match";
import { themeOf } from "~/server/game/rivalDecks";
import { createRng } from "~/server/game/rng";
import { starterDeck } from "~/server/game/clans";
import {
  flatten,
  lift,
  soloActions,
  soloMatch,
  type Solo as MatchState,
} from "~/server/game/solo";
import { toMatchView, toRivalBeat } from "~/server/game/view";

import { describeEvents } from "./describe";
import { FLIGHT_MS } from "./flight";
import {
  buildSteps,
  chainEnd,
  OPENING_MS,
  STEP_FLOOR_MS,
  STEP_MS,
  stepDuration,
  type Frame,
} from "./playback";

/**
 * A table already in play, with these cats on the player's board. The
 * player's seat is laid flat, as these tests read it; a real rival sits
 * opposite and answers every turn.
 */
function dealt(
  board: Partial<Record<"hunt" | "den" | "prowl", string[]>> = {},
  relics: string[] = [],
): MatchState {
  const base = soloMatch({
    seed: "playback-test",
    deck: starterDeck("flame"),
    relics,
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

/** One action of the player's and the rival's answer, as the table plays it. */
function turnOf(match: Match, action: Action, chainStart = 0) {
  const { state: next, events, trail } = advance(match, action, rivalPolicy);
  const before = toMatchView(match);
  const after = toMatchView(next);
  const beats = trail.slice(1).map(toRivalBeat);
  return {
    next,
    before,
    after,
    events,
    beats,
    frames: buildSteps(before, after, action, events, chainStart, beats),
  };
}

function play(state: MatchState, action: Action, chainStart = 0) {
  const rivalTurns = state.phase === "setup" ? 0 : state.turnsLeft;
  const turn = turnOf(lift(state, rivalTurns), action, chainStart);
  return { ...turn, next: flatten(turn.next) };
}

/** A whole match against a rival of the gauntlet, dealt and waiting on a keep. */
function matchAgainst(
  seed: string,
  rivalId = "alley-tom",
  level = 0,
  relics: string[] = [],
  clan: "flame" | "shade" = "flame",
): Match {
  return openMatch(
    {
      seed,
      rivalId,
      level,
      player: { deck: starterDeck(clan), relics },
      rival: { deck: starterDeck(themeOf(rivalId)), relics: [] },
    },
    rivalPolicy,
  ).state;
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
    const state = soloMatch({
      seed: "playback-keep",
      deck: starterDeck("flame"),
      relics: [],
    });
    const { after, frames } = play(state, {
      type: "keep",
      cats: [0, 1, 2],
      essence: ["flame", "mist"],
    });
    expect(frames).toHaveLength(1);
    expect(frames[0]?.view).toBe(after);
  });

  it("opens a trade with what it was paid with already spent", () => {
    const base = dealt({ hunt: ["thornkit"], den: ["bramblepaw"] });
    const den = base.board.den[0];
    if (!den) throw new Error("no cat in the Den");
    den.yarn = 2;
    const state = { ...base, essence: { ...base.essence, mist: 1 } };

    const hunt = play(state, { type: "hunt", dice: [0, 1], trade: 0 });
    expect(hunt.frames[0]?.view.hand).toEqual(state.hand.slice(1));
    expect(hunt.frames[0]?.view.feeder).toHaveLength(3);
    expect(hunt.frames[0]?.cue.delta.hand).toBe(-1);

    const slot = { row: "den" as const, col: 0 };
    const laid = play(state, {
      type: "den",
      targets: [slot, slot, slot],
      trade: "mist",
    });
    expect(laid.frames[0]?.cue.delta.food.mist).toBe(-1);
    expect(laid.frames[0]?.cue.delta.yarn).toBe(3);

    const prowled = play(
      { ...state, board: { ...state.board, prowl: state.board.hunt } },
      { type: "prowl", picks: [0, "deck"], trade: slot },
    );
    expect(prowled.frames[0]?.view.board.den[0]?.yarn).toBe(1);
    expect(prowled.frames[0]?.cue.delta.hand).toBe(2);
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
    const action = soloActions(state).find((a) => a.type === "play");
    if (action?.type !== "play") throw new Error("nothing to play");
    const catId = state.hand[action.hand];
    const { before, frames } = play(state, action);
    const first = frames[0]?.view;
    expect(first?.board[action.row].at(-1)?.catId).toBe(catId);
    expect(first?.hand).toHaveLength(before.hand.length - 1);
    const paid = Object.values(first?.essence ?? {}).reduce((a, b) => a + b, 0);
    expect(paid).toBe(18 - getCat(catId ?? "").cost.length);
  });

  it("pays a short play with the swap it was sent with", () => {
    const state: MatchState = {
      ...dealt(),
      hand: ["flameclaw"],
      essence: { flame: 0, mist: 1, volt: 2, thorn: 0, shade: 0, wild: 0 },
    };
    const { frames } = play(state, {
      type: "play",
      hand: 0,
      row: "hunt",
      swap: ["volt", "volt"],
    });
    expect(frames[0]?.view.essence).toMatchObject({ mist: 1, volt: 0 });
    expect(frames[0]?.view.board.hunt.at(-1)).toMatchObject({
      catId: "flameclaw",
      under: [],
    });
  });

  it("shows which cat went under, from the deck and from the hand", () => {
    const deck = play(dealt({ prowl: ["duskmew"] }), {
      type: "prowl",
      picks: ["deck"],
    });
    const under = deck.after.board.prowl[0]?.under ?? [];
    expect(under).toHaveLength(1);
    const fired = deck.frames.find((frame) => frame.firing !== null);
    expect(fired?.view.board.prowl[0]?.under).toEqual(under);
    expect(fired?.text).toBe(
      `Duskmew tucked ${getCat(under[0] ?? "").name} from the deck.`,
    );

    const paused = play(dealt({ prowl: ["voltwhisk"] }), {
      type: "prowl",
      picks: ["deck"],
    });
    expect(paused.after.pending?.kind).toBe("tuckHand");
    const chosen = paused.after.hand[0];
    const answered = play(paused.next, { type: "resolve", choice: 0 });
    expect(answered.frames[0]?.view.board.prowl[0]?.under).toEqual([chosen]);
  });

  it("fires an activated row from right to left, one frame a power", () => {
    expect(ACTIVATED.length).toBeGreaterThan(0);
    const row = ["hunt", "den", "prowl"] as const;
    for (const lane of row) {
      const cats = ACTIVATED.filter((id) => getCat(id).rows.includes(lane));
      if (cats.length < 2) continue;
      const state = dealt({ [lane]: cats.slice(0, 3) });
      const action = soloActions(state).find((a) => a.type === lane);
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

  it("fires a row twice over for an encore, and settles where the server does", () => {
    const state = dealt({ prowl: ["duskmew", "pyrelynx", "hadu", "mistpaw"] });
    const { before, after, events, frames } = play(state, {
      type: "prowl",
      picks: ["deck", "deck", "deck"],
    });
    const fired = frames.flatMap((f) => (f.firing ? [f.firing.col] : []));
    // The last is Hadu's relic, bringing its treat as the turn ends.
    expect(fired).toEqual([3, 2, 1, 0, 3, 1, 0, 2]);
    const treat = frames.filter((f) => f.firing).at(-1);
    expect(treat?.text).toBe("Hadu's relic brought 1 Treat.");
    expect(treat?.view.essence.wild).toBe(before.essence.wild + 1);

    const settled = frames[frames.length - 2]?.view;
    expect(settled?.board).toEqual(after.board);
    expect(settled?.essence).toEqual(after.essence);
    expect(settled?.hand).toEqual(after.hand);
    expect(after.board.prowl[1]?.cached).toBe(2);

    // Duskmew takes one cat under it at each of its two firings.
    const duskmew = frames.filter((f) => f.firing?.col === 0);
    expect(duskmew.map((f) => f.view.board.prowl[0]?.tucked)).toEqual([1, 2]);

    // Each of Duskmew's two firings names the cat that one tucked.
    const under = (after.board.prowl[0]?.under ?? []).map(
      (id) => getCat(id).name,
    );
    expect(under).toHaveLength(2);
    const lines = describeEvents(before, after, events).map((l) => l.text);
    expect(lines).toContain("Hadu set the rest of the Prowl off again.");
    expect(lines.filter((text) => text.startsWith("Duskmew tucked"))).toEqual(
      under.map((name) => `Duskmew tucked ${name} from the deck.`),
    );
  });

  it("pays a discounted cost on the first frame", () => {
    const state: MatchState = {
      ...dealt({ den: ["nyxaroth"] }),
      hand: ["pyrelynx"],
      essence: { flame: 2, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 },
    };
    const { after, frames } = play(state, {
      type: "play",
      hand: 0,
      row: "prowl",
    });
    expect(frames[0]?.view.essence.flame).toBe(0);
    expect(after.essence.flame).toBe(0);
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
      let state = matchAgainst(`playback-${seed}`);
      for (let guard = 0; guard < 200 && state.phase !== "over"; guard++) {
        const action = rng.pick(legalActions(state));
        const { next, after, frames } = turnOf(state, action);
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

/** Random play through whole matches, with the frames of every action. */
function eachTurn(
  relics: string[],
  visit: (turn: ReturnType<typeof turnOf>, where: string) => void,
): void {
  for (const seed of ["a", "b", "c", "d", "e", "f"]) {
    const rng = createRng(`cue-${seed}`);
    let state =
      seed < "d"
        ? matchAgainst(`cue-${seed}`, "alley-tom", 0, relics)
        : matchAgainst(`cue-${seed}`, "the-archivist", 6, relics, "shade");
    for (let guard = 0; guard < 200 && state.phase !== "over"; guard++) {
      const action = rng.pick(legalActions(state));
      const turn = turnOf(state, action);
      visit(turn, `${seed} step ${state.step} ${JSON.stringify(action)}`);
      state = turn.next;
    }
    expect(state.phase).toBe("over");
  }
}

describe("the score through a turn", () => {
  it("has reached the server's on the frame before the last, both sides", () => {
    let ended = 0;
    eachTurn(
      ["ember-charm", "hoarders-basket", "quiet-corner"],
      (turn, where) => {
        const { after, frames } = turn;
        if (frames.length < 2) return;
        const settled = frames[frames.length - 2]!.view;
        expect(settled.score, where).toEqual(after.score);
        expect(settled.rival.score, where).toEqual(after.rival.score);
        expect(settled.rival, where).toEqual(after.rival);
        expect(settled.goalResults, where).toEqual(after.goalResults);
        if (after.result) {
          ended += 1;
          expect(settled.score, where).toEqual(after.result.player);
          expect(settled.rival.score, where).toEqual(after.result.rival);
        }
      },
    );
    expect(ended).toBe(6);
  }, 30_000);

  it("never jumps: every frame's totals differ by what its cue says", () => {
    eachTurn(["dusk-charm"], ({ before, frames }, where) => {
      let prev = before;
      for (const frame of frames.slice(0, -1)) {
        const { delta } = frame.cue;
        expect(frame.view.score.total - prev.score.total, where).toBe(
          delta.score,
        );
        expect(
          frame.view.rival.score.total - prev.rival.score.total,
          where,
        ).toBe(delta.rival);
        expect(frame.view.hand.length - prev.hand.length, where).toBe(
          delta.hand,
        );
        expect(delta.slots.reduce((sum, slot) => sum + slot.yarn, 0)).toBe(
          delta.yarn,
        );
        prev = frame.view;
      }
    });
  });

  it("climbs as a chain lays yarn, one frame a power", () => {
    // Pyrelynx caches on every firing, and each cached food is a point.
    const state = dealt({ prowl: ["duskmew", "pyrelynx", "hadu", "mistpaw"] });
    const { before, after, frames } = play(state, {
      type: "prowl",
      picks: ["deck", "deck", "deck"],
    });
    const totals = frames.map((frame) => frame.view.score.total);
    expect(totals[0]).toBe(before.score.total);
    expect(totals.at(-1)).toBe(after.score.total);
    expect(after.score.total).toBeGreaterThan(before.score.total);
    const fired = frames.filter((frame) => frame.firing);
    const climbed = fired.map((frame) => frame.cue.delta.score);
    expect(climbed.every((n) => n >= 0)).toBe(true);
    expect(climbed.filter((n) => n > 0).length).toBeGreaterThanOrEqual(4);
    expect(climbed.reduce((sum, n) => sum + n, 0)).toBe(
      after.score.total - before.score.total,
    );
  });

  it("pays a goal to both sides on the goal's own frame", () => {
    let goals = 0;
    eachTurn([], ({ frames, events }, where) => {
      const event = events.find((e) => e.type === "goal");
      const at = frames.findIndex((frame) => frame.cue.kind === "goal");
      if (event?.type !== "goal") return expect(at, where).toBe(-1);
      goals += 1;
      const frame = frames[at]!;
      const prev = frames[at - 1]!;
      expect(frame.cue.delta.score, where).toBe(event.playerPoints);
      expect(frame.cue.delta.rival, where).toBe(event.rivalPoints);
      expect(frame.view.goalResults, where).toHaveLength(
        prev.view.goalResults.length + 1,
      );
      expect(frame.cue.won, where).toBe(
        event.playerPoints === event.rivalPoints
          ? null
          : event.playerPoints > event.rivalPoints,
      );
      // The rival's move that closed the round paid it no goal points:
      // those land with the goal's own frame.
      expect(prev.view.rival.score.goals, where).toBe(
        frame.view.rival.score.goals - event.rivalPoints,
      );
    });
    // Six matches, a goal a round.
    expect(goals).toBe(6 * 4);
  }, 30_000);
});

describe("cues", () => {
  it("names the player's own move on the first frame", () => {
    const hunt = play(dealt(), { type: "hunt", dice: [0] });
    const face = dealt().feeder[0]!;
    expect(hunt.frames[0]?.cue).toMatchObject({
      kind: "hunt",
      slot: null,
      chain: 0,
      fizzled: false,
    });
    expect(hunt.frames[0]?.cue.delta.food[face]).toBe(1);

    // The second column costs a yarn, paid off the cat already there.
    const state: MatchState = {
      ...dealt(),
      board: {
        hunt: [{ catId: "flameclaw", yarn: 1, cached: 0, tucked: 0 }],
        den: [],
        prowl: [],
      },
      hand: ["flameclaw"],
      essence: { flame: 3, mist: 0, volt: 0, thorn: 0, shade: 0, wild: 0 },
    };
    const played = play(state, { type: "play", hand: 0, row: "hunt" });
    const cue = played.frames[0]?.cue;
    expect(cue).toMatchObject({ kind: "play", slot: { row: "hunt", col: 1 } });
    expect(cue?.delta.hand).toBe(-1);
    expect(cue?.delta.slots).toEqual([
      { row: "hunt", col: 0, yarn: -1, cached: 0, tucked: 0 },
    ]);
    expect(cue?.delta.score).toBe(getCat("flameclaw").points - 1);
  });

  it("ends on a settle that changes nothing", () => {
    eachTurn([], ({ frames }) => {
      const cue = last(frames).cue;
      expect(cue.kind).toBe("settle");
      expect(cue.delta.score).toBe(0);
      expect(cue.delta.slots).toEqual([]);
      expect(cue.fizzled).toBe(false);
    });
  });

  it("counts a chain up through an encore row, power by power", () => {
    const state = dealt({ prowl: ["duskmew", "pyrelynx", "hadu", "mistpaw"] });
    const { frames } = play(state, {
      type: "prowl",
      picks: ["deck", "deck", "deck"],
    });
    const fired = frames.filter((frame) => frame.firing);
    expect(fired.map((frame) => frame.cue.kind)).toEqual([
      ...Array.from({ length: 7 }, () => "power"),
      "aura",
    ]);
    expect(fired.map((frame) => frame.cue.effect)).toEqual([
      getCat("mistpaw").power?.effect.kind,
      "encore",
      "cache",
      "tuckDeck",
      getCat("mistpaw").power?.effect.kind,
      "cache",
      "tuckDeck",
      null,
    ]);
    // Nothing here fizzles, so every firing is one step further up.
    expect(fired.every((frame) => !frame.cue.fizzled)).toBe(true);
    expect(fired.map((frame) => frame.cue.chain)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
    expect(fired.map((frame) => frame.cue.slot?.col)).toEqual([
      3, 2, 1, 0, 3, 1, 0, 2,
    ]);
    expect(last(frames).cue.chain).toBe(8);
    const rival = frames.find((frame) => frame.cue.kind === "rival");
    expect(rival?.cue.rivalMove).not.toBeNull();
    expect(rival?.cue.chain).toBe(8);
  });

  it("does not climb for a power that changed nothing", () => {
    // A cat already holding all the yarn it can has no room for more.
    const cat = CAT_LIST.find(
      (c) =>
        c.power?.timing === "activated" &&
        c.power.effect.kind === "yarnSelf" &&
        c.rows.includes("den"),
    );
    if (!cat) throw new Error("no cat lays yarn on itself in the Den");
    const base = dealt({ den: [cat.id, cat.id] });
    const state: MatchState = {
      ...base,
      board: {
        ...base.board,
        den: [
          { catId: cat.id, yarn: cat.yarnCap, cached: 0, tucked: 0 },
          { catId: cat.id, yarn: 0, cached: 0, tucked: 0 },
        ],
      },
    };
    const { frames } = play(state, { type: "den", targets: [] });
    const fired = frames.filter((frame) => frame.cue.kind === "power");
    expect(fired.map((frame) => frame.cue.slot?.col)).toEqual([1, 0]);
    expect(fired.map((frame) => frame.cue.fizzled)).toEqual([false, true]);
    expect(fired.map((frame) => frame.cue.chain)).toEqual([0, 1]);
    expect(last(frames).cue.chain).toBe(1);
  });

  it("carries the chain across a choice answered in the middle of it", () => {
    // Voltwhisk stops the Prowl for a tuck; Mistpaw fires before it.
    const state = dealt({ prowl: ["voltwhisk", "mistpaw"] });
    const asked = play(state, { type: "prowl", picks: ["deck", "deck"] });
    expect(asked.after.pending?.kind).toBe("tuckHand");
    const fired = asked.frames.filter((frame) => frame.cue.kind === "power");
    expect(fired.map((frame) => frame.cue.chain)).toEqual([0, 1]);
    // The power that stops for the choice has not fizzled.
    expect(fired.at(-1)?.cue).toMatchObject({
      effect: "tuckHand",
      fizzled: false,
    });
    const reached = chainEnd(
      asked.before,
      asked.after,
      { type: "prowl", picks: ["deck", "deck"] },
      asked.events,
    );
    expect(reached).toBe(2);
    expect(last(asked.frames).cue.chain).toBe(reached);

    const answered = play(asked.next, { type: "resolve", choice: 0 }, reached);
    expect(answered.frames[0]?.cue).toMatchObject({
      kind: "resolve",
      slot: { row: "prowl", col: 0 },
      chain: 2,
    });
    expect(answered.frames[0]?.cue.delta.tucked).toBe(1);
    expect(answered.frames.every((frame) => frame.cue.chain >= 2)).toBe(true);
    // Left to its default, the answer would start the chain over.
    expect(
      play(asked.next, { type: "resolve", choice: 0 }).frames[0]?.cue.chain,
    ).toBe(0);
  });

  it("says who a rival's move and the end of the match belong to", () => {
    let overs = 0;
    eachTurn([], ({ frames, after }, where) => {
      const flips = frames.filter((frame) => frame.cue.kind === "rival");
      for (const flip of flips) {
        expect(flip.cue.rivalMove, where).not.toBeNull();
        expect(flip.flipping, where).toBe(true);
        expect(flip.tone, where).toBe("rival");
      }
      const over = frames.find((frame) => frame.cue.kind === "over");
      if (!over) return;
      overs += 1;
      expect(over.cue.won, where).toBe(after.result?.won);
      expect(frames.indexOf(over), where).toBe(frames.length - 2);
    });
    expect(overs).toBe(6);
  });
});

describe("stepDuration", () => {
  const chain = () =>
    play(dealt({ prowl: ["duskmew", "pyrelynx", "hadu", "mistpaw"] }), {
      type: "prowl",
      picks: ["deck", "deck", "deck"],
    }).frames;

  it("waits on nothing once the last frame is up", () => {
    const frames = chain();
    expect(stepDuration(frames, frames.length - 1)).toBe(0);
    expect(stepDuration(frames, frames.length)).toBe(0);
    expect(stepDuration([], 0)).toBe(0);
  });

  it("lets the opening frame outlast a piece in flight", () => {
    const frames = chain();
    expect(stepDuration(frames, 0)).toBe(OPENING_MS);
    expect(OPENING_MS).toBeGreaterThan(FLIGHT_MS);
  });

  it("speeds a chain up, one power after another, down to a floor", () => {
    const frames = chain();
    const holds = frames
      .map((frame, index) => ({ frame, hold: stepDuration(frames, index) }))
      .filter(({ frame }) => frame.firing)
      .map(({ hold }) => hold);
    expect(holds[0]).toBe(STEP_MS);
    for (let i = 1; i < holds.length; i++) {
      expect(holds[i]).toBeLessThanOrEqual(holds[i - 1]!);
      expect(holds[i]).toBeGreaterThanOrEqual(STEP_FLOOR_MS);
    }
    expect(holds.at(-1)).toBe(STEP_FLOOR_MS);
    expect(holds[3]).toBeLessThan(holds[0]! * 0.75);
  });

  it("never drops under the floor, however long the chain", () => {
    const frames = play(
      dealt({ prowl: ["duskmew", "pyrelynx", "hadu", "mistpaw"] }),
      { type: "prowl", picks: ["deck", "deck", "deck"] },
      40,
    ).frames;
    for (let i = 0; i < frames.length - 1; i++) {
      expect(stepDuration(frames, i)).toBeGreaterThanOrEqual(STEP_FLOOR_MS);
    }
  });

  it("gives the rival's card and a goal a beat, and holds the end", () => {
    const seen = new Map<string, Set<number>>();
    eachTurn([], ({ frames }) => {
      frames.forEach((frame, index) => {
        const kind = frame.cue.kind;
        seen.set(
          kind,
          (seen.get(kind) ?? new Set()).add(stepDuration(frames, index)),
        );
      });
    });
    const only = (kind: string) => {
      const holds = [...(seen.get(kind) ?? [])];
      expect(holds, kind).toHaveLength(1);
      return holds[0]!;
    };
    expect(only("rival")).toBeGreaterThan(STEP_MS);
    expect(only("goal")).toBeGreaterThan(only("rival"));
    expect(only("over")).toBeGreaterThanOrEqual(1000);
    expect(only("feeder")).toBe(STEP_MS);
    expect(only("den")).toBe(STEP_MS);
    expect(only("settle")).toBe(0);
  });
});
