import { describe, expect, it } from "vitest";

import { CATS, getCat } from "./cats";
import { CLAN_LIST, CLANS, isClanId, starterDeck } from "./clans";
import { ELEMENTS } from "./elements";

/** `n` copies of each id, in order. */
function of(n: number, ...ids: string[]): string[] {
  return ids.flatMap((id) => Array.from({ length: n }, () => id));
}

describe("clans", () => {
  it("is one to an element", () => {
    expect(CLAN_LIST.map((clan) => clan.id)).toEqual([...ELEMENTS]);
    for (const element of ELEMENTS) {
      expect(CLANS[element].id).toBe(element);
      expect(isClanId(element)).toBe(true);
    }
    expect(isClanId("hadu")).toBe(false);
  });
});

describe("starter decks", () => {
  // Pinned card for card. A rival's deck is built on its clan's, so these do
  // not move when the catalogue grows.
  it("are the same 16 cards, in the same order, whatever the catalogue holds", () => {
    expect(starterDeck("flame")).toEqual([
      ...of(3, "flameclaw", "emberkit"),
      ...of(2, "cinderpounce"),
      "mistpaw",
      "dewhisker",
      "voltwhisk",
      "sparkmew",
      "thornkit",
      "bramblepaw",
      "shadewhisker",
      "duskmew",
    ]);
    expect(starterDeck("mist")).toEqual([
      "flameclaw",
      "emberkit",
      ...of(3, "mistpaw", "dewhisker"),
      ...of(2, "brumefang"),
      "voltwhisk",
      "sparkmew",
      "thornkit",
      "bramblepaw",
      "shadewhisker",
      "duskmew",
    ]);
    expect(starterDeck("volt")).toEqual([
      "flameclaw",
      "emberkit",
      "mistpaw",
      "dewhisker",
      ...of(3, "voltwhisk", "sparkmew"),
      ...of(2, "joltpad"),
      "thornkit",
      "bramblepaw",
      "shadewhisker",
      "duskmew",
    ]);
    expect(starterDeck("thorn")).toEqual([
      "flameclaw",
      "emberkit",
      "mistpaw",
      "dewhisker",
      "voltwhisk",
      "sparkmew",
      ...of(3, "thornkit", "bramblepaw"),
      ...of(2, "burrfang"),
      "shadewhisker",
      "duskmew",
    ]);
    expect(starterDeck("shade")).toEqual([
      "flameclaw",
      "emberkit",
      "mistpaw",
      "dewhisker",
      "voltwhisk",
      "sparkmew",
      "thornkit",
      "bramblepaw",
      ...of(3, "shadewhisker", "duskmew"),
      ...of(2, "gloomtail"),
    ]);
  });

  it("hold 16 cats that exist: 14 commons and the clan's own uncommon twice", () => {
    for (const element of ELEMENTS) {
      const deck = starterDeck(element);
      expect(deck, element).toHaveLength(16);
      for (const catId of deck) expect(CATS[catId], catId).toBeDefined();
      const uncommon = deck.filter((id) => getCat(id).rarity === "uncommon");
      expect(uncommon, element).toHaveLength(2);
      expect(new Set(uncommon).size, element).toBe(1);
      expect(getCat(uncommon[0] ?? "").element).toBe(element);
      expect(
        deck.filter((id) => getCat(id).rarity === "common"),
        element,
      ).toHaveLength(14);
      expect(
        deck.filter((id) => getCat(id).element === element),
        element,
      ).toHaveLength(8);
    }
  });

  it("hand out a fresh list each time", () => {
    const deck = starterDeck("flame");
    deck.push("hadu");
    expect(starterDeck("flame")).toHaveLength(16);
  });
});
