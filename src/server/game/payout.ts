/**
 * What a run pays in coins. The whole formula stays on the server: a player
 * is only ever shown the total, so this module must never be imported by
 * anything a browser loads.
 *
 * Half a coin a point is the floor, and it is the same on every tier. The
 * bonuses are for going deeper, and each win is worth more than the one
 * before, so a run played on is always worth more than one abandoned after
 * an easy first match. A harder tier multiplies the bonuses, and by a good
 * deal: measured, a run on a harder tier ends sooner, and with a smaller
 * factor it paid less than the same play on Kitten.
 */

import "server-only";

import { difficultyOf, type DifficultyId } from "./difficulty";
import { HIGH_SCORE, TOP_SCORE } from "./unlocks";

/** The facts of a finished run that coins are counted from. */
export interface PayoutFacts {
  /** Points scored over every finished match, a lost one included. */
  totalScore: number;
  matchesWon: number;
  won: boolean;
  difficulty: DifficultyId;
  bestMatchScore: number;
  /** Matches in which the player took the higher share of every round goal. */
  goalsSwept: number;
  /** Stolen cards taken back. */
  reclaimed: number;
}

/** Coins for each point scored. */
export const COIN_RATE = 0.5;

/** The bonus for each win of a run, by how many came before it. */
const WIN_BONUS: readonly number[] = [4, 6, 8, 12, 16, 24];
/** For beating all six. */
const RUN_BONUS = 30;
/** For a best match at each of the two scores the unlocks ask for. */
const HIGH_BONUS = 6;
const TOP_BONUS = 12;
/** For each match whose every round goal went to the player. */
const SWEEP_BONUS = 4;
/** For each stolen card taken back. */
const RECLAIM_BONUS = 2;

/**
 * How much more every bonus is worth on a harder tier. Set so that a careful
 * player's run pays about the same on all three, and a better one's more
 * the harder it is.
 */
const TIER_FACTOR: Record<DifficultyId, number> = {
  kitten: 1,
  stray: 1.7,
  apex: 2.8,
};

/** The coins a finished run pays, whole and never negative. */
export function payout(facts: PayoutFacts): number {
  const count = (n: number) => Math.max(0, Math.floor(n));
  const wins = Math.min(count(facts.matchesWon), WIN_BONUS.length);
  const depth = WIN_BONUS.slice(0, wins).reduce((sum, n) => sum + n, 0);
  const best = count(facts.bestMatchScore);
  const bonus =
    depth +
    (facts.won ? RUN_BONUS : 0) +
    (best >= TOP_SCORE ? TOP_BONUS : best >= HIGH_SCORE ? HIGH_BONUS : 0) +
    SWEEP_BONUS * count(facts.goalsSwept) +
    RECLAIM_BONUS * count(facts.reclaimed);
  const tier = TIER_FACTOR[difficultyOf(facts.difficulty).id];
  return (
    Math.floor(count(facts.totalScore) * COIN_RATE) + Math.round(bonus * tier)
  );
}
