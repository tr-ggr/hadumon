/**
 * Sprint 04 — Async PvP & ranked ladder.
 *
 * Three tables:
 *  - `defenseTeams` — the 1–4 cats that defend a trainer while they are away.
 *  - `battles`      — an immutable record of every resolved attack, including
 *                     the full `BattleResult` log and both team snapshots so a
 *                     replay never has to re-simulate.
 *  - `attackQuota`  — one row per trainer per UTC day, capped at 10 attacks.
 */
import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import type { BattleResult, Combatant } from "~/server/game/battle";
import { createTable } from "./_table";
import { users } from "./auth";

/** Who won a PvP battle. Side "A" is always the attacker. */
export const battleWinnerEnum = pgEnum("hadumon_battle_winner", [
  "attacker",
  "defender",
]);

export const defenseTeams = createTable("defense_teams", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  creatureIds: uuid("creature_ids").array().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const battles = createTable(
  "battles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attackerId: uuid("attacker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    defenderId: uuid("defender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    winner: battleWinnerEnum("winner").notNull(),
    attackerRatingBefore: integer("attacker_rating_before").notNull(),
    attackerRatingAfter: integer("attacker_rating_after").notNull(),
    defenderRatingBefore: integer("defender_rating_before").notNull(),
    defenderRatingAfter: integer("defender_rating_after").notNull(),
    seed: text("seed").notNull(),
    /** The complete `BattleResult` — replays read this, never the engine. */
    log: jsonb("log").$type<BattleResult>().notNull(),
    attackerTeam: jsonb("attacker_team").$type<Combatant[]>().notNull(),
    defenderTeam: jsonb("defender_team").$type<Combatant[]>().notNull(),
    goldReward: integer("gold_reward").notNull().default(0),
    gemReward: integer("gem_reward").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("battles_attacker_idx").on(t.attackerId, t.createdAt),
    index("battles_defender_idx").on(t.defenderId, t.createdAt),
  ],
);

export const attackQuota = createTable(
  "attack_quota",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** UTC calendar day, `YYYY-MM-DD`. */
    day: date("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const defenseTeamsRelations = relations(defenseTeams, ({ one }) => ({
  user: one(users, { fields: [defenseTeams.userId], references: [users.id] }),
}));

export const battlesRelations = relations(battles, ({ one }) => ({
  attacker: one(users, {
    fields: [battles.attackerId],
    references: [users.id],
    relationName: "battleAttacker",
  }),
  defender: one(users, {
    fields: [battles.defenderId],
    references: [users.id],
    relationName: "battleDefender",
  }),
}));

export const attackQuotaRelations = relations(attackQuota, ({ one }) => ({
  user: one(users, { fields: [attackQuota.userId], references: [users.id] }),
}));

export type DefenseTeam = typeof defenseTeams.$inferSelect;
export type Battle = typeof battles.$inferSelect;
export type NewBattle = typeof battles.$inferInsert;
export type AttackQuotaRow = typeof attackQuota.$inferSelect;
export type BattleWinner = Battle["winner"];
