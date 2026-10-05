import { describe, expect, it } from "vitest";

import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { getCat } from "~/server/game/cats";
import { ELEMENTS } from "~/server/game/elements";
import { CLAN_LIST, starterDeck } from "~/server/game/run";

import {
  CLAN_MASCOTS,
  CLAN_PACKS,
  countCats,
  dulled,
  packTitle,
  packWord,
  PRINT_LEGEND,
  PRINT_SIZE,
  slotOf,
  stackEdge,
  turned,
} from "./packs";

describe("turned", () => {
  it("goes round the end of the row both ways", () => {
    expect(turned(4, 1, 5)).toBe(0);
    expect(turned(0, -1, 5)).toBe(4);
    expect(turned(2, 0, 5)).toBe(2);
    expect(turned(1, 7, 5)).toBe(3);
    expect(turned(1, -7, 5)).toBe(4);
  });

  it("has nowhere to go in an empty row", () => {
    expect(turned(3, 1, 0)).toBe(0);
  });
});

describe("slotOf", () => {
  it("puts the shown pack in the middle", () => {
    for (let shown = 0; shown < 5; shown++) {
      expect(slotOf(shown, shown, 5)).toBe(0);
    }
  });

  it("gives every pack a place of its own, two to each side", () => {
    for (let shown = 0; shown < 5; shown++) {
      const slots = Array.from({ length: 5 }, (_, i) => slotOf(i, shown, 5));
      expect(
        [...slots].sort((a, b) => a - b),
        `shown ${shown}`,
      ).toEqual([-2, -1, 0, 1, 2]);
    }
  });

  it("stands a pack on the side it is nearer by, round the end", () => {
    expect(slotOf(0, 4, 5)).toBe(1);
    expect(slotOf(4, 0, 5)).toBe(-1);
    expect(slotOf(1, 4, 5)).toBe(2);
    expect(slotOf(3, 0, 5)).toBe(-2);
  });

  it("moves every pack one place when the row turns by one", () => {
    for (let shown = 0; shown < 5; shown++) {
      const next = turned(shown, 1, 5);
      const wrapped = Array.from({ length: 5 }, (_, i) => i).filter(
        (i) => slotOf(i, next, 5) - slotOf(i, shown, 5) !== -1,
      );
      // The one pack that leaves the left end comes back in at the right.
      expect(wrapped).toHaveLength(1);
      expect(slotOf(wrapped[0]!, shown, 5)).toBe(-2);
      expect(slotOf(wrapped[0]!, next, 5)).toBe(2);
    }
  });
});

describe("the clans' packs", () => {
  it("has a pack for every clan", () => {
    expect(Object.keys(CLAN_PACKS).sort()).toEqual([...ELEMENTS].sort());
    expect(CLAN_LIST.map((clan) => clan.id).sort()).toEqual(
      [...ELEMENTS].sort(),
    );
  });

  it("fronts each pack with one of the clan's own commons, three in the deck", () => {
    for (const element of ELEMENTS) {
      const mascot = getCat(CLAN_PACKS[element].mascot);
      expect(mascot.element, element).toBe(element);
      expect(mascot.rarity, element).toBe("common");
      expect(
        starterDeck(element).filter((id) => id === mascot.id),
        element,
      ).toHaveLength(3);
      expect(CLAN_MASCOTS[element]).toBe(mascot.id);
    }
  });

  it("marks each pack with its own element", () => {
    for (const element of ELEMENTS) {
      expect(CLAN_PACKS[element].motif).toBe(element);
    }
  });

  it("prints every wrapper from a square tile in the legend", () => {
    for (const element of ELEMENTS) {
      const { print } = CLAN_PACKS[element];
      expect(print, element).toHaveLength(PRINT_SIZE);
      for (const row of print) {
        expect(row, `${element}: ${row}`).toHaveLength(PRINT_SIZE);
        for (const pixel of row) expect(PRINT_LEGEND).toHaveProperty(pixel);
      }
      expect(print.join(""), element).toContain("1");
    }
  });

  it("gives no two clans the same pattern or the same mascot", () => {
    const prints = ELEMENTS.map((el) => CLAN_PACKS[el].print.join("\n"));
    expect(new Set(prints).size).toBe(ELEMENTS.length);
    const mascots = ELEMENTS.map((el) => CLAN_PACKS[el].mascot);
    expect(new Set(mascots).size).toBe(ELEMENTS.length);
  });
});

describe("dulled", () => {
  const luma = (hex: string) =>
    0.299 * parseInt(hex.slice(1, 3), 16) +
    0.587 * parseInt(hex.slice(3, 5), 16) +
    0.114 * parseInt(hex.slice(5, 7), 16);
  const spread = (hex: string) => {
    const tones = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
    return Math.max(...tones) - Math.min(...tones);
  };

  it("takes the colour out of a wrapper and darkens it", () => {
    for (const element of ELEMENTS) {
      for (const tone of ["1", "2"] as const) {
        const open = ELEMENT_PALETTES[element][tone];
        const locked = dulled(open);
        expect(locked, open).toMatch(/^#[0-9a-f]{6}$/);
        expect(luma(locked), open).toBeLessThan(luma(open));
        // Ink has a little blue in it, so a tone that was nearly white keeps
        // a trace of colour; every tone still loses a good part of its own.
        expect(spread(locked), open).toBeLessThan(spread(open) * 0.75);
      }
    }
  });

  it("keeps a locked wrapper's print lighter than its ground", () => {
    for (const element of ELEMENTS) {
      const { "1": ground, "2": light } = ELEMENT_PALETTES[element];
      expect(luma(dulled(light)), element).toBeGreaterThan(
        luma(dulled(ground)) + 20,
      );
    }
  });

  it("leaves each clan a colour of its own", () => {
    const grounds = ELEMENTS.map((el) => dulled(ELEMENT_PALETTES[el]["1"]));
    expect(new Set(grounds).size).toBe(ELEMENTS.length);
  });

  it("leaves a grey grey, only darker", () => {
    expect(dulled("#808080")).toBe("#6b6d6f");
  });
});

describe("packTitle", () => {
  it("says the clan, and what state its pack is in", () => {
    expect(packTitle("Cinder Clan")).toBe("Cinder Clan");
    expect(packTitle("Cinder Clan", { chosen: true })).toBe(
      "Cinder Clan, chosen",
    );
    expect(packTitle("Tide Clan", { locked: true })).toBe("Tide Clan, locked");
  });

  it("prints the clan's first word on the plate", () => {
    expect(CLAN_LIST.map((clan) => packWord(clan.name))).toEqual([
      "Cinder",
      "Tide",
      "Static",
      "Bramble",
      "Dusk",
    ]);
  });
});

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
