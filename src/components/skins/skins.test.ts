import { describe, expect, it } from "vitest";

import { cosmeticsIn, TABLE_SLOTS } from "~/server/game/cosmetics";

import { SKIN_SWATCHES, skinSwatch } from "./skins";

describe("skins", () => {
  it("have colours for every table and tower cosmetic, and for nothing else", () => {
    const ids = TABLE_SLOTS.flatMap((slot) =>
      cosmeticsIn(slot).map((cosmetic) => cosmetic.id),
    );
    expect(Object.keys(SKIN_SWATCHES).sort()).toEqual([...ids].sort());
  });

  it("are three flat colours each, and no two skins of a slot alike", () => {
    for (const slot of TABLE_SLOTS) {
      const seen = new Set<string>();
      for (const { id } of cosmeticsIn(slot)) {
        const swatch = skinSwatch(id);
        expect(swatch).toHaveLength(3);
        for (const colour of swatch) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
        seen.add(swatch.join());
      }
      expect(seen.size).toBe(cosmeticsIn(slot).length);
    }
  });

  it("fall back on the slot's free skin for an id nobody drew", () => {
    expect(skinSwatch("sky-of-lies")).toEqual(SKIN_SWATCHES["sky-day"]);
    expect(skinSwatch("toString")).toEqual(SKIN_SWATCHES["mat-sky"]);
  });
});
