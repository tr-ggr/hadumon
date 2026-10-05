import { describe, expect, it } from "vitest";

import { ELEMENTS } from "~/server/game/elements";
import { starterDeck } from "~/server/game/clans";

import { countCats, stackEdge } from "./packs";

describe("stackEdge", () => {
  it("stands a single card as a card, and adds a pixel a copy", () => {
    expect(stackEdge(1)).toBe(3);
    expect(stackEdge(2)).toBe(4);
    expect(stackEdge(3)).toBe(5);
  });

  it("never stands lower than a card or taller than a pile", () => {
    expect(stackEdge(0)).toBe(3);
    expect(stackEdge(40)).toBe(6);
  });
});

describe("countCats", () => {
  it("counts the copies of each cat, most first, in deck order within a count", () => {
    expect(countCats(["a", "b", "b", "c", "a", "b", "d"])).toEqual([
      ["b", 3],
      ["a", 2],
      ["c", 1],
      ["d", 1],
    ]);
    expect(countCats([])).toEqual([]);
  });

  it("makes eleven stacks of a starter deck: two of three, one of two", () => {
    for (const element of ELEMENTS) {
      const stacks = countCats(starterDeck(element));
      expect(stacks.map(([, copies]) => copies)).toEqual([
        3, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1,
      ]);
      expect(stacks.reduce((sum, [, copies]) => sum + copies, 0)).toBe(16);
    }
  });
});
