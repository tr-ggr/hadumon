/**
 * Elo ratings for the async PvP ladder (Sprint 04).
 *
 * Pure functions only — the router owns the transaction, this file owns the
 * maths. Every trainer (bots included) carries a rating on `users.rating`.
 */

/** Maximum cats on a team (attack or defense). Client-safe constant. */
export const MAX_TEAM_SIZE = 4;

/** Standard Elo K-factor. */
export const DEFAULT_K = 32;

/** No trainer can ever be pushed below this rating. */
export const RATING_FLOOR = 100;

/** Rating every new trainer starts at (mirrors `users.rating`'s default). */
export const STARTING_RATING = 1000;

/** Attacks a trainer may launch per UTC day. */
export const ATTACKS_PER_DAY = 10;

/** Paid to the attacker on a win, via `adjustWallet`. */
export const WIN_GOLD_REWARD = 50;
export const WIN_GEM_REWARD = 10;

/** How long a defender is hidden from the attacker's opponent list. */
export const REMATCH_COOLDOWN_MS = 60 * 60 * 1000;

export interface RatingUpdate {
  attacker: number;
  defender: number;
}

/**
 * Probability that a player rated `rating` beats a player rated `opponent`.
 * Standard logistic Elo curve with a 400-point scale.
 */
export function expectedScore(rating: number, opponent: number): number {
  return 1 / (1 + Math.pow(10, (opponent - rating) / 400));
}

/**
 * The signed rating change the attacker earns. The defender's change is the
 * exact negation, so the ladder is zero-sum before the floor is applied.
 */
export function ratingDelta(
  attacker: number,
  defender: number,
  attackerWon: boolean,
  k: number = DEFAULT_K,
): number {
  const score = attackerWon ? 1 : 0;
  return Math.round(k * (score - expectedScore(attacker, defender)));
}

/**
 * New ratings for both sides of a resolved battle.
 *
 * Zero-sum (the attacker's gain is the defender's loss) and clamped at
 * `RATING_FLOOR`, so nobody can be farmed into oblivion.
 */
export function updateRatings(
  attacker: number,
  defender: number,
  attackerWon: boolean,
  k: number = DEFAULT_K,
): RatingUpdate {
  const delta = ratingDelta(attacker, defender, attackerWon, k);

  return {
    attacker: Math.max(RATING_FLOOR, Math.round(attacker) + delta),
    defender: Math.max(RATING_FLOOR, Math.round(defender) - delta),
  };
}

export const RATING_TIERS = [
  { min: 1600, label: "Apex" },
  { min: 1400, label: "Prowler" },
  { min: 1200, label: "Hunter" },
  { min: 1000, label: "Stray" },
  { min: 0, label: "Kitten" },
] as const;

export type RatingTier = (typeof RATING_TIERS)[number]["label"];

/** Cosmetic ladder tier for a rating, used by the ladder UI. */
export function ratingTier(rating: number): RatingTier {
  for (const tier of RATING_TIERS) {
    if (rating >= tier.min) return tier.label;
  }
  return "Kitten";
}
