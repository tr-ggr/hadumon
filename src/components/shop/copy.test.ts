import { describe, expect, it } from "vitest";

import { RARITIES } from "~/server/game/cats";
import {
  DUPLICATE_REFUND,
  getPack,
  PACK_LIST,
  SLOT_ODDS,
} from "~/server/game/packs";

import {
  coins,
  copiesRule,
  leftToFind,
  oddsLines,
  packHeading,
  packPhrase,
  refundRule,
  shelfSentence,
  standing,
} from "./copy";

const cinder = getPack("cinder-pack");
const wardrobe = getPack("wardrobe-pack");

describe("coins", () => {
  it("counts one coin as one", () => {
    expect(coins(1)).toBe("1 coin");
    expect(coins(0)).toBe("0 coins");
    expect(coins(240)).toBe("240 coins");
  });
});

describe("a pack's name in a sentence", () => {
  it("says pack once, whatever the pack is called", () => {
    expect(packPhrase(cinder)).toBe("the Cinder Pack");
    expect(packPhrase(wardrobe)).toBe("the Wardrobe pack");
    expect(packPhrase(getPack("table-pack"))).toBe("the Table and Tower pack");
    expect(packHeading(cinder)).toBe("Cinder Pack");
    expect(packHeading(wardrobe)).toBe("Wardrobe pack");
    for (const pack of PACK_LIST) {
      expect(packPhrase(pack).match(/pack/gi), pack.id).toHaveLength(1);
    }
  });
});

describe("standing", () => {
  it("lets a pack be opened with its price or more", () => {
    expect(standing(100, null, 100)).toEqual({ can: true });
    expect(standing(100, null, 240)).toEqual({ can: true });
    expect(standing(150, 12, 150)).toEqual({ can: true });
  });

  it("says how many more coins a pack needs", () => {
    const short = standing(100, null, 40);
    expect(short).toMatchObject({ can: false, reason: "short", short: 60 });
    expect(short.can ? "" : short.why).toBe(
      "It is 100 coins and you have 40: 60 more to go.",
    );
  });

  it("says an empty purse is empty", () => {
    const none = standing(100, null, 0);
    expect(none.can ? "" : none.why).toBe("It is 100 coins and you have none.");
  });

  it("says a finished cosmetic pack is finished, coins or no coins", () => {
    for (const balance of [0, 1000]) {
      expect(standing(150, 0, balance)).toEqual({
        can: false,
        reason: "complete",
        why: "You have everything in this pack.",
      });
    }
  });
});

describe("shelfSentence", () => {
  it("says what the confirm will do, and what is in the purse", () => {
    expect(shelfSentence(cinder, 100, null, 240)).toBe(
      "Open the Cinder Pack for 100 coins. You have 240.",
    );
    expect(shelfSentence(wardrobe, 150, 12, 150)).toBe(
      "Open the Wardrobe pack for 150 coins. You have 150.",
    );
  });

  it("says why a pack cannot be opened", () => {
    expect(shelfSentence(cinder, 100, null, 40)).toBe(
      "The Cinder Pack is 100 coins. You have 40: 60 more to go.",
    );
    expect(shelfSentence(cinder, 100, null, 0)).toBe(
      "The Cinder Pack is 100 coins. You have none.",
    );
    expect(shelfSentence(wardrobe, 150, 0, 900)).toBe(
      "You have everything in this pack.",
    );
  });
});

describe("leftToFind", () => {
  it("counts what is left, and says when nothing is", () => {
    expect(leftToFind(12, 37)).toBe("12 of 37 still to find.");
    expect(leftToFind(0, 37)).toBe("All 37 found.");
  });
});

describe("oddsLines", () => {
  const lines = oddsLines();

  it("says the game's own odds, in the game's own numbers", () => {
    expect(lines).toEqual([
      {
        cards: "Cards 1 to 3",
        chances: "75 in 100 common, 25 in 100 uncommon",
      },
      { cards: "Card 4", chances: "70 in 100 uncommon, 30 in 100 rare" },
      {
        cards: "Card 5",
        chances: "70 in 100 rare, 24 in 100 epic, 6 in 100 legendary",
      },
    ]);
  });

  it("names every chance of every card, and each line adds up to a hundred", () => {
    const said = lines.flatMap((line) =>
      [...line.chances.matchAll(/(\d+) in 100/g)].map((match) =>
        Number(match[1]),
      ),
    );
    const real = [
      ...new Set(SLOT_ODDS.map((odds) => JSON.stringify(odds))),
    ].flatMap((odds) => Object.values(JSON.parse(odds) as object) as number[]);
    expect([...said].sort()).toEqual([...real].sort());
    for (const line of lines) {
      const sum = [...line.chances.matchAll(/(\d+) in 100/g)].reduce(
        (total, match) => total + Number(match[1]),
        0,
      );
      expect(sum, line.cards).toBe(100);
    }
  });
});

describe("the rules under the odds", () => {
  it("says what every rarity pays back", () => {
    const rule = refundRule();
    for (const rarity of RARITIES) {
      expect(rule).toContain(`${DUPLICATE_REFUND[rarity]} for a`);
      expect(rule).toContain(rarity);
    }
    expect(rule).toContain("for an uncommon");
    expect(rule).toContain("for an epic");
    expect(rule).toContain("and 150 for a legendary.");
  });

  it("says how many of a cat can be held", () => {
    expect(copiesRule()).toBe("You can hold 4 of a cat, and 1 of a legendary.");
  });
});
