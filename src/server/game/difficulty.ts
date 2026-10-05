/**
 * Difficulty: how well every rival of a run plays. A tier gives the rival
 * nothing: no points, no cards, no food. It only moves each rival up the
 * table of levels in `bot/levels.ts`, so on a harder tier the same six
 * rivals think further ahead. Kitten is the gauntlet as it stands, and a run
 * saved before tiers existed is a Kitten run.
 */

export const DIFFICULTIES = ["kitten", "stray", "apex"] as const;
export type DifficultyId = (typeof DIFFICULTIES)[number];

/** Rivals in a run, and so levels a tier spans. */
const MATCHES = 6;
/** How many levels a rival can play at; the top tier's last rival is the best. */
export const LEVEL_COUNT = 8;

export interface Difficulty {
  id: DifficultyId;
  name: string;
  /** The exact rule, in one line. */
  text: string;
  /** 0 for the easiest; added to every rival's level. */
  rank: number;
}

function tier(id: DifficultyId, name: string, rank: number): Difficulty {
  return {
    id,
    name,
    rank,
    // Levels are printed from 1, as a player counts them.
    text: `Rivals play at levels ${rank + 1} to ${rank + MATCHES} of ${LEVEL_COUNT}. Nobody gets a head start.`,
  };
}

export const DIFFICULTY: Record<DifficultyId, Difficulty> = {
  kitten: tier("kitten", "Kitten", 0),
  stray: tier("stray", "Stray", 1),
  apex: tier("apex", "Apex", 2),
};

export const DIFFICULTY_LIST: Difficulty[] = DIFFICULTIES.map(
  (id) => DIFFICULTY[id],
);

export function isDifficulty(value: unknown): value is DifficultyId {
  return (
    typeof value === "string" &&
    (DIFFICULTIES as readonly string[]).includes(value)
  );
}

/** The tier a stored value names; anything else, or nothing, is Kitten. */
export function difficultyOf(value: unknown): Difficulty {
  return DIFFICULTY[isDifficulty(value) ? value : "kitten"];
}

/** True when `value` is `tier` or harder. */
export function isAtLeast(value: unknown, tier: DifficultyId): boolean {
  return difficultyOf(value).rank >= DIFFICULTY[tier].rank;
}

/** The level the rival at `matchIndex` plays at on a tier, 0 the least. */
export function rivalLevel(matchIndex: number, tier: unknown): number {
  return Math.min(LEVEL_COUNT - 1, matchIndex + difficultyOf(tier).rank);
}
