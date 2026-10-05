import { describe, expect, it } from "vitest";

import { advance, openMatch, type Policy } from "./duel";
import {
  applyDuel,
  createDuel,
  duelActions,
  duelScore,
  duelStanding,
  emptyPool,
  IllegalAction,
  reactsTo,
  stepDuel,
  type Action,
  type DuelConfig,
  type DuelEvent,
  type DuelState,
  type Essence,
  type PlacedCat,
  type Side,
  type SideId,
} from "./match";
import { GAUNTLET } from "./rival";
import { createRng } from "./rng";
import { starterDeck } from "./run";

const FACES: Essence[] = ["flame", "mist", "volt", "thorn", "shade"];

const config = (seed = "duel", relics: string[] = []): DuelConfig => ({
  seed,
  rivalId: "alley-tom",
  level: 0,
  player: { deck: starterDeck("flame"), relics },
  rival: { deck: starterDeck("mist"), relics: [] },
});

const placed = (catId: string, extra: Partial<PlacedCat> = {}): PlacedCat => ({
  catId,
  yarn: 0,
  cached: 0,
  tucked: 0,
  under: [],
  ...extra,
});

const KEEP: Action = {
  type: "keep",
  cats: [0, 1, 2],
  essence: ["flame", "mist"],
};

/** A match in its first round with `who` to act and both seats bare. */
function turn(
  who: SideId,
  sides: Partial<Record<SideId, Partial<Side>>> = {},
  table: Partial<DuelState> = {},
  relics: string[] = [],
): DuelState {
  const base = createDuel(config("duel", relics));
  const seat = (id: SideId): Side => ({
    ...base.sides[id],
    setup: [],
    turnsLeft: 5,
    ...sides[id],
  });
  return {
    ...base,
    phase: "turn",
    active: who,
    feeder: [...FACES],
    sides: { player: seat("player"), rival: seat("rival") },
    ...table,
  };
}

const board = (extra: Partial<Side["board"]>) => ({
  hunt: [],
  den: [],
  prowl: [],
  ...extra,
});

const powers = (events: DuelEvent[], side: SideId) =>
  events.flatMap((e) =>
    e.type === "power" && e.side === side ? [e.catId] : [],
  );

/** Picks at random from the listed actions, never the free reroll. */
function randomPolicy(seed: string): Policy {
  const rng = createRng(seed);
  return (state) =>
    rng.pick(duelActions(state).filter((action) => action.type !== "reroll"));
}

describe("createDuel", () => {
  it("deals both seats and one shared table", () => {
    const state = createDuel(config());
    expect(state.phase).toBe("setup");
    for (const side of [state.sides.player, state.sides.rival]) {
      expect(side.setup).toHaveLength(5);
      expect(side.tray).toHaveLength(3);
      expect(side.deck).toHaveLength(8);
      expect(side.hand).toEqual([]);
    }
    expect(state.feeder).toHaveLength(5);
    expect(state.goals).toHaveLength(3);
  });

  it("deals each seat from its own stream", () => {
    const one = createDuel(config());
    const two = createDuel({
      ...config(),
      rival: { deck: starterDeck("shade"), relics: [] },
    });
    expect(two.sides.player).toEqual(one.sides.player);
    expect(two.sides.rival.setup).not.toEqual(one.sides.rival.setup);
  });

  it("gives the player's relics to the player alone", () => {
    const state = createDuel(config("duel", ["bent-whisker"]));
    expect(state.sides.player.mods.huntBonus).toBe(1);
    expect(state.sides.rival.mods.huntBonus).toBe(0);
  });
});

describe("setup", () => {
  it("has the rival keep first, then the player, then starts round one", () => {
    const dealt = createDuel(config());
    expect(dealt.active).toBe("rival");
    const kept = applyDuel(dealt, KEEP);
    expect(kept.state.phase).toBe("setup");
    expect(kept.state.active).toBe("player");
    expect(kept.events).toEqual([
      { type: "kept", side: "rival", cats: 3, essence: 2 },
    ]);
    expect(kept.state.sides.rival.hand).toHaveLength(3);
    expect(kept.state.sides.player.hand).toHaveLength(0);

    const { state } = applyDuel(kept.state, KEEP);
    expect(state.phase).toBe("turn");
    expect(state.active).toBe("player");
    expect(state.sides.player.turnsLeft).toBe(5);
    expect(state.sides.rival.turnsLeft).toBe(5);
  });

  it("refuses anything but a keep", () => {
    expect(() =>
      applyDuel(createDuel(config()), { type: "den", targets: [] }),
    ).toThrow(IllegalAction);
  });

  it("gives Early Riser's turn to the seat that holds it", () => {
    const dealt = createDuel(config("duel", ["early-riser", "warm-saucer"]));
    const { state } = applyDuel(applyDuel(dealt, KEEP).state, KEEP);
    expect(state.sides.player.turnsLeft).toBe(6);
    expect(state.sides.rival.turnsLeft).toBe(5);
    expect(state.sides.player.essence.wild).toBe(1);
    expect(state.sides.rival.essence.wild).toBe(0);
  });
});

describe("turn order", () => {
  /** Who acted on each whole turn of a match, round by round. */
  function order(relics: string[] = []): SideId[][] {
    const rounds: SideId[][] = [[], [], []];
    let state = createDuel(config("order", relics));
    state = applyDuel(applyDuel(state, KEEP).state, KEEP).state;
    while (state.phase !== "over") {
      rounds[state.round]?.push(state.active);
      state = applyDuel(state, { type: "den", targets: [] }).state;
    }
    return rounds;
  }

  it("alternates seats, 5, 4 and 3 turns each, the lead changing hands", () => {
    const rounds = order();
    const p: SideId = "player";
    const r: SideId = "rival";
    expect(rounds).toEqual([
      [p, r, p, r, p, r, p, r, p, r],
      [r, p, r, p, r, p, r, p],
      [p, r, p, r, p, r],
    ]);
  });

  it("lets a seat with a turn to spare take it once the other is done", () => {
    const [first] = order(["early-riser"]);
    expect(first).toHaveLength(11);
    expect(first?.filter((who) => who === "player")).toHaveLength(6);
    expect(first?.[10]).toBe("player");
  });

  it("does not pass the turn on a free reroll", () => {
    const state = turn("player", {}, { feeder: ["mist", "mist", "mist"] });
    const { state: next, events } = applyDuel(state, { type: "reroll" });
    expect(next.active).toBe("player");
    expect(next.sides.player.turnsLeft).toBe(5);
    expect(events[0]).toEqual({
      type: "move",
      side: "player",
      move: { type: "reroll" },
    });
  });

  it("keeps the turn with a seat that owes a choice", () => {
    const state = turn("rival", {
      rival: {
        board: board({ hunt: [placed("voltwhisk")] }),
        hand: ["emberkit"],
      },
    });
    const hunted = applyDuel(state, { type: "hunt", dice: [0] });
    expect(hunted.state.phase).toBe("pending");
    expect(hunted.state.active).toBe("rival");
    const { state: next } = applyDuel(hunted.state, {
      type: "resolve",
      choice: 0,
    });
    expect(next.active).toBe("player");
    expect(next.sides.rival.board.hunt[0]?.tucked).toBe(1);
    expect(next.sides.rival.turnsLeft).toBe(4);
  });
});

describe("a shared table", () => {
  it("has one feeder: a die one seat takes is gone for the other", () => {
    const state = turn("rival");
    const { state: next } = applyDuel(state, { type: "hunt", dice: [1] });
    expect(next.feeder).toEqual(["flame", "volt", "thorn", "shade"]);
    expect(next.sides.rival.essence.mist).toBe(1);
    expect(next.sides.player.essence).toEqual(emptyPool());
  });

  it("keeps each seat's cats, tray and deck its own", () => {
    const state = turn("rival", {
      rival: { hand: ["dewhisker"], essence: { ...emptyPool(), volt: 1 } },
    });
    const before = state.sides.player;
    const { state: next, events } = applyDuel(state, {
      type: "play",
      hand: 0,
      row: "den",
    });
    expect(next.sides.rival.board.den[0]).toMatchObject({
      catId: "dewhisker",
      yarn: 2,
    });
    expect(next.sides.player).toEqual(before);
    expect(next.last.rival).toEqual({
      type: "play",
      catId: "dewhisker",
      row: "den",
      col: 0,
    });
    expect(events.map((e) => e.type)).toEqual(["move", "played", "power"]);
  });

  it("says what a seat did without showing what it drew", () => {
    const state = turn("rival", {
      rival: {
        board: board({ prowl: [placed("thornkit"), placed("thornkit")] }),
      },
    });
    const tray = state.sides.rival.tray;
    const { events } = applyDuel(state, { type: "prowl", picks: [0, "deck"] });
    expect(events[0]).toEqual({
      type: "move",
      side: "rival",
      move: { type: "prowl", tray: [tray[0]], deck: 1, payer: null },
    });
  });
});

describe("cats that watch the other seat", () => {
  const watchers = board({
    den: [placed("brumefang"), placed("gloomtail"), placed("nyxaroth")],
    hunt: [placed("shadewhisker")],
  });

  it("answer to the kind of turn it took", () => {
    expect(reactsTo("raid", "hunt")).toBe(true);
    expect(reactsTo("bank", "den")).toBe(true);
    expect(reactsTo("burn", "prowl")).toBe(true);
    expect(reactsTo("raid", "den")).toBe(false);
    expect(reactsTo("any", "play")).toBe(true);
    expect(reactsTo("stash", "play")).toBe(false);
  });

  it("fire on the player's board when the rival acts", () => {
    const state = turn("rival", { player: { board: watchers } });
    const fired = (action: Action) =>
      powers(applyDuel(state, action).events, "player");
    expect(fired({ type: "hunt", dice: [0] })).toEqual([
      "brumefang",
      "nyxaroth",
    ]);
    expect(fired({ type: "den", targets: [] })).toEqual([
      "gloomtail",
      "nyxaroth",
    ]);
    expect(fired({ type: "prowl", picks: ["deck"] })).toEqual([
      "shadewhisker",
      "nyxaroth",
    ]);
  });

  it("pay the seat that owns them", () => {
    const state = turn("rival", { player: { board: watchers } });
    const { state: next } = applyDuel(state, { type: "hunt", dice: [0] });
    expect(next.sides.player.essence.mist).toBe(1);
    expect(next.sides.player.board.den[2]?.yarn).toBe(1);
    expect(next.sides.rival.essence.mist).toBe(0);
  });

  it("fire on the rival's board when the player acts", () => {
    const state = turn("player", {
      rival: { board: watchers },
      player: { hand: ["emberkit"], essence: { ...emptyPool(), flame: 1 } },
    });
    const played = applyDuel(state, { type: "play", hand: 0, row: "hunt" });
    expect(powers(played.events, "rival")).toEqual(["nyxaroth"]);
    expect(powers(played.events, "player")).toEqual(["emberkit"]);
    const hunted = applyDuel(state, { type: "hunt", dice: [0] });
    expect(powers(hunted.events, "rival")).toEqual(["brumefang", "nyxaroth"]);
    expect(hunted.state.sides.rival.essence.mist).toBe(1);
  });

  it("wait for a turn to finish before they answer it", () => {
    const state = turn("rival", {
      player: { board: watchers },
      rival: {
        board: board({ hunt: [placed("voltwhisk")] }),
        hand: ["emberkit"],
      },
    });
    const hunted = applyDuel(state, { type: "hunt", dice: [0] });
    expect(powers(hunted.events, "player")).toEqual([]);
    const resolved = applyDuel(hunted.state, { type: "resolve", choice: null });
    expect(powers(resolved.events, "player")).toEqual([
      "brumefang",
      "nyxaroth",
    ]);
  });

  it("stay quiet on their own seat's turn", () => {
    const state = turn("player", { player: { board: watchers } });
    const { events } = applyDuel(state, { type: "hunt", dice: [0] });
    expect(powers(events, "player")).toEqual([]);
  });
});

describe("relics at a table with two seats", () => {
  it("has Hadu bring his treat after his own seat's turns only", () => {
    const state = turn("player", {
      player: { board: board({ den: [placed("hadu")] }) },
    });
    const mine = applyDuel(state, { type: "prowl", picks: ["deck"] });
    expect(mine.state.sides.player.essence.wild).toBe(1);
    const theirs = applyDuel(mine.state, { type: "den", targets: [] });
    expect(theirs.state.sides.player.essence.wild).toBe(1);
    expect(theirs.state.sides.rival.essence.wild).toBe(0);
  });

  it("rings the Loud Bell whenever the feeder is rolled again", () => {
    const bell = ["loud-bell"];
    const emptied = turn("rival", {}, { feeder: ["flame"] }, bell);
    const hunted = applyDuel(emptied, { type: "hunt", dice: [0] });
    expect(hunted.state.feeder).toHaveLength(5);
    expect(hunted.state.sides.player.essence.wild).toBe(1);
    expect(hunted.state.sides.rival.essence.wild).toBe(0);
    expect(hunted.events).toContainEqual({
      type: "refill",
      side: "player",
      treats: 1,
    });

    const same = turn("player", {}, { feeder: ["mist", "mist"] }, bell);
    const rerolled = applyDuel(same, { type: "reroll" });
    expect(rerolled.state.sides.player.essence.wild).toBe(1);

    const quiet = applyDuel(turn("rival", {}, {}, bell), {
      type: "hunt",
      dice: [0],
    });
    expect(quiet.state.sides.player.essence.wild).toBe(0);
  });
});

describe("round goals", () => {
  const lastTurn = (
    goalId: string,
    sides: Partial<Record<SideId, Partial<Side>>>,
    relics: string[] = [],
  ) =>
    turn(
      "rival",
      {
        player: { turnsLeft: 0, ...sides.player },
        rival: { turnsLeft: 1, ...sides.rival },
      },
      { goals: [goalId, "crowd", "pantry"] },
      relics,
    );

  it("compare what each side really has", () => {
    const state = lastTurn("hunting-party", {
      player: {
        board: board({ hunt: [placed("flameclaw"), placed("thornkit")] }),
      },
      rival: { board: board({ hunt: [placed("thornkit")] }) },
    });
    expect(duelStanding(state)).toEqual({
      goalId: "hunting-party",
      player: 2,
      rival: 1,
      playerPoints: 4,
      rivalPoints: 1,
    });
    const { state: next, events } = applyDuel(state, {
      type: "den",
      targets: [],
    });
    expect(next.round).toBe(1);
    expect(next.goalResults).toHaveLength(1);
    expect(events).toContainEqual({
      type: "goal",
      round: 0,
      goalId: "hunting-party",
      player: 2,
      rival: 1,
      playerPoints: 4,
      rivalPoints: 1,
    });
  });

  it("score nothing for a side with nothing, whichever side it is", () => {
    const ahead = board({ hunt: [placed("thornkit")] });
    const rivalBare = lastTurn("hunting-party", { player: { board: ahead } });
    expect(duelStanding(rivalBare)).toMatchObject({
      playerPoints: 4,
      rivalPoints: 0,
    });
    const playerBare = lastTurn("hunting-party", { rival: { board: ahead } });
    expect(duelStanding(playerBare)).toMatchObject({
      playerPoints: 0,
      rivalPoints: 4,
    });
    expect(duelStanding(lastTurn("hunting-party", {}))).toMatchObject({
      playerPoints: 0,
      rivalPoints: 0,
    });
  });

  it("split a tie, and count the Lucky Collar for its holder", () => {
    const one = board({ hunt: [placed("thornkit")] });
    const tied = lastTurn("hunting-party", {
      player: { board: one },
      rival: { board: one },
    });
    expect(duelStanding(tied)).toMatchObject({
      playerPoints: 2,
      rivalPoints: 2,
    });
    const collared = lastTurn(
      "hunting-party",
      { player: { board: one }, rival: { board: one } },
      ["lucky-collar"],
    );
    expect(duelStanding(collared)).toMatchObject({
      player: 2,
      rival: 1,
      playerPoints: 4,
      rivalPoints: 1,
    });
  });

  it("fire end-of-round powers on both boards, the leader's first", () => {
    const state = lastTurn("crowd", {
      player: { board: board({ den: [placed("verdantmane")] }) },
      rival: { board: board({ den: [placed("nimbustail")] }) },
    });
    const { state: next, events } = applyDuel(state, {
      type: "den",
      targets: [],
    });
    expect(next.sides.player.board.den[0]?.yarn).toBe(2);
    expect(next.sides.rival.board.den[0]?.yarn).toBe(1);
    const ended = events.flatMap((e) => (e.type === "power" ? [e.side] : []));
    expect(ended).toEqual(["player", "rival"]);
    expect(next.lead).toBe("rival");
    expect(next.active).toBe("rival");
    expect(next.sides.player.turnsLeft).toBe(4);
  });
});

describe("the end of a match", () => {
  const closing = (sides: Partial<Record<SideId, Partial<Side>>>) =>
    turn(
      "rival",
      {
        player: { turnsLeft: 0, ...sides.player },
        rival: { turnsLeft: 1, ...sides.rival },
      },
      { round: 2, goals: ["crowd", "crowd", "pawful"] },
      ["ember-charm"],
    );

  it("scores both boards the same way and refuses further actions", () => {
    const state = closing({
      player: {
        board: board({ hunt: [placed("flameclaw", { yarn: 2 })] }),
        hand: ["emberkit"],
      },
      rival: {
        board: board({ den: [placed("bramblepaw", { cached: 1, tucked: 2 })] }),
        hand: ["mistpaw", "mistpaw"],
      },
    });
    const { state: over, events } = applyDuel(state, {
      type: "den",
      targets: [],
    });
    expect(over.phase).toBe("over");
    // Flameclaw 2 + 2 yarn + the Ember Charm's 2 + the lower share of Pawful.
    expect(over.result?.player).toMatchObject({
      total: 9,
      goals: 3,
      relics: 2,
    });
    // Bramblepaw 3 + 1 cached + 2 tucked + the goal.
    expect(over.result?.rival).toMatchObject({
      total: 12,
      goals: 6,
      relics: 0,
    });
    expect(over.result?.won).toBe(false);
    expect(duelScore(over, "rival").total).toBe(12);
    expect(events[events.length - 1]).toEqual({
      type: "over",
      won: false,
      player: 9,
      rival: 12,
    });
    expect(() => applyDuel(over, { type: "den", targets: [] })).toThrow(
      IllegalAction,
    );
    expect(duelActions(over)).toEqual([]);
  });

  it("goes to the player only on strictly more", () => {
    const even = closing({});
    const { state } = applyDuel(even, { type: "den", targets: [] });
    expect(state.result?.player.total).toBe(state.result?.rival.total);
    expect(state.result?.won).toBe(false);
  });
});

describe("the driver", () => {
  const rival = randomPolicy("driver-rival");

  it("opens on the player's keep, the rival's already made", () => {
    const { state, events } = openMatch(config(), rival);
    expect(state.phase).toBe("setup");
    expect(state.active).toBe("player");
    expect(state.sides.rival.setup).toEqual([]);
    expect(events.map((e) => e.type)).toEqual(["kept"]);
  });

  it("answers each player action with the rival's, in one list of events", () => {
    let { state } = openMatch(config(), rival);
    state = advance(state, KEEP, rival).state;
    expect(state.active).toBe("player");
    const { state: next, events } = advance(
      state,
      { type: "den", targets: [] },
      rival,
    );
    expect(next.active).toBe("player");
    expect(next.sides.rival.turnsLeft).toBe(4);
    const moves = events.flatMap((e) => (e.type === "move" ? [e.side] : []));
    expect(moves[0]).toBe("player");
    expect(moves).toContain("rival");
  });

  it("refuses to act for the player out of turn", () => {
    const dealt = createDuel(config());
    expect(() => advance(dealt, KEEP, rival)).toThrow(IllegalAction);
  });

  it("stops a policy that never ends its turn", () => {
    const stuck: Policy = () => ({ type: "reroll" });
    const state = turn("player", {}, { feeder: ["mist"] });
    // Hunting the last die rolls five more; a rival that only rerolls then
    // fails on the first roll that is not all alike.
    expect(() => advance(state, { type: "hunt", dice: [0] }, stuck)).toThrow();
  });
});

describe("engine guarantees", () => {
  it("never mutates the state it is given", () => {
    const state = turn("player");
    const copy = structuredClone(state);
    applyDuel(state, { type: "hunt", dice: [0] });
    expect(state).toEqual(copy);
  });

  it("steps in place to the same state it returns a copy of", () => {
    const rng = createRng("in-place");
    let state = createDuel(config("in-place"));
    for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
      const action = rng.pick(duelActions(state));
      const stepped = structuredClone(state);
      stepDuel(stepped, action);
      state = applyDuel(state, action).state;
      expect(stepped).toEqual(state);
    }
  });

  it("finishes every match, against every rival, and accepts what it lists", () => {
    for (const [index, rivalId] of GAUNTLET.entries()) {
      for (let game = 0; game < 12; game++) {
        const seed = `finish-${rivalId}-${game}`;
        const pick = randomPolicy(`${seed}:player`);
        const rival = randomPolicy(`${seed}:rival`);
        let { state } = openMatch(
          {
            ...config(seed, ["loud-bell", "early-riser"]),
            rivalId,
            level: index,
          },
          rival,
        );
        let turns = 0;
        for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
          expect(state.active).toBe("player");
          const action = pick(state);
          if (state.phase === "turn" && action.type !== "reroll") turns += 1;
          state = advance(state, action, rival).state;
        }
        expect(state.phase).toBe("over");
        expect(state.result).not.toBeNull();
        expect(turns).toBe(13);
        expect(state.goalResults).toHaveLength(3);
      }
    }
  });

  it("gives the same match for the same seed and policies", () => {
    const play = () => {
      const rival = randomPolicy("same:rival");
      const pick = randomPolicy("same:player");
      let { state } = openMatch(config("same"), rival);
      while (state.phase !== "over") {
        state = advance(state, pick(state), rival).state;
      }
      return state;
    };
    expect(play()).toEqual(play());
  });
});
