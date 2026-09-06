import { describe, expect, it } from "vitest";

import {
  canUpgrade,
  MAX_UPGRADE_TIER,
  nextUpgradeCost,
  upgradeCost,
} from "./progression";
import { getSpecies, SPECIES_LIST } from "./species";

const flame = { speciesId: "flameclaw", upgradeTier: 0 };

describe("upgradeCost", () => {
  it("follows 100 * (tier + 1)^2 gold and 3 * (tier + 1) shards", () => {
    for (let tier = 0; tier < MAX_UPGRADE_TIER; tier++) {
      const cost = upgradeCost({ ...flame, upgradeTier: tier });
      expect(cost.gold).toBe(100 * (tier + 1) ** 2);
      expect(cost.materials.amount).toBe(3 * (tier + 1));
    }
  });

  it("prices tier 0 → 1 at 100 gold and 3 shards", () => {
    expect(upgradeCost(flame)).toEqual({
      gold: 100,
      materials: { element: "flame", amount: 3 },
    });
  });

  it("charges the creature's own element", () => {
    for (const species of SPECIES_LIST) {
      const cost = upgradeCost({ speciesId: species.id, upgradeTier: 2 });
      expect(cost.materials.element).toBe(getSpecies(species.id).element);
    }
  });

  it("gets strictly more expensive every tier", () => {
    for (let tier = 1; tier < MAX_UPGRADE_TIER; tier++) {
      const prev = upgradeCost({ ...flame, upgradeTier: tier - 1 });
      const next = upgradeCost({ ...flame, upgradeTier: tier });
      expect(next.gold).toBeGreaterThan(prev.gold);
      expect(next.materials.amount).toBeGreaterThan(prev.materials.amount);
    }
  });

  it("refuses to price an upgrade past the tier cap", () => {
    expect(() =>
      upgradeCost({ ...flame, upgradeTier: MAX_UPGRADE_TIER }),
    ).toThrow(/maximum upgrade tier/);
    expect(() => upgradeCost({ ...flame, upgradeTier: 99 })).toThrow();
  });

  it("treats negative or fractional tiers as their clamped floor", () => {
    expect(upgradeCost({ ...flame, upgradeTier: -3 })).toEqual(
      upgradeCost(flame),
    );
    expect(upgradeCost({ ...flame, upgradeTier: 2.9 })).toEqual(
      upgradeCost({ ...flame, upgradeTier: 2 }),
    );
  });
});

describe("canUpgrade / nextUpgradeCost", () => {
  it("allows every tier below the cap", () => {
    for (let tier = 0; tier < MAX_UPGRADE_TIER; tier++) {
      expect(canUpgrade({ ...flame, upgradeTier: tier })).toBe(true);
      expect(nextUpgradeCost({ ...flame, upgradeTier: tier })).not.toBeNull();
    }
  });

  it("stops at the cap", () => {
    expect(canUpgrade({ ...flame, upgradeTier: MAX_UPGRADE_TIER })).toBe(false);
    expect(
      nextUpgradeCost({ ...flame, upgradeTier: MAX_UPGRADE_TIER }),
    ).toBeNull();
  });
});
