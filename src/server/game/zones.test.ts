import { describe, expect, it } from "vitest";

import { ELEMENTS } from "./elements";
import { SPECIES } from "./species";
import {
  ENCOUNTER_INTERVAL_SEC,
  findZone,
  generateEnemies,
  getZone,
  isZoneUnlocked,
  WINS_TO_UNLOCK,
  ZONE_IDS,
  ZONES,
} from "./zones";

describe("ZONES", () => {
  it("defines five zones, one per element, in ascending tier order", () => {
    expect(ZONES).toHaveLength(5);
    expect(ZONES.map((z) => z.tier)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(ZONES.map((z) => z.element)).size).toBe(5);
    expect(new Set(ZONE_IDS).size).toBe(5);
  });

  it("uses a 60 second encounter interval and rising rewards everywhere", () => {
    for (const zone of ZONES) {
      expect(zone.encounterIntervalSec).toBe(ENCOUNTER_INTERVAL_SEC);
      expect(zone.enemyLevelRange[0]).toBeLessThanOrEqual(
        zone.enemyLevelRange[1],
      );
    }
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i]!.rewardMult).toBeGreaterThan(ZONES[i - 1]!.rewardMult);
      expect(ZONES[i]!.recommendedPower).toBeGreaterThan(
        ZONES[i - 1]!.recommendedPower,
      );
    }
  });

  it("chains unlocks: each zone needs 20 wins in the previous one", () => {
    expect(ZONES[0]!.unlockRequirement).toBeNull();
    for (let i = 1; i < ZONES.length; i++) {
      expect(ZONES[i]!.unlockRequirement).toEqual({
        zoneId: ZONES[i - 1]!.id,
        wins: WINS_TO_UNLOCK,
      });
    }
  });

  it("getZone throws on unknown ids, findZone returns undefined", () => {
    expect(getZone("whisker-meadows").name).toBe("Whisker Meadows");
    expect(findZone("nowhere")).toBeUndefined();
    expect(() => getZone("nowhere")).toThrow(/Unknown zone/);
  });
});

describe("isZoneUnlocked", () => {
  const first = ZONES[0]!;
  const second = ZONES[1]!;

  it("always unlocks the first zone", () => {
    expect(isZoneUnlocked(first, {})).toBe(true);
  });

  it("locks the next zone until the win threshold is met", () => {
    expect(isZoneUnlocked(second, {})).toBe(false);
    expect(isZoneUnlocked(second, { [first.id]: WINS_TO_UNLOCK - 1 })).toBe(
      false,
    );
    expect(isZoneUnlocked(second, { [first.id]: WINS_TO_UNLOCK })).toBe(true);
    expect(isZoneUnlocked(second, { [first.id]: 999 })).toBe(true);
  });
});

describe("generateEnemies", () => {
  const zone = getZone("ember-alley");

  it("is deterministic in expedition id + encounter index", () => {
    const a = generateEnemies(zone, "exp-1", 7);
    const b = generateEnemies(zone, "exp-1", 7);
    expect(a).toEqual(b);
  });

  it("varies with the encounter index and the expedition", () => {
    const base = generateEnemies(zone, "exp-1", 0);
    const laterIndex = generateEnemies(zone, "exp-1", 1);
    const otherExpedition = generateEnemies(zone, "exp-2", 0);
    expect(laterIndex).not.toEqual(base);
    expect(otherExpedition).not.toEqual(base);
  });

  it("fields 2-4 enemies inside the zone's level range from real species", () => {
    for (let i = 0; i < 60; i++) {
      const enemies = generateEnemies(zone, "exp-range", i);
      expect(enemies.length).toBeGreaterThanOrEqual(2);
      expect(enemies.length).toBeLessThanOrEqual(4);
      for (const enemy of enemies) {
        expect(SPECIES[enemy.speciesId]).toBeDefined();
        expect(enemy.level).toBeGreaterThanOrEqual(zone.enemyLevelRange[0]);
        expect(enemy.level).toBeLessThanOrEqual(zone.enemyLevelRange[1]);
        expect(ELEMENTS).toContain(enemy.element);
        expect(enemy.element).toBe(SPECIES[enemy.speciesId]!.element);
        expect(enemy.stats.hp).toBeGreaterThan(0);
      }
    }
  });

  it("is dominated by the zone element but admits off-element strays", () => {
    const all = Array.from({ length: 120 }, (_, i) =>
      generateEnemies(zone, "exp-mix", i),
    ).flat();
    const onElement = all.filter((e) => e.element === zone.element).length;
    const share = onElement / all.length;
    expect(share).toBeGreaterThan(0.6);
    expect(share).toBeLessThan(1);
  });

  it("gives every enemy a unique id inside one encounter", () => {
    const enemies = generateEnemies(zone, "exp-ids", 3);
    expect(new Set(enemies.map((e) => e.id)).size).toBe(enemies.length);
  });
});
