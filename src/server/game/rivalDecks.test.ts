import { describe, expect, it } from "vitest";

import { CAT_LIST, getCat, RARITIES, type Rarity } from "./cats";
import { CLANS, starterDeck } from "./clans";
import { copyCap } from "./collection";
import { countCards, defaultDeck } from "./deck";
import { ELEMENTS } from "./elements";
import { GAUNTLET } from "./rival";
import {
  gauntletDeck,
  rarityMix,
  RIVAL_DECK,
  rivalDeck,
  rivalRelics,
  themeOf,
  themeShare,
} from "./rivalDecks";
import { startingPool } from "./unlocks";

const EVERY_CAT = CAT_LIST.map((cat) => cat.id);
const NEW_ACCOUNT = startingPool().cats;
const DEFAULT = defaultDeck();
const sorted = (cards: readonly string[]) => [...cards].sort();
const count = (deck: readonly string[], rarity: Rarity) =>
  deck.filter((id) => getCat(id).rarity === rarity).length;

/** A legal deck that is half rares and better, from the whole catalogue. */
function richDeck(): string[] {
  const of = (rarity: Rarity) =>
    CAT_LIST.filter((cat) => cat.rarity === rarity).map((cat) => cat.id);
  return [
    ...of("legendary").slice(0, 2),
    ...of("epic").slice(0, 4),
    ...of("rare").slice(0, 6),
    ...of("uncommon").slice(0, 6),
    ...of("common").slice(0, 6),
  ];
}

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
    for (const [pool, built] of [
      [EVERY_CAT, DEFAULT],
      [EVERY_CAT, richDeck()],
      [NEW_ACCOUNT, DEFAULT],
    ] as const) {
      for (const [matchIndex] of GAUNTLET.entries()) {
        expect(gauntletDeck(matchIndex, pool, built)).toHaveLength(
          RIVAL_DECK + matchIndex,
        );
      }
    }
  });

  it("come out, for a new account's first match, as each clan's old starter", () => {
    for (const rivalId of GAUNTLET) {
      expect(sorted(rivalDeck(rivalId, 0, NEW_ACCOUNT, DEFAULT))).toEqual(
        sorted(starterDeck(themeOf(rivalId))),
      );
    }
  });

  it("are mixed as the player's deck is, every rarity above common rounded down", () => {
    const rich = richDeck();
    expect(rich).toHaveLength(24);
    for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
      const size = RIVAL_DECK + matchIndex;
      const mix = rarityMix(rich, size);
      const deck = rivalDeck(rivalId, matchIndex, EVERY_CAT, rich);
      for (const rarity of RARITIES) {
        expect(count(deck, rarity), `${rivalId} ${rarity}`).toBe(mix[rarity]);
        if (rarity !== "common") {
          // Never more of a rarity than the player holds, for its size.
          expect(mix[rarity] / size).toBeLessThanOrEqual(
            count(rich, rarity) / rich.length,
          );
        }
      }
      expect(RARITIES.reduce((sum, r) => sum + mix[r], 0)).toBe(size);
    }
    // A deck of commons and uncommons meets no rare, whatever the pool.
    for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
      const deck = rivalDeck(rivalId, matchIndex, EVERY_CAT, DEFAULT);
      expect(count(deck, "rare") + count(deck, "epic")).toBe(0);
      expect(count(deck, "legendary")).toBe(0);
    }
  });

  it("take their own clan's cats first, for half the deck, and keep to the copy caps", () => {
    for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
      const theme = themeOf(rivalId);
      const size = RIVAL_DECK + matchIndex;
      const deck = rivalDeck(rivalId, matchIndex, EVERY_CAT, richDeck());
      for (const [catId, copies] of Object.entries(countCards(deck))) {
        expect(copies, catId).toBeLessThanOrEqual(copyCap(catId));
      }
      // With the whole catalogue to draw on, half is the rival's element,
      // and that half is its rarest cards.
      const own = deck.filter((id) => getCat(id).element === theme);
      expect(own).toHaveLength(themeShare(size));
      const rank = (id: string) => RARITIES.indexOf(getCat(id).rarity);
      const others = deck.filter((id) => getCat(id).element !== theme);
      expect(Math.min(...own.map(rank))).toBeGreaterThanOrEqual(
        Math.max(...others.map(rank)) - 1,
      );
    }
    expect(themeShare(16)).toBe(8);
    expect(themeShare(21)).toBe(11);
  });

  it("never show an account a cat it could not own", () => {
    for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
      for (const catId of rivalDeck(
        rivalId,
        matchIndex,
        NEW_ACCOUNT,
        DEFAULT,
      )) {
        expect(NEW_ACCOUNT).toContain(catId);
      }
    }
  });

  it("make up a rarity the account cannot fill from the one below", () => {
    // The deck asks for rares, and the account owns one rare of another clan.
    const pool = [...NEW_ACCOUNT, "pyrelynx"];
    const deck = rivalDeck("old-nine-lives", 5, pool, richDeck());
    expect(deck).toHaveLength(RIVAL_DECK + 5);
    expect(deck.every((id) => pool.includes(id))).toBe(true);
    expect(count(deck, "legendary") + count(deck, "epic")).toBe(0);
    expect(count(deck, "rare")).toBe(copyCap("pyrelynx"));
  });

  it("come with the rival's clan charm and no other relic", () => {
    for (const rivalId of GAUNTLET) {
      expect(rivalRelics(rivalId)).toEqual([CLANS[themeOf(rivalId)].relicId]);
    }
  });

  it("are the same deck every time", () => {
    expect(gauntletDeck(5, EVERY_CAT, richDeck())).toEqual(
      gauntletDeck(5, EVERY_CAT, richDeck()),
    );
  });
});
