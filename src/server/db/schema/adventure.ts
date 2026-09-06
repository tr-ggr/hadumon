import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { BattleEvent } from "~/server/game/battle";
import { createTable } from "./_table";
import { users } from "./auth";
import { creatures } from "./creatures";

/** Lifecycle of an idle expedition. */
export const expeditionStatusEnum = pgEnum("hadumon_expedition_status", [
  "active",
  "completed",
  "retreated",
]);

/**
 * One squad sent to one zone. At most one row per user may be `active`;
 * `lastClaimedAt` is the watermark idle rewards are computed from — `claim`
 * advances it by the seconds it actually consumed so partial minutes carry
 * over to the next claim.
 */
export const expeditions = createTable(
  "expeditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    zoneId: text("zone_id").notNull(),
    status: expeditionStatusEnum("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    lastClaimedAt: timestamp("last_claimed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    winCount: integer("win_count").notNull().default(0),
    lossCount: integer("loss_count").notNull().default(0),
    lastBattleLog: jsonb("last_battle_log").$type<ExpeditionBattleLog>(),
    totalGold: integer("total_gold").notNull().default(0),
    totalXp: integer("total_xp").notNull().default(0),
  },
  (t) => [
    index("expeditions_user_id_idx").on(t.userId),
    index("expeditions_user_status_idx").on(t.userId, t.status),
  ],
);

/** The stored "latest fight" replay — a single battle, not the whole session. */
export interface ExpeditionBattleLog {
  encounterIndex: number;
  won: boolean;
  rounds: number;
  squad: { id: string; name: string; speciesId: string }[];
  enemies: { id: string; name: string; speciesId: string; level: number }[];
  events: BattleEvent[];
}

/** Squad membership, slots 0–3. */
export const expeditionMembers = createTable(
  "expedition_members",
  {
    expeditionId: uuid("expedition_id")
      .notNull()
      .references(() => expeditions.id, { onDelete: "cascade" }),
    creatureId: uuid("creature_id")
      .notNull()
      .references(() => creatures.id, { onDelete: "cascade" }),
    slot: integer("slot").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.expeditionId, t.creatureId] }),
    index("expedition_members_creature_idx").on(t.creatureId),
  ],
);

/** Wins per zone — drives zone unlocks (20 wins unlocks the next zone). */
export const zoneProgress = createTable(
  "zone_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    zoneId: text("zone_id").notNull(),
    wins: integer("wins").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.zoneId] })],
);

export const expeditionsRelations = relations(expeditions, ({ one, many }) => ({
  user: one(users, { fields: [expeditions.userId], references: [users.id] }),
  members: many(expeditionMembers),
}));

export const expeditionMembersRelations = relations(expeditionMembers, ({ one }) => ({
  expedition: one(expeditions, {
    fields: [expeditionMembers.expeditionId],
    references: [expeditions.id],
  }),
  creature: one(creatures, {
    fields: [expeditionMembers.creatureId],
    references: [creatures.id],
  }),
}));

export const zoneProgressRelations = relations(zoneProgress, ({ one }) => ({
  user: one(users, { fields: [zoneProgress.userId], references: [users.id] }),
}));

export type Expedition = typeof expeditions.$inferSelect;
export type NewExpedition = typeof expeditions.$inferInsert;
export type ExpeditionStatus = Expedition["status"];
export type ExpeditionMember = typeof expeditionMembers.$inferSelect;
export type ZoneProgressRow = typeof zoneProgress.$inferSelect;
