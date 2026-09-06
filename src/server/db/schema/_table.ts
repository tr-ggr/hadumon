import { pgTableCreator } from "drizzle-orm/pg-core";

/**
 * Multi-project schema helper: every HaduMon table is prefixed with `hadumon_`.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `hadumon_${name}`);
