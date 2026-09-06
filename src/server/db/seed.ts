/**
 * Idempotent development seed.
 *
 * Creates five bot trainers (counterparties for the Sprint 04 ladder and the
 * Sprint 05 marketplace) plus a demo human account. Re-running it tops each
 * account back up to its target roster instead of duplicating anything.
 *
 *   pnpm db:seed
 *
 * Sprint 04/05 add their own seeds (`seed-battle.ts`, `seed-market.ts`) that
 * look these same bots up by username.
 */
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "~/env";
import { hashPassword } from "~/server/auth/password";
import { ELEMENTS } from "~/server/game/elements";
import { createRng } from "~/server/game/rng";
import { SPECIES_LIST, STARTER_SPECIES_IDS, type Rarity } from "~/server/game/species";
import * as schema from "./schema";
import { creatures, materials, users, type NewCreature } from "./schema";

export const BOT_USERNAMES = [
  "whiskerbot_1",
  "whiskerbot_2",
  "whiskerbot_3",
  "whiskerbot_4",
  "whiskerbot_5",
] as const;

export const BOT_PASSWORD = "botpass123";
export const DEMO_USERNAME = "demo";
export const DEMO_PASSWORD = "demo1234";

/** Rarity mix bots and the demo roster draw from. */
const ROSTER_RARITIES: Rarity[] = [
  "common",
  "common",
  "common",
  "uncommon",
  "uncommon",
  "rare",
  "rare",
  "epic",
  "legendary",
];

interface SeedAccount {
  username: string;
  displayName: string;
  password: string;
  isBot: boolean;
  rating: number;
  gold: number;
  gems: number;
  creatureCount: number;
  levelRange: [number, number];
}

type Db = ReturnType<typeof drizzle<typeof schema>>;

async function ensureAccount(db: Db, account: SeedAccount): Promise<string> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, account.username))
    .limit(1);

  if (existing) return existing.id;

  const passwordHash = await hashPassword(account.password);
  const [created] = await db
    .insert(users)
    .values({
      username: account.username,
      displayName: account.displayName,
      passwordHash,
      isBot: account.isBot,
      rating: account.rating,
      gold: account.gold,
      gems: account.gems,
    })
    .returning({ id: users.id });

  if (!created) throw new Error(`Failed to create ${account.username}`);
  return created.id;
}

async function ensureRoster(db: Db, account: SeedAccount, userId: string): Promise<number> {
  const owned = await db
    .select({ id: creatures.id })
    .from(creatures)
    .where(eq(creatures.ownerId, userId));

  const missing = account.creatureCount - owned.length;
  if (missing <= 0) return 0;

  const rng = createRng(`seed:${account.username}`);
  const rows: NewCreature[] = Array.from({ length: missing }, (_, index) => {
    const rarity = rng.pick(ROSTER_RARITIES);
    const pool = SPECIES_LIST.filter((s) => s.rarity === rarity);
    const species = rng.pick(pool.length > 0 ? pool : SPECIES_LIST);
    const level = rng.int(account.levelRange[0], account.levelRange[1]);

    return {
      ownerId: userId,
      speciesId: species.id,
      level,
      xp: rng.int(0, 40),
      upgradeTier: rng.int(0, 2),
      obtainedVia: index === 0 ? "starter" : "gacha",
    };
  });

  await db.insert(creatures).values(rows);
  return rows.length;
}

async function ensureMaterials(db: Db, userId: string, amount: number): Promise<void> {
  await db
    .insert(materials)
    .values(ELEMENTS.map((element) => ({ userId, element, amount })))
    .onConflictDoNothing();
}

function buildAccounts(): SeedAccount[] {
  const rng = createRng("hadumon-bot-ratings");

  const bots: SeedAccount[] = BOT_USERNAMES.map((username, index) => ({
    username,
    displayName: `Whiskerbot ${index + 1}`,
    password: BOT_PASSWORD,
    isBot: true,
    rating: rng.int(900, 1300),
    gold: rng.int(500, 4000),
    gems: rng.int(0, 800),
    creatureCount: rng.int(4, 6),
    levelRange: [5, 25],
  }));

  return [
    ...bots,
    {
      username: DEMO_USERNAME,
      displayName: "Demo",
      password: DEMO_PASSWORD,
      isBot: false,
      rating: 1000,
      gold: 5000,
      gems: 2000,
      creatureCount: 8,
      levelRange: [3, 20],
    },
  ];
}

export async function seed(db: Db): Promise<void> {
  const accounts = buildAccounts();

  for (const account of accounts) {
    const userId = await ensureAccount(db, account);
    const added = await ensureRoster(db, account, userId);
    await ensureMaterials(db, userId, account.isBot ? 5 : 20);
    console.log(
      `  ${account.username.padEnd(14)} rating ${String(account.rating).padStart(4)}  +${added} creatures`,
    );
  }

  // The demo account always keeps the three canonical starters on hand.
  const [demo] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, DEMO_USERNAME))
    .limit(1);

  if (demo) {
    const owned = await db
      .select({ speciesId: creatures.speciesId })
      .from(creatures)
      .where(eq(creatures.ownerId, demo.id));
    const ownedIds = new Set(owned.map((c) => c.speciesId));
    const missing = STARTER_SPECIES_IDS.filter((id) => !ownedIds.has(id));

    if (missing.length > 0) {
      await db.insert(creatures).values(
        missing.map((speciesId) => ({
          ownerId: demo.id,
          speciesId,
          level: 5,
          obtainedVia: "starter" as const,
        })),
      );
      console.log(`  demo received starters: ${missing.join(", ")}`);
    }
  }
}

async function main(): Promise<void> {
  const conn = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(conn, { schema });

  console.log("Seeding HaduMon…");
  try {
    await seed(db);
    console.log("Done. Log in as demo / demo1234.");
  } finally {
    await conn.end();
  }
}

const invokedDirectly = process.argv[1]?.includes("seed");
if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
