/**
 * The numbers a profile shows, from an account's career. Win rates are
 * `null` until there is something to divide by, so a new account reads as
 * "no runs yet" rather than as 0%.
 */

import type { DifficultyId } from "./difficulty";
import type { CareerStats } from "./achievements";

/** Finished runs an account needs before its run win rate is ranked. */
export const RANKED_RUNS = 5;

export const LEADERBOARDS = ["runsWon", "bestRun", "winRate"] as const;
export type Leaderboard = (typeof LEADERBOARDS)[number];

export const LEADERBOARD_LABELS: Record<Leaderboard, string> = {
  runsWon: "Runs won",
  bestRun: "Best run",
  winRate: "Win rate",
};

export interface PlayerStats {
  runsFinished: number;
  runsWon: number;
  /** Runs won over runs finished, 0 to 1; `null` before the first. */
  runWinRate: number | null;
  matchesWon: number;
  matchesPlayed: number;
  /** Matches won over matches finished, 0 to 1; `null` before the first. */
  matchWinRate: number | null;
  bestMatch: number;
  bestRun: number;
  runsWonOn: Record<DifficultyId, number>;
}

export function rate(won: number, played: number): number | null {
  if (!(played > 0)) return null;
  return Math.min(1, Math.max(0, won / played));
}

/** A rate as a whole percentage, or a dash when there is none. */
export function percent(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

export function playerStats(career: CareerStats): PlayerStats {
  return {
    runsFinished: career.runsFinished,
    runsWon: career.runsWon,
    runWinRate: rate(career.runsWon, career.runsFinished),
    matchesWon: career.matchesWon,
    matchesPlayed: career.matchesPlayed,
    matchWinRate: rate(career.matchesWon, career.matchesPlayed),
    bestMatch: career.bestMatch,
    bestRun: career.bestRun,
    runsWonOn: { ...career.runsWonOn },
  };
}
