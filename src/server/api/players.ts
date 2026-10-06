import { eq } from "drizzle-orm";

import { careerFor, heldAchievements } from "~/server/api/achievements";
import { looksOf } from "~/server/api/looks";
import { historyOf, type PastRun } from "~/server/api/records";
import type { DbOrTx } from "~/server/db";
import { users } from "~/server/db/schema/auth";
import { profiles } from "~/server/db/schema/economy";
import { lookOf, type Look } from "~/server/game/cosmetics";
import { playerStats, type PlayerStats } from "~/server/game/stats";

export type { PlayerCard } from "~/server/api/looks";

/** One achievement an account holds, by its key in the catalogue. */
export interface HeldAchievement {
  key: string;
  earnedAt: Date;
}

export interface PlayerProfile {
  handle: string;
  name: string;
  look: Look;
  joinedAt: Date;
  /** True when the viewer is this player. */
  isSelf: boolean;
  /** Whether the player shows their runs to other players. */
  runsPublic: boolean;
  stats: PlayerStats;
  achievements: HeldAchievement[];
  /** The latest runs, or `null` when the viewer may not see them. */
  recentRuns: PastRun[] | null;
}

/** Runs a profile lists before "See all runs". */
export const RECENT_RUNS = 5;

/** The account a handle belongs to, or `null`. */
export async function playerByHandle(
  db: DbOrTx,
  handle: string,
): Promise<{
  userId: string;
  handle: string;
  name: string;
  look: unknown;
  runsPublic: boolean;
  joinedAt: Date;
} | null> {
  const [row] = await db
    .select({
      userId: profiles.userId,
      handle: profiles.handle,
      name: users.name,
      look: profiles.look,
      runsPublic: profiles.runsPublic,
      joinedAt: users.createdAt,
    })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(eq(profiles.handle, handle.toLowerCase()))
    .limit(1);
  if (!row?.handle) return null;
  return { ...row, handle: row.handle };
}

/** A player's profile as `viewerId` (or a signed-out visitor) sees it. */
export async function playerProfile(
  db: DbOrTx,
  handle: string,
  viewerId: string | null,
): Promise<PlayerProfile | null> {
  const player = await playerByHandle(db, handle);
  if (!player) return null;
  const isSelf = player.userId === viewerId;
  const showRuns = isSelf || player.runsPublic;
  const [looks, career, held, recent] = await Promise.all([
    looksOf(db, [player]),
    careerFor(db, player.userId),
    heldAchievements(db, player.userId),
    showRuns
      ? historyOf(db, player.userId, { limit: RECENT_RUNS }, isSelf)
      : null,
  ]);
  return {
    handle: player.handle,
    name: player.name,
    look: looks.get(player.userId) ?? lookOf(null, []),
    joinedAt: player.joinedAt,
    isSelf,
    runsPublic: player.runsPublic,
    stats: playerStats(career),
    achievements: held,
    recentRuns: recent?.runs ?? null,
  };
}
