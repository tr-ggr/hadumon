import { describe, expect, it } from "vitest";

import { act, standIn } from "./bot";
import { getCat } from "./cats";
import { rivalLevel } from "./difficulty";
import { IllegalAction, ROUND_TURNS } from "./match";
import { GAUNTLET } from "./rival";
import { rivalDeck, rivalRelics } from "./rivalDecks";
import {
  abandonRun,
  actInRun,
  chooseReward,
  CLANS,
  isCurrentRun,
  makeOffer,
  MIN_DECK,
  offerWeights,
  relicDue,
  retireRun,
  RUN_VERSION,
  starterDeck,
  startRun,
  summarizeRun,
  type RunState,
} from "./run";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";

const pool = poolFromUnlocks(STARTING_UNLOCKS);
const newRun = (seed = "r") => startRun({ seed, clanId: "flame", pool });
const player = standIn(1);

/**
 * Plays the current match to the player's last turn, then rigs the score
 * with a goal nobody played for, so the match ends the way a test needs.
 */
function finishMatch(start: RunState, win: boolean): RunState {
  let run = start;
  for (let guard = 0; guard < 300; guard++) {
    const match = run.match;
    if (!match) throw new Error("no match");
    const last =
      match.phase === "turn" &&
      match.round === ROUND_TURNS.length - 1 &&
      match.sides.player.turnsLeft === 1;
    if (last) {
      const rigged = {
        ...match,
        goalResults: [
          ...match.goalResults,
          {
            goalId: "crowd",
            player: 0,
            rival: 0,
            playerPoints: win ? 500 : 0,
            rivalPoints: win ? 0 : 500,
          },
        ],
      };
      return actInRun({ ...run, match: rigged }, { type: "den", targets: [] })
        .run;
    }
    run = actInRun(run, act(match, player)).run;
  }
  throw new Error("match never reached its last turn");
}

describe("starter deck", () => {
  it("is 16 cards built around the clan's element", () => {
    const deck = starterDeck("mist");
    const count = (id: string) => deck.filter((c) => c === id).length;
    expect(deck).toHaveLength(16);
    expect(count("mistpaw")).toBe(3);
    expect(count("dewhisker")).toBe(3);
    expect(count("brumefang")).toBe(2);
    expect(count("flameclaw")).toBe(1);
    expect(deck.every((id) => getCat(id).rarity !== "rare")).toBe(true);
  });
});

describe("startRun", () => {
  it("opens the first match with the clan's deck and relic", () => {
    const run = newRun();
    expect(run.v).toBe(RUN_VERSION);
    expect(run.phase).toBe("match");
    expect(run.matchIndex).toBe(0);
    expect(run.relics).toEqual([CLANS.flame.relicId]);
    expect(run.match?.rivalId).toBe(GAUNTLET[0]);
    expect(run.match?.sides.player.relics).toEqual(run.relics);
    expect(run.deck).toHaveLength(16);
    expect(newRun("x")).toEqual(newRun("x"));
  });

  it("seats the rival on its own deck with its clan's charm, already kept", () => {
    const match = newRun().match!;
    const rival = match.sides.rival;
    expect(match.phase).toBe("setup");
    expect(match.active).toBe("player");
    expect(rival.setup).toEqual([]);
    expect(rival.relics).toEqual(rivalRelics("alley-tom"));
    const cards = [
      ...rival.hand,
      ...rival.deck,
      ...rival.tray,
      ...rival.discard,
    ];
    expect(cards.sort()).toEqual(rivalDeck("alley-tom", 0, pool.cats).sort());
  });
});

describe("difficulty", () => {
  const onTier = (difficulty?: "kitten" | "stray" | "apex") =>
    startRun({ seed: "r", clanId: "flame", pool, difficulty });

  it("is Kitten unless the run says otherwise", () => {
    expect(newRun().difficulty).toBe("kitten");
    expect(newRun().match?.level).toBe(0);
    expect(onTier("kitten")).toEqual(newRun());
    expect(summarizeRun(newRun()).difficulty).toBe("kitten");
  });

  it("raises the rival's level and gives it nothing else", () => {
    const kitten = newRun().match!;
    const stray = onTier("stray").match!;
    const apex = onTier("apex").match!;
    expect(stray.level).toBe(1);
    expect(apex.level).toBe(2);
    expect(summarizeRun(onTier("apex")).difficulty).toBe("apex");
    // The same seed deals the same table on every tier: the player's seat,
    // the feeder, the goals, and the cats the rival holds between its hand,
    // its deck and what it chose not to keep.
    for (const match of [stray, apex]) {
      expect(match.sides.player).toEqual(kitten.sides.player);
      expect(match.feeder).toEqual(kitten.feeder);
      expect(match.goals).toEqual(kitten.goals);
      expect(match.sides.rival.tray).toEqual(kitten.sides.rival.tray);
      expect(match.sides.rival.relics).toEqual(kitten.sides.rival.relics);
      expect(match.sides.rival.mods).toEqual(kitten.sides.rival.mods);
    }
  });

  it("carries the tier into every match of the run", () => {
    let run = finishMatch(onTier("apex"), true);
    run = chooseReward(run, { cat: null, relic: null, trim: null });
    expect(run.matchIndex).toBe(1);
    expect(run.match?.level).toBe(rivalLevel(1, "apex"));
    expect(run.match?.level).toBe(3);
    expect(run.difficulty).toBe("apex");
  });

  it("reads a run with no tier as Kitten", () => {
    const old = finishMatch(newRun(), true);
    delete old.difficulty;
    const next = chooseReward(old, { cat: null, relic: null, trim: null });
    expect(next.match?.level).toBe(1);
    expect(summarizeRun(next).difficulty).toBe("kitten");
  });
});

describe("a run saved by an older game", () => {
  // The shape a run had while the rival was a deck of action cards: no
  // version, and a match with one seat laid flat beside the rival's counters.
  const old = {
    seed: "old",
    clanId: "mist",
    difficulty: "stray",
    pool: { cats: [], relics: [] },
    deck: starterDeck("mist"),
    relics: ["tide-charm"],
    matchIndex: 2,
    phase: "match",
    match: {
      seed: "old:m2",
      step: 9,
      rivalId: "madame-mittens",
      phase: "turn",
      board: { hunt: [], den: [], prowl: [] },
      hand: ["mistpaw"],
      rival: { deck: ["bank"], discard: [], banked: 2, yarn: 2, pushes: 0 },
    },
    reward: null,
    results: [
      { rivalId: "alley-tom", player: 31, rival: 22, won: true },
      { rivalId: "dockside-twins", player: 36, rival: 30, won: true },
    ],
    outcome: null,
  };

  it("is told apart from one this game can read", () => {
    expect(isCurrentRun(old)).toBe(false);
    expect(isCurrentRun(null)).toBe(false);
    expect(isCurrentRun({ v: 1 })).toBe(false);
    expect(isCurrentRun(newRun())).toBe(true);
  });

  it("retires as abandoned, keeping what its won matches earned", () => {
    expect(retireRun(old)).toEqual({
      clanId: "mist",
      difficulty: "stray",
      matchesWon: 2,
      won: false,
      bestMatchScore: 36,
      totalScore: 67,
    });
  });

  it("retires cleanly whatever is left of it", () => {
    expect(retireRun({})).toEqual({
      clanId: "flame",
      difficulty: "kitten",
      matchesWon: 0,
      won: false,
      bestMatchScore: 0,
      totalScore: 0,
    });
    expect(retireRun(null).matchesWon).toBe(0);
    expect(retireRun({ clanId: "dog", results: "none" }).clanId).toBe("flame");
  });
});

describe("a match ending", () => {
  it("keeps the run in the match until it is over", () => {
    const run = newRun();
    const { run: next } = actInRun(run, {
      type: "keep",
      cats: [0, 1, 2],
      essence: ["flame", "mist"],
    });
    expect(next.phase).toBe("match");
    expect(next.results).toEqual([]);
  });

  it("ends the run on a loss", () => {
    const run = finishMatch(newRun(), false);
    expect(run.phase).toBe("over");
    expect(run.outcome).toBe("lost");
    expect(run.reward).toBeNull();
    expect(run.results).toHaveLength(1);
    expect(run.results[0]?.won).toBe(false);
    expect(() => actInRun(run, { type: "den", targets: [] })).toThrow(
      IllegalAction,
    );
  });

  it("opens a reward on a win", () => {
    const run = finishMatch(newRun(), true);
    expect(run.phase).toBe("reward");
    expect(run.outcome).toBeNull();
    const offer = run.reward!;
    expect(new Set(offer.cats).size).toBe(3);
    expect(offer.cats.every((id) => pool.cats.includes(id))).toBe(true);
    // A relic is due after the first win, and never one already held.
    expect(new Set(offer.relics).size).toBe(3);
    expect(offer.relics).not.toContain(CLANS.flame.relicId);
    expect(offer.canTrim).toBe(true);
    expect(makeOffer(run)).toEqual(offer);
  });
});

describe("chooseReward", () => {
  it("adds the cat and relic, trims, and starts the next match", () => {
    const won = finishMatch(newRun(), true);
    const offer = won.reward!;
    const next = chooseReward(won, {
      cat: offer.cats[0]!,
      relic: offer.relics[0]!,
      trim: "emberkit",
    });
    expect(next.phase).toBe("match");
    expect(next.matchIndex).toBe(1);
    expect(next.reward).toBeNull();
    expect(next.deck).toHaveLength(16);
    expect(next.deck.filter((c) => c === "emberkit")).toHaveLength(
      won.deck.filter((c) => c === "emberkit").length - 1,
    );
    expect(next.deck.at(-1)).toBe(offer.cats[0]);
    expect(next.relics).toEqual([CLANS.flame.relicId, offer.relics[0]]);
    expect(next.match?.rivalId).toBe(GAUNTLET[1]);
    expect(next.match?.sides.player.relics).toEqual(next.relics);
    expect(next.match?.phase).toBe("setup");
    // The previous run state is untouched.
    expect(won.deck).toHaveLength(16);
  });

  it("allows skipping everything", () => {
    const won = finishMatch(newRun(), true);
    const next = chooseReward(won, { cat: null, relic: null, trim: null });
    expect(next.deck).toEqual(won.deck);
    expect(next.relics).toEqual(won.relics);
  });

  it("rejects what was not offered", () => {
    const won = finishMatch(newRun(), true);
    const none = { cat: null, relic: null, trim: null };
    expect(() => chooseReward(won, { ...none, cat: "nyxaroth" })).toThrow(
      IllegalAction,
    );
    expect(() => chooseReward(won, { ...none, relic: "ember-charm" })).toThrow(
      IllegalAction,
    );
    expect(() => chooseReward(won, { ...none, trim: "nyxaroth" })).toThrow(
      IllegalAction,
    );
    expect(() => chooseReward(newRun(), none)).toThrow(IllegalAction);
  });

  it("will not trim a deck at the minimum size", () => {
    const won = finishMatch(newRun(), true);
    const small = { ...won, deck: won.deck.slice(0, MIN_DECK) };
    const offer = makeOffer(small);
    expect(offer.canTrim).toBe(false);
    expect(() =>
      chooseReward(
        { ...small, reward: offer },
        { cat: null, relic: null, trim: small.deck[0]! },
      ),
    ).toThrow(IllegalAction);
  });
});

describe("offers", () => {
  it("offers a relic after matches 1, 3 and 5", () => {
    expect([0, 1, 2, 3, 4].map(relicDue)).toEqual([
      true,
      false,
      true,
      false,
      true,
    ]);
  });

  it("holds back epics and legendaries until the first boss is beaten", () => {
    expect(offerWeights(0).epic).toBe(0);
    expect(offerWeights(1).legendary).toBe(0);
    expect(offerWeights(2).epic).toBeGreaterThan(0);
    expect(offerWeights(4).legendary).toBeGreaterThan(
      offerWeights(2).legendary,
    );
  });
});

describe("a whole run", () => {
  it("is won by beating all six rivals", () => {
    let run = newRun("six");
    for (let i = 0; i < GAUNTLET.length; i++) {
      run = finishMatch(run, true);
      if (i < GAUNTLET.length - 1) {
        expect(run.phase).toBe("reward");
        run = chooseReward(run, {
          cat: run.reward!.cats[0] ?? null,
          relic: run.reward!.relics[0] ?? null,
          trim: null,
        });
      }
    }
    expect(run.phase).toBe("over");
    expect(run.outcome).toBe("won");
    expect(run.results.map((r) => r.rivalId)).toEqual([...GAUNTLET]);
    expect(run.relics).toHaveLength(4);
    expect(run.deck).toHaveLength(21);

    const summary = summarizeRun(run);
    expect(summary).toMatchObject({
      clanId: "flame",
      matchesWon: 6,
      won: true,
    });
    expect(summary.totalScore).toBe(
      run.results.reduce((sum, r) => sum + r.player, 0),
    );
    expect(summary.bestMatchScore).toBe(
      Math.max(...run.results.map((r) => r.player)),
    );
  });

  it("can be abandoned once", () => {
    const run = abandonRun(newRun());
    expect(run.phase).toBe("over");
    expect(run.outcome).toBe("abandoned");
    expect(summarizeRun(run)).toMatchObject({
      matchesWon: 0,
      won: false,
      bestMatchScore: 0,
    });
    expect(() => abandonRun(run)).toThrow(IllegalAction);
  });
});
