/**
 * Idempotent development seed: the demo account and nothing else.
 *
 *   pnpm db:seed
 *
 * Re-running it leaves an existing demo account untouched.
 */
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "~/env";
import { DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from "~/lib/auth/constants";
import { hashPassword } from "~/server/auth/password";
import { isEntryPoint } from "./entry-point";
import * as schema from "./schema";
import { accounts, users } from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Creates the demo account if it is missing. Returns true when it was created.
 *
 * Writes the two rows Better Auth would: the player, and the `credential`
 * account that holds the password hash and is named after the player's id.
 */
export async function seed(db: Db): Promise<boolean> {
  const password = await hashPassword(DEMO_PASSWORD);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_EMAIL))
      .limit(1);

    if (existing) return false;

    const [user] = await tx
      .insert(users)
      .values({ name: DEMO_NAME, email: DEMO_EMAIL })
      .returning({ id: users.id });
    if (!user) throw new Error("The demo account was not created");

    await tx.insert(accounts).values({
      userId: user.id,
      accountId: user.id,
      providerId: "credential",
      password,
    });
    return true;
  });
}

async function main(): Promise<void> {
  // Prefer Neon's direct connection when the integration provides one, so
  // this single long-lived connection does not sit on the pooler.
  const conn = postgres(process.env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL, {
    max: 1,
  });
  const db = drizzle(conn, { schema });

  console.log("Seeding HaduMon…");
  try {
    const created = await seed(db);
    console.log(
      created ? "  demo account created." : "  demo account already exists.",
    );
    console.log(`Done. Sign in as ${DEMO_EMAIL} / ${DEMO_PASSWORD}.`);
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
