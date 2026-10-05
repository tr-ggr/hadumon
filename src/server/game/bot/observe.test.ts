import { describe, expect, it } from "vitest";

import { ROWS } from "../cats";
import {
  applyAction,
  createMatch,
  legalActions,
  otherSide,
  SIDES,
  type MatchState,
  type SideId,
} from "../match";
import { createRng } from "../rng";
import { starterDeck } from "../run";
import { botAt, TOP_LEVEL } from "./levels";
import { imagine, observe } from "./observe";
import { styleOf } from "./styles";

const SEED = "top-secret-seed";

function deal(seed = SEED): MatchState {
  return createMatch({
    seed,
    rivalId: "madame-mittens",
    level: 3,
    player: { deck: starterDeck("flame"), relics: ["ember-charm"] },
    rival: { deck: [...starterDeck("shade"), "umbralynx"], relics: [] },
  });
}

/** Positions from all through a match played at random. */
function positions(seed = SEED): MatchState[] {
  const rng = createRng(`${seed}:walk`);
  const seen: MatchState[] = [];
  let state = deal(seed);
  for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
    seen.push(state);
    state = applyAction(state, rng.pick(legalActions(state))).state;
  }
  return seen;
}

/**
 * The same table with everything a seat cannot see dealt again: its own deck
 * in another order, the other seat's hidden cats moved between its hand, its
 * deck, its discard pile and under its cats, and another seed.
 */
function reshuffled(state: MatchState, me: SideId, salt: string): MatchState {
  const rng = createRng(`reshuffle:${salt}`);
  const next = structuredClone(state);
  const mine = next.sides[me];
  const theirs = next.sides[otherSide(me)];
  mine.deck = rng.shuffle(mine.deck);
  mine.discard = rng.shuffle(mine.discard);

  const under = ROWS.flatMap((row) => theirs.board[row]);
  const pool = rng.shuffle([
    ...theirs.hand,
    ...theirs.setup,
    ...theirs.deck,
    ...theirs.discard,
    ...under.flatMap((placed) => placed.under ?? []),
  ]);
  theirs.hand = pool.splice(0, theirs.hand.length);
  theirs.setup = pool.splice(0, theirs.setup.length);
  theirs.discard = pool.splice(0, theirs.discard.length);
  for (const placed of under) placed.under = pool.splice(0, placed.tucked);
  theirs.deck = pool;
  next.seed = `other-${salt}`;
  return next;
}

const keys = (value: object) => Object.keys(value).sort();

describe("observe", () => {
  const all = positions();

  it("is built from an exact list of what a seat may know", () => {
    const seen = observe(all[20]!, "rival");
    expect(keys(seen)).toEqual(
      [
        "active",
        "feeder",
        "goalResults",
        "goals",
        "last",
        "lead",
        "me",
        "other",
        "own",
        "pending",
        "phase",
        "queue",
        "round",
        "step",
      ].sort(),
    );
    expect(keys(seen.own)).toEqual(
      [
        "board",
        "discard",
        "essence",
        "hand",
        "mods",
        "relics",
        "setup",
        "tray",
        "turnsLeft",
        "unseen",
      ].sort(),
    );
    expect(keys(seen.other)).toEqual(
      [
        "board",
        "deckCount",
        "discardCount",
        "essence",
        "handCount",
        "mods",
        "relics",
        "setupCount",
        "tray",
        "turnsLeft",
        "unseen",
      ].sort(),
    );
  });

  it("never carries the seed, a deck's order, or a cat that is face down", () => {
    for (const state of all) {
      for (const me of SIDES) {
        const seen = observe(state, me);
        expect(JSON.stringify(seen)).not.toContain(SEED);
        expect(seen.own.unseen).toEqual([...state.sides[me].deck].sort());
        expect(seen.own.discard).toEqual([...state.sides[me].discard].sort());
        for (const row of ROWS) {
          for (const placed of seen.other.board[row]) {
            expect(placed).not.toHaveProperty("under");
          }
        }
      }
    }
  });

  it("is the same whatever is dealt where a seat cannot see", () => {
    for (const [index, state] of all.entries()) {
      for (const me of SIDES) {
        const again = reshuffled(state, me, `${index}`);
        expect(observe(again, me)).toEqual(observe(state, me));
      }
    }
  });

  it("is a copy: changing it changes nothing at the table", () => {
    const state = all[10]!;
    const before = structuredClone(state);
    const seen = observe(state, "player");
    seen.own.hand.push("hadu");
    seen.feeder.length = 0;
    seen.other.board.hunt.push({
      catId: "hadu",
      yarn: 9,
      cached: 0,
      tucked: 0,
    });
    expect(state).toEqual(before);
  });
});

describe("a bot", () => {
  it("chooses the same move however the hidden cats are dealt", () => {
    const sample = positions("hidden").filter((_, index) => index % 10 === 0);
    for (let level = 0; level <= TOP_LEVEL; level++) {
      const bot = botAt(level, styleOf("madame-mittens"));
      for (const [index, state] of sample.entries()) {
        const me = state.active;
        const again = reshuffled(state, me, `${level}-${index}`);
        const choice = bot(observe(state, me), createRng("thinking"));
        expect(bot(observe(again, me), createRng("thinking"))).toEqual(choice);
      }
    }
  });
});

describe("imagine", () => {
  const all = positions("imagined");

  it("deals a table that looks the same from the bot's seat", () => {
    const rng = createRng("deals");
    for (const state of all) {
      for (const me of SIDES) {
        const seen = observe(state, me);
        expect(observe(imagine(seen, rng), me)).toEqual(seen);
      }
    }
  });

  it("deals the hidden cats differently, under a seed of its own", () => {
    // Late enough that cats have moved, early enough that a deck is left.
    const state = [...all]
      .reverse()
      .find((seen) => seen.sides.rival.deck.length >= 4)!;
    const seen = observe(state, "rival");
    const one = imagine(seen, createRng("one"));
    const two = imagine(seen, createRng("two"));
    expect(one.seed).not.toBe(state.seed);
    expect(one.seed).not.toBe(two.seed);
    expect(one.sides.rival.deck).not.toEqual(two.sides.rival.deck);
    expect([...one.sides.rival.deck].sort()).toEqual(
      [...state.sides.rival.deck].sort(),
    );
    expect(one.sides.player.hand).toHaveLength(state.sides.player.hand.length);
    expect(one.sides.player.deck).toHaveLength(state.sides.player.deck.length);
  });

  it("can be played on to the end", () => {
    const rng = createRng("play-on");
    let state = imagine(observe(all[8]!, "rival"), rng);
    for (let guard = 0; guard < 400 && state.phase !== "over"; guard++) {
      state = applyAction(state, rng.pick(legalActions(state))).state;
    }
    expect(state.phase).toBe("over");
  });
});
