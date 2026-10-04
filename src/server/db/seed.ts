/**
 * Idempotent development seed: the `demo` account and nothing else.
 *
 *   pnpm db:seed
 *
 * Re-running it leaves an existing demo account untouched.
 */
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import { env } from "~/env";
import { hashPassword } from "~/server/auth/password";
import { isEntryPoint } from "./entry-point";
import * as schema from "./schema";
import { users } from "./schema";

export const DEMO_USERNAME = "demo";
export const DEMO_PASSWORD = "demo1234";

type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Creates the demo account if it is missing. Returns true when it was created. */
export async function seed(db: Db): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, DEMO_USERNAME))
    .limit(1);

  if (existing) return false;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db
    .insert(users)
    .values({ username: DEMO_USERNAME, displayName: "Demo", passwordHash });
  return true;
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
    console.log(`Done. Log in as ${DEMO_USERNAME} / ${DEMO_PASSWORD}.`);
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
