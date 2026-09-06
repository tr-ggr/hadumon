import { type Config } from "drizzle-kit";

import { env } from "~/env";

export default {
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations are DDL; on Neon run them over the direct (unpooled)
    // connection when the integration provides one.
    url: process.env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL,
  },
  tablesFilter: ["hadumon_*"],
} satisfies Config;
