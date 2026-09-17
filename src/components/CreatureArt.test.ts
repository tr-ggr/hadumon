import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CREATURE_ART_LABELS,
  CREATURE_ART_MANIFEST,
  MASCOT_ART,
} from "./CreatureArt";
import { SPECIES } from "~/server/game/species";

describe("creature art manifest", () => {
  it("contains art for every catalogue species", () => {
    expect(Object.keys(CREATURE_ART_MANIFEST).sort()).toEqual(
      Object.keys(SPECIES).sort(),
    );
    expect(Object.keys(CREATURE_ART_LABELS).sort()).toEqual(
      Object.keys(SPECIES).sort(),
    );
    for (const source of Object.values(CREATURE_ART_MANIFEST)) {
      expect(
        existsSync(resolve(process.cwd(), "public", source.slice(1))),
      ).toBe(true);
    }
    for (const label of Object.values(CREATURE_ART_LABELS)) {
      expect(label.trim()).not.toBe("");
    }
  });

  it("uses the complete Flameclaw artwork for the mascot", () => {
    expect(MASCOT_ART).toBe(CREATURE_ART_MANIFEST.flameclaw);
    expect(
      existsSync(resolve(process.cwd(), "public", MASCOT_ART.slice(1))),
    ).toBe(true);
  });
});
