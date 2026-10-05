import { describe, expect, it } from "vitest";

import { ICONS } from "~/components/sprites/icons";
import { ELEMENT_PALETTES } from "~/components/sprites/palettes";
import { getCat } from "~/server/game/cats";
import {
  CAT_PACKS,
  PACK_CARDS,
  PACK_LIST,
  PACK_PIECES,
} from "~/server/game/packs";

import {
  dulled,
  PACK_ART,
  packArt,
  packHolds,
  packWord,
  PRINT_LEGEND,
  PRINT_SIZE,
  slotOf,
  turned,
} from "./packs";

describe("turned", () => {
  it("goes round the end of the row both ways", () => {
    expect(turned(6, 1, 7)).toBe(0);
    expect(turned(0, -1, 7)).toBe(6);
    expect(turned(2, 0, 7)).toBe(2);
    expect(turned(1, 9, 7)).toBe(3);
    expect(turned(1, -9, 7)).toBe(6);
  });

  it("has nowhere to go in an empty row", () => {
    expect(turned(3, 1, 0)).toBe(0);
  });
});

describe("slotOf", () => {
  const count = PACK_LIST.length;
  const places = Array.from({ length: count }, (_, i) => i);

  it("puts the shown pack in the middle", () => {
    for (const shown of places) expect(slotOf(shown, shown, count)).toBe(0);
  });

  it("gives every pack on the shelf a place of its own, three to each side", () => {
    for (const shown of places) {
      const slots = places.map((i) => slotOf(i, shown, count));
      expect(
        [...slots].sort((a, b) => a - b),
        `shown ${shown}`,
      ).toEqual([-3, -2, -1, 0, 1, 2, 3]);
    }
  });

  it("stands a pack on the side it is nearer by, round the end", () => {
    expect(slotOf(0, 6, 7)).toBe(1);
    expect(slotOf(6, 0, 7)).toBe(-1);
    expect(slotOf(2, 6, 7)).toBe(3);
    expect(slotOf(4, 0, 7)).toBe(-3);
  });

  it("moves every pack one place when the row turns by one", () => {
    for (const shown of places) {
      const next = turned(shown, 1, count);
      const wrapped = places.filter(
        (i) => slotOf(i, next, count) - slotOf(i, shown, count) !== -1,
      );
      // The one pack that leaves the left end comes back in at the right.
      expect(wrapped).toHaveLength(1);
      expect(slotOf(wrapped[0]!, shown, count)).toBe(-3);
      expect(slotOf(wrapped[0]!, next, count)).toBe(3);
    }
  });
});

describe("the packs' wrappers", () => {
  it("draws a wrapper for every pack on the shelf, and for nothing else", () => {
    expect(Object.keys(PACK_ART).sort()).toEqual(
      PACK_LIST.map((pack) => pack.id).sort(),
    );
    expect(() => packArt("no-such-pack")).toThrow();
    expect(() => packArt("constructor")).toThrow();
  });

  it("fronts each cat pack with a common of its own element, in its colours", () => {
    for (const pack of CAT_PACKS) {
      const art = packArt(pack.id);
      expect(art.front.kind, pack.id).toBe("cat");
      if (art.front.kind !== "cat") continue;
      const mascot = getCat(art.front.catId);
      expect(mascot.element, pack.id).toBe(pack.element);
      expect(mascot.rarity, pack.id).toBe("common");
      expect(art.ground, pack.id).toBe(ELEMENT_PALETTES[pack.element]["1"]);
      expect(art.light, pack.id).toBe(ELEMENT_PALETTES[pack.element]["2"]);
      expect(art.mark, pack.id).toBe(pack.element);
    }
  });

  it("fronts every pack with something that can be drawn", () => {
    for (const pack of PACK_LIST) {
      const { front, mark } = packArt(pack.id);
      expect(ICONS, pack.id).toHaveProperty(mark);
      if (front.kind === "cat") {
        expect(() => getCat(front.catId), pack.id).not.toThrow();
        continue;
      }
      // An emblem is on the cats' grid, in the icons' legend.
      expect(front.rows, pack.id).toHaveLength(16);
      for (const row of front.rows) {
        expect(row, `${pack.id}: ${row}`).toMatch(/^[.o1w]{16}$/);
      }
    }
  });

  it("prints every wrapper from a square tile in the legend", () => {
    for (const pack of PACK_LIST) {
      const { print } = packArt(pack.id);
      expect(print, pack.id).toHaveLength(PRINT_SIZE);
      for (const row of print) {
        expect(row, `${pack.id}: ${row}`).toHaveLength(PRINT_SIZE);
        for (const pixel of row) expect(PRINT_LEGEND).toHaveProperty(pixel);
      }
      expect(print.join(""), pack.id).toContain("1");
    }
  });

  it("gives no two packs the same pattern, colour or front", () => {
    const arts = PACK_LIST.map((pack) => packArt(pack.id));
    const distinct = (values: string[]) => new Set(values).size;
    expect(distinct(arts.map((art) => art.print.join("\n")))).toBe(arts.length);
    expect(distinct(arts.map((art) => art.ground))).toBe(arts.length);
    expect(distinct(arts.map((art) => JSON.stringify(art.front)))).toBe(
      arts.length,
    );
  });

  it("prints a wrapper's pattern lighter than its ground", () => {
    for (const pack of PACK_LIST) {
      const { ground, light } = packArt(pack.id);
      expect(luma(light), pack.id).toBeGreaterThan(luma(ground));
    }
  });

  it("prints the pack's first word on the plate", () => {
    expect(PACK_LIST.map((pack) => packArt(pack.id).word)).toEqual([
      "Cinder",
      "Tide",
      "Static",
      "Bramble",
      "Dusk",
      "Wardrobe",
      "Table",
    ]);
    expect(packWord("Cinder Pack")).toBe("Cinder");
  });
});

describe("packHolds", () => {
  const cats = PACK_LIST.find((pack) => pack.kind === "cats")!;
  const pieces = PACK_LIST.find((pack) => pack.kind === "cosmetics")!;

  it("is five cats, whatever the account holds", () => {
    expect(packHolds(cats, null)).toBe(PACK_CARDS);
  });

  it("is two pieces while that many are left, then what is left", () => {
    expect(packHolds(pieces, 30)).toBe(PACK_PIECES);
    expect(packHolds(pieces, PACK_PIECES)).toBe(PACK_PIECES);
    expect(packHolds(pieces, 1)).toBe(1);
    expect(packHolds(pieces, 0)).toBe(0);
    expect(packHolds(pieces, null)).toBe(PACK_PIECES);
  });
});

function luma(hex: string): number {
  return (
    0.299 * parseInt(hex.slice(1, 3), 16) +
    0.587 * parseInt(hex.slice(3, 5), 16) +
    0.114 * parseInt(hex.slice(5, 7), 16)
  );
}

describe("dulled", () => {
  const spread = (hex: string) => {
    const tones = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
    return Math.max(...tones) - Math.min(...tones);
  };

  it("takes the colour out of a wrapper and darkens it", () => {
    for (const pack of PACK_LIST) {
      const art = packArt(pack.id);
      for (const open of [art.ground, art.light]) {
        const spent = dulled(open);
        expect(spent, open).toMatch(/^#[0-9a-f]{6}$/);
        expect(luma(spent), open).toBeLessThan(luma(open));
        // Ink has a little blue in it, so a tone that was nearly white or
        // grey keeps a trace of colour; none gains any to speak of.
        expect(spread(spent), open).toBeLessThanOrEqual(
          Math.max(12, spread(open) * 0.75),
        );
      }
    }
  });

  it("keeps a spent wrapper's print lighter than its ground", () => {
    for (const pack of PACK_LIST) {
      const { ground, light } = packArt(pack.id);
      expect(luma(dulled(light)), pack.id).toBeGreaterThan(
        luma(dulled(ground)) + 20,
      );
    }
  });

  it("leaves each pack a colour of its own", () => {
    const grounds = PACK_LIST.map((pack) => dulled(packArt(pack.id).ground));
    expect(new Set(grounds).size).toBe(PACK_LIST.length);
  });

  it("leaves a grey grey, only darker", () => {
    expect(dulled("#808080")).toBe("#6b6d6f");
  });
});
