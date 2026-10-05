import { describe, expect, it } from "vitest";

import { STARTER_COLLECTION } from "~/server/game/collection";
import { DECK_SIZE, defaultDeck, validateDeck } from "~/server/game/deck";

import {
  addCard,
  addRefusal,
  deckStatus,
  elementCounts,
  NO_FILTERS,
  removeCard,
  sameDeck,
  shelve,
  stacks,
} from "./build";

const owned = { ...STARTER_COLLECTION, hadu: 1, pyrelynx: 2 };
const saved = defaultDeck();

describe("adding a card", () => {
  it("puts one more copy in, and keeps the deck in reading order", () => {
    const deck = addCard(removeCard(saved, "duskmew"), "pyrelynx", owned);
    expect(deck).toHaveLength(DECK_SIZE);
    expect(deck.filter((id) => id === "pyrelynx")).toHaveLength(1);
    // Flame comes first, and a rare after its element's commons and uncommons.
    expect(deck.indexOf("pyrelynx")).toBe(deck.indexOf("cinderpounce") + 1);
    expect(validateDeck(deck, owned)).toEqual([]);
  });

  it("refuses a fourth copy, and says why", () => {
    const three = addCard(saved, "flameclaw", owned);
    expect(three.filter((id) => id === "flameclaw")).toHaveLength(3);
    expect(addRefusal(three, "flameclaw", owned)).toBe(
      "A deck holds 3 of a cat at most.",
    );
    expect(addCard(three, "flameclaw", owned)).toEqual(three);
  });

  it("refuses a second copy of a legendary", () => {
    const one = addCard(saved, "hadu", owned);
    expect(one).toContain("hadu");
    expect(addRefusal(one, "hadu", owned)).toBe(
      "Hadu is a legendary: a deck holds one of it.",
    );
    expect(addCard(one, "hadu", { ...owned, hadu: 2 })).toEqual(one);
  });

  it("refuses a copy the account does not own", () => {
    expect(addRefusal(saved, "nyxaroth", owned)).toBe(
      "You do not own Nyxaroth.",
    );
    const both = addCard(addCard(saved, "pyrelynx", owned), "pyrelynx", owned);
    expect(addRefusal(both, "pyrelynx", owned)).toBe(
      "You own 2 of Pyrelynx, and all 2 are in the deck.",
    );
    const mine = { ...owned, pyrelynx: 1 };
    expect(addRefusal(addCard(saved, "pyrelynx", mine), "pyrelynx", mine)).toBe(
      "You own one Pyrelynx, and it is in the deck.",
    );
  });

  it("lets a deck go over 24, for the rail to say so", () => {
    const over = addCard(saved, "flameclaw", owned);
    expect(over).toHaveLength(DECK_SIZE + 1);
    expect(deckStatus(over, owned, saved).sentence).toBe(
      "25 of 24 cards. Take 1 out.",
    );
  });
});

describe("taking a card out", () => {
  it("removes one copy and leaves the rest", () => {
    const deck = removeCard(saved, "flameclaw");
    expect(deck).toHaveLength(DECK_SIZE - 1);
    expect(deck.filter((id) => id === "flameclaw")).toHaveLength(1);
    expect(removeCard(deck, "nyxaroth")).toEqual(deck);
    // The deck handed in is never changed.
    expect(saved).toHaveLength(DECK_SIZE);
  });
});

describe("the shelf", () => {
  it("lists only what is owned unless asked for everything", () => {
    const mine = shelve(owned, saved, NO_FILTERS);
    expect(mine.map((row) => row.cat.id)).toContain("hadu");
    expect(mine.every((row) => row.owned > 0)).toBe(true);
    const all = shelve(owned, saved, { ...NO_FILTERS, ownedOnly: false });
    expect(all.length).toBeGreaterThan(mine.length);
    const stranger = all.find((row) => row.cat.id === "nyxaroth");
    expect(stranger).toMatchObject({ owned: 0, inDeck: 0 });
    expect(stranger?.refusal).toBe("You do not own Nyxaroth.");
  });

  it("counts what is in the deck and says when no more can go in", () => {
    const rows = shelve(owned, saved, NO_FILTERS);
    const flameclaw = rows.find((row) => row.cat.id === "flameclaw");
    expect(flameclaw).toMatchObject({ owned: 3, inDeck: 2, refusal: null });
    const gloomtail = rows.find((row) => row.cat.id === "gloomtail");
    expect(gloomtail).toMatchObject({ owned: 2, inDeck: 1, refusal: null });
  });

  it("filters by element and rarity together", () => {
    const rows = shelve(owned, saved, {
      element: "flame",
      rarity: "common",
      ownedOnly: true,
    });
    expect(rows.map((row) => row.cat.id).sort()).toEqual([
      "emberkit",
      "flameclaw",
    ]);
  });
});

describe("the deck as it is shown", () => {
  it("stacks the copies of a cat, in reading order", () => {
    const piles = stacks(saved);
    expect(piles).toHaveLength(14);
    expect(piles[0]).toEqual(["emberkit", 2]);
    expect(piles.reduce((sum, [, copies]) => sum + copies, 0)).toBe(DECK_SIZE);
  });

  it("counts the cats of each element", () => {
    expect(elementCounts(saved)).toEqual([
      ["flame", 5],
      ["mist", 5],
      ["volt", 4],
      ["thorn", 5],
      ["shade", 5],
    ]);
  });
});

describe("the rail", () => {
  it("says the deck is saved when nothing has changed", () => {
    const status = deckStatus(saved, owned, [...saved].reverse());
    expect(status).toMatchObject({
      dirty: false,
      canSave: false,
      problems: [],
    });
    expect(status.sentence).toMatch(/^24 cards, saved\./);
    expect(sameDeck(saved, [...saved].reverse())).toBe(true);
  });

  it("offers to save a legal deck that has changed", () => {
    const deck = addCard(removeCard(saved, "duskmew"), "hadu", owned);
    const status = deckStatus(deck, owned, saved);
    expect(status).toMatchObject({ dirty: true, canSave: true });
    expect(status.sentence).toMatch(/^24 cards\. Save it/);
  });

  it("says what is wrong, the size first, and will not save it", () => {
    const short = removeCard(saved, "duskmew");
    const status = deckStatus(short, owned, saved);
    expect(status.canSave).toBe(false);
    expect(status.sentence).toBe("23 of 24 cards. Add 1 more.");
    // A deck saved before a card left the collection is told so too.
    const stale = deckStatus(saved, { ...owned, gloomtail: 0 }, saved);
    expect(stale.dirty).toBe(false);
    expect(stale.sentence).toBe("You do not own Gloomtail.");
  });
});
