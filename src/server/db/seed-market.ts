/**
 * Marketplace seed (Sprint 05).
 *
 * Puts ~10 bot-owned cats up for sale at plausible prices so a fresh database
 * has something to browse and buy. Idempotent: re-running it only tops the
 * board back up to `TARGET_LISTINGS` active listings.
 *
 *   pnpm tsx --env-file=.env src/server/db/seed-market.ts
 *
 * Sprint 06 can call `seedListings(db)` from the main seed instead.
 */
import { and, count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import { createRng } from "~/server/game/rng";
import { clampPrice, RARITY_PRICE_RANGE } from "~/server/game/market";
import { getSpecies } from "~/server/game/species";
import * as schema from "./schema";
import { creatures, listings, users } from "./schema";

type SeedDb = ReturnType<typeof drizzle<typeof schema>>;

/** How many active listings the board should hold after seeding. */
export const TARGET_LISTINGS = 10;
/** No bot floods the board: at most this many of its cats are for sale. */
const MAX_PER_BOT = 3;

export interface SeedMarketResult {
  created: number;
  active: number;
}

/**
 * Lists idle cats belonging to bot trainers until the board holds
 * `TARGET_LISTINGS` active listings. Every bot keeps at least one cat.
 */
export async function seedListings(db: SeedDb): Promise<SeedMarketResult> {
  const [activeRow] = await db
    .select({ value: count() })
    .from(listings)
    .where(eq(listings.status, "active"));

  let active = activeRow?.value ?? 0;
  if (active >= TARGET_LISTINGS) {
    console.log(
      `  market already has ${active} active listings — nothing to do`,
    );
    return { created: 0, active };
  }

  const bots = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.isBot, true))
    .orderBy(users.username);

  if (bots.length === 0) {
    console.warn("  no bot trainers found — run `pnpm db:seed` first");
    return { created: 0, active };
  }

  let created = 0;

  for (const bot of bots) {
    if (active >= TARGET_LISTINGS) break;

    const roster = await db
      .select()
      .from(creatures)
      .where(and(eq(creatures.ownerId, bot.id), eq(creatures.status, "idle")))
      .orderBy(creatures.obtainedAt);

    // Always leave the bot one cat it can still fight with.
    const sellable = roster.slice(
      0,
      Math.max(0, Math.min(roster.length - 1, MAX_PER_BOT)),
    );
    if (sellable.length === 0) continue;

    const rng = createRng(`market:${bot.username}`);

    for (const creature of sellable) {
      if (active >= TARGET_LISTINGS) break;

      const species = getSpecies(creature.speciesId);
      const [min, max] = RARITY_PRICE_RANGE[species.rarity];
      const levelBonus =
        1 + 0.02 * (creature.level - 1) + 0.05 * creature.upgradeTier;
      const price = clampPrice(rng.int(min, max) * levelBonus);

      await db.transaction(async (tx) => {
        const [reserved] = await tx
          .update(creatures)
          .set({ status: "listed" })
          .where(
            and(eq(creatures.id, creature.id), eq(creatures.status, "idle")),
          )
          .returning({ id: creatures.id });

        if (!reserved) return;

        await tx
          .insert(listings)
          .values({ sellerId: bot.id, creatureId: creature.id, price });

        created += 1;
        active += 1;
      });

      console.log(
        `  ${bot.username.padEnd(14)} lists ${species.name.padEnd(13)} Lv ${String(
          creature.level,
        ).padStart(2)}  ${price.toLocaleString()}g`,
      );
    }
  }

  return { created, active };
}

async function main(): Promise<void> {
  const conn = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(conn, { schema });

  console.log("Seeding the trading post…");
  try {
    const result = await seedListings(db);
    console.log(
      `Done. ${result.created} new listing(s), ${result.active} active.`,
    );
  } finally {
    await conn.end();
  }
}

if (process.argv[1]?.includes("seed-market")) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
