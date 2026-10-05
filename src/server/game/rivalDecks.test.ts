import { describe, expect, it } from "vitest";

import { CAT_LIST, getCat, RARITIES, type Rarity } from "./cats";
import { ELEMENTS } from "./elements";
import { GAUNTLET } from "./rival";
import {
  gauntletDeck,
  PICK_CAPS,
  rivalDeck,
  rivalPicks,
  rivalRelics,
  themeOf,
} from "./rivalDecks";
import { CLANS, makeOffer, starterDeck, startRun } from "./run";
import { poolFromUnlocks, STARTING_UNLOCKS } from "./unlocks";

const EVERY_CAT = CAT_LIST.map((cat) => cat.id);
const NEW_ACCOUNT = poolFromUnlocks(STARTING_UNLOCKS).cats;
const rank = (catId: string) => RARITIES.indexOf(getCat(catId).rarity);

describe("rival decks", () => {
  it("give every rival of the gauntlet a clan to build on", () => {
    for (const rivalId of GAUNTLET) {
      expect(ELEMENTS).toContain(themeOf(rivalId));
    }
    expect(GAUNTLET.map(themeOf)).toEqual([
      "thorn",
      "mist",
      "flame",
      "volt",
      "thorn",
      "shade",
    ]);
  });

  it("are a run deck's size at the same match: 16 cards and one a match", () => {
    for (const pool of [EVERY_CAT, NEW_ACCOUNT]) {
      for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
        const deck = gauntletDeck(matchIndex, pool);
        expect(deck).toHaveLength(16 + matchIndex);
        expect(deck.slice(0, 16)).toEqual(starterDeck(themeOf(rivalId)));
      }
    }
  });

  it("never pick a cat rarer than a player has typically taken by then", () => {
    for (const rivalId of GAUNTLET) {
      rivalPicks(rivalId, 5, EVERY_CAT).forEach((catId, pick) => {
        const cap = PICK_CAPS[pick];
        if (!cap) throw new Error("no cap");
        expect(rank(catId)).toBeLessThanOrEqual(RARITIES.indexOf(cap));
      });
    }
    // With the whole catalogue to pick from, the cap is what gets picked.
    expect(
      rivalPicks("old-nine-lives", 5, EVERY_CAT).map(
        (catId) => getCat(catId).rarity,
      ),
    ).toEqual(PICK_CAPS);
  });

  it("pick their own clan's cats first, and no cat twice", () => {
    for (const rivalId of GAUNTLET) {
      const picks = rivalPicks(rivalId, 5, EVERY_CAT);
      expect(new Set(picks).size).toBe(picks.length);
      // The first pick is an uncommon, and every clan has one.
      expect(getCat(picks[0] ?? "").element).toBe(themeOf(rivalId));
    }
  });

  it("never show an account a cat it could not own", () => {
    for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
      for (const catId of rivalDeck(rivalId, matchIndex, NEW_ACCOUNT)) {
        expect(NEW_ACCOUNT).toContain(catId);
      }
    }
    expect(rivalPicks("old-nine-lives", 5, ["flameclaw"])).toEqual([
      "flameclaw",
    ]);
    expect(rivalPicks("old-nine-lives", 5, [])).toEqual([]);
  });

  it("come with the rival's clan charm and no other relic", () => {
    for (const rivalId of GAUNTLET) {
      expect(rivalRelics(rivalId)).toEqual([CLANS[themeOf(rivalId)].relicId]);
    }
  });

  it("are the same deck every time", () => {
    expect(gauntletDeck(5, EVERY_CAT)).toEqual(gauntletDeck(5, EVERY_CAT));
  });
});

describe("the pick caps", () => {
  /** The rarity the best of three offered cats has, half the time or more. */
  function typicalBest(matchIndex: number): Rarity {
    const base = startRun({
      seed: "caps",
      clanId: "flame",
      pool: { cats: EVERY_CAT, relics: [] },
    });
    const best: number[] = [];
    for (let i = 0; i < 2000; i++) {
      const offer = makeOffer({ ...base, seed: `caps-${i}`, matchIndex });
      best.push(Math.max(...offer.cats.map(rank)));
    }
    best.sort((a, b) => a - b);
    const median = RARITIES[best[Math.floor(best.length / 2)] ?? 0];
    if (!median) throw new Error("no median");
    return median;
  }

  it("are what a reward's best cat typically is after each match", () => {
    expect([0, 1, 2, 3, 4].map(typicalBest)).toEqual(PICK_CAPS);
  });
});
