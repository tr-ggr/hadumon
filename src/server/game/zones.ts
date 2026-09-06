import type { Combatant } from "./battle";
import { ELEMENTS, type Element } from "./elements";
import { createRng } from "./rng";
import { getSpecies, SPECIES_LIST, type Species } from "./species";
import { effectiveStats } from "./stats";

/** A zone becomes available once `wins` encounters have been won in `zoneId`. */
export interface ZoneUnlockRequirement {
  zoneId: string;
  wins: number;
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  /** 1–5. Drives reward scale and enemy strength. */
  tier: number;
  /** Dominant element: 80% of enemies and the material that drops here. */
  element: Element;
  recommendedPower: number;
  encounterIntervalSec: number;
  enemyLevelRange: readonly [number, number];
  rewardMult: number;
  unlockRequirement: ZoneUnlockRequirement | null;
}

/** How many encounters must be won in a zone to open the next one. */
export const WINS_TO_UNLOCK = 20;

/** Every expedition resolves one encounter per minute of elapsed time. */
export const ENCOUNTER_INTERVAL_SEC = 60;

/** Idle rewards accrue for at most 8 hours while you are away. */
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

/** Chance an enemy rolls off the zone's dominant element. */
export const OFF_ELEMENT_CHANCE = 0.2;

export const ZONES: readonly Zone[] = [
  {
    id: "whisker-meadows",
    name: "Whisker Meadows",
    description: "Sunlit grass, lazy bees and bramble cats who mean well.",
    tier: 1,
    element: "thorn",
    recommendedPower: 0,
    encounterIntervalSec: ENCOUNTER_INTERVAL_SEC,
    enemyLevelRange: [1, 4],
    rewardMult: 1,
    unlockRequirement: null,
  },
  {
    id: "ember-alley",
    name: "Ember Alley",
    description: "Back-street braziers where the strays keep the coals warm.",
    tier: 2,
    element: "flame",
    recommendedPower: 700,
    encounterIntervalSec: ENCOUNTER_INTERVAL_SEC,
    enemyLevelRange: [5, 9],
    rewardMult: 1.2,
    unlockRequirement: { zoneId: "whisker-meadows", wins: WINS_TO_UNLOCK },
  },
  {
    id: "foggy-docks",
    name: "Foggy Docks",
    description: "Salt fog, creaking rope, and eyes that blink out of it.",
    tier: 3,
    element: "mist",
    recommendedPower: 1400,
    encounterIntervalSec: ENCOUNTER_INTERVAL_SEC,
    enemyLevelRange: [10, 16],
    rewardMult: 1.45,
    unlockRequirement: { zoneId: "ember-alley", wins: WINS_TO_UNLOCK },
  },
  {
    id: "static-rooftops",
    name: "Static Rooftops",
    description: "Aerials, pigeons and a permanent smell of thunderstorm.",
    tier: 4,
    element: "volt",
    recommendedPower: 2400,
    encounterIntervalSec: ENCOUNTER_INTERVAL_SEC,
    enemyLevelRange: [17, 25],
    rewardMult: 1.75,
    unlockRequirement: { zoneId: "foggy-docks", wins: WINS_TO_UNLOCK },
  },
  {
    id: "moonlit-catacombs",
    name: "Moonlit Catacombs",
    description: "Nine tails' worth of shadow for every one cat you can see.",
    tier: 5,
    element: "shade",
    recommendedPower: 3600,
    encounterIntervalSec: ENCOUNTER_INTERVAL_SEC,
    enemyLevelRange: [26, 36],
    rewardMult: 2.1,
    unlockRequirement: { zoneId: "static-rooftops", wins: WINS_TO_UNLOCK },
  },
];

const ZONE_BY_ID: Record<string, Zone> = Object.fromEntries(
  ZONES.map((zone) => [zone.id, zone] as const),
);

export const ZONE_IDS: readonly string[] = ZONES.map((zone) => zone.id);

export function findZone(zoneId: string): Zone | undefined {
  return ZONE_BY_ID[zoneId];
}

export function getZone(zoneId: string): Zone {
  const zone = ZONE_BY_ID[zoneId];
  if (!zone) throw new Error(`Unknown zone: ${zoneId}`);
  return zone;
}

/** True when `winsByZone` satisfies the zone's unlock requirement. */
export function isZoneUnlocked(
  zone: Zone,
  winsByZone: Readonly<Record<string, number>>,
): boolean {
  const req = zone.unlockRequirement;
  if (!req) return true;
  return (winsByZone[req.zoneId] ?? 0) >= req.wins;
}

/** Stable per-encounter seed: the same expedition + index always replays identically. */
export function encounterSeed(
  expeditionId: string,
  encounterIndex: number,
): string {
  return `${expeditionId}:${encounterIndex}`;
}

export interface EnemyCombatant extends Combatant {
  level: number;
  species: Species;
}

/**
 * Builds the 2–4 wild cats guarding one encounter. Deterministic in
 * `(expeditionId, encounterIndex)` — enemies are drawn from the zone's element
 * with a 20% chance of an off-element interloper, at levels inside the zone's
 * range, and scale slightly with the encounter index so a long expedition
 * keeps its teeth.
 */
export function generateEnemies(
  zone: Zone,
  expeditionId: string,
  encounterIndex: number,
): EnemyCombatant[] {
  const rng = createRng(
    `enemies:${encounterSeed(expeditionId, encounterIndex)}`,
  );
  const count = rng.int(2, 4);
  const [minLevel, maxLevel] = zone.enemyLevelRange;

  const enemies: EnemyCombatant[] = [];
  for (let i = 0; i < count; i++) {
    const element = rng.chance(OFF_ELEMENT_CHANCE)
      ? rng.pick(ELEMENTS)
      : zone.element;
    const species = rng.pick(candidateSpecies(element, zone.tier));
    const level = rng.int(minLevel, maxLevel);
    const stats = effectiveStats(species, level, 0);

    enemies.push({
      id: `enemy-${encounterIndex}-${i}`,
      name: species.name,
      speciesId: species.id,
      element: species.element,
      stats,
      level,
      species,
    });
  }

  return enemies;
}

/** Wild cats stay at common/uncommon until the deeper zones. */
function candidateSpecies(element: Element, tier: number): Species[] {
  const allowed = tier >= 4 ? 3 : tier >= 2 ? 2 : 1;
  const rank: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
  };

  const pool = SPECIES_LIST.filter(
    (sp) => sp.element === element && (rank[sp.rarity] ?? 9) <= allowed,
  );

  if (pool.length > 0) return pool;
  // Every element has at least one common, but stay safe for odd catalogues.
  const fallback = SPECIES_LIST.filter((sp) => sp.element === element);
  return fallback.length > 0 ? fallback : [getSpecies("flameclaw")];
}
