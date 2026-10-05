import { afterEach, describe, expect, it } from "vitest";

import { CAT_LIST, CATS } from "~/server/game/cats";
import { ELEMENTS } from "~/server/game/elements";
import {
  BASE_SPRITE,
  COAT_DISTANCE,
  MIN_RECIPE_DISTANCE,
  SPRITE_FACE,
  SPRITE_LEGEND,
  SPRITE_PATCHES,
  SPRITE_RECIPES,
  SPRITE_SIZE,
  SPRITE_ZONES,
  SPRITE_ZONE_CELLS,
  applyPatch,
  catLook,
  catSprite,
  gridDistance,
  recipeSprite,
  spriteDistance,
  spritePart,
  spritePartIds,
  type SpritePatch,
  type SpriteRecipeDraft,
  type SpriteSpan,
  type SpriteZone,
} from "./cats";
import {
  CAT_PALETTES,
  ELEMENT_COATS,
  ELEMENT_PALETTES,
  spriteColors,
} from "./palettes";

const LEGEND = new Set(Object.keys(SPRITE_LEGEND));

/** A cat that is in no table, to try a recipe on. */
const STAND_IN = "stand-in";

/** `row,column` for every cell a list of spans covers. */
function cellsOf(spans: readonly SpriteSpan[]): string[] {
  return spans.flatMap(([row, from, to]) =>
    Array.from({ length: to - from }, (_, i) => `${row},${from + i}`),
  );
}

const ZONE_OF = new Map<string, SpriteZone>(
  SPRITE_ZONES.flatMap((zone) =>
    cellsOf(SPRITE_ZONE_CELLS[zone]).map((cell) => [cell, zone] as const),
  ),
);

/** A grid with every cell outside `zone` blanked, to compare one zone. */
function onlyZone(rows: readonly string[], zone: SpriteZone): string[] {
  return rows.map((row, y) =>
    [...row]
      .map((pixel, x) => (ZONE_OF.get(`${y},${x}`) === zone ? pixel : " "))
      .join(""),
  );
}

/** One recipe for each `n`, taking the `n`th part of every zone in turn. */
function fullRecipe(n: number): SpriteRecipeDraft {
  return Object.fromEntries(
    SPRITE_ZONES.map((zone) => {
      const parts = spritePartIds(zone);
      return [zone, parts[n % parts.length]];
    }),
  );
}

const MOST_PARTS = Math.max(
  ...SPRITE_ZONES.map((zone) => spritePartIds(zone).length),
);

function pixelsChanged(rows: readonly string[]): number {
  return gridDistance(rows, BASE_SPRITE);
}

function expectValidGrid(rows: readonly string[]) {
  expect(rows).toHaveLength(SPRITE_SIZE);
  for (const row of rows) {
    expect(row).toHaveLength(SPRITE_SIZE);
    for (const pixel of row) expect(LEGEND.has(pixel)).toBe(true);
  }
}

function expectValidPatch([row, column, pixels]: SpritePatch, owner: string) {
  const where = `${owner} [${row}, ${column}, "${pixels}"]`;
  expect(Number.isInteger(row), where).toBe(true);
  expect(Number.isInteger(column), where).toBe(true);
  expect(row, where).toBeGreaterThanOrEqual(0);
  expect(row, where).toBeLessThan(SPRITE_SIZE);
  expect(column, where).toBeGreaterThanOrEqual(0);
  expect(pixels.length, where).toBeGreaterThan(0);
  expect(column + pixels.length, where).toBeLessThanOrEqual(SPRITE_SIZE);
  for (const pixel of pixels) expect(LEGEND.has(pixel), where).toBe(true);
}

function expectFaceUntouched(rows: readonly string[], owner: string) {
  for (const [row, from, to] of SPRITE_FACE) {
    expect(rows[row]?.slice(from, to), `${owner} row ${row}`).toBe(
      BASE_SPRITE[row]?.slice(from, to),
    );
  }
}

afterEach(() => {
  delete SPRITE_RECIPES[STAND_IN];
  delete SPRITE_RECIPES.flameclaw;
});

describe("cat sprites", () => {
  it("has a 16x16 base made of legend characters", () => {
    expectValidGrid(BASE_SPRITE);
  });

  it("resolves every cat to 16 rows of 16 legend characters", () => {
    expect(CAT_LIST.length).toBeGreaterThan(0);
    for (const cat of CAT_LIST) expectValidGrid(catSprite(cat.id));
  });

  it("keeps every patch in bounds and on the legend", () => {
    for (const [catId, patches] of Object.entries(SPRITE_PATCHES)) {
      for (const patch of patches) expectValidPatch(patch, catId);
    }
  });

  it("only patches cats that exist", () => {
    for (const catId of Object.keys(SPRITE_PATCHES)) {
      expect(CATS[catId], catId).toBeDefined();
    }
  });

  it("applies a cat's patches to the base", () => {
    const flameclaw = catSprite("flameclaw");
    expect(flameclaw[1]).toBe(".oo...o33o...oo.");
    expect(flameclaw[3]).toBe("o121oo3333oo121o");
    expect(flameclaw).not.toEqual(BASE_SPRITE);
  });

  it("returns the base unchanged for a cat with no patches", () => {
    expect(catSprite("not-drawn-yet")).toBe(BASE_SPRITE);
  });

  it("has patches or a recipe for every cat", () => {
    for (const cat of CAT_LIST) {
      const drawn = (SPRITE_PATCHES[cat.id]?.length ?? 0) > 0;
      const built = SPRITE_RECIPES[cat.id] !== undefined;
      expect(drawn || built, cat.id).toBe(true);
    }
  });

  it("draws every cat as more than a stray pixel on the base", () => {
    for (const cat of CAT_LIST) {
      expect(pixelsChanged(catSprite(cat.id)), cat.id).toBeGreaterThanOrEqual(
        8,
      );
    }
  });

  it("gives no two cats the same grid, whatever coats they wear", () => {
    const owners = new Map<string, string>();
    for (const cat of CAT_LIST) {
      const grid = catSprite(cat.id).join("\n");
      expect(owners.get(grid), `${cat.id} repeats a grid`).toBeUndefined();
      owners.set(grid, cat.id);
    }
    expect(owners.size).toBe(CAT_LIST.length);
  });

  it("leaves the eyes and the muzzle of the base where they are", () => {
    for (const cat of CAT_LIST) expectFaceUntouched(catSprite(cat.id), cat.id);
  });
});

describe("sprite zones", () => {
  it("keeps every zone on the grid", () => {
    for (const zone of SPRITE_ZONES) {
      for (const [row, from, to] of SPRITE_ZONE_CELLS[zone]) {
        const where = `${zone} [${row}, ${from}, ${to}]`;
        expect(row, where).toBeGreaterThanOrEqual(0);
        expect(row, where).toBeLessThan(SPRITE_SIZE);
        expect(from, where).toBeGreaterThanOrEqual(0);
        expect(to, where).toBeGreaterThan(from);
        expect(to, where).toBeLessThanOrEqual(SPRITE_SIZE);
      }
    }
  });

  it("gives no cell to two zones", () => {
    const owners = new Map<string, SpriteZone>();
    for (const zone of SPRITE_ZONES) {
      for (const cell of cellsOf(SPRITE_ZONE_CELLS[zone])) {
        expect(owners.get(cell), `${cell} is in ${zone} too`).toBeUndefined();
        owners.set(cell, zone);
      }
    }
  });

  it("keeps every zone off the face", () => {
    for (const cell of cellsOf(SPRITE_FACE)) {
      expect(ZONE_OF.get(cell), cell).toBeUndefined();
    }
  });

  it("names the face where the base has its eyes and its muzzle", () => {
    const face = SPRITE_FACE.map(([row, from, to]) =>
      BASE_SPRITE[row]?.slice(from, to),
    );
    expect(face).toEqual(["we", "we", "ee", "ee", "ww33ww", "wwooww"]);
  });
});

describe("sprite parts", () => {
  it("has a choice of parts in every zone", () => {
    for (const zone of SPRITE_ZONES) {
      expect(spritePartIds(zone).length, zone).toBeGreaterThanOrEqual(6);
    }
  });

  it("keeps every part in bounds and on the legend", () => {
    for (const zone of SPRITE_ZONES) {
      for (const part of spritePartIds(zone)) {
        const patches = spritePart(zone, part);
        expect(patches.length, `${zone}.${part}`).toBeGreaterThan(0);
        for (const patch of patches) expectValidPatch(patch, `${zone}.${part}`);
      }
    }
  });

  it("keeps every part inside its zone", () => {
    for (const zone of SPRITE_ZONES) {
      for (const part of spritePartIds(zone)) {
        for (const [row, column, pixels] of spritePart(zone, part)) {
          for (const cell of cellsOf([[row, column, column + pixels.length]])) {
            expect(ZONE_OF.get(cell), `${zone}.${part} at ${cell}`).toBe(zone);
          }
        }
      }
    }
  });

  it("has no part that leaves the base as it was, and no two alike", () => {
    for (const zone of SPRITE_ZONES) {
      const owners = new Map<string, string>([
        [BASE_SPRITE.join("\n"), "none"],
      ]);
      for (const part of spritePartIds(zone)) {
        const grid = recipeSprite({ [zone]: part }).join("\n");
        expect(owners.get(grid), `${zone}.${part} repeats`).toBeUndefined();
        owners.set(grid, part);
      }
    }
  });

  it("has no patches for a part a zone does not have", () => {
    expect(spritePart("ears", undefined)).toEqual([]);
    expect(spritePart("ears", "no-such-part")).toEqual([]);
    // A tail's part is not an ear's.
    expect(spritePart("ears", "manx")).toEqual([]);
  });
});

describe("sprite recipes", () => {
  it("only gives a recipe to a cat that exists and is not drawn by hand", () => {
    for (const catId of Object.keys(SPRITE_RECIPES)) {
      expect(CATS[catId], catId).toBeDefined();
      expect(SPRITE_PATCHES[catId], catId).toBeUndefined();
    }
  });

  it("names parts that exist and a coat its element has", () => {
    const keys = new Set<string>([...SPRITE_ZONES, "coat"]);
    for (const [catId, recipe] of Object.entries(SPRITE_RECIPES)) {
      for (const key of Object.keys(recipe)) {
        expect(keys.has(key), `${catId}.${key}`).toBe(true);
      }
      for (const zone of SPRITE_ZONES) {
        const part = recipe[zone];
        if (part === undefined) continue;
        expect(spritePartIds(zone), `${catId}.${zone}`).toContain(part);
      }
      const coat = recipe.coat ?? 0;
      const coats = CATS[catId] ? ELEMENT_COATS[CATS[catId].element] : [];
      expect(Number.isInteger(coat), `${catId} coat`).toBe(true);
      expect(coat, `${catId} coat`).toBeGreaterThanOrEqual(0);
      expect(coat, `${catId} coat`).toBeLessThan(coats.length);
    }
  });

  it("lays a part on the base and leaves the rest alone", () => {
    const horned = recipeSprite({ crown: "horns" });
    expect(horned[1]).toBe(".oo.owo..owo.oo.");
    expect(gridDistance(horned, BASE_SPRITE)).toBe(16);
    expect(recipeSprite({})).toEqual(BASE_SPRITE);
  });

  it("composes a part from every zone without one drawing over another", () => {
    for (let n = 0; n < MOST_PARTS; n++) {
      const recipe = fullRecipe(n);
      const grid = recipeSprite(recipe);
      expectValidGrid(grid);
      expectFaceUntouched(grid, `recipe ${n}`);

      let changed = 0;
      for (const zone of SPRITE_ZONES) {
        const alone = recipeSprite({ [zone]: recipe[zone] });
        expect(onlyZone(grid, zone), `recipe ${n} ${zone}`).toEqual(
          onlyZone(alone, zone),
        );
        changed += pixelsChanged(alone);
      }
      // Every cell that differs from the base belongs to one part alone.
      expect(pixelsChanged(grid), `recipe ${n}`).toBe(changed);
    }
  });

  it("makes the same grid whatever order the zones are laid in", () => {
    for (let n = 0; n < MOST_PARTS; n++) {
      const recipe = fullRecipe(n);
      const backwards = [...SPRITE_ZONES]
        .reverse()
        .flatMap((zone) => spritePart(zone, recipe[zone]))
        .reduce<readonly string[]>(applyPatch, BASE_SPRITE);
      expect(backwards, `recipe ${n}`).toEqual(recipeSprite(recipe));
    }
  });

  it("resolves a cat with a recipe to that recipe's grid", () => {
    const recipe = { ears: "tufted", tail: "manx", coat: 2 } as const;
    SPRITE_RECIPES[STAND_IN] = recipe;
    expect(catSprite(STAND_IN)).toEqual(recipeSprite(recipe));
    expect(catSprite(STAND_IN)).not.toEqual(BASE_SPRITE);
    expect(catLook(STAND_IN).coat).toBe(2);
  });

  it("draws a cat by its patches even if it is given a recipe", () => {
    const drawn = catSprite("flameclaw");
    SPRITE_RECIPES.flameclaw = { crown: "horns" };
    expect(catSprite("flameclaw")).toEqual(drawn);
  });
});

describe("coats", () => {
  it("gives every element its own palette first and a few coats more", () => {
    for (const element of ELEMENTS) {
      const coats = ELEMENT_COATS[element];
      expect(coats[0], element).toBe(ELEMENT_PALETTES[element]);
      expect(coats.length, element).toBeGreaterThanOrEqual(3);
      expect(coats.length, element).toBeLessThanOrEqual(4);
    }
  });

  it("writes every coat as three flat colours", () => {
    for (const element of ELEMENTS) {
      for (const coat of ELEMENT_COATS[element]) {
        for (const tone of ["1", "2", "3"] as const) {
          expect(coat[tone], element).toMatch(/^#[0-9a-f]{6}$/);
        }
        expect(new Set(Object.values(coat)).size, element).toBe(3);
      }
    }
  });

  it("gives no two coats the same fur", () => {
    const furs = ELEMENTS.flatMap((element) =>
      ELEMENT_COATS[element].map((coat) => coat["1"]),
    );
    expect(new Set(furs).size).toBe(furs.length);
  });

  it("colours a cat drawn by hand in its element's own palette", () => {
    const colors = spriteColors("flame", "common", "flameclaw");
    expect(colors["1"]).toBe(ELEMENT_PALETTES.flame["1"]);
    expect(colors["3"]).toBe(ELEMENT_PALETTES.flame["3"]);
    expect(spriteColors("flame", "common")).toEqual(colors);
  });

  it("colours a cat with a recipe in the coat the recipe names", () => {
    SPRITE_RECIPES[STAND_IN] = { ears: "tufted", coat: 2 };
    const coat = ELEMENT_COATS.mist[2];
    expect(spriteColors("mist", "rare", STAND_IN)).toMatchObject({ ...coat });

    SPRITE_RECIPES[STAND_IN] = { ears: "tufted" };
    expect(spriteColors("mist", "rare", STAND_IN)).toMatchObject({
      ...ELEMENT_PALETTES.mist,
    });
  });

  it("keeps a cat drawn from life in its own colours", () => {
    SPRITE_RECIPES[STAND_IN] = { coat: 1 };
    expect(spriteColors("shade", "legendary", "hadu")).toMatchObject({
      ...CAT_PALETTES.hadu,
    });
  });
});

describe("sprite distance", () => {
  it("counts the cells that differ between two grids", () => {
    expect(gridDistance(BASE_SPRITE, BASE_SPRITE)).toBe(0);
    const tipped = recipeSprite({ ears: "tipped" });
    expect(gridDistance(tipped, BASE_SPRITE)).toBe(4);
    expect(gridDistance(BASE_SPRITE, tipped)).toBe(4);
  });

  it("counts another coat as so many cells more", () => {
    const grid = recipeSprite({ ears: "tipped" });
    const here = { grid, coat: 0 };
    expect(spriteDistance(here, { grid, coat: 0 })).toBe(0);
    expect(spriteDistance(here, { grid, coat: 1 })).toBe(COAT_DISTANCE);
    expect(spriteDistance(here, { grid: BASE_SPRITE, coat: 1 })).toBe(
      4 + COAT_DISTANCE,
    );
  });

  it("asks for more than a change of coat alone gives", () => {
    expect(MIN_RECIPE_DISTANCE).toBeGreaterThan(COAT_DISTANCE);
  });

  it("keeps every cat with a recipe well apart from the rest of its element", () => {
    for (const element of ELEMENTS) {
      const cats = CAT_LIST.filter((cat) => cat.element === element);
      for (const cat of cats) {
        if (!SPRITE_RECIPES[cat.id]) continue;
        for (const other of cats) {
          if (other.id === cat.id) continue;
          expect(
            spriteDistance(catLook(cat.id), catLook(other.id)),
            `${cat.id} and ${other.id}`,
          ).toBeGreaterThanOrEqual(MIN_RECIPE_DISTANCE);
        }
      }
    }
  });
});
