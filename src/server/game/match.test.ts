import { describe, expect, it } from "vitest";

import type { RivalAction } from "./cats";
import {
  applyAction,
  canReroll,
  createMatch,
  emptyPool,
  goalStanding,
  IllegalAction,
  legalActions,
  payCost,
  playerScore,
  rivalScore,
  type Essence,
  type MatchEvent,
  type MatchState,
  type PlacedCat,
} from "./match";
import { createRng } from "./rng";
import { starterDeck } from "./run";
import { randomBot } from "./sim";

const ALL_FACES: Essence[] = ["flame", "mist", "volt", "thorn", "shade"];

function fresh(seed = "t", relics: string[] = []): MatchState {
  return createMatch({
    seed,
    deck: starterDeck("flame"),
    relics,
    rivalId: "alley-tom",
  });
}

/** A mid-turn state whose rival will flip `rivalCard` next. */
function turnState(
  overrides: Partial<MatchState> = {},
  rivalCard: RivalAction = "bank",
): MatchState {
  const base = fresh();
  return {
    ...base,
    phase: "turn",
    setup: [],
    turnsLeft: 5,
    feeder: [...ALL_FACES],
    rival: { ...base.rival, deck: Array.from({ length: 10 }, () => rivalCard) },
    ...overrides,
  };
}

const placed = (catId: string, extra: Partial<PlacedCat> = {}): PlacedCat => ({
  catId,
  yarn: 0,
  cached: 0,
  tucked: 0,
  ...extra,
});

const pool = (extra: Partial<Record<Essence, number>>) => ({
  ...emptyPool(),
  ...extra,
});

const powers = (events: MatchEvent[]) =>
  events.flatMap((e) => (e.type === "power" ? [e.catId] : []));

describe("createMatch", () => {
  it("deals the setup, the tray and the feeder", () => {
    const state = fresh();
    expect(state.phase).toBe("setup");
    expect(state.setup).toHaveLength(5);
    expect(state.tray).toHaveLength(3);
    expect(state.deck).toHaveLength(8);
    expect(state.feeder).toHaveLength(5);
    expect(new Set(state.goals).size).toBe(3);
    expect(state.rival.deck).toHaveLength(10);
  });

  it("is deterministic for a seed and varies across seeds", () => {
    expect(fresh("a")).toEqual(fresh("a"));
    const orders = new Set(
      ["a", "b", "c", "d"].map((seed) => fresh(seed).deck.join(",")),
    );
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe("setup", () => {
  it("keeps cats and essence, discards the rest, and starts round one", () => {
    const state = fresh();
    const { state: next } = applyAction(state, {
      type: "keep",
      cats: [0, 2, 4],
      essence: ["flame", "mist"],
    });
    expect(next.hand).toEqual([state.setup[0], state.setup[2], state.setup[4]]);
    expect(next.discard).toEqual([state.setup[1], state.setup[3]]);
    expect(next.essence).toEqual(pool({ flame: 1, mist: 1 }));
    expect(next.phase).toBe("turn");
    expect(next.turnsLeft).toBe(5);
    // Keeping is not a turn: the rival has not acted.
    expect(next.rival.deck).toHaveLength(10);
  });

  it("rejects anything but exactly five", () => {
    const state = fresh();
    expect(() =>
      applyAction(state, { type: "keep", cats: [0, 1], essence: ["flame"] }),
    ).toThrow(IllegalAction);
    expect(() =>
      applyAction(state, {
        type: "keep",
        cats: [0, 0, 1],
        essence: ["flame", "mist"],
      }),
    ).toThrow(IllegalAction);
    expect(() => applyAction(state, { type: "hunt", dice: [0] })).toThrow(
      IllegalAction,
    );
  });

  it("applies start-of-match relics", () => {
    const state = fresh("t", ["warm-saucer", "early-riser"]);
    const { state: next } = applyAction(state, {
      type: "keep",
      cats: [0, 1, 2, 3, 4],
      essence: [],
    });
    expect(next.essence.wild).toBe(1);
    expect(next.turnsLeft).toBe(6);
  });
});

describe("payCost", () => {
  it("pays element pips with the element, then wild", () => {
    expect(payCost(pool({ flame: 1 }), ["flame"])).toEqual(pool({}));
    expect(payCost(pool({ wild: 1 }), ["flame"])).toEqual(pool({}));
    expect(payCost(pool({ mist: 3 }), ["flame"])).toBeNull();
  });

  it("pays any pips from the fullest element and keeps wild for last", () => {
    expect(payCost(pool({ mist: 2, volt: 1, wild: 1 }), ["any"])).toEqual(
      pool({ mist: 1, volt: 1, wild: 1 }),
    );
    expect(payCost(pool({ wild: 1 }), ["any"])).toEqual(pool({}));
    expect(payCost(pool({ flame: 1 }), ["flame", "any"])).toBeNull();
  });
});

describe("play", () => {
  it("pays the cost, places the cat, and hands the turn to the rival", () => {
    const state = turnState({
      hand: ["flameclaw"],
      essence: pool({ flame: 1 }),
    });
    const { state: next, events } = applyAction(state, {
      type: "play",
      hand: 0,
      row: "hunt",
    });
    expect(next.board.hunt).toEqual([placed("flameclaw")]);
    expect(next.hand).toEqual([]);
    expect(next.essence.flame).toBe(0);
    expect(next.turnsLeft).toBe(4);
    expect(next.rival.banked).toBe(1);
    expect(events.map((e) => e.type)).toEqual(["played", "rival"]);
  });

  it("rejects the wrong row, an unpaid cost, and a full row", () => {
    const state = turnState({
      hand: ["flameclaw"],
      essence: pool({ flame: 1 }),
    });
    expect(() =>
      applyAction(state, { type: "play", hand: 0, row: "den" }),
    ).toThrow(IllegalAction);
    expect(() =>
      applyAction(
        { ...state, essence: emptyPool() },
        { type: "play", hand: 0, row: "hunt" },
      ),
    ).toThrow(IllegalAction);
    const full = {
      ...state,
      board: {
        ...state.board,
        hunt: Array.from({ length: 4 }, () => placed("flameclaw", { yarn: 3 })),
      },
    };
    expect(() =>
      applyAction(full, { type: "play", hand: 0, row: "hunt" }),
    ).toThrow(IllegalAction);
  });

  it("charges yarn for later columns, from the cat holding the most", () => {
    const board = {
      hunt: [placed("flameclaw", { yarn: 1 })],
      den: [placed("sparkmew", { yarn: 2 })],
      prowl: [],
    };
    const state = turnState({
      hand: ["flameclaw"],
      essence: pool({ flame: 1 }),
      board,
    });
    const { state: next } = applyAction(state, {
      type: "play",
      hand: 0,
      row: "hunt",
    });
    expect(next.board.den[0]?.yarn).toBe(1);
    expect(next.board.hunt[0]?.yarn).toBe(1);

    const broke = {
      ...state,
      board: { hunt: [placed("flameclaw")], den: [], prowl: [] },
    };
    expect(() =>
      applyAction(broke, { type: "play", hand: 0, row: "hunt" }),
    ).toThrow(/yarn/);
  });

  it("discounts column yarn with Soft Landing", () => {
    const base = fresh("t", ["soft-landing"]);
    const state: MatchState = {
      ...turnState({ hand: ["flameclaw"], essence: pool({ flame: 1 }) }),
      mods: base.mods,
      board: { hunt: [placed("flameclaw")], den: [], prowl: [] },
    };
    expect(() =>
      applyAction(state, { type: "play", hand: 0, row: "hunt" }),
    ).not.toThrow();
  });

  it("fires a when-played power", () => {
    const state = turnState({ hand: ["emberkit"], essence: pool({ mist: 1 }) });
    const { state: next, events } = applyAction(state, {
      type: "play",
      hand: 0,
      row: "prowl",
    });
    expect(next.hand).toHaveLength(2);
    expect(powers(events)).toEqual(["emberkit"]);
  });
});

describe("hunt", () => {
  it("takes the chosen dice as essence", () => {
    const { state: next } = applyAction(turnState(), {
      type: "hunt",
      dice: [1],
    });
    expect(next.essence).toEqual(pool({ mist: 1 }));
    expect(next.feeder).toEqual(["flame", "volt", "thorn", "shade"]);
  });

  it("fires activated powers from right to left", () => {
    const state = turnState({
      board: {
        hunt: [placed("flameclaw"), placed("burrfang")],
        den: [],
        prowl: [],
      },
    });
    const { state: next, events } = applyAction(state, {
      type: "hunt",
      dice: [0, 1],
    });
    expect(powers(events)).toEqual(["burrfang", "flameclaw"]);
    expect(next.essence).toEqual(pool({ flame: 2, mist: 1, thorn: 1 }));
  });

  it("rerolls the feeder the moment it empties", () => {
    const { state: next, events } = applyAction(
      turnState({ feeder: ["volt"] }),
      {
        type: "hunt",
        dice: [0],
      },
    );
    expect(next.essence.volt).toBe(1);
    expect(next.feeder).toHaveLength(5);
    expect(events.some((e) => e.type === "feeder")).toBe(true);
  });

  it("requires exactly the reward, or every die left", () => {
    expect(() =>
      applyAction(turnState(), { type: "hunt", dice: [0, 1] }),
    ).toThrow(IllegalAction);
    expect(() => applyAction(turnState(), { type: "hunt", dice: [9] })).toThrow(
      IllegalAction,
    );
  });

  it("takes an extra die with Bent Whisker", () => {
    const state = { ...turnState(), mods: fresh("t", ["bent-whisker"]).mods };
    const { state: next } = applyAction(state, { type: "hunt", dice: [0, 1] });
    expect(next.essence).toEqual(pool({ flame: 1, mist: 1 }));
  });
});

describe("reroll", () => {
  it("is free and only allowed when every die matches", () => {
    expect(canReroll(turnState())).toBe(false);
    expect(() => applyAction(turnState(), { type: "reroll" })).toThrow(
      IllegalAction,
    );

    const state = turnState({ feeder: ["mist", "mist"] });
    expect(canReroll(state)).toBe(true);
    const { state: next } = applyAction(state, { type: "reroll" });
    expect(next.feeder).toHaveLength(5);
    expect(next.turnsLeft).toBe(state.turnsLeft);
    expect(next.rival.deck).toHaveLength(10);
  });
});

describe("den", () => {
  it("lays yarn on the chosen cats, then fires the row", () => {
    const state = turnState({
      board: { hunt: [], den: [placed("sparkmew")], prowl: [] },
    });
    const slot = { row: "den", col: 0 } as const;
    const { state: next } = applyAction(state, {
      type: "den",
      targets: [slot, slot],
    });
    // Two from the Den, one from Sparkmew's own power.
    expect(next.board.den[0]?.yarn).toBe(3);
  });

  it("respects the reward and each cat's capacity", () => {
    const state = turnState({
      board: { hunt: [], den: [placed("sparkmew", { yarn: 3 })], prowl: [] },
    });
    const slot = { row: "den", col: 0 } as const;
    expect(() => applyAction(state, { type: "den", targets: [slot] })).toThrow(
      /cannot hold/,
    );
    expect(() =>
      applyAction(turnState(), {
        type: "den",
        targets: [{ row: "hunt", col: 0 }],
      }),
    ).toThrow(IllegalAction);
    expect(() =>
      applyAction(state, { type: "den", targets: [slot, slot, slot, slot] }),
    ).toThrow(IllegalAction);
  });
});

describe("prowl", () => {
  it("takes from the tray or the deck and refills the tray", () => {
    const state = turnState();
    const fromTray = applyAction(state, { type: "prowl", picks: [1] }).state;
    expect(fromTray.hand).toEqual([state.tray[1]]);
    expect(fromTray.tray).toHaveLength(3);

    const fromDeck = applyAction(state, {
      type: "prowl",
      picks: ["deck"],
    }).state;
    expect(fromDeck.hand).toEqual([state.deck[0]]);
    expect(fromDeck.tray).toEqual(state.tray);
  });

  it("requires exactly the reward", () => {
    expect(() =>
      applyAction(turnState(), { type: "prowl", picks: [0, 1] }),
    ).toThrow(IllegalAction);
    expect(() =>
      applyAction(turnState(), { type: "prowl", picks: [] }),
    ).toThrow(IllegalAction);
  });

  it("reshuffles the discard pile when the deck runs out", () => {
    const state = turnState({ deck: [], discard: ["flameclaw"] });
    const { state: next } = applyAction(state, {
      type: "prowl",
      picks: ["deck"],
    });
    expect(next.hand).toEqual(["flameclaw"]);
    expect(next.discard).toEqual([]);
  });
});

describe("pending choices", () => {
  const withVoltwhisk = () =>
    turnState({
      board: { hunt: [], den: [], prowl: [placed("voltwhisk")] },
      hand: ["flameclaw"],
    });

  it("pauses the turn until a tuck is answered", () => {
    const paused = applyAction(withVoltwhisk(), {
      type: "prowl",
      picks: ["deck"],
    }).state;
    expect(paused.phase).toBe("pending");
    expect(paused.pending).toEqual({
      kind: "tuckHand",
      slot: { row: "prowl", col: 0 },
      draw: 1,
    });
    // The rival waits for the answer.
    expect(paused.rival.banked).toBe(0);
    expect(() => applyAction(paused, { type: "hunt", dice: [0] })).toThrow(
      IllegalAction,
    );

    const tucked = applyAction(paused, { type: "resolve", choice: 0 }).state;
    expect(tucked.phase).toBe("turn");
    expect(tucked.board.prowl[0]?.tucked).toBe(1);
    expect(tucked.hand).toHaveLength(2);
    expect(tucked.hand).not.toContain("flameclaw");
    expect(tucked.rival.banked).toBe(1);
  });

  it("lets the player decline", () => {
    const paused = applyAction(withVoltwhisk(), {
      type: "prowl",
      picks: ["deck"],
    }).state;
    const skipped = applyAction(paused, {
      type: "resolve",
      choice: null,
    }).state;
    expect(skipped.board.prowl[0]?.tucked).toBe(0);
    expect(skipped.hand).toHaveLength(2);
    expect(skipped.phase).toBe("turn");
  });

  it("trades yarn for wild essence, and skips the offer with no yarn", () => {
    const board = (yarn: number) => ({
      hunt: [placed("joltpad", { yarn })],
      den: [],
      prowl: [],
    });
    const paused = applyAction(turnState({ board: board(1) }), {
      type: "hunt",
      dice: [0],
    }).state;
    expect(paused.pending?.kind).toBe("trade");
    const traded = applyAction(paused, { type: "resolve", choice: 1 }).state;
    expect(traded.board.hunt[0]?.yarn).toBe(0);
    expect(traded.essence.wild).toBe(1);

    const none = applyAction(turnState({ board: board(0) }), {
      type: "hunt",
      dice: [0],
    }).state;
    expect(none.phase).toBe("turn");
  });
});

describe("the rival", () => {
  it("acts once after every turn and reshuffles its deck", () => {
    let state = turnState();
    state = {
      ...state,
      rival: { ...state.rival, deck: ["stash"], discard: [] },
    };
    state = applyAction(state, { type: "den", targets: [] }).state;
    expect(state.rival.yarn).toBe(1);
    expect(state.rival.deck).toEqual([]);
    state = applyAction(state, { type: "den", targets: [] }).state;
    expect(state.rival.yarn).toBe(2);
  });

  it("raids dice and burns the best tray card", () => {
    const raided = applyAction(turnState({}, "raid"), {
      type: "den",
      targets: [],
    });
    expect(raided.state.feeder).toHaveLength(4);

    const state = turnState(
      { tray: ["emberkit", "bramblepaw", "flameclaw"] },
      "burn",
    );
    const burned = applyAction(state, { type: "den", targets: [] });
    expect(burned.state.discard).toContain("bramblepaw");
    expect(burned.state.tray).toHaveLength(3);
    expect(burned.events).toContainEqual({
      type: "rival",
      action: "burn",
      removed: ["bramblepaw"],
    });
  });

  it("triggers between-turn powers that match its action", () => {
    const board = {
      hunt: [],
      den: [placed("gloomtail"), placed("brumefang")],
      prowl: [],
    };
    const banked = applyAction(turnState({ board }, "bank"), {
      type: "hunt",
      dice: [0],
    }).state;
    expect(banked.board.den[0]?.yarn).toBe(1);
    expect(banked.essence.mist).toBe(0);

    const raided = applyAction(turnState({ board }, "raid"), {
      type: "prowl",
      picks: ["deck"],
    }).state;
    expect(raided.board.den[0]?.yarn).toBe(0);
    expect(raided.essence.mist).toBe(1);
  });

  it("scores banked cats, yarn and goals, and Loud Bell cheapens banks", () => {
    const state = turnState();
    const scored = {
      ...state,
      rival: { ...state.rival, banked: 3, yarn: 2, goalPoints: 5 },
    };
    expect(rivalScore(scored)).toBe(3 * 2 + 2 + 5);
    const belled = {
      ...scored,
      mods: fresh("t", ["loud-bell", "loud-bell"]).mods,
    };
    expect(rivalScore(belled)).toBe(3 * 1 + 2 + 5);
  });
});

describe("rounds and goals", () => {
  it("ends the round after the last turn and fires end-of-round powers", () => {
    const state = turnState({
      turnsLeft: 1,
      goals: ["crowd", "pantry", "pawful"],
      board: { hunt: [], den: [placed("verdantmane")], prowl: [] },
    });
    const { state: next, events } = applyAction(state, {
      type: "hunt",
      dice: [0],
    });
    expect(next.board.den[0]?.yarn).toBe(2);
    expect(next.round).toBe(1);
    expect(next.turnsLeft).toBe(4);
    expect(next.goalResults).toHaveLength(1);
    expect(events.at(-1)?.type).toBe("goal");
  });

  it("scores a goal by comparing the player's count with the rival's tally", () => {
    const base = turnState({ goals: ["crowd", "pantry", "pawful"] });
    const cats = (n: number) => ({
      hunt: Array.from({ length: n }, () => placed("flameclaw")),
      den: [],
      prowl: [],
    });
    // Par for Crowd in round one is 2; Alley Tom has no edge.
    expect(goalStanding(base)).toMatchObject({
      player: 0,
      rival: 2,
      playerPoints: 0,
      rivalPoints: 4,
    });
    expect(goalStanding({ ...base, board: cats(1) })).toMatchObject({
      playerPoints: 1,
      rivalPoints: 4,
    });
    expect(goalStanding({ ...base, board: cats(2) })).toMatchObject({
      playerPoints: 2,
      rivalPoints: 2,
    });
    expect(goalStanding({ ...base, board: cats(3) })).toMatchObject({
      playerPoints: 4,
      rivalPoints: 1,
    });

    const pushed = {
      ...base,
      board: cats(3),
      rival: { ...base.rival, pushes: 2 },
    };
    expect(goalStanding(pushed)).toMatchObject({ rival: 4, playerPoints: 1 });
    const collar = {
      ...base,
      board: cats(2),
      mods: fresh("t", ["lucky-collar"]).mods,
    };
    expect(goalStanding(collar)).toMatchObject({ player: 3, playerPoints: 4 });
  });

  it("finishes after the third round and refuses further actions", () => {
    const state = turnState({
      round: 2,
      turnsLeft: 1,
      board: {
        hunt: [placed("flameclaw", { yarn: 2, cached: 1, tucked: 1 })],
        den: [],
        prowl: [],
      },
    });
    const { state: over, events } = applyAction(state, {
      type: "den",
      targets: [],
    });
    expect(over.phase).toBe("over");
    expect(over.result?.player.total).toBe(playerScore(over).total);
    expect(over.result?.won).toBe(
      over.result!.player.total > over.result!.rival,
    );
    expect(events.at(-1)?.type).toBe("over");
    expect(() => applyAction(over, { type: "den", targets: [] })).toThrow(
      IllegalAction,
    );
    expect(legalActions(over)).toEqual([]);
  });

  it("adds up cats, yarn, caches, tucks, goals and relics", () => {
    const state: MatchState = {
      ...turnState({
        relics: ["ember-charm", "quiet-corner"],
        board: {
          hunt: [placed("flameclaw", { yarn: 2, cached: 1 })],
          den: [placed("pyrelynx", { tucked: 3 })],
          prowl: [],
        },
      }),
    };
    const withGoal = {
      ...state,
      goalResults: [
        {
          goalId: "crowd",
          player: 3,
          rival: 2,
          playerPoints: 4,
          rivalPoints: 1,
        },
      ],
    };
    expect(playerScore(withGoal)).toEqual({
      cats: 6,
      yarn: 2,
      cached: 1,
      tucked: 3,
      goals: 4,
      relics: 2 * 2 + 2,
      total: 22,
    });
  });
});

describe("engine guarantees", () => {
  it("never mutates the state it is given", () => {
    const state = turnState({
      hand: ["flameclaw"],
      essence: pool({ flame: 1 }),
    });
    const before = JSON.stringify(state);
    applyAction(state, { type: "play", hand: 0, row: "hunt" });
    applyAction(state, { type: "hunt", dice: [0] });
    expect(JSON.stringify(state)).toBe(before);
  });

  it("gives the same result for the same state and action", () => {
    const state = turnState({ feeder: ["volt"] });
    const a = applyAction(state, { type: "hunt", dice: [0] });
    const b = applyAction(state, { type: "hunt", dice: [0] });
    expect(a).toEqual(b);
  });

  it("accepts every action it lists, through whole matches", () => {
    for (let seed = 0; seed < 12; seed++) {
      const rng = createRng(`walk-${seed}`);
      let state = fresh(`walk-${seed}`);
      let rivalTurns = 0;
      for (let guard = 0; guard < 300 && state.phase !== "over"; guard++) {
        const actions = legalActions(state);
        expect(actions.length).toBeGreaterThan(0);
        for (const action of actions) {
          expect(() => applyAction(state, action)).not.toThrow();
        }
        const result = applyAction(state, randomBot(state, rng));
        rivalTurns += result.events.filter((e) => e.type === "rival").length;
        state = result.state;
      }
      expect(state.phase).toBe("over");
      expect(rivalTurns).toBe(12);
      expect(state.goalResults).toHaveLength(3);
    }
  });
});
