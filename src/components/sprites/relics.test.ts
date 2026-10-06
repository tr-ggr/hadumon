import { describe, expect, it } from "vitest";

import { RELIC_LIST } from "~/server/game/relics";

import { ICON_LEGEND } from "./icons";
import {
  ELEMENT_PALETTES,
  LIME_COLOR,
  WHITE_COLOR,
  relicFill,
} from "./palettes";
import { RELIC_GRIDS, RELIC_SIZE, relicGrid } from "./relics";

const LEGEND = new Set(Object.keys(ICON_LEGEND));
const IDS = RELIC_LIST.map((relic) => relic.id);

function count(rows: readonly string[], pixel: string): number {
  return rows.join("").split(pixel).length - 1;
}

describe("relic art", () => {
  it("draws every relic, and nothing else", () => {
    expect(Object.keys(RELIC_GRIDS).sort()).toEqual([...IDS].sort());
    expect(() => relicGrid("no-such-relic")).toThrow();
  });

  it("draws each as a 16x16 grid of legend characters", () => {
    for (const id of IDS) {
      const rows = relicGrid(id);
      expect(rows, id).toHaveLength(RELIC_SIZE);
      for (const row of rows) {
        expect(row, id).toHaveLength(RELIC_SIZE);
        for (const pixel of row) expect(LEGEND.has(pixel), id).toBe(true);
      }
    }
  });

  it("outlines every relic and fills some of it, so it reads on any ground", () => {
    for (const id of IDS) {
      const rows = relicGrid(id);
      expect(count(rows, "o"), id).toBeGreaterThanOrEqual(24);
      expect(count(rows, "1"), id).toBeGreaterThanOrEqual(8);
    }
  });

  it("gives no two relics the same drawing", () => {
    const grids = new Set(IDS.map((id) => relicGrid(id).join("\n")));
    expect(grids.size).toBe(IDS.length);
  });

  it("fills a charm with its element, a lane relic with lime, the rest white", () => {
    expect(relicFill("ember-charm")).toBe(ELEMENT_PALETTES.flame["1"]);
    expect(relicFill("dusk-charm")).toBe(ELEMENT_PALETTES.shade["1"]);
    const lime = IDS.filter((id) => relicFill(id) === LIME_COLOR).sort();
    expect(lime).toEqual([
      "ball-of-twine",
      "bent-whisker",
      "hunters-tally",
      "moonlit-path",
      "night-map",
      "quiet-corner",
    ]);
    const white = IDS.filter((id) => relicFill(id) === WHITE_COLOR).sort();
    expect(white).toEqual([
      "alley-crown",
      "crowded-sill",
      "early-riser",
      "hoarders-basket",
      "loud-bell",
      "lucky-collar",
      "mouse-jar",
      "night-bowl",
      "night-owl",
      "old-blanket",
      "paper-bag",
      "patchwork-quilt",
      "soft-landing",
      "warm-saucer",
    ]);
  });
});
