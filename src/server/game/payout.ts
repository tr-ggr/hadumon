/**
 * What a match pays in coins, paid the moment it ends, won or lost. The
 * formula stays on the server: a player is shown what each match paid and
 * the floor's factor, never the rest, so this module must never be imported
 * by anything a browser loads.
 *
 * Half a coin a point is the floor, and it is the same on every tier. A win,
 * a swept match and a high score pay bonuses on top, and a harder tier
 * multiplies the bonuses, by a good deal: measured, a run on a harder tier
 * ends sooner, and with a smaller factor it paid less than the same play on
 * Kitten. Then the whole of it is multiplied by how high up the tower the
 * match was, so a deep run that ends in a loss has still paid well, and the
 * player is stronger for the next one.
 */

import "server-only";

import { difficultyOf, type DifficultyId } from "./difficulty";
import type { MatchPaid, MatchPay } from "./run";
import { HIGH_SCORE, TOP_SCORE } from "./unlocks";

/** Coins for each point scored, before the floor's factor. */
export const COIN_RATE = 0.5;

/**
 * What a match on each floor of the tower is multiplied by, from the first
 * rival to the last. Depth is paid here and only here.
 */
export const FLOOR_FACTOR: readonly number[] = [1, 1.2, 1.4, 1.6, 1.8, 2];

/** For a match won. */
const WIN_BONUS = 8;
/** For beating all six, paid with the last win. */
const RUN_BONUS = 30;
/** For a match at each of the two scores the unlocks ask for. */
const HIGH_BONUS = 6;
const TOP_BONUS = 12;
/** For a match whose every round goal went to the player. */
const SWEEP_BONUS = 4;

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

/** The factor a match on `floor` (0 for the first rival) is paid at. */
export function floorFactor(floor: number): number {
  const at = Math.min(Math.max(0, Math.floor(floor)), FLOOR_FACTOR.length - 1);
  return FLOOR_FACTOR[at] ?? 1;
}

/** The coins a finished match pays, whole and never negative. */
export function matchPayout(facts: MatchPay): MatchPaid {
  const score = Math.max(0, Math.floor(facts.score));
  const bonus =
    (facts.won ? WIN_BONUS : 0) +
    (facts.wonRun ? RUN_BONUS : 0) +
    (score >= TOP_SCORE ? TOP_BONUS : score >= HIGH_SCORE ? HIGH_BONUS : 0) +
    (facts.swept ? SWEEP_BONUS : 0);
  const tier = TIER_FACTOR[difficultyOf(facts.difficulty).id];
  const factor = floorFactor(facts.floor);
  // A hair over, so a product that should come out whole is never floored
  // a coin short by the float it is held in.
  const coins = Math.floor((score * COIN_RATE + bonus * tier) * factor + 1e-9);
  return { coins: Math.max(0, coins), factor };
}
