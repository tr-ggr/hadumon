import { describe, expect, it } from "vitest";

import { getSpecies, RARITY_MULTIPLIER, SPECIES_LIST } from "./species";
import {
  applyXp,
  creaturePower,
  effectiveStats,
  MAX_LEVEL,
  squadPower,
  xpForLevel,
} from "./stats";

describe("effectiveStats", () => {
  it("returns the base stats at level 1, tier 0, common rarity", () => {
    const species = getSpecies("flameclaw");
    expect(effectiveStats(species, 1, 0)).toEqual(species.baseStats);
  });

  it("applies the documented formula", () => {
    const species = getSpecies("umbralynx"); // rare → 1.35
    const level = 12;
    const tier = 3;
    const mult =
      RARITY_MULTIPLIER.rare * (1 + 0.06 * (level - 1)) * (1 + 0.05 * tier);
    expect(effectiveStats(species, level, tier).attack).toBe(
      Math.floor(species.baseStats.attack * mult),
    );
  });

  it("grows monotonically with level and tier", () => {
    const species = getSpecies("mistpaw");
    const l1 = effectiveStats(species, 1, 0);
    const l10 = effectiveStats(species, 10, 0);
    const l10t5 = effectiveStats(species, 10, 5);
    expect(l10.attack).toBeGreaterThan(l1.attack);
    expect(l10t5.attack).toBeGreaterThan(l10.attack);
  });

  it("clamps the level to the cap", () => {
    const species = getSpecies("mistpaw");
    expect(effectiveStats(species, 999, 0)).toEqual(
      effectiveStats(species, MAX_LEVEL, 0),
    );
  });
});

describe("power", () => {
  it("is hp/4 + attack + defense + speed + affinity", () => {
    const stats = { hp: 200, attack: 50, defense: 40, speed: 30, affinity: 20 };
    expect(creaturePower(stats)).toBe(190);
  });

  it("squadPower sums the members", () => {
    const a = { hp: 200, attack: 50, defense: 40, speed: 30, affinity: 20 };
    const b = { hp: 100, attack: 10, defense: 10, speed: 10, affinity: 10 };
    expect(squadPower([a, b])).toBe(creaturePower(a) + creaturePower(b));
    expect(squadPower([])).toBe(0);
  });

  it("ranks rarer species above commons at the same level", () => {
    const common = creaturePower(
      effectiveStats(getSpecies("flameclaw"), 20, 0),
    );
    const legendary = creaturePower(
      effectiveStats(getSpecies("aurelynx"), 20, 0),
    );
    expect(legendary).toBeGreaterThan(common);
  });
});

describe("xp", () => {
  it("xpForLevel matches 50 * L^1.6 rounded", () => {
    expect(xpForLevel(1)).toBe(50);
    expect(xpForLevel(5)).toBe(Math.round(50 * Math.pow(5, 1.6)));
    expect(xpForLevel(10)).toBeGreaterThan(xpForLevel(9));
  });

  it("levels up once enough xp is banked", () => {
    const result = applyXp({ level: 1, xp: 0 }, xpForLevel(1));
    expect(result).toEqual({ level: 2, xp: 0, leveledUp: true });
  });

  it("keeps the remainder and can chain several levels", () => {
    const gained = xpForLevel(1) + xpForLevel(2) + 7;
    const result = applyXp({ level: 1, xp: 0 }, gained);
    expect(result.level).toBe(3);
    expect(result.xp).toBe(7);
    expect(result.leveledUp).toBe(true);
  });

  it("does not level up below the threshold", () => {
    const result = applyXp({ level: 3, xp: 5 }, 10);
    expect(result).toEqual({ level: 3, xp: 15, leveledUp: false });
  });

  it("caps at level 50", () => {
    const result = applyXp({ level: 49, xp: 0 }, 10_000_000);
    expect(result.level).toBe(MAX_LEVEL);
    expect(result.xp).toBe(0);
  });
});

describe("species catalogue", () => {
  it("has 25 species with unique ids and the required starters", () => {
    expect(SPECIES_LIST).toHaveLength(25);
    expect(new Set(SPECIES_LIST.map((s) => s.id)).size).toBe(25);
    for (const id of ["flameclaw", "mistpaw", "voltwhisk"]) {
      expect(getSpecies(id).rarity).toBe("common");
    }
  });

  it("covers every element at common/uncommon/rare and has epics + legendaries", () => {
    const byRarity = (r: string) => SPECIES_LIST.filter((s) => s.rarity === r);
    expect(byRarity("common")).toHaveLength(10);
    expect(byRarity("uncommon")).toHaveLength(5);
    expect(byRarity("rare")).toHaveLength(5);
    expect(byRarity("epic")).toHaveLength(3);
    expect(byRarity("legendary")).toHaveLength(2);
  });

  it("throws on an unknown species id", () => {
    expect(() => getSpecies("nope")).toThrow(/Unknown species/);
  });
});
