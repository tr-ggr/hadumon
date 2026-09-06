import { simulateBattle, type BattleEvent, type Combatant } from "./battle";
import type { Element } from "./elements";
import { createRng } from "./rng";
import { getSpecies } from "./species";
import { applyXp, effectiveStats } from "./stats";
import {
  encounterSeed,
  generateEnemies,
  MAX_OFFLINE_SECONDS,
  type EnemyCombatant,
  type Zone,
} from "./zones";

/** Consecutive losses that force an expedition to retreat. */
export const RETREAT_LOSS_STREAK = 3;

/** Base gold for a won encounter, before tier and zone multipliers. */
export const BASE_GOLD_PER_WIN = 10;
/** Base XP pool for a won encounter, before the tier multiplier. */
export const BASE_XP_PER_WIN = 25;
/** Fraction of the win rewards paid out for a lost encounter. */
export const LOSS_GOLD_FRACTION = 0.25;
export const GEM_DROP_CHANCE = 0.1;
export const MATERIAL_DROP_CHANCE = 0.35;

/** Enough of a creature row to fight and to earn XP. */
export interface SquadCreature {
  id: string;
  name: string;
  speciesId: string;
  level: number;
  xp: number;
  upgradeTier: number;
}

export interface ExpeditionState {
  id: string;
  lastClaimedAt: Date;
  winCount: number;
  lossCount: number;
}

export interface EncounterEnemySummary {
  id: string;
  name: string;
  speciesId: string;
  level: number;
}

export interface EncounterSummary {
  index: number;
  won: boolean;
  rounds: number;
  gold: number;
  gems: number;
  xp: number;
  materials: number;
  enemies: EncounterEnemySummary[];
}

export interface ExpeditionRewards {
  gold: number;
  gems: number;
  xp: number;
  materialElement: Element;
  materials: number;
}

export interface CreatureXpGain {
  creatureId: string;
  name: string;
  speciesId: string;
  xpGained: number;
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
  leveledUp: boolean;
}

/** The stored replay of the final encounter of a claim. */
export interface LatestFight {
  encounterIndex: number;
  won: boolean;
  rounds: number;
  squad: { id: string; name: string; speciesId: string }[];
  enemies: EncounterEnemySummary[];
  events: BattleEvent[];
}

export interface ResolveResult {
  encounters: EncounterSummary[];
  rewards: ExpeditionRewards;
  xpPerCreature: CreatureXpGain[];
  winCount: number;
  lossCount: number;
  /** Seconds of elapsed time this resolution actually used up. */
  secondsConsumed: number;
  /** True when the squad lost `RETREAT_LOSS_STREAK` encounters in a row. */
  retreated: boolean;
  /** Replay of the last encounter fought, or `null` when nothing was fought. */
  latestFight: LatestFight | null;
}

export interface ResolveInput {
  expedition: ExpeditionState;
  squad: readonly SquadCreature[];
  zone: Zone;
  now: Date;
}

/** Elapsed seconds since the last claim, clamped to the 8h offline cap. */
export function creditedSeconds(lastClaimedAt: Date, now: Date, cap = MAX_OFFLINE_SECONDS): number {
  const elapsed = Math.floor((now.getTime() - lastClaimedAt.getTime()) / 1000);
  return Math.min(Math.max(0, elapsed), cap);
}

/** How many encounters are ready to be claimed right now. */
export function pendingEncounters(lastClaimedAt: Date, now: Date, zone: Zone): number {
  return Math.floor(creditedSeconds(lastClaimedAt, now) / zone.encounterIntervalSec);
}

/**
 * The new `lastClaimedAt` watermark after a claim.
 *
 * Advances by the seconds actually consumed — so a partial minute carries over
 * to the next claim — but never from further back than the offline cap, so
 * being away for a week still only ever pays out eight hours.
 */
export function nextClaimedAt(
  lastClaimedAt: Date,
  now: Date,
  secondsConsumed: number,
): Date {
  const capMs = MAX_OFFLINE_SECONDS * 1000;
  const elapsedMs = now.getTime() - lastClaimedAt.getTime();
  const base = elapsedMs > capMs ? now.getTime() - capMs : lastClaimedAt.getTime();
  return new Date(base + secondsConsumed * 1000);
}

/** Seconds until one more encounter becomes claimable (0 once the cap is hit). */
export function secondsToNextEncounter(lastClaimedAt: Date, now: Date, zone: Zone): number {
  const interval = zone.encounterIntervalSec;
  const elapsed = Math.max(0, Math.floor((now.getTime() - lastClaimedAt.getTime()) / 1000));
  if (elapsed >= MAX_OFFLINE_SECONDS) return 0;
  return interval - (elapsed % interval);
}

/** Builds the battle-engine combatant for one of the player's cats. */
export function toCombatant(creature: SquadCreature): Combatant {
  const species = getSpecies(creature.speciesId);
  return {
    id: creature.id,
    name: creature.name,
    speciesId: creature.speciesId,
    element: species.element,
    stats: effectiveStats(species, creature.level, creature.upgradeTier),
  };
}

/**
 * Resolves every encounter that has come due since `expedition.lastClaimedAt`.
 *
 * Pure and deterministic: the same expedition id, encounter index, squad and
 * zone always produce the same battles and drops. The squad fights each
 * encounter at full HP (no carry-over damage), and the run stops early if the
 * squad loses `RETREAT_LOSS_STREAK` encounters back-to-back.
 */
export function resolveExpedition({
  expedition,
  squad,
  zone,
  now,
}: ResolveInput): ResolveResult {
  const interval = zone.encounterIntervalSec;
  const available = pendingEncounters(expedition.lastClaimedAt, now, zone);

  const encounters: EncounterSummary[] = [];
  const rewards: ExpeditionRewards = {
    gold: 0,
    gems: 0,
    xp: 0,
    materialElement: zone.element,
    materials: 0,
  };

  const gains = new Map<string, CreatureXpGain>(
    squad.map((creature) => [
      creature.id,
      {
        creatureId: creature.id,
        name: creature.name,
        speciesId: creature.speciesId,
        xpGained: 0,
        levelBefore: creature.level,
        levelAfter: creature.level,
        xpBefore: creature.xp,
        xpAfter: creature.xp,
        leveledUp: false,
      },
    ]),
  );

  const team = squad.map(toCombatant);
  const winGold = Math.floor(BASE_GOLD_PER_WIN * zone.tier * zone.rewardMult);
  const winXp = BASE_XP_PER_WIN * zone.tier;

  let winCount = 0;
  let lossCount = 0;
  let lossStreak = 0;
  let retreated = false;
  let resolved = 0;
  let latestFight: LatestFight | null = null;

  for (let i = 0; i < available; i++) {
    // Encounter indices keep climbing across claims, so seeds never repeat.
    const index = expedition.winCount + expedition.lossCount + resolved;
    const seed = encounterSeed(expedition.id, index);
    const enemies = generateEnemies(zone, expedition.id, index);
    const result = simulateBattle(team, enemies, seed);
    const won = result.winner === "A";

    const rng = createRng(`rewards:${seed}`);
    const gold = won ? winGold : Math.floor(winGold * LOSS_GOLD_FRACTION);
    const xp = won ? winXp : Math.floor(winXp / 2);
    const gems = won && rng.chance(GEM_DROP_CHANCE) ? 1 : 0;
    const materials = won && rng.chance(MATERIAL_DROP_CHANCE) ? 1 : 0;

    rewards.gold += gold;
    rewards.gems += gems;
    rewards.xp += xp;
    rewards.materials += materials;

    awardXp(gains, squad, xp);

    encounters.push({
      index,
      won,
      rounds: result.rounds,
      gold,
      gems,
      xp,
      materials,
      enemies: enemies.map(toEnemySummary),
    });

    latestFight = {
      encounterIndex: index,
      won,
      rounds: result.rounds,
      squad: squad.map((c) => ({ id: c.id, name: c.name, speciesId: c.speciesId })),
      enemies: enemies.map(toEnemySummary),
      events: result.log,
    };

    resolved += 1;
    if (won) {
      winCount += 1;
      lossStreak = 0;
    } else {
      lossCount += 1;
      lossStreak += 1;
      if (lossStreak >= RETREAT_LOSS_STREAK) {
        retreated = true;
        break;
      }
    }
  }

  return {
    encounters,
    rewards,
    xpPerCreature: [...gains.values()],
    winCount,
    lossCount,
    secondsConsumed: resolved * interval,
    retreated,
    latestFight,
  };
}

/** Splits an encounter's XP pool evenly across the squad and rolls levels. */
function awardXp(
  gains: Map<string, CreatureXpGain>,
  squad: readonly SquadCreature[],
  pool: number,
): void {
  if (squad.length === 0) return;
  const share = Math.floor(pool / squad.length);
  if (share <= 0) return;

  for (const creature of squad) {
    const gain = gains.get(creature.id);
    if (!gain) continue;
    const progress = applyXp({ level: gain.levelAfter, xp: gain.xpAfter }, share);
    gain.xpGained += share;
    gain.leveledUp ||= progress.level > gain.levelAfter;
    gain.levelAfter = progress.level;
    gain.xpAfter = progress.xp;
  }
}

function toEnemySummary(enemy: EnemyCombatant): EncounterEnemySummary {
  return {
    id: enemy.id,
    name: enemy.name,
    speciesId: enemy.speciesId,
    level: enemy.level,
  };
}
