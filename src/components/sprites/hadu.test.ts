import { describe, expect, it } from "vitest";

import { buildRuns } from "~/components/PixelSprite";
import { getCat } from "~/server/game/cats";
import {
  cosmeticsIn,
  DEFAULT_LOOK,
  HADU_SLOTS,
  type Look,
} from "~/server/game/cosmetics";

import {
  SPRITE_FACE,
  SPRITE_LEGEND,
  SPRITE_SIZE,
  catSprite,
  type SpriteSpan,
} from "./cats";
import {
  AURA_INSET,
  AURA_SIZE,
  HADU_AURAS,
  HADU_PIECES,
  HADU_SLOT_CELLS,
  HADU_SLOT_INK,
  HADU_WORN_SLOTS,
  PIECE_INK,
  PIECE_SKIP,
  haduDrawing,
  wornPiece,
  type HaduWornSlot,
  type SpriteLayer,
} from "./hadu";
import { CAT_PALETTES, OUTLINE_COLOR, spriteColors } from "./palettes";

const LEGEND = new Set(Object.keys(SPRITE_LEGEND));
const HEX = /^#[0-9a-f]{6}$/;

/** `row,column` for every cell a list of spans covers. */
function cellsOf(spans: readonly SpriteSpan[]): string[] {
  return spans.flatMap(([row, from, to]) =>
    Array.from({ length: to - from }, (_, i) => `${row},${from + i}`),
  );
}

const SLOT_OF = new Map<string, HaduWornSlot>(
  HADU_WORN_SLOTS.flatMap((slot) =>
    cellsOf(HADU_SLOT_CELLS[slot]).map((cell) => [cell, slot] as const),
  ),
);

/** The ids `game/cosmetics.ts` lists for a slot. */
function idsIn(slot: (typeof HADU_SLOTS)[number]): string[] {
  return cosmeticsIn(slot).map((cosmetic) => cosmetic.id);
}

/** What a layer looks like: the colour of every cell, clear ones as `null`. */
function painted(layer: SpriteLayer): (string | null)[][] {
  return layer.rows.map((row) =>
    [...row].map((pixel) => layer.colors[pixel] ?? null),
  );
}

/** A whole hadu as one string, to tell two of them apart. */
function picture(look: Partial<Look>): string {
  const { cat, aura } = haduDrawing(look);
  return JSON.stringify([painted(cat), aura ? painted(aura) : null]);
}

const hadu = getCat("hadu");
const HADU_COLORS = spriteColors(hadu.element, hadu.rarity, hadu.id);

describe("the hadu's wardrobe", () => {
  it("draws every piece a hadu can wear, and nothing else", () => {
    const worn = HADU_WORN_SLOTS.flatMap(idsIn);
    expect(Object.keys(HADU_PIECES).sort()).toEqual([...worn].sort());
    expect(Object.keys(HADU_AURAS).sort()).toEqual(idsIn("halo").sort());
    // The aura is the one slot that is not worn on the cat.
    expect([...HADU_WORN_SLOTS, "halo"]).toEqual([...HADU_SLOTS]);
  });

  it("draws the default look as Hadu's own sprite in his own colours", () => {
    for (const look of [undefined, {}, DEFAULT_LOOK]) {
      const { cat, aura } = haduDrawing(look);
      expect(cat.rows).toEqual(catSprite("hadu"));
      expect(cat.colors).toEqual(HADU_COLORS);
      expect(aura).toBeNull();
    }
    const { colors } = haduDrawing().cat;
    expect(colors["1"]).toBe(CAT_PALETTES.hadu?.["1"]);
    expect(colors["2"]).toBe(CAT_PALETTES.hadu?.["2"]);
    expect(colors["3"]).toBe(CAT_PALETTES.hadu?.["3"]);
  });

  it("gives each slot cells of its own, and the face to nobody", () => {
    const owned = HADU_WORN_SLOTS.flatMap((slot) =>
      cellsOf(HADU_SLOT_CELLS[slot]),
    );
    expect(new Set(owned).size).toBe(owned.length);
    for (const cell of owned) {
      const [row, column] = cell.split(",").map(Number);
      expect(row, cell).toBeGreaterThanOrEqual(0);
      expect(row, cell).toBeLessThan(SPRITE_SIZE);
      expect(column, cell).toBeGreaterThanOrEqual(0);
      expect(column, cell).toBeLessThan(SPRITE_SIZE);
    }
    // Rows 6 and 7 of the face are the eyes; rows 8 and 9 are the muzzle.
    for (const cell of cellsOf(SPRITE_FACE)) {
      const eye = Number(cell.split(",")[0]) < 8;
      expect(SLOT_OF.get(cell), cell).toBe(eye ? "eyes" : undefined);
    }
  });

  it("gives each slot legend characters of its own", () => {
    const own = HADU_WORN_SLOTS.flatMap((slot) => [...HADU_SLOT_INK[slot]]);
    expect(new Set(own).size).toBe(own.length);
    for (const character of own) expect(LEGEND.has(character)).toBe(false);
    for (const slot of HADU_WORN_SLOTS) {
      expect(HADU_SLOT_INK[slot]).toHaveLength(PIECE_INK.length);
    }
    expect(LEGEND.has(PIECE_SKIP)).toBe(false);
    for (const character of PIECE_INK) {
      expect(LEGEND.has(character)).toBe(false);
    }
  });

  it("keeps every piece inside its slot, on its legend and in bounds", () => {
    for (const slot of HADU_WORN_SLOTS) {
      for (const id of idsIn(slot)) {
        const piece = HADU_PIECES[id]!;
        expect(piece.ink.length, id).toBeLessThanOrEqual(PIECE_INK.length);
        for (const color of piece.ink) expect(color, id).toMatch(HEX);

        const allowed = new Set([
          ...LEGEND,
          PIECE_SKIP,
          ...PIECE_INK.slice(0, piece.ink.length),
        ]);
        const used = new Set<string>();
        for (const [row, column, pixels] of piece.art) {
          expect(row, id).toBeGreaterThanOrEqual(0);
          expect(row, id).toBeLessThan(SPRITE_SIZE);
          expect(column, id).toBeGreaterThanOrEqual(0);
          expect(column + pixels.length, id).toBeLessThanOrEqual(SPRITE_SIZE);
          [...pixels].forEach((pixel, i) => {
            expect(allowed.has(pixel), `${id} draws "${pixel}"`).toBe(true);
            used.add(pixel);
            if (pixel === PIECE_SKIP) return;
            const cell = `${row},${column + i}`;
            expect(SLOT_OF.get(cell), `${id} at ${cell}`).toBe(slot);
          });
        }
        // A colour a piece names is one it draws with.
        piece.ink.forEach((_, i) => {
          expect(used.has(PIECE_INK[i]!), `${id} ink ${i}`).toBe(true);
        });
      }
    }
  });

  it("changes nothing outside the slot a piece is worn in", () => {
    const bare = painted(haduDrawing().cat);
    for (const slot of HADU_WORN_SLOTS) {
      for (const id of idsIn(slot)) {
        const { cat, aura } = haduDrawing({ [slot]: id });
        expect(aura, id).toBeNull();
        expect(cat.rows, id).toHaveLength(SPRITE_SIZE);
        expect(cat.colors.o, id).toBe(OUTLINE_COLOR);
        painted(cat).forEach((row, y) => {
          expect(row, id).toHaveLength(SPRITE_SIZE);
          row.forEach((color, x) => {
            if (SLOT_OF.get(`${y},${x}`) === slot) return;
            expect(color, `${id} at ${y},${x}`).toBe(bare[y]?.[x]);
          });
        });
        // Every character on the grid has a colour, so it draws as it is.
        for (const pixel of cat.rows.join("")) {
          expect(Object.hasOwn(cat.colors, pixel), `${id} "${pixel}"`).toBe(
            true,
          );
        }
      }
    }
  });

  it("draws no two pieces of a slot alike", () => {
    for (const slot of HADU_SLOTS) {
      const ids = idsIn(slot);
      const pictures = new Set(ids.map((id) => picture({ [slot]: id })));
      expect(pictures.size, slot).toBe(ids.length);
    }
  });

  it("draws each aura on its own grid, behind the cat", () => {
    expect(AURA_SIZE).toBeGreaterThan(SPRITE_SIZE);
    expect(AURA_INSET * 2 + SPRITE_SIZE).toBe(AURA_SIZE);

    for (const id of idsIn("halo")) {
      const worn = HADU_AURAS[id];
      const { cat, aura } = haduDrawing({ halo: id });
      // An aura never touches the cat's own cells.
      expect(cat.rows, id).toEqual(catSprite("hadu"));
      expect(cat.colors, id).toEqual(HADU_COLORS);
      if (id === DEFAULT_LOOK.halo) {
        expect(worn, id).toBeNull();
        expect(aura, id).toBeNull();
        continue;
      }

      expect(worn, id).not.toBeNull();
      expect(aura?.rows, id).toEqual(worn?.rows);
      expect(aura?.rows, id).toHaveLength(AURA_SIZE);
      const ink = worn?.ink ?? [];
      expect(ink.length, id).toBeGreaterThan(0);
      expect(ink.length, id).toBeLessThanOrEqual(PIECE_INK.length);
      for (const color of ink) expect(color, id).toMatch(HEX);

      const allowed = new Set([
        ".",
        "o",
        "w",
        ...PIECE_INK.slice(0, ink.length),
      ]);
      const drawn = (aura?.rows ?? []).join("");
      for (const row of aura?.rows ?? []) {
        expect(row, id).toHaveLength(AURA_SIZE);
      }
      for (const pixel of drawn) {
        expect(allowed.has(pixel), `${id} draws "${pixel}"`).toBe(true);
      }
      ink.forEach((color, i) => {
        const character = PIECE_INK[i]!;
        expect(drawn.includes(character), `${id} ink ${i}`).toBe(true);
        expect(aura?.colors[character], id).toBe(color);
      });
      // Its marks keep the sprites' outline, to read on any ground.
      expect(aura?.colors.o, id).toBe(OUTLINE_COLOR);
      expect(drawn.includes("o"), id).toBe(true);
      // Some of it shows in the air round the cat, clear of his grid.
      const clear = (aura?.rows ?? []).some((row, y) =>
        [...row].some((pixel, x) => {
          const inside =
            y >= AURA_INSET &&
            y < AURA_INSET + SPRITE_SIZE &&
            x >= AURA_INSET &&
            x < AURA_INSET + SPRITE_SIZE;
          return !inside && pixel !== ".";
        }),
      );
      expect(clear, id).toBe(true);
    }
  });

  it("falls back to the free piece for an id it cannot draw", () => {
    const plain = picture({});
    const strays: Partial<Look>[] = [
      { hat: "hat-no-such-thing" },
      { hat: "" },
      // A piece of another slot is not one of this slot's.
      { hat: "body-cape", body: "hat-top-hat", tail: "halo-stars" },
      { eyes: "eyes", halo: "eyes-green" },
      // Names every object has are not ids.
      { hat: "toString", halo: "constructor", body: "__proto__" },
      { mat: "mat-gilt", sky: "sky-night" },
    ];
    for (const look of strays) {
      expect(picture(look), JSON.stringify(look)).toBe(plain);
    }

    for (const slot of HADU_SLOTS) {
      expect(wornPiece(slot)).toBe(DEFAULT_LOOK[slot]);
      expect(wornPiece(slot, { [slot]: "nope" })).toBe(DEFAULT_LOOK[slot]);
      for (const id of idsIn(slot)) {
        expect(wornPiece(slot, { [slot]: id })).toBe(id);
      }
    }
    // One stray slot does not take the others off.
    expect(picture({ hat: "nope", tail: "tail-bolt" })).toBe(
      picture({ tail: "tail-bolt" }),
    );
  });

  it("composes any hat with any eyes, body, tail and aura", () => {
    const bare = painted(haduDrawing().cat);
    const alone = new Map<string, (string | null)[][]>();
    for (const slot of HADU_WORN_SLOTS) {
      for (const id of idsIn(slot)) {
        alone.set(id, painted(haduDrawing({ [slot]: id }).cat));
      }
    }
    const auras = idsIn("halo");
    let looks = 0;

    for (const hat of idsIn("hat")) {
      for (const eyes of idsIn("eyes")) {
        for (const body of idsIn("body")) {
          for (const tail of idsIn("tail")) {
            const halo = auras[looks++ % auras.length]!;
            const look = { hat, eyes, body, tail, halo };
            const { cat, aura } = haduDrawing(look);
            const whole = painted(cat);
            const mismatch = whole.findIndex((row, y) =>
              row.some((color, x) => {
                const slot = SLOT_OF.get(`${y},${x}`);
                const source = slot ? alone.get(look[slot]) : bare;
                return color !== source?.[y]?.[x];
              }),
            );
            if (mismatch >= 0) {
              throw new Error(`${JSON.stringify(look)} breaks row ${mismatch}`);
            }
            expect(aura?.rows ?? null).toEqual(HADU_AURAS[halo]?.rows ?? null);
          }
        }
      }
    }
    expect(looks).toBe(9 ** 4);
  });

  it("wears a whole look, one piece to a slot", () => {
    const look = {
      hat: "hat-wizard-hat",
      eyes: "eyes-star",
      body: "body-cape",
      tail: "tail-flame",
      halo: "halo-nine-lives",
    };
    const { cat, aura } = haduDrawing(look);
    const rows = cat.rows.join("");
    for (const slot of HADU_WORN_SLOTS) {
      const piece = HADU_PIECES[look[slot]]!;
      piece.ink.forEach((color, i) => {
        const character = HADU_SLOT_INK[slot][i]!;
        expect(cat.colors[character], look[slot]).toBe(color);
        expect(rows.includes(character), look[slot]).toBe(true);
      });
    }
    expect(aura?.rows).toEqual(HADU_AURAS["halo-nine-lives"]?.rows);
    // Nine lives is nine marks: nine white glints, one to a bell.
    expect((aura?.rows.join("").match(/w/g) ?? []).length).toBe(9);
    // The grid and the aura both draw through the sprites' own run builder.
    expect(buildRuns(cat.rows, { ...cat.colors }).length).toBeGreaterThan(0);
    expect(
      buildRuns(aura?.rows ?? [], { ...aura?.colors }).length,
    ).toBeGreaterThan(0);
  });
});
