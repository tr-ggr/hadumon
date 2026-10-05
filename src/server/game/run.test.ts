import { describe, expect, it } from "vitest";

import { getCat } from "./cats";
import { IllegalAction } from "./match";
import type { Mods } from "./relics";
import { GAUNTLET } from "./rival";
import { createRng } from "./rng";
import {
  abandonRun,
  actInRun,
  chooseReward,
  CLANS,
  loadRun,
  makeOffer,
  MIN_DECK,
  offerWeights,
  relicDue,
  starterDeck,
  startRun,
  summarizeRun,
  type RunState,
} from "./run";
import { greedyBot } from "./sim";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";

const pool = poolFromUnlocks(STARTING_UNLOCKS);
const newRun = (seed = "r") => startRun({ seed, clanId: "flame", pool });

/** Plays the current match to its last turn, then rigs the rival's score. */
function finishMatch(start: RunState, win: boolean): RunState {
  const rng = createRng("bot");
  let run = start;
  for (let guard = 0; guard < 300; guard++) {
    const match = run.match;
    if (!match) throw new Error("no match");
    if (match.phase === "turn" && match.round === 2 && match.turnsLeft === 1) {
      const rigged = {
        ...match,
        rival: { ...match.rival, banked: win ? 0 : 99, yarn: 0, goalPoints: 0 },
      };
      return actInRun({ ...run, match: rigged }, { type: "den", targets: [] })
        .run;
    }
    run = actInRun(run, greedyBot(match, rng)).run;
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
    expect(run.phase).toBe("match");
    expect(run.matchIndex).toBe(0);
    expect(run.relics).toEqual([CLANS.flame.relicId]);
    expect(run.match?.rivalId).toBe(GAUNTLET[0]);
    expect(run.match?.relics).toEqual(run.relics);
    expect(run.deck).toHaveLength(16);
    expect(newRun("x")).toEqual(newRun("x"));
  });
});

describe("difficulty", () => {
  const onTier = (difficulty?: "kitten" | "stray" | "apex") =>
    startRun({ seed: "r", clanId: "flame", pool, difficulty });

  it("is Kitten unless the run says otherwise", () => {
    expect(newRun().difficulty).toBe("kitten");
    expect(newRun().match?.rival.yarn).toBe(0);
    expect(onTier("kitten")).toEqual(newRun());
    expect(summarizeRun(newRun()).difficulty).toBe("kitten");
  });

  it("gives the rival its head start and changes nothing else", () => {
    const stray = onTier("stray");
    const apex = onTier("apex");
    expect(stray.match?.rival.yarn).toBe(2);
    expect(apex.match?.rival.yarn).toBe(4);
    expect(stray.match?.mods.rivalStartYarn).toBe(2);
    expect(summarizeRun(apex).difficulty).toBe("apex");
    // The same seed deals the same table on every tier.
    const kitten = newRun();
    expect({
      ...stray.match,
      mods: kitten.match?.mods,
      rival: kitten.match?.rival,
    }).toEqual(kitten.match);
  });

  it("carries the head start into every match of the run", () => {
    let run = finishMatch(onTier("apex"), true);
    run = chooseReward(run, { cat: null, relic: null, trim: null });
    expect(run.matchIndex).toBe(1);
    expect(run.match?.rival.yarn).toBe(4);
    expect(run.difficulty).toBe("apex");
  });

  it("reads a run saved before tiers existed as Kitten", () => {
    const old = finishMatch(newRun(), true);
    delete old.difficulty;
    const next = chooseReward(old, { cat: null, relic: null, trim: null });
    expect(next.match?.rival.yarn).toBe(0);
    expect(summarizeRun(next).difficulty).toBe("kitten");
  });
});

describe("loadRun", () => {
  it("fills in a mod the stored match never had", () => {
    const run = startRun({ seed: "r", clanId: "flame", pool });
    const oldMods: Partial<Mods> = { ...run.match!.mods };
    delete oldMods.rivalStartYarn;
    const stored = {
      ...run,
      match: { ...run.match!, mods: oldMods },
    } as RunState;
    expect(stored.match?.mods.rivalStartYarn).toBeUndefined();
    expect(loadRun(stored)).toEqual(run);
  });

  it("keeps the mods a match was dealt", () => {
    const run = startRun({
      seed: "r",
      clanId: "flame",
      pool,
      difficulty: "apex",
    });
    expect(loadRun(run)).toEqual(run);
    const between = { ...run, match: null };
    expect(loadRun(between)).toBe(between);
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
    expect(next.match?.relics).toEqual(next.relics);
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
