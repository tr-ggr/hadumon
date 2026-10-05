import { describe, expect, it } from "vitest";

import { CAT_LIST, getCat, RARITIES } from "./cats";
import {
  cardCount,
  copyCap,
  gainCards,
  MAX_COPIES,
  ownedCards,
  ownedIds,
  STARTER_COLLECTION,
} from "./collection";
import {
  COSMETIC_LIST,
  COSMETIC_SLOTS,
  cosmeticsIn,
  DEFAULT_LOOK,
  getCosmetic,
  HADU_SLOTS,
  lookOf,
  ownsCosmetic,
  TABLE_SLOTS,
} from "./cosmetics";
import {
  countCards,
  DECK_SIZE,
  defaultDeck,
  describeProblem,
  isLegalDeck,
  sortDeck,
  STOLEN,
  validateDeck,
} from "./deck";
import { ELEMENTS } from "./elements";
import {
  CAT_PACKS,
  COSMETIC_PACKS,
  DUPLICATE_REFUND,
  expectedRefund,
  getPack,
  isPackId,
  openCatPack,
  openCosmeticPack,
  PACK_CARDS,
  PACK_LIST,
  PACK_PIECES,
  PACK_PRICE,
  packCats,
  packOf,
  packPieces,
  piecesLeft,
  settleCats,
  SLOT_ODDS,
} from "./packs";
import { payout, type PayoutFacts } from "./payout";
import { createRng } from "./rng";

describe("the starter collection", () => {
  it("is three of ten commons and two of five uncommons", () => {
    const ids = Object.keys(STARTER_COLLECTION);
    expect(ids).toHaveLength(15);
    expect(cardCount(STARTER_COLLECTION)).toBe(40);
    for (const id of ids) {
      const { rarity } = getCat(id);
      expect(STARTER_COLLECTION[id]).toBe(rarity === "common" ? 3 : 2);
      expect(["common", "uncommon"]).toContain(rarity);
    }
    for (const element of ELEMENTS) {
      expect(ids.filter((id) => getCat(id).element === element)).toHaveLength(
        3,
      );
    }
  });

  it("is added to what an account has gained, never stored with it", () => {
    const owned = ownedCards([
      { catId: "pyrelynx", copies: 2 },
      { catId: "joltpad", copies: 1 },
      { catId: "hadu", copies: 0 },
    ]);
    expect(owned.pyrelynx).toBe(2);
    expect(owned.joltpad).toBe(3);
    expect(owned.flameclaw).toBe(3);
    expect(owned.hadu).toBeUndefined();
    expect(ownedIds(owned)).toHaveLength(16);
    expect(STARTER_COLLECTION.pyrelynx).toBeUndefined();
  });

  it("keeps a card until its cap, three of a cat and one of a legendary", () => {
    expect(copyCap("flameclaw")).toBe(MAX_COPIES);
    expect(copyCap("hadu")).toBe(1);
    const { owned, gains } = gainCards(STARTER_COLLECTION, [
      "flameclaw",
      "joltpad",
      "joltpad",
      "hadu",
      "hadu",
    ]);
    expect(gains.map((gain) => gain.kept)).toEqual([
      false,
      true,
      false,
      true,
      false,
    ]);
    expect(owned.flameclaw).toBe(3);
    expect(owned.joltpad).toBe(3);
    expect(owned.hadu).toBe(1);
    expect(STARTER_COLLECTION.hadu).toBeUndefined();
  });
});

describe("a deck", () => {
  const deck = defaultDeck();

  it("is 24 cards, of which a run opens with 8 stolen", () => {
    expect(DECK_SIZE).toBe(24);
    expect(STOLEN).toBe(8);
    expect(deck).toHaveLength(DECK_SIZE);
  });

  it("has a default a new account can play", () => {
    expect(validateDeck(deck, STARTER_COLLECTION)).toEqual([]);
    expect(isLegalDeck(deck, STARTER_COLLECTION)).toBe(true);
    // A copy the caller may change, not the frozen list.
    deck.pop();
    expect(defaultDeck()).toHaveLength(DECK_SIZE);
  });

  it("says when it is short, and when it is over", () => {
    const short = defaultDeck().slice(1);
    expect(validateDeck(short, STARTER_COLLECTION)).toEqual([
      { kind: "size", have: 23 },
    ]);
    expect(describeProblem({ kind: "size", have: 23 })).toBe(
      "23 of 24 cards. Add 1 more.",
    );
    expect(describeProblem({ kind: "size", have: 25 })).toBe(
      "25 of 24 cards. Take 1 out.",
    );
  });

  it("refuses a fourth copy, even of a cat owned four times over", () => {
    const four = [...defaultDeck().slice(0, -2), "flameclaw", "flameclaw"];
    expect(countCards(four).flameclaw).toBe(4);
    const problems = validateDeck(four, {
      ...STARTER_COLLECTION,
      flameclaw: 4,
    });
    expect(problems).toEqual([
      { kind: "copies", catId: "flameclaw", have: 4, cap: 3 },
    ]);
    expect(describeProblem(problems[0]!)).toContain("4 of Flameclaw");
  });

  it("refuses a second copy of a legendary", () => {
    const owned = { ...STARTER_COLLECTION, hadu: 1 };
    const one = [...defaultDeck().slice(1), "hadu"];
    expect(validateDeck(one, owned)).toEqual([]);
    const two = [...defaultDeck().slice(2), "hadu", "hadu"];
    expect(validateDeck(two, owned)).toEqual([
      { kind: "copies", catId: "hadu", have: 2, cap: 1 },
    ]);
    expect(describeProblem(validateDeck(two, owned)[0]!)).toBe(
      "Hadu is a legendary: a deck holds one of it.",
    );
  });

  it("refuses a card the account does not own, or owns fewer of", () => {
    const rare = [...defaultDeck().slice(1), "pyrelynx"];
    expect(validateDeck(rare, STARTER_COLLECTION)).toEqual([
      { kind: "owned", catId: "pyrelynx", have: 1, owned: 0 },
    ]);
    const third = [...defaultDeck().slice(2), "gloomtail", "gloomtail"];
    expect(validateDeck(third, STARTER_COLLECTION)).toEqual([
      { kind: "owned", catId: "gloomtail", have: 3, owned: 2 },
    ]);
  });

  it("refuses a card that is not in the game", () => {
    const odd = [...defaultDeck().slice(1), "dogmon"];
    expect(validateDeck(odd, STARTER_COLLECTION)).toEqual([
      { kind: "unknown", catId: "dogmon" },
    ]);
    // A name on `Object.prototype` is not a cat either.
    expect(
      validateDeck([...defaultDeck().slice(1), "toString"], STARTER_COLLECTION),
    ).toEqual([{ kind: "unknown", catId: "toString" }]);
  });

  it("sorts by element, then rarity, then name", () => {
    expect(sortDeck(["duskmew", "burrfang", "emberkit", "flameclaw"])).toEqual([
      "emberkit",
      "flameclaw",
      "burrfang",
      "duskmew",
    ]);
  });
});

describe("cat packs", () => {
  it("are one an element, and between them hold every cat once", () => {
    expect(CAT_PACKS.map((pack) => pack.element)).toEqual([...ELEMENTS]);
    const held = CAT_PACKS.flatMap(packCats);
    expect([...held].sort()).toEqual(CAT_LIST.map((cat) => cat.id).sort());
    for (const cat of CAT_LIST) {
      expect(packCats(packOf(cat.id))).toContain(cat.id);
    }
  });

  it("hold cats of every rarity", () => {
    for (const pack of CAT_PACKS) {
      const rarities = new Set(packCats(pack).map((id) => getCat(id).rarity));
      // Flame and mist gain their legendaries with the larger catalogue.
      for (const rarity of ["common", "uncommon", "rare"] as const) {
        expect(rarities.has(rarity), `${pack.id} ${rarity}`).toBe(true);
      }
    }
  });

  it("give five cats of the pack's element, the same for the same seed", () => {
    for (const pack of CAT_PACKS) {
      const cats = openCatPack(pack, createRng(`open-${pack.id}`));
      expect(cats).toHaveLength(PACK_CARDS);
      expect(cats.every((id) => getCat(id).element === pack.element)).toBe(
        true,
      );
      expect(openCatPack(pack, createRng(`open-${pack.id}`))).toEqual(cats);
    }
  });

  it("roll each slot inside its odds", () => {
    for (const odds of SLOT_ODDS) {
      const total = Object.values(odds).reduce((sum, n) => sum + n, 0);
      expect(total).toBe(100);
    }
    const pack = CAT_PACKS[2]!;
    const seen = SLOT_ODDS.map(() => new Map<string, number>());
    const packs = 4000;
    for (let i = 0; i < packs; i++) {
      openCatPack(pack, createRng(`odds-${i}`)).forEach((id, slot) => {
        const rarity = getCat(id).rarity;
        seen[slot]!.set(rarity, (seen[slot]!.get(rarity) ?? 0) + 1);
      });
    }
    SLOT_ODDS.forEach((odds, slot) => {
      for (const rarity of RARITIES) {
        const share = (seen[slot]!.get(rarity) ?? 0) / packs;
        const wanted = (odds[rarity] ?? 0) / 100;
        // A rarity the slot does not list never comes out of it.
        if (wanted === 0) expect(share, `${slot} ${rarity}`).toBe(0);
        else expect(Math.abs(share - wanted)).toBeLessThan(0.03);
      }
    });
  });

  it("pay back less than they cost, however full the collection", () => {
    expect(expectedRefund()).toBeLessThan(PACK_PRICE.cats);
    // The dearest five cards a pack can hold are not free coins either.
    const worst = SLOT_ODDS.reduce(
      (sum, odds) =>
        sum +
        Math.max(
          ...RARITIES.filter((r) => (odds[r] ?? 0) > 0).map(
            (r) => DUPLICATE_REFUND[r],
          ),
        ),
      0,
    );
    expect(worst).toBeGreaterThan(PACK_PRICE.cats);
    expect(expectedRefund()).toBeGreaterThan(0);
  });

  it("turn a card past its cap into coins and keep the rest", () => {
    const { owned, cats, refund } = settleCats(
      ["flameclaw", "pyrelynx", "pyrelynx", "cinderpounce", "cinderpounce"],
      STARTER_COLLECTION,
    );
    expect(cats.map((cat) => cat.kept)).toEqual([
      false,
      true,
      true,
      true,
      false,
    ]);
    expect(refund).toBe(DUPLICATE_REFUND.common + DUPLICATE_REFUND.uncommon);
    expect(owned.pyrelynx).toBe(2);
    expect(owned.cinderpounce).toBe(3);
    expect(STARTER_COLLECTION.pyrelynx).toBeUndefined();
  });
});

describe("cosmetics", () => {
  it("are eight to a hadu slot and six to a table slot, and one free each", () => {
    for (const slot of COSMETIC_SLOTS) {
      const pieces = cosmeticsIn(slot);
      expect(pieces.filter((piece) => piece.free)).toHaveLength(1);
      expect(pieces.filter((piece) => !piece.free)).toHaveLength(
        (HADU_SLOTS as readonly string[]).includes(slot) ? 8 : 6,
      );
      expect(DEFAULT_LOOK[slot]).toBe(pieces.find((piece) => piece.free)?.id);
    }
    expect(COSMETIC_LIST.filter((piece) => !piece.free)).toHaveLength(64);
    const ids = COSMETIC_LIST.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = COSMETIC_LIST.map((piece) => piece.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("let an account wear what is free or gained, and nothing else", () => {
    expect(ownsCosmetic("hat-none", [])).toBe(true);
    expect(ownsCosmetic("hat-top-hat", [])).toBe(false);
    expect(ownsCosmetic("hat-top-hat", ["hat-top-hat"])).toBe(true);
    expect(ownsCosmetic("hat-of-lies", ["hat-of-lies"])).toBe(false);
    expect(ownsCosmetic("toString", [])).toBe(false);
  });

  it("make a stored look whole", () => {
    expect(lookOf(null, [])).toEqual(DEFAULT_LOOK);
    expect(lookOf({}, [])).toEqual(DEFAULT_LOOK);
    const look = lookOf(
      {
        hat: "hat-top-hat",
        eyes: "eyes-star",
        // A hat is not a tail.
        tail: "hat-top-hat",
        sky: "sky-night",
        extra: "x",
      },
      ["hat-top-hat", "sky-night"],
    );
    expect(look).toEqual({
      ...DEFAULT_LOOK,
      hat: "hat-top-hat",
      sky: "sky-night",
    });
    expect(Object.keys(look).sort()).toEqual([...COSMETIC_SLOTS].sort());
  });
});

describe("cosmetic packs", () => {
  const [wardrobe, table] = COSMETIC_PACKS;

  it("hold every piece that is not free, each in one pack", () => {
    expect(packPieces(wardrobe!)).toHaveLength(HADU_SLOTS.length * 8);
    expect(packPieces(table!)).toHaveLength(TABLE_SLOTS.length * 6);
    const all = COSMETIC_PACKS.flatMap(packPieces);
    expect(new Set(all).size).toBe(all.length);
    expect(all.every((id) => !getCosmetic(id).free)).toBe(true);
    expect(all).toHaveLength(COSMETIC_LIST.filter((p) => !p.free).length);
  });

  it("never give a piece the account has, or the same one twice", () => {
    for (const pack of COSMETIC_PACKS) {
      const gained: string[] = [];
      const all = packPieces(pack);
      for (let i = 0; gained.length < all.length; i++) {
        const pieces = openCosmeticPack(
          pack,
          gained,
          createRng(`${pack.id}-${i}`),
        );
        expect(pieces).toHaveLength(
          Math.min(PACK_PIECES, all.length - gained.length),
        );
        expect(new Set(pieces).size).toBe(pieces.length);
        for (const id of pieces) {
          expect(gained).not.toContain(id);
          expect(all).toContain(id);
        }
        gained.push(...pieces);
        expect(i).toBeLessThan(all.length);
      }
      expect(piecesLeft(pack, gained)).toEqual([]);
      expect(openCosmeticPack(pack, gained, createRng("empty"))).toEqual([]);
    }
  });

  it("bring the common pieces out first, more often than not", () => {
    let common = 0;
    const packs = 400;
    for (let i = 0; i < packs; i++) {
      const [first] = openCosmeticPack(wardrobe!, [], createRng(`first-${i}`));
      if (getCosmetic(first!).rarity === "common") common += 1;
    }
    expect(common / packs).toBeGreaterThan(0.5);
  });
});

describe("the shelf", () => {
  it("is five cat packs and two cosmetic packs at one price a kind", () => {
    expect(PACK_LIST).toHaveLength(7);
    expect(PACK_LIST.filter((pack) => pack.kind === "cats")).toHaveLength(5);
    expect(PACK_PRICE.cats).toBeGreaterThan(0);
    expect(PACK_PRICE.cosmetics).toBeGreaterThan(0);
    for (const pack of PACK_LIST) {
      expect(isPackId(pack.id)).toBe(true);
      expect(getPack(pack.id)).toBe(pack);
      expect(pack.text).toMatch(/\.$/);
    }
    expect(isPackId("toString")).toBe(false);
    expect(() => getPack("constructor")).toThrow();
  });
});

describe("what a run pays", () => {
  const run = (over: Partial<PayoutFacts> = {}): PayoutFacts => ({
    totalScore: 0,
    matchesWon: 0,
    won: false,
    difficulty: "kitten",
    bestMatchScore: 0,
    goalsSwept: 0,
    reclaimed: 0,
    ...over,
  });

  it("is half a coin a point, rounded down, with nothing else earned", () => {
    expect(payout(run())).toBe(0);
    expect(payout(run({ totalScore: 51 }))).toBe(25);
    expect(payout(run({ totalScore: 100 }))).toBe(50);
  });

  it("is whole and never negative, whatever it is handed", () => {
    for (const facts of [
      run({ totalScore: -40, matchesWon: -2, goalsSwept: -1, reclaimed: -3 }),
      run({ totalScore: 33.7, matchesWon: 2.9, bestMatchScore: 61.5 }),
      run({ matchesWon: 99, won: true, difficulty: "apex" }),
    ]) {
      const coins = payout(facts);
      expect(Number.isInteger(coins)).toBe(true);
      expect(coins).toBeGreaterThanOrEqual(0);
    }
  });

  it("pays each win more than the one before it", () => {
    const at = (wins: number) =>
      payout(run({ totalScore: 50 * wins, matchesWon: wins }));
    const steps = [1, 2, 3, 4, 5, 6].map((wins) => at(wins) - at(wins - 1));
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1]!);
    }
    // So two runs given up after one win pay less than one run of two.
    expect(at(2)).toBeGreaterThan(2 * at(1));
  });

  it("pays a won run, a swept match and a card taken back", () => {
    const base = run({ totalScore: 300, matchesWon: 6 });
    expect(payout({ ...base, won: true })).toBeGreaterThan(payout(base));
    expect(payout({ ...base, goalsSwept: 1 })).toBeGreaterThan(payout(base));
    expect(payout({ ...base, reclaimed: 1 })).toBeGreaterThan(payout(base));
  });

  it("pays more for the same run on a harder tier", () => {
    const base = run({ totalScore: 200, matchesWon: 4, reclaimed: 4 });
    const kitten = payout(base);
    const stray = payout({ ...base, difficulty: "stray" });
    const apex = payout({ ...base, difficulty: "apex" });
    expect(stray).toBeGreaterThan(kitten);
    expect(apex).toBeGreaterThan(stray);
    // The points themselves are worth the same on every tier.
    expect(payout(run({ totalScore: 200, difficulty: "apex" }))).toBe(
      payout(run({ totalScore: 200 })),
    );
    expect(payout(run({ totalScore: 200 }))).toBe(100);
  });
});
