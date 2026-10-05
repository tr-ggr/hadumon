import { describe, expect, it } from "vitest";

import {
  cosmeticsIn,
  DEFAULT_LOOK,
  TABLE_SLOTS,
} from "~/server/game/cosmetics";

import {
  clothSkin,
  clothWeave,
  matSkin,
  SKIN_IDS,
  SKIN_VARS,
  skinSwatch,
  skinVars,
  skySkin,
  towerSkin,
} from "./skins";

const HEX = /^#[0-9a-f]{6}$/;

/** How light a colour is, 0 to 1, as contrast is worked out. */
function luminance(hex: string): number {
  const channel = (at: number) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

const INK = "#17212b";

describe("skins", () => {
  it("are drawn for every table and tower cosmetic, and for nothing else", () => {
    for (const slot of TABLE_SLOTS) {
      expect([...SKIN_IDS[slot]].sort()).toEqual(
        cosmeticsIn(slot)
          .map((cosmetic) => cosmetic.id)
          .sort(),
      );
    }
  });

  it("are three flat colours each, and no two skins of a slot alike", () => {
    for (const slot of TABLE_SLOTS) {
      const seen = new Set<string>();
      for (const { id } of cosmeticsIn(slot)) {
        const swatch = skinSwatch(id);
        expect(swatch).toHaveLength(3);
        for (const colour of swatch) expect(colour, id).toMatch(HEX);
        seen.add(swatch.join());
      }
      expect(seen.size).toBe(cosmeticsIn(slot).length);
    }
  });

  it("keep every board and cloth light enough to print on in ink", () => {
    for (const { id } of cosmeticsIn("mat")) {
      const mat = matSkin(id);
      expect(contrast(INK, mat.fill), id).toBeGreaterThanOrEqual(7);
      expect(contrast(INK, mat.soft), id).toBeGreaterThanOrEqual(7);
    }
    for (const { id } of cosmeticsIn("cloth")) {
      const cloth = clothSkin(id);
      expect(contrast(INK, cloth.fill), id).toBeGreaterThanOrEqual(7);
      // The weave is a texture, not a pattern to read through.
      expect(contrast(INK, cloth.weave), id).toBeGreaterThanOrEqual(7);
    }
  });

  it("keep the inside of every tower dark, and its stone in four steps", () => {
    for (const { id } of cosmeticsIn("tower")) {
      const { light, stone, rib, deep } = towerSkin(id);
      const steps = [light, stone, rib, deep].map(luminance);
      expect(steps, id).toEqual([...steps].sort((a, b) => b - a));
      expect(contrast("#ffffff", deep), id).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("run every sky from its palest at the sea to its top in one direction", () => {
    for (const { id } of cosmeticsIn("sky")) {
      const { sky, cloud, sea } = skySkin(id);
      for (const colour of [...sky, ...cloud, ...sea]) {
        expect(colour, id).toMatch(HEX);
      }
      const steps = sky.map(luminance);
      expect(steps, id).toEqual([...steps].sort((a, b) => b - a));
    }
  });

  it("weave every cloth from a tile of whole rows on its own legend", () => {
    for (const { id } of cosmeticsIn("cloth")) {
      const cloth = clothSkin(id);
      const width = cloth.tile[0]?.length ?? 0;
      expect(width).toBeGreaterThan(0);
      for (const row of cloth.tile) {
        expect(row, id).toHaveLength(width);
        expect(row, id).toMatch(/^[.12]+$/);
      }
      expect(clothWeave(cloth)).toMatch(/^url\("data:image\/svg\+xml,/);
    }
  });

  it("fall back on the slot's free skin for an id nobody drew, or another slot's", () => {
    expect(skySkin("sky-of-lies")).toBe(skySkin(DEFAULT_LOOK.sky));
    expect(matSkin("toString")).toBe(matSkin(DEFAULT_LOOK.mat));
    expect(matSkin("sky-night")).toBe(matSkin(DEFAULT_LOOK.mat));
    expect(towerSkin(undefined)).toBe(towerSkin("tower-stone"));
    expect(skinSwatch("sky-of-lies")).toEqual(skinSwatch(DEFAULT_LOOK.sky));
  });
});

describe("the properties a look sets", () => {
  it("are none for the look every account starts with", () => {
    expect(skinVars(DEFAULT_LOOK)).toEqual({});
    expect(skinVars({})).toEqual({});
  });

  it("are the board's, the cloth's and the stone's, each only when worn", () => {
    const vars = skinVars({ mat: "mat-rose", tower: "tower-ice" });
    expect(vars["--mat-fill"]).toBe(matSkin("mat-rose").fill);
    expect(vars["--color-stone-deep"]).toBe(towerSkin("tower-ice").deep);
    expect(vars["--cloth-fill"]).toBeUndefined();
    const cloth = skinVars({ cloth: "cloth-tartan" });
    expect(cloth["--cloth-size"]).toBe("16px 16px");
    expect(cloth["--cloth-weave"]).toContain("data:image/svg+xml");
    expect(Object.keys(cloth)).toHaveLength(4);
    // A skinned board goes without the sky board's own print.
    expect(vars["--mat-print"]).toBe("none");
  });

  it("are all named, so a look taken off can be cleared", () => {
    const all = skinVars({
      mat: "mat-gilt",
      cloth: "cloth-denim",
      tower: "tower-brick",
      sky: "sky-night",
    });
    expect(Object.keys(all).sort()).toEqual([...SKIN_VARS].sort());
  });
});
