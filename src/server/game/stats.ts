import { RARITY_MULTIPLIER, type BaseStats, type Species } from "./species";

export type Stats = BaseStats;

export const MAX_LEVEL = 50;

/**
 * Effective stat at level `level` with `upgradeTier` upgrades:
 * `floor(base * rarityMult * (1 + 0.06 * (level - 1)) * (1 + 0.05 * upgradeTier))`
 */
export function effectiveStats(species: Species, level: number, upgradeTier = 0): Stats {
  const lvl = clamp(Math.floor(level), 1, MAX_LEVEL);
  const tier = Math.max(0, Math.floor(upgradeTier));
  const mult =
    RARITY_MULTIPLIER[species.rarity] * (1 + 0.06 * (lvl - 1)) * (1 + 0.05 * tier);

  return {
    hp: Math.floor(species.baseStats.hp * mult),
    attack: Math.floor(species.baseStats.attack * mult),
    defense: Math.floor(species.baseStats.defense * mult),
    speed: Math.floor(species.baseStats.speed * mult),
    affinity: Math.floor(species.baseStats.affinity * mult),
  };
}

/** `hp/4 + attack + defense + speed + affinity`, floored. */
export function creaturePower(stats: Stats): number {
  return Math.floor(
    stats.hp / 4 + stats.attack + stats.defense + stats.speed + stats.affinity,
  );
}

/** Sum of `creaturePower` over a squad. */
export function squadPower(members: readonly Stats[]): number {
  return members.reduce((total, stats) => total + creaturePower(stats), 0);
}

/** XP required to advance from `level` to `level + 1`. */
export function xpForLevel(level: number): number {
  const lvl = clamp(Math.floor(level), 1, MAX_LEVEL);
  return Math.round(50 * Math.pow(lvl, 1.6));
}

export interface XpProgress {
  level: number;
  xp: number;
  leveledUp: boolean;
}

/** Applies XP to a creature, rolling levels over until the cap. */
export function applyXp(
  creature: { level: number; xp: number },
  gained: number,
): XpProgress {
  let level = clamp(Math.floor(creature.level), 1, MAX_LEVEL);
  let xp = Math.max(0, Math.floor(creature.xp)) + Math.max(0, Math.floor(gained));
  let leveledUp = false;

  while (level < MAX_LEVEL) {
    const needed = xpForLevel(level);
    if (xp < needed) break;
    xp -= needed;
    level += 1;
    leveledUp = true;
  }

  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = 0;
  }

  return { level, xp, leveledUp };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
