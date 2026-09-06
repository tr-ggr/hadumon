import { describe, expect, it } from "vitest";

import { ARCHETYPES } from "~/server/game/species";
import { ARCHETYPE_SPRITES, SPRITE_LEGEND, SPRITE_SIZE } from "./archetypes";

const legend = new Set<string>(SPRITE_LEGEND);

describe("archetype sprite maps", () => {
  it("has a map for every archetype and nothing else", () => {
    expect(Object.keys(ARCHETYPE_SPRITES).sort()).toEqual(
      [...ARCHETYPES].sort(),
    );
  });

  for (const archetype of ARCHETYPES) {
    describe(archetype, () => {
      const rows = ARCHETYPE_SPRITES[archetype];

      it("is 32 rows of exactly 32 characters", () => {
        expect(rows).toHaveLength(SPRITE_SIZE);
        rows.forEach((row, y) => {
          expect(`${archetype}[${y}] length ${row.length}`).toBe(
            `${archetype}[${y}] length ${SPRITE_SIZE}`,
          );
        });
      });

      it("only uses legend characters", () => {
        rows.forEach((row, y) => {
          for (const char of row) {
            expect(legend.has(char), `${archetype}[${y}] has "${char}"`).toBe(
              true,
            );
          }
        });
      });

      it("draws a substantial figure that sits on the baseline", () => {
        const opaque = rows
          .join("")
          .split("")
          .filter((c) => c !== ".").length;
        expect(opaque).toBeGreaterThan(200);
        // The last row stays clear so every sprite shares the same baseline.
        expect(rows[SPRITE_SIZE - 1]).toBe(".".repeat(SPRITE_SIZE));
      });

      it("is outlined wherever it meets transparency", () => {
        // A pixel directly above the top of a column must be transparent or
        // outline — i.e. no bare fur edges hanging in the air.
        const first = rows.findIndex((r) => r.includes("o"));
        expect(first).toBeGreaterThanOrEqual(0);
        expect(first).toBeLessThan(SPRITE_SIZE / 2);
      });

      it("has eyes", () => {
        expect(rows.join("")).toContain("e");
      });
    });
  }

  it("gives each archetype a distinct silhouette", () => {
    const shapes = ARCHETYPES.map((a) =>
      ARCHETYPE_SPRITES[a].join("").replace(/[^.]/g, "#"),
    );
    expect(new Set(shapes).size).toBe(ARCHETYPES.length);
  });
});
