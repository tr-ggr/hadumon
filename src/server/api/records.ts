import { and, desc, eq, lt, ne, or, type SQL } from "drizzle-orm";
import { z } from "zod";

import { looksOf, type PlayerCard } from "~/server/api/looks";
import type { DbOrTx } from "~/server/db";
import { users } from "~/server/db/schema/auth";
import { profiles } from "~/server/db/schema/economy";
import { achievements, runs, unlocks } from "~/server/db/schema/runs";
import { getAchievement, isAchievementKey } from "~/server/game/achievements";
import { DIFFICULTIES, type DifficultyId } from "~/server/game/difficulty";
import { toRunRecord, type RunRecord } from "~/server/game/runRecord";
import {
  UNLOCK_KINDS,
  type Unlock,
  type UnlockKind,
} from "~/server/game/unlocks";

export const ENDINGS = ["won", "lost", "abandoned"] as const;

/** Where a page of runs carries on from: the last run of the page before. */
export const runCursor = z.object({
  startedAt: z.date(),
  id: z.string().uuid(),
});
export type RunCursor = z.infer<typeof runCursor>;

export const historyInput = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  cursor: runCursor.nullish(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  outcome: z.enum(ENDINGS).optional(),
});
export type HistoryInput = z.infer<typeof historyInput>;

export interface PastRun {
  id: string;
  difficulty: DifficultyId;
  status: (typeof ENDINGS)[number];
  matchesWon: number;
  matchesPlayed: number;
  score: number;
  /** What the run paid; `null` unless the viewer played it. */
  coins: number | null;
  startedAt: Date;
  endedAt: Date | null;
}

export interface RunPage {
  runs: PastRun[];
  nextCursor: RunCursor | null;
}

/** A page of an account's finished runs, newest first. */
export async function historyOf(
  db: DbOrTx,
  userId: string,
  input: HistoryInput,
  owner: boolean,
): Promise<RunPage> {
  const where: (SQL | undefined)[] = [
    eq(runs.userId, userId),
    ne(runs.status, "active"),
  ];
  if (input.difficulty) where.push(eq(runs.difficulty, input.difficulty));
  if (input.outcome) where.push(eq(runs.status, input.outcome));
  if (input.cursor) {
    where.push(
      or(
        lt(runs.startedAt, input.cursor.startedAt),
        and(
          eq(runs.startedAt, input.cursor.startedAt),
          lt(runs.id, input.cursor.id),
        ),
      ),
    );
  }
  const rows = await db
    .select({
      id: runs.id,
      difficulty: runs.difficulty,
      status: runs.status,
      matchesWon: runs.matchesWon,
      matchesPlayed: runs.matchesPlayed,
      score: runs.score,
      coins: runs.coins,
      startedAt: runs.startedAt,
      endedAt: runs.endedAt,
    })
    .from(runs)
    .where(and(...where))
    .orderBy(desc(runs.startedAt), desc(runs.id))
    .limit(input.limit + 1);
  const page = rows.slice(0, input.limit).map((row): PastRun => ({
    ...row,
    difficulty: row.difficulty as DifficultyId,
    status: row.status === "active" ? "abandoned" : row.status,
    coins: owner ? row.coins : null,
  }));
  const last = page[page.length - 1];
  return {
    runs: page,
    nextCursor:
      rows.length > input.limit && last
        ? { startedAt: last.startedAt, id: last.id }
        : null,
  };
}

/** A run's record with whose it was. */
export interface RunRecordPage extends RunRecord {
  player: PlayerCard;
  /** True when the viewer played it. */
  isOwner: boolean;
}

function isUnlockKind(value: string): value is UnlockKind {
  return (UNLOCK_KINDS as readonly string[]).includes(value);
}

/**
 * A finished run's record, for `viewerId` (or a signed-out visitor), or
 * `null` when there is no such run or the viewer may not see it: a run in
 * play, or one of an account that keeps its runs to itself. The two read
 * the same, so a private run's existence does not show.
 */
export async function recordOf(
  db: DbOrTx,
  runId: string,
  viewerId: string | null,
): Promise<RunRecordPage | null> {
  const [row] = await db
    .select({
      id: runs.id,
      userId: runs.userId,
      handle: profiles.handle,
      name: users.name,
      look: profiles.look,
      runsPublic: profiles.runsPublic,
      status: runs.status,
      difficulty: runs.difficulty,
      score: runs.score,
      matchesWon: runs.matchesWon,
      coins: runs.coins,
      startedAt: runs.startedAt,
      endedAt: runs.endedAt,
      state: runs.state,
    })
    .from(runs)
    .innerJoin(users, eq(users.id, runs.userId))
    .leftJoin(profiles, eq(profiles.userId, runs.userId))
    .where(eq(runs.id, runId))
    .limit(1);
  if (!row || row.status === "active") return null;
  const owner = row.userId === viewerId;
  if (!owner && row.runsPublic === false) return null;

  const [unlockRows, achievementRows, looks] = await Promise.all([
    db
      .select({ kind: unlocks.kind, key: unlocks.key })
      .from(unlocks)
      .where(eq(unlocks.runId, row.id)),
    db
      .select({ key: achievements.key })
      .from(achievements)
      .where(eq(achievements.runId, row.id)),
    looksOf(db, [row]),
  ]);
  const prizes = {
    unlocks: unlockRows.flatMap(({ kind, key }): Unlock[] =>
      isUnlockKind(kind) ? [{ kind, key }] : [],
    ),
    achievements: achievementRows
      .filter((a) => isAchievementKey(a.key))
      .map((a) => getAchievement(a.key)),
  };
  return {
    ...toRunRecord(row, prizes, owner),
    player: {
      handle: row.handle ?? "",
      name: row.name,
      look: looks.get(row.userId)!,
    },
    isOwner: owner,
  };
}
