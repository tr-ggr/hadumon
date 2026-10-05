import { describe, expect, it } from "vitest";

import { advance, openMatch, type Policy } from "./duel";
import {
  applyAction,
  createMatch,
  legalActions,
  sideScore,
  goalStanding,
  emptyPool,
  IllegalAction,
  reactsTo,
  ROUND_TURNS,
  stepMatch,
  type Action,
  type MatchConfig,
  type MatchEvent,
  type MatchState,
  type Essence,
  type PlacedCat,
  type Side,
  type SideId,
} from "./match";
import { GAUNTLET } from "./rival";
import { createRng } from "./rng";
import { starterDeck } from "./clans";

const FACES: Essence[] = ["flame", "mist", "volt", "thorn", "shade"];

const config = (seed = "duel", relics: string[] = []): MatchConfig => ({
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
  table: Partial<MatchState> = {},
  relics: string[] = [],
): MatchState {
  const base = createMatch(config("duel", relics));
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

const powers = (events: MatchEvent[], side: SideId) =>
  events.flatMap((e) =>
    e.type === "power" && e.side === side ? [e.catId] : [],
  );

/** Picks at random from the listed actions, never the free reroll. */
function randomPolicy(seed: string): Policy {
  const rng = createRng(seed);
  return (state) =>
    rng.pick(legalActions(state).filter((action) => action.type !== "reroll"));
}

describe("createMatch", () => {
  it("deals both seats and one shared table", () => {
    const state = createMatch(config());
    expect(state.phase).toBe("setup");
    for (const side of [state.sides.player, state.sides.rival]) {
      expect(side.setup).toHaveLength(5);
      expect(side.tray).toHaveLength(3);
      expect(side.deck).toHaveLength(8);
      expect(side.hand).toEqual([]);
    }
    expect(state.feeder).toHaveLength(5);
    expect(state.goals).toHaveLength(ROUND_TURNS.length);
  });

  it("deals each seat from its own stream", () => {
    const one = createMatch(config());
    const two = createMatch({
      ...config(),
      rival: { deck: starterDeck("shade"), relics: [] },
    });
    expect(two.sides.player).toEqual(one.sides.player);
    expect(two.sides.rival.setup).not.toEqual(one.sides.rival.setup);
  });

  it("gives the player's relics to the player alone", () => {
    const state = createMatch(config("duel", ["bent-whisker"]));
    expect(state.sides.player.mods.huntBonus).toBe(1);
    expect(state.sides.rival.mods.huntBonus).toBe(0);
  });
});

describe("setup", () => {
  it("has the rival keep first, then the player, then starts round one", () => {
    const dealt = createMatch(config());
    expect(dealt.active).toBe("rival");
    const kept = applyAction(dealt, KEEP);
    expect(kept.state.phase).toBe("setup");
    expect(kept.state.active).toBe("player");
    expect(kept.events).toEqual([
      { type: "kept", side: "rival", cats: 3, essence: 2 },
    ]);
    expect(kept.state.sides.rival.hand).toHaveLength(3);
    expect(kept.state.sides.player.hand).toHaveLength(0);

    const { state } = applyAction(kept.state, KEEP);
    expect(state.phase).toBe("turn");
    expect(state.active).toBe("player");
    expect(state.sides.player.turnsLeft).toBe(ROUND_TURNS[0]);
    expect(state.sides.rival.turnsLeft).toBe(ROUND_TURNS[0]);
  });

  it("refuses anything but a keep", () => {
    expect(() =>
      applyAction(createMatch(config()), { type: "den", targets: [] }),
    ).toThrow(IllegalAction);
  });

  it("gives Early Riser's turn to the seat that holds it", () => {
    const dealt = createMatch(config("duel", ["early-riser", "warm-saucer"]));
    const { state } = applyAction(applyAction(dealt, KEEP).state, KEEP);
    expect(state.sides.player.turnsLeft).toBe(ROUND_TURNS[0] + 1);
    expect(state.sides.rival.turnsLeft).toBe(ROUND_TURNS[0]);
    expect(state.sides.player.essence.wild).toBe(1);
    expect(state.sides.rival.essence.wild).toBe(0);
  });
});

describe("turn order", () => {
  /** Who acted on each whole turn of a match, round by round. */
  function order(relics: string[] = []): SideId[][] {
    const rounds: SideId[][] = ROUND_TURNS.map(() => []);
    let state = createMatch(config("order", relics));
    state = applyAction(applyAction(state, KEEP).state, KEEP).state;
    while (state.phase !== "over") {
      rounds[state.round]?.push(state.active);
      state = applyAction(state, { type: "den", targets: [] }).state;
    }
    return rounds;
  }

  it("alternates seats, 8, 7, 6 and 5 turns each, the lead changing hands", () => {
    const rounds = order();
    const p: SideId = "player";
    const r: SideId = "rival";
    expect(rounds.map((round) => round.length / 2)).toEqual([8, 7, 6, 5]);
    expect(rounds.map((round) => round[0])).toEqual([p, r, p, r]);
    for (const round of rounds) {
      round.forEach((who, turn) => {
        expect(who).toBe(turn % 2 === 0 ? round[0] : round[1]);
      });
      expect(round[1]).not.toBe(round[0]);
    }
  });

  it("lets a seat with a turn to spare take it once the other is done", () => {
    const [first] = order(["early-riser"]);
    expect(first).toHaveLength(17);
    expect(first?.filter((who) => who === "player")).toHaveLength(9);
    expect(first?.[16]).toBe("player");
  });

  it("does not pass the turn on a free reroll", () => {
    const state = turn("player", {}, { feeder: ["mist", "mist", "mist"] });
    const { state: next, events } = applyAction(state, { type: "reroll" });
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
    const hunted = applyAction(state, { type: "hunt", dice: [0] });
    expect(hunted.state.phase).toBe("pending");
    expect(hunted.state.active).toBe("rival");
    const { state: next } = applyAction(hunted.state, {
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
    const { state: next } = applyAction(state, { type: "hunt", dice: [1] });
    expect(next.feeder).toEqual(["flame", "volt", "thorn", "shade"]);
    expect(next.sides.rival.essence.mist).toBe(1);
    expect(next.sides.player.essence).toEqual(emptyPool());
  });

  it("keeps each seat's cats, tray and deck its own", () => {
    const state = turn("rival", {
      rival: { hand: ["dewhisker"], essence: { ...emptyPool(), volt: 1 } },
    });
    const before = state.sides.player;
    const { state: next, events } = applyAction(state, {
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
    const { events } = applyAction(state, {
      type: "prowl",
      picks: [0, "deck"],
    });
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
    expect(reactsTo("hunt", "hunt")).toBe(true);
    expect(reactsTo("den", "den")).toBe(true);
    expect(reactsTo("prowl", "prowl")).toBe(true);
    expect(reactsTo("hunt", "den")).toBe(false);
    expect(reactsTo("any", "play")).toBe(true);
    expect(reactsTo("den", "play")).toBe(false);
  });

  it("fire on the player's board when the rival acts", () => {
    const state = turn("rival", { player: { board: watchers } });
    const fired = (action: Action) =>
      powers(applyAction(state, action).events, "player");
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
    const { state: next } = applyAction(state, { type: "hunt", dice: [0] });
    expect(next.sides.player.essence.mist).toBe(1);
    expect(next.sides.player.board.den[2]?.yarn).toBe(1);
    expect(next.sides.rival.essence.mist).toBe(0);
  });

  it("fire on the rival's board when the player acts", () => {
    const state = turn("player", {
      rival: { board: watchers },
      player: { hand: ["emberkit"], essence: { ...emptyPool(), flame: 1 } },
    });
    const played = applyAction(state, { type: "play", hand: 0, row: "hunt" });
    expect(powers(played.events, "rival")).toEqual(["nyxaroth"]);
    expect(powers(played.events, "player")).toEqual(["emberkit"]);
    const hunted = applyAction(state, { type: "hunt", dice: [0] });
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
    const hunted = applyAction(state, { type: "hunt", dice: [0] });
    expect(powers(hunted.events, "player")).toEqual([]);
    const resolved = applyAction(hunted.state, {
      type: "resolve",
      choice: null,
    });
    expect(powers(resolved.events, "player")).toEqual([
      "brumefang",
      "nyxaroth",
    ]);
  });

  it("stay quiet on their own seat's turn", () => {
    const state = turn("player", { player: { board: watchers } });
    const { events } = applyAction(state, { type: "hunt", dice: [0] });
    expect(powers(events, "player")).toEqual([]);
  });
});

describe("relics at a table with two seats", () => {
  it("has Hadu bring his treat after his own seat's turns only", () => {
    const state = turn("player", {
      player: { board: board({ den: [placed("hadu")] }) },
    });
    const mine = applyAction(state, { type: "prowl", picks: ["deck"] });
    expect(mine.state.sides.player.essence.wild).toBe(1);
    const theirs = applyAction(mine.state, { type: "den", targets: [] });
    expect(theirs.state.sides.player.essence.wild).toBe(1);
    expect(theirs.state.sides.rival.essence.wild).toBe(0);
  });

  it("rings the Loud Bell whenever the feeder is rolled again", () => {
    const bell = ["loud-bell"];
    const emptied = turn("rival", {}, { feeder: ["flame"] }, bell);
    const hunted = applyAction(emptied, { type: "hunt", dice: [0] });
    expect(hunted.state.feeder).toHaveLength(5);
    expect(hunted.state.sides.player.essence.wild).toBe(1);
    expect(hunted.state.sides.rival.essence.wild).toBe(0);
    expect(hunted.events).toContainEqual({
      type: "refill",
      side: "player",
      treats: 1,
    });

    const same = turn("player", {}, { feeder: ["mist", "mist"] }, bell);
    const rerolled = applyAction(same, { type: "reroll" });
    expect(rerolled.state.sides.player.essence.wild).toBe(1);

    const quiet = applyAction(turn("rival", {}, {}, bell), {
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
    expect(goalStanding(state)).toEqual({
      goalId: "hunting-party",
      player: 2,
      rival: 1,
      playerPoints: 4,
      rivalPoints: 1,
    });
    const { state: next, events } = applyAction(state, {
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
    expect(goalStanding(rivalBare)).toMatchObject({
      playerPoints: 4,
      rivalPoints: 0,
    });
    const playerBare = lastTurn("hunting-party", { rival: { board: ahead } });
    expect(goalStanding(playerBare)).toMatchObject({
      playerPoints: 0,
      rivalPoints: 4,
    });
    expect(goalStanding(lastTurn("hunting-party", {}))).toMatchObject({
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
    expect(goalStanding(tied)).toMatchObject({
      playerPoints: 2,
      rivalPoints: 2,
    });
    const collared = lastTurn(
      "hunting-party",
      { player: { board: one }, rival: { board: one } },
      ["lucky-collar"],
    );
    expect(goalStanding(collared)).toMatchObject({
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
    const { state: next, events } = applyAction(state, {
      type: "den",
      targets: [],
    });
    expect(next.sides.player.board.den[0]?.yarn).toBe(2);
    expect(next.sides.rival.board.den[0]?.yarn).toBe(1);
    const ended = events.flatMap((e) => (e.type === "power" ? [e.side] : []));
    expect(ended).toEqual(["player", "rival"]);
    expect(next.lead).toBe("rival");
    expect(next.active).toBe("rival");
    expect(next.sides.player.turnsLeft).toBe(ROUND_TURNS[1]);
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
      { round: 3, goals: ["crowd", "crowd", "crowd", "pawful"] },
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
    const { state: over, events } = applyAction(state, {
      type: "den",
      targets: [],
    });
    expect(over.phase).toBe("over");
    // Flameclaw 2 + 2 yarn + the Ember Charm's 1 + the lower share of Pawful.
    expect(over.result?.player).toMatchObject({
      total: 9,
      goals: 4,
      relics: 1,
    });
    // Bramblepaw 3 + 1 cached + 2 tucked + the goal.
    expect(over.result?.rival).toMatchObject({
      total: 13,
      goals: 7,
      relics: 0,
    });
    expect(over.result?.won).toBe(false);
    expect(sideScore(over, "rival").total).toBe(13);
    expect(events[events.length - 1]).toEqual({
      type: "over",
      won: false,
      player: 9,
      rival: 13,
      tiebreak: null,
    });
    expect(() => applyAction(over, { type: "den", targets: [] })).toThrow(
      IllegalAction,
    );
    expect(legalActions(over)).toEqual([]);
  });

  it("breaks a tie on food left, then on cats, then for the player", () => {
    const end = (sides: Partial<Record<SideId, Partial<Side>>>) =>
      applyAction(closing(sides), { type: "den", targets: [] }).state.result;
    const cat = board({ den: [placed("sparkmew")] });
    // Two bare boards: level on points, on food and on cats.
    expect(end({})).toMatchObject({ won: true, tiebreak: "seat" });
    expect(
      end({ rival: { essence: { ...emptyPool(), mist: 1 } } }),
    ).toMatchObject({ won: false, tiebreak: "food" });
    expect(
      end({ player: { essence: { ...emptyPool(), wild: 2 } } }),
    ).toMatchObject({ won: true, tiebreak: "food" });
    // Sparkmew's 2 points against two Dewhiskers' 1 each: level on points
    // and on food, so the board with more cats takes it.
    const level = end({
      player: { board: cat },
      rival: {
        board: board({
          den: [placed("dewhisker")],
          prowl: [placed("dewhisker")],
        }),
      },
    });
    expect(level?.player.total).toBe(level?.rival.total);
    expect(level).toMatchObject({ won: false, tiebreak: "cats" });
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
    expect(next.sides.rival.turnsLeft).toBe(ROUND_TURNS[0] - 1);
    const moves = events.flatMap((e) => (e.type === "move" ? [e.side] : []));
    expect(moves[0]).toBe("player");
    expect(moves).toContain("rival");
  });

  it("refuses to act for the player out of turn", () => {
    const dealt = createMatch(config());
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
    applyAction(state, { type: "hunt", dice: [0] });
    expect(state).toEqual(copy);
  });

  it("steps in place to the same state it returns a copy of", () => {
    const rng = createRng("in-place");
    let state = createMatch(config("in-place"));
    for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
      const action = rng.pick(legalActions(state));
      const stepped = structuredClone(state);
      stepMatch(stepped, action);
      state = applyAction(state, action).state;
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
        // Every round's turns, and Early Riser's one more.
        expect(turns).toBe(8 + 7 + 6 + 5 + 1);
        expect(state.goalResults).toHaveLength(ROUND_TURNS.length);
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
