import { describe, expect, it } from "vitest";

import { ICON_LEGEND, ICON_NAMES, ICON_SIZES, ICONS } from "./icons";

const LEGEND = new Set(Object.keys(ICON_LEGEND));

describe("pixel icons", () => {
  it("draws every icon as a square grid of legend characters", () => {
    expect(ICON_NAMES.length).toBeGreaterThan(0);
    for (const name of ICON_NAMES) {
      const rows: readonly string[] = ICONS[name];
      expect(ICON_SIZES as readonly number[], name).toContain(rows.length);
      for (const row of rows) {
        expect(row, name).toHaveLength(rows.length);
        for (const pixel of row) expect(LEGEND.has(pixel), name).toBe(true);
      }
    }
  });

  it("outlines every icon, so it reads on any fill", () => {
    for (const name of ICON_NAMES) {
      const outline = ICONS[name].join("").split("o").length - 1;
      expect(outline, name).toBeGreaterThanOrEqual(8);
    }
  });

  it("gives no two icons the same grid", () => {
    const grids = new Set(ICON_NAMES.map((name) => ICONS[name].join("\n")));
    expect(grids.size).toBe(ICON_NAMES.length);
  });
});
