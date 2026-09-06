import type { Element } from "./elements";
import { getSpecies } from "./species";

/** Upgrade tiers run 0 → 10; each tier is +5% to every effective stat. */
export const MAX_UPGRADE_TIER = 10;

/** Anything with enough shape to be priced — a DB row or a view both fit. */
export interface UpgradableCreature {
  speciesId: string;
  upgradeTier: number;
}

export interface UpgradeCost {
  gold: number;
  materials: { element: Element; amount: number };
}

/**
 * Cost of taking a creature from its current tier to the next:
 * `gold = 100 * (tier + 1)^2`, `materials = 3 * (tier + 1)` of the creature's
 * own element. Throws once the creature is already at `MAX_UPGRADE_TIER` —
 * check with `canUpgrade` first.
 */
export function upgradeCost(creature: UpgradableCreature): UpgradeCost {
  const tier = normalizeTier(creature.upgradeTier);
  if (tier >= MAX_UPGRADE_TIER) {
    throw new Error(`Creature is already at the maximum upgrade tier (${MAX_UPGRADE_TIER})`);
  }

  const step = tier + 1;
  return {
    gold: 100 * step * step,
    materials: {
      element: getSpecies(creature.speciesId).element,
      amount: 3 * step,
    },
  };
}

export function canUpgrade(creature: UpgradableCreature): boolean {
  return normalizeTier(creature.upgradeTier) < MAX_UPGRADE_TIER;
}

/** `upgradeCost` unless the creature is maxed, in which case `null`. */
export function nextUpgradeCost(creature: UpgradableCreature): UpgradeCost | null {
  return canUpgrade(creature) ? upgradeCost(creature) : null;
}

function normalizeTier(tier: number): number {
  return Math.min(MAX_UPGRADE_TIER, Math.max(0, Math.floor(tier)));
}
