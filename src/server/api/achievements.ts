import { and, count, eq, ne } from "drizzle-orm";

import {
  addCoins,
  gainedCosmetics,
  lockProfile,
  ownedBy,
} from "~/server/api/economy";
import type { DbOrTx, Transaction } from "~/server/db";
import { packOpens } from "~/server/db/schema/economy";
import { achievements, runs } from "~/server/db/schema/runs";
import {
  careerOf,
  earnedAchievements,
  isAchievementKey,
  type Achievement,
  type CareerRun,
  type CareerStats,
} from "~/server/game/achievements";
import { ownedIds } from "~/server/game/collection";
import { difficultyOf } from "~/server/game/difficulty";
import { deckElements, type RunSummary } from "~/server/game/run";

const NO_ELEMENTS = deckElements([]);

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/**
 * What one finished run adds to a career: its stored summary where it has
 * one, and otherwise what its columns hold, which is all a run that ended
 * before summaries were kept can say.
 */
export function careerRun(row: {
  status: string;
  difficulty: string;
  matchesWon: number;
  matchesPlayed: number;
  bestMatch: number;
  score: number;
  summary: Partial<RunSummary> | null;
}): CareerRun {
  const s = row.summary ?? {};
  return {
    difficulty: difficultyOf(row.difficulty).id,
    won: row.status === "won",
    matchesWon: num(s.matchesWon, row.matchesWon),
    matchesPlayed: num(s.matchesPlayed, row.matchesPlayed),
    bestMatchScore: num(s.bestMatchScore, row.bestMatch),
    totalScore: num(s.totalScore, row.score),
    deckElements: { ...NO_ELEMENTS, ...(s.deckElements ?? {}) },
    goalsSwept: num(s.goalsSwept, 0),
    reclaimed: num(s.reclaimed, 0),
  };
}

/** Everything an account has done, for its profile and its achievements. */
export async function careerFor(
  db: DbOrTx,
  userId: string,
): Promise<CareerStats> {
  const [rows, owned, gained, [packs]] = await Promise.all([
    db
      .select({
        status: runs.status,
        difficulty: runs.difficulty,
        matchesWon: runs.matchesWon,
        matchesPlayed: runs.matchesPlayed,
        bestMatch: runs.bestMatch,
        score: runs.score,
        summary: runs.summary,
      })
      .from(runs)
      .where(and(eq(runs.userId, userId), ne(runs.status, "active"))),
    ownedBy(db, userId),
    gainedCosmetics(db, userId),
    db
      .select({ n: count() })
      .from(packOpens)
      .where(eq(packOpens.userId, userId)),
  ]);
  return careerOf(rows.map(careerRun), {
    catsOwned: ownedIds(owned).length,
    packsOpened: packs?.n ?? 0,
    cosmeticsOwned: gained.length,
  });
}

/** The achievements an account has been paid for, and when. */
export async function heldAchievements(
  db: DbOrTx,
  userId: string,
): Promise<{ key: string; earnedAt: Date }[]> {
  const rows = await db
    .select({ key: achievements.key, earnedAt: achievements.earnedAt })
    .from(achievements)
    .where(eq(achievements.userId, userId));
  return rows.filter((row) => isAchievementKey(row.key));
}

/**
 * Pays every achievement the account's career now holds and it has not been
 * paid for, in the caller's transaction, and returns them. `runId` is the
 * run that just ended, if one did. Takes the profile lock: a caller that
 * holds a run row has locked it already.
 */
export async function grantAchievements(
  tx: Transaction,
  userId: string,
  runId: string | null,
): Promise<Achievement[]> {
  await lockProfile(tx, userId);
  const [career, held] = await Promise.all([
    careerFor(tx, userId),
    heldAchievements(tx, userId),
  ]);
  const earned = earnedAchievements(
    career,
    held.map((row) => row.key),
  );
  if (earned.length === 0) return earned;
  const inserted = await tx
    .insert(achievements)
    .values(earned.map((a) => ({ userId, key: a.key, runId, coins: a.coins })))
    .onConflictDoNothing()
    .returning({ key: achievements.key });
  const paid = new Set(inserted.map((row) => row.key));
  const fresh = earned.filter((a) => paid.has(a.key));
  const coins = fresh.reduce((sum, a) => sum + a.coins, 0);
  if (coins > 0) await addCoins(tx, userId, coins);
  return fresh;
}
