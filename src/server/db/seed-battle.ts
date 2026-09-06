/**
 * Sprint 04 seed — gives every bot trainer a defense team so the ladder has
 * something to punch on a fresh database.
 *
 * Standalone:
 *   pnpm tsx --env-file=.env src/server/db/seed-battle.ts
 *
 * Sprint 06 can instead call `seedDefenseTeams(db)` from the main seed after
 * `seed(db)` has created the bots and their rosters.
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import { isEntryPoint } from "./entry-point";
import type { DbOrTx } from "~/server/db";
import { users } from "./schema/auth";
import { defenseTeams } from "./schema/battle";
import { creatures } from "./schema/creatures";
import * as schema from "./schema";
import { MAX_TEAM_SIZE } from "~/server/game/rating";
import { getSpecies } from "~/server/game/species";
import { creaturePower, effectiveStats } from "~/server/game/stats";

export interface SeededDefenseTeam {
  username: string;
  creatureIds: string[];
  power: number;
}

/**
 * Idempotent: each bot's defense team is recomputed from its current roster
 * (strongest cats first), so re-running after new cats are seeded just keeps
 * the team up to date. Bots with no cats are skipped.
 */
export async function seedDefenseTeams(
  db: DbOrTx,
): Promise<SeededDefenseTeam[]> {
  const bots = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.isBot, true));

  const seeded: SeededDefenseTeam[] = [];

  for (const bot of bots) {
    const roster = await db
      .select({
        id: creatures.id,
        speciesId: creatures.speciesId,
        level: creatures.level,
        upgradeTier: creatures.upgradeTier,
      })
      .from(creatures)
      .where(eq(creatures.ownerId, bot.id));

    if (roster.length === 0) continue;

    const ranked = roster
      .map((row) => ({
        id: row.id,
        power: creaturePower(
          effectiveStats(getSpecies(row.speciesId), row.level, row.upgradeTier),
        ),
      }))
      .sort((a, b) => b.power - a.power || a.id.localeCompare(b.id))
      .slice(0, MAX_TEAM_SIZE);

    const creatureIds = ranked.map((entry) => entry.id);

    await db
      .insert(defenseTeams)
      .values({ userId: bot.id, creatureIds })
      .onConflictDoUpdate({
        target: defenseTeams.userId,
        set: { creatureIds, updatedAt: new Date() },
      });

    seeded.push({
      username: bot.username,
      creatureIds,
      power: ranked.reduce((total, entry) => total + entry.power, 0),
    });
  }

  return seeded;
}

async function main(): Promise<void> {
  const conn = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(conn, { schema });

  console.log("Seeding bot defense teams…");
  try {
    const seeded = await seedDefenseTeams(db);
    for (const team of seeded) {
      console.log(
        `  ${team.username.padEnd(14)} ${team.creatureIds.length} cats  ${team.power} PWR`,
      );
    }
    console.log(`Done. ${seeded.length} defense team(s) ready.`);
  } finally {
    await conn.end();
  }
}

if (isEntryPoint(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
