import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { RunState } from "~/server/game/run";
import { createTable } from "./_table";
import { users } from "./auth";

/** Lifecycle of a run. Only `active` runs can be played. */
export const runStatusEnum = pgEnum("hadumon_run_status", [
  "active",
  "won",
  "lost",
  "abandoned",
]);

/**
 * One gauntlet attempt. `state` is the whole engine state; `version` is
 * bumped on every write so a stale client action is rejected instead of
 * applied twice.
 */
export const runs = createTable(
  "runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: runStatusEnum("status").notNull().default("active"),
    clanId: text("clan_id").notNull(),
    /** A `DifficultyId`. Runs from before tiers existed are Kitten runs. */
    difficulty: text("difficulty").notNull().default("kitten"),
    seed: text("seed").notNull(),
    version: integer("version").notNull().default(0),
    state: jsonb("state").$type<RunState>().notNull(),
    matchesWon: integer("matches_won").notNull().default(0),
    score: integer("score").notNull().default(0),
    /** What the run paid when it ended; 0 while it is being played. */
    coins: integer("coins").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    index("runs_user_started_idx").on(t.userId, t.startedAt),
    // Hard guarantee: an account can never have two active runs.
    uniqueIndex("runs_one_active_per_user")
      .on(t.userId)
      .where(sql`${t.status} = 'active'`),
  ],
);

/**
 * What an account keeps between runs. `kind` is `cat`, `relic` or `clan`;
 * `key` is that thing's id in the game catalogue.
 */
export const unlocks = createTable(
  "unlocks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind, t.key] })],
);

export const runsRelations = relations(runs, ({ one }) => ({
  user: one(users, { fields: [runs.userId], references: [users.id] }),
}));

export const unlocksRelations = relations(unlocks, ({ one }) => ({
  user: one(users, { fields: [unlocks.userId], references: [users.id] }),
}));

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type RunStatus = Run["status"];
export type Unlock = typeof unlocks.$inferSelect;
