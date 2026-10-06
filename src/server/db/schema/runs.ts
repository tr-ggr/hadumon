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

import type { RunState, RunSummary } from "~/server/game/run";
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
    /** A `DifficultyId`. Runs from before tiers existed are Kitten runs. */
    difficulty: text("difficulty").notNull().default("kitten"),
    seed: text("seed").notNull(),
    version: integer("version").notNull().default(0),
    state: jsonb("state").$type<RunState>().notNull(),
    matchesWon: integer("matches_won").notNull().default(0),
    score: integer("score").notNull().default(0),
    /** What the run's matches have paid so far. */
    coins: integer("coins").notNull().default(0),
    /** Matches finished, the lost one included. */
    matchesPlayed: integer("matches_played").notNull().default(0),
    /** The best score of a single match. */
    bestMatch: integer("best_match").notNull().default(0),
    /**
     * What the run came to, written when it ends, for profiles and
     * achievements to read without the whole state. `null` on a run that
     * ended before it was kept.
     */
    summary: jsonb("summary").$type<RunSummary>(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    index("runs_user_started_idx").on(t.userId, t.startedAt),
    index("runs_status_ended_idx").on(t.status, t.endedAt),
    // Hard guarantee: an account can never have two active runs.
    uniqueIndex("runs_one_active_per_user")
      .on(t.userId)
      .where(sql`${t.status} = 'active'`),
  ],
);

/**
 * The prizes an account has been paid for what its runs did, each once.
 * `kind` is `cat` or `relic`; `key` is that thing's id in the game
 * catalogue. A relic here is unlocked; a cat here has had its one copy
 * given (`cards` holds the copy itself).
 */
export const unlocks = createTable(
  "unlocks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    /** The run that earned it, while that run is kept. */
    runId: uuid("run_id").references(() => runs.id, { onDelete: "set null" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.kind, t.key] }),
    index("unlocks_run_idx").on(t.runId),
  ],
);

/**
 * The achievements an account has been paid for (`game/achievements.ts`),
 * each once, with what it paid and the run that earned it, if a run did.
 */
export const achievements = createTable(
  "achievements",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    runId: uuid("run_id").references(() => runs.id, { onDelete: "set null" }),
    coins: integer("coins").notNull().default(0),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.key] }),
    index("achievements_run_idx").on(t.runId),
  ],
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
export type AchievementRow = typeof achievements.$inferSelect;
