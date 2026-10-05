/**
 * Difficulty: how far ahead every rival of a run starts. A tier is a handful
 * of mods laid over the run's relics, so it bends the rules the same way a
 * relic does and nothing else in the engine knows it is there. Kitten is the
 * game with no tier at all, and a run saved before tiers existed is a Kitten
 * run.
 */

import type { Mods } from "./relics";

export const DIFFICULTIES = ["kitten", "stray", "apex"] as const;
export type DifficultyId = (typeof DIFFICULTIES)[number];

export interface Difficulty {
  id: DifficultyId;
  name: string;
  /** The exact rule, in one line. */
  text: string;
  mods: Partial<Mods>;
  /** 0 for the easiest; a harder tier ranks higher. */
  rank: number;
}

function headStart(
  id: DifficultyId,
  name: string,
  rank: number,
  yarn: number,
): Difficulty {
  return {
    id,
    name,
    rank,
    text:
      yarn === 0
        ? "No head start. Every rival begins at 0."
        : `Every rival starts ${yarn} points ahead, as ${yarn} yarn.`,
    mods: yarn === 0 ? {} : { rivalStartYarn: yarn },
  };
}

export const DIFFICULTY: Record<DifficultyId, Difficulty> = {
  kitten: headStart("kitten", "Kitten", 0, 0),
  stray: headStart("stray", "Stray", 1, 2),
  apex: headStart("apex", "Apex", 2, 4),
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
