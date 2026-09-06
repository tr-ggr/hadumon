import { relations } from "drizzle-orm";
import {
  bigserial,
  boolean,
  index,
  integer,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createTable } from "./_table";
import { users } from "./auth";
import { creatures, rarityEnum } from "./creatures";

/**
 * One row per summoned cat — the player-facing pull history.
 *
 * `creatureId` is nullable and set to `null` when the creature leaves the
 * account (sold, traded away), so history survives its subject.
 */
export const pulls = createTable(
  "pulls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Monotonic insertion order — every row of one batch shares `createdAt`. */
    seq: bigserial("seq", { mode: "number" }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bannerId: text("banner_id").notNull(),
    speciesId: text("species_id").notNull(),
    rarity: rarityEnum("rarity").notNull(),
    wasPity: boolean("was_pity").notNull().default(false),
    creatureId: uuid("creature_id").references(() => creatures.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("pulls_user_seq_idx").on(t.userId, t.seq),
    index("pulls_user_banner_idx").on(t.userId, t.bannerId),
  ],
);

/**
 * Per-user, per-banner pity counter: how many pulls in a row have missed
 * epic+. Reset to 0 on a natural or forced epic+.
 */
export const pityCounters = createTable(
  "pity_counters",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bannerId: text("banner_id").notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.bannerId] })],
);

export const pullsRelations = relations(pulls, ({ one }) => ({
  user: one(users, { fields: [pulls.userId], references: [users.id] }),
  creature: one(creatures, { fields: [pulls.creatureId], references: [creatures.id] }),
}));

export const pityCountersRelations = relations(pityCounters, ({ one }) => ({
  user: one(users, { fields: [pityCounters.userId], references: [users.id] }),
}));

export type Pull = typeof pulls.$inferSelect;
export type NewPull = typeof pulls.$inferInsert;
export type PityCounter = typeof pityCounters.$inferSelect;
