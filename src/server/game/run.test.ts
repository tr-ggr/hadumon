import { describe, expect, it } from "vitest";

import { act, standIn } from "./bot";
import { getCat } from "./cats";
import { DECK_SIZE, defaultDeck, STOLEN } from "./deck";
import { rivalLevel } from "./difficulty";
import { IllegalAction, ROUND_TURNS } from "./match";
import { getRelic } from "./relics";
import { GAUNTLET } from "./rival";
import { rivalDeck, rivalRelics } from "./rivalDecks";
import {
  abandonRun,
  actInRun,
  applyReward,
  CHARM_CATS,
  CHEST_RELICS,
  chestOffer,
  chooseReward,
  deckElements,
  isCurrentRun,
  makeOffer,
  matchConfig,
  MIN_DECK,
  openChest,
  relicDue,
  retireRun,
  REWARD_RECLAIM,
  RUN_VERSION,
  startRun,
  summarizeRun,
  takeChest,
  theft,
  type RunState,
} from "./run";
import { startingPool } from "./unlocks";

const pool = startingPool();
const config = (seed = "r", ticket = "t") => ({
  seed,
  ticket,
  deck: defaultDeck(),
  pool,
});
/** A run stopped at its chest. */
const atChest = (seed = "r", ticket = "t") => startRun(config(seed, ticket));
/** A run with its chest opened, at the first match. */
const newRun = (seed = "r", ticket = "t") => {
  const run = atChest(seed, ticket);
  return openChest(run, run.chest[0]!);
};
const player = standIn(1);
const NOTHING = { reclaim: null, relic: null, trim: null };

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

const sorted = (cards: readonly string[]) => [...cards].sort();

describe("startRun", () => {
  it("stops at the chest, with eight of the deck's 24 cards stolen", () => {
    const run = atChest();
    expect(run.v).toBe(RUN_VERSION);
    expect(run.phase).toBe("chest");
    expect(run.match).toBeNull();
    expect(run.matchIndex).toBe(0);
    expect(run.relics).toEqual([]);
    expect(run.built).toHaveLength(DECK_SIZE);
    expect(run.stolen).toHaveLength(STOLEN);
    expect(run.deck).toHaveLength(DECK_SIZE - STOLEN);
    // Nothing is made or lost: the deck and the stolen cards are the 24.
    expect(sorted([...run.deck, ...run.stolen])).toEqual(sorted(defaultDeck()));
    expect(atChest("x")).toEqual(atChest("x"));
  });

  it("draws the theft and the chest from the ticket, not the seed", () => {
    const one = atChest("seed-1", "ticket");
    const two = atChest("seed-2", "ticket");
    expect(two.stolen).toEqual(one.stolen);
    expect(two.chest).toEqual(one.chest);
    // So giving a run up at the chest and starting again changes neither.
    const tickets = ["a", "b", "c", "d", "e", "f"].map((t) => atChest("s", t));
    expect(new Set(tickets.map((r) => r.stolen.join())).size).toBeGreaterThan(
      1,
    );
    expect(new Set(tickets.map((r) => r.chest.join())).size).toBeGreaterThan(1);
    expect(theft(defaultDeck(), "ticket")).toEqual(one.stolen);
  });

  it("steals the same cards whatever order the deck was saved in", () => {
    const backwards = startRun({ ...config(), deck: defaultDeck().reverse() });
    expect(backwards.stolen).toEqual(atChest().stolen);
    expect(backwards.built).toEqual(atChest().built);
  });
});

describe("the chest", () => {
  it("holds three different relics the account has unlocked", () => {
    const run = atChest();
    expect(run.chest).toHaveLength(CHEST_RELICS);
    expect(new Set(run.chest).size).toBe(CHEST_RELICS);
    expect(run.chest.every((id) => pool.relics.includes(id))).toBe(true);
  });

  it("leaves out a charm for an element the deck is thin in", () => {
    // The default deck is spread over five elements, under six cats of each.
    expect(
      Math.max(...Object.values(deckElements(defaultDeck()))),
    ).toBeLessThan(CHARM_CATS);
    for (const ticket of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      for (const relicId of chestOffer(pool.relics, defaultDeck(), ticket)) {
        expect(getRelic(relicId).score?.per, relicId).not.toBe("element");
      }
    }
  });

  it("can hold the charm of an element the deck is built on", () => {
    const flames = [
      ...Array.from({ length: 3 }, () => "flameclaw"),
      ...Array.from({ length: 3 }, () => "emberkit"),
      ...defaultDeck().filter((id) => getCat(id).element !== "flame"),
    ];
    expect(deckElements(flames).flame).toBe(CHARM_CATS);
    const seen = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].flatMap((ticket) =>
        chestOffer(pool.relics, flames, ticket),
      ),
    );
    expect(seen.has("ember-charm")).toBe(true);
    expect(seen.has("tide-charm")).toBe(false);
  });

  it("falls back on a thin charm sooner than hold fewer than three", () => {
    const few = ["warm-saucer", "tide-charm", "dusk-charm"];
    expect(sorted(chestOffer(few, defaultDeck(), "t"))).toEqual(sorted(few));
    expect(chestOffer(few, defaultDeck(), "t")[0]).toBe("warm-saucer");
  });

  it("gives the run its one relic and deals the first match", () => {
    const run = atChest();
    const relic = run.chest[1]!;
    const taken = takeChest(run, relic);
    expect(taken.relics).toEqual([relic]);
    expect(taken.phase).toBe("match");
    expect(taken.match).toBeNull();

    const opened = openChest(run, relic);
    expect(opened.relics).toEqual([relic]);
    expect(opened.match?.rivalId).toBe(GAUNTLET[0]);
    expect(opened.match?.sides.player.relics).toEqual([relic]);
    // The run before it is untouched.
    expect(run.phase).toBe("chest");
  });

  it("is opened once, with a relic that is in it", () => {
    const run = atChest();
    const outside = pool.relics.find((id) => !run.chest.includes(id))!;
    expect(() => openChest(run, outside)).toThrow(IllegalAction);
    expect(() => openChest(run, "toString")).toThrow(IllegalAction);
    expect(() => openChest(newRun(), run.chest[0]!)).toThrow(IllegalAction);
    expect(() => actInRun(run, { type: "den", targets: [] })).toThrow(
      IllegalAction,
    );
  });
});

describe("the first match", () => {
  it("is played with the sixteen cards that were not stolen", () => {
    const run = newRun();
    const side = run.match!.sides.player;
    const cards = [...side.setup, ...side.deck, ...side.tray, ...side.hand];
    expect(sorted(cards)).toEqual(sorted(run.deck));
  });

  it("seats the rival on its own deck with its clan's charm, already kept", () => {
    const run = newRun();
    const match = run.match!;
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
    expect(sorted(cards)).toEqual(
      sorted(rivalDeck("alley-tom", 0, pool.cats, run.built)),
    );
    expect(matchConfig(run).rival.deck).toHaveLength(run.deck.length);
  });
});

describe("difficulty", () => {
  const onTier = (difficulty?: "kitten" | "stray" | "apex") => {
    const run = startRun({ ...config(), difficulty });
    return openChest(run, run.chest[0]!);
  };

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
    run = chooseReward(run, NOTHING);
    expect(run.matchIndex).toBe(1);
    expect(run.match?.level).toBe(rivalLevel(1, "apex"));
    expect(run.match?.level).toBe(3);
    expect(run.difficulty).toBe("apex");
  });
});

describe("a run saved by an older game", () => {
  // The shape a run had when it began with a clan: version 2, no built deck.
  const old = {
    v: 2,
    seed: "old",
    clanId: "mist",
    difficulty: "stray",
    pool: { cats: [], relics: [] },
    deck: ["mistpaw"],
    relics: ["tide-charm"],
    matchIndex: 2,
    phase: "match",
    match: null,
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
    expect(isCurrentRun(atChest())).toBe(true);
  });

  it("retires as abandoned, keeping what its won matches earned", () => {
    expect(retireRun(old)).toEqual({
      difficulty: "stray",
      matchesWon: 2,
      matchesPlayed: 2,
      won: false,
      bestMatchScore: 36,
      totalScore: 67,
      deckElements: deckElements([]),
      goalsSwept: 0,
      reclaimed: 0,
    });
  });

  it("retires cleanly whatever is left of it", () => {
    expect(retireRun({})).toMatchObject({
      difficulty: "kitten",
      matchesWon: 0,
      matchesPlayed: 0,
      won: false,
      bestMatchScore: 0,
      totalScore: 0,
    });
    expect(retireRun(null).matchesWon).toBe(0);
    expect(retireRun({ results: "none" }).totalScore).toBe(0);
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
    expect(run.results[0]?.goals).toBeGreaterThanOrEqual(ROUND_TURNS.length);
    expect(() => actInRun(run, { type: "den", targets: [] })).toThrow(
      IllegalAction,
    );
  });

  it("opens a reward on a win: three stolen cards to take one back from", () => {
    const run = finishMatch(newRun(), true);
    expect(run.phase).toBe("reward");
    expect(run.outcome).toBeNull();
    const offer = run.reward!;
    expect(offer.reclaim).toHaveLength(REWARD_RECLAIM);
    expect(new Set(offer.reclaim).size).toBe(REWARD_RECLAIM);
    expect(offer.reclaim.every((id) => run.stolen.includes(id))).toBe(true);
    // A relic is due after the first win, and never one already held.
    expect(new Set(offer.relics).size).toBe(3);
    expect(offer.relics).not.toContain(run.relics[0]);
    // A run starts at the floor, so there is nothing to trim yet.
    expect(MIN_DECK).toBe(DECK_SIZE - STOLEN);
    expect(offer.canTrim).toBe(false);
    expect(makeOffer(run)).toEqual(offer);
  });

  it("offers fewer when fewer different cats are still stolen", () => {
    const run = finishMatch(newRun(), true);
    const two = { ...run, stolen: ["duskmew", "duskmew", "emberkit"] };
    expect(sorted(makeOffer(two).reclaim)).toEqual(["duskmew", "emberkit"]);
    expect(makeOffer({ ...run, stolen: [] }).reclaim).toEqual([]);
  });
});

describe("chooseReward", () => {
  it("takes a card back, takes a relic, trims, and starts the next match", () => {
    // A deck of one card over the floor, so a trim is on offer.
    const first = finishMatch(newRun(), true);
    const grown = { ...first, deck: [...first.deck, "flameclaw"] };
    const won = { ...grown, reward: makeOffer(grown) };
    const offer = won.reward;
    expect(first.reward?.canTrim).toBe(false);
    expect(offer.canTrim).toBe(true);
    const back = offer.reclaim[0]!;
    const trim = won.deck.find((id) => id !== back)!;
    const next = chooseReward(won, {
      reclaim: back,
      relic: offer.relics[0]!,
      trim,
    });
    expect(next.phase).toBe("match");
    expect(next.matchIndex).toBe(1);
    expect(next.reward).toBeNull();
    expect(next.deck).toHaveLength(won.deck.length);
    expect(next.deck.filter((c) => c === trim)).toHaveLength(
      won.deck.filter((c) => c === trim).length - 1,
    );
    expect(next.deck.at(-1)).toBe(back);
    // One copy leaves the stolen pile, however many of that cat are in it.
    expect(next.stolen).toHaveLength(STOLEN - 1);
    expect(next.stolen.filter((c) => c === back)).toHaveLength(
      won.stolen.filter((c) => c === back).length - 1,
    );
    expect(next.relics).toEqual([won.relics[0], offer.relics[0]]);
    expect(next.match?.rivalId).toBe(GAUNTLET[1]);
    expect(next.match?.sides.player.relics).toEqual(next.relics);
    expect(next.match?.phase).toBe("setup");
    // The previous run state is untouched.
    expect(won.stolen).toHaveLength(STOLEN);
    expect(won.deck).toHaveLength(DECK_SIZE - STOLEN + 1);
  });

  it("is `applyReward` and the next match dealt", () => {
    const won = finishMatch(newRun(), true);
    const choice = { ...NOTHING, reclaim: won.reward!.reclaim[1]! };
    const applied = applyReward(won, choice);
    expect(applied.match).toBeNull();
    expect(applied.phase).toBe("match");
    expect({ ...chooseReward(won, choice), match: null }).toEqual(applied);
  });

  it("allows skipping everything", () => {
    const won = finishMatch(newRun(), true);
    const next = chooseReward(won, NOTHING);
    expect(next.deck).toEqual(won.deck);
    expect(next.stolen).toEqual(won.stolen);
    expect(next.relics).toEqual(won.relics);
  });

  it("rejects what was not offered", () => {
    const won = finishMatch(newRun(), true);
    const kept = won.stolen.find((id) => !won.reward!.reclaim.includes(id));
    expect(() =>
      chooseReward(won, { ...NOTHING, reclaim: "nyxaroth" }),
    ).toThrow(IllegalAction);
    if (kept) {
      // Stolen, but not one of the three on the table.
      expect(() => chooseReward(won, { ...NOTHING, reclaim: kept })).toThrow(
        IllegalAction,
      );
    }
    expect(() =>
      chooseReward(won, { ...NOTHING, relic: won.relics[0]! }),
    ).toThrow(IllegalAction);
    expect(() => chooseReward(won, { ...NOTHING, trim: "nyxaroth" })).toThrow(
      IllegalAction,
    );
    expect(() => chooseReward(newRun(), NOTHING)).toThrow(IllegalAction);
  });

  it("will not trim a deck at the minimum size", () => {
    const won = finishMatch(newRun(), true);
    const small = { ...won, deck: won.deck.slice(0, MIN_DECK) };
    const offer = makeOffer(small);
    expect(offer.canTrim).toBe(false);
    expect(() =>
      chooseReward(
        { ...small, reward: offer },
        { ...NOTHING, trim: small.deck[0]! },
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
});

describe("a whole run", () => {
  it("is won by beating all six rivals, with five cards taken back", () => {
    let run = newRun("six");
    for (let i = 0; i < GAUNTLET.length; i++) {
      run = finishMatch(run, true);
      if (i < GAUNTLET.length - 1) {
        expect(run.phase).toBe("reward");
        run = chooseReward(run, {
          reclaim: run.reward!.reclaim[0] ?? null,
          relic: run.reward!.relics[0] ?? null,
          trim: null,
        });
        expect(matchConfig(run).rival.deck).toHaveLength(run.deck.length);
      }
    }
    expect(run.phase).toBe("over");
    expect(run.outcome).toBe("won");
    expect(run.results.map((r) => r.rivalId)).toEqual([...GAUNTLET]);
    // The chest's relic, and one after matches 1, 3 and 5.
    expect(run.relics).toHaveLength(4);
    expect(run.deck).toHaveLength(21);
    expect(run.stolen).toHaveLength(3);
    expect(sorted([...run.deck, ...run.stolen])).toEqual(sorted(run.built));

    const summary = summarizeRun(run);
    expect(summary).toMatchObject({
      matchesWon: 6,
      matchesPlayed: 6,
      won: true,
      reclaimed: 5,
      deckElements: deckElements(defaultDeck()),
    });
    expect(summary.totalScore).toBe(
      run.results.reduce((sum, r) => sum + r.player, 0),
    );
    expect(summary.bestMatchScore).toBe(
      Math.max(...run.results.map((r) => r.player)),
    );
  });

  it("counts a match swept when every round goal went to the player", () => {
    const run = finishMatch(newRun(), false);
    const record = run.results[0]!;
    const swept = {
      ...run,
      results: [{ ...record, goalsWon: record.goals }],
    };
    expect(summarizeRun(swept).goalsSwept).toBe(1);
    expect(
      summarizeRun({
        ...run,
        results: [{ ...record, goalsWon: record.goals - 1 }],
      }).goalsSwept,
    ).toBe(0);
  });

  it("can be abandoned once, at the chest or after it", () => {
    for (const start of [atChest(), newRun()]) {
      const run = abandonRun(start);
      expect(run.phase).toBe("over");
      expect(run.outcome).toBe("abandoned");
      expect(summarizeRun(run)).toMatchObject({
        matchesWon: 0,
        matchesPlayed: 0,
        won: false,
        bestMatchScore: 0,
        reclaimed: 0,
      });
      expect(() => abandonRun(run)).toThrow(IllegalAction);
    }
  });
});
