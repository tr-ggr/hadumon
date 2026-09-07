import { elementMultiplier, type Element } from "./elements";
import { createRng } from "./rng";
import type { Stats } from "./stats";

/** One fighter in a battle. Built from live creature stats by the callers. */
export interface Combatant {
  id: string;
  name: string;
  speciesId: string;
  element: Element;
  stats: Stats;
}

export interface BattleEvent {
  round: number;
  actorId: string;
  targetId: string;
  damage: number;
  crit: boolean;
  targetHpAfter: number;
  ko: boolean;
}

export type BattleSide = "A" | "B";

export interface BattleResult {
  winner: BattleSide;
  rounds: number;
  log: BattleEvent[];
  remainingHpA: number;
  remainingHpB: number;
}

export const MAX_ROUNDS = 30;
export const MAX_CRIT_CHANCE = 0.35;
export const CRIT_MULTIPLIER = 1.5;

interface Fighter {
  combatant: Combatant;
  side: BattleSide;
  hp: number;
  maxHp: number;
  tiebreak: number;
}

/**
 * Deterministic auto-battle. Both the idle adventure (Sprint 03) and the PvP
 * ladder (Sprint 04) call this; neither may change it — wrap it instead.
 */
export function simulateBattle(
  teamA: readonly Combatant[],
  teamB: readonly Combatant[],
  seed: string | number,
): BattleResult {
  const rng = createRng(seed);

  const fighters: Fighter[] = [
    ...teamA.map((c) => toFighter(c, "A")),
    ...teamB.map((c) => toFighter(c, "B")),
  ];
  // Seeded tiebreak assigned once, so speed ties resolve deterministically.
  for (const fighter of fighters) fighter.tiebreak = rng.next();

  const log: BattleEvent[] = [];
  const totalA = sumMaxHp(fighters, "A");
  const totalB = sumMaxHp(fighters, "B");

  let round = 0;
  while (
    round < MAX_ROUNDS &&
    anyAlive(fighters, "A") &&
    anyAlive(fighters, "B")
  ) {
    round += 1;

    const order = fighters
      .filter((f) => f.hp > 0)
      .sort(
        (a, b) =>
          b.combatant.stats.speed - a.combatant.stats.speed ||
          b.tiebreak - a.tiebreak,
      );

    for (const actor of order) {
      if (actor.hp <= 0) continue;
      const enemies = fighters.filter((f) => f.side !== actor.side && f.hp > 0);
      if (enemies.length === 0) break;

      const target = rng.pick(enemies);
      const critChance = Math.min(
        MAX_CRIT_CHANCE,
        0.05 + actor.combatant.stats.affinity / 400,
      );
      const crit = rng.chance(critChance);
      const critMult = crit ? CRIT_MULTIPLIER : 1;
      const elementMult = elementMultiplier(
        actor.combatant.element,
        target.combatant.element,
      );
      const variance = rng.float(0.9, 1.1);

      const raw =
        (actor.combatant.stats.attack * 1.2 -
          target.combatant.stats.defense * 0.6) *
        elementMult *
        critMult *
        variance;
      const damage = Math.max(1, Math.floor(raw));

      target.hp = Math.max(0, target.hp - damage);
      log.push({
        round,
        actorId: actor.combatant.id,
        targetId: target.combatant.id,
        damage,
        crit,
        targetHpAfter: target.hp,
        ko: target.hp === 0,
      });

      if (!anyAlive(fighters, target.side)) break;
    }
  }

  const remainingHpA = sumHp(fighters, "A");
  const remainingHpB = sumHp(fighters, "B");

  let winner: BattleSide;
  if (!anyAlive(fighters, "B")) {
    winner = "A";
  } else if (!anyAlive(fighters, "A")) {
    winner = "B";
  } else {
    // Round cap: higher remaining HP fraction wins; a tie goes to the defender.
    const pctA = totalA === 0 ? 0 : remainingHpA / totalA;
    const pctB = totalB === 0 ? 0 : remainingHpB / totalB;
    winner = pctA > pctB ? "A" : "B";
  }

  return { winner, rounds: round, log, remainingHpA, remainingHpB };
}

/** A combatant's starting HP as the engine counts it: whole, and at least 1. */
export function maxHpOf(combatant: Combatant): number {
  return Math.max(1, Math.floor(combatant.stats.hp));
}

function toFighter(combatant: Combatant, side: BattleSide): Fighter {
  const maxHp = maxHpOf(combatant);
  return { combatant, side, hp: maxHp, maxHp, tiebreak: 0 };
}

function anyAlive(fighters: readonly Fighter[], side: BattleSide): boolean {
  return fighters.some((f) => f.side === side && f.hp > 0);
}

function sumHp(fighters: readonly Fighter[], side: BattleSide): number {
  return fighters.reduce(
    (total, f) => (f.side === side ? total + f.hp : total),
    0,
  );
}

function sumMaxHp(fighters: readonly Fighter[], side: BattleSide): number {
  return fighters.reduce(
    (total, f) => (f.side === side ? total + f.maxHp : total),
    0,
  );
}
