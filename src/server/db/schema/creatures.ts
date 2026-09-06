import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createTable } from "./_table";
import { users } from "./auth";

/* -------------------------------------------------------------------------- */
/* Shared enums — every sprint imports these from here.                        */
/* -------------------------------------------------------------------------- */

export const elementEnum = pgEnum("hadumon_element", [
  "flame",
  "mist",
  "volt",
  "thorn",
  "shade",
]);

export const rarityEnum = pgEnum("hadumon_rarity", [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
]);

export const creatureStatusEnum = pgEnum("hadumon_creature_status", [
  "idle",
  "expedition",
  "listed",
  "trading",
]);

/** How a creature entered a player's collection. */
export type ObtainedVia = "starter" | "gacha" | "trade" | "market";

/* -------------------------------------------------------------------------- */
/* Tables                                                                      */
/* -------------------------------------------------------------------------- */

export const creatures = createTable(
  "creatures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    speciesId: text("species_id").notNull(),
    nickname: text("nickname"),
    level: integer("level").notNull().default(1),
    xp: integer("xp").notNull().default(0),
    upgradeTier: integer("upgrade_tier").notNull().default(0),
    status: creatureStatusEnum("status").notNull().default("idle"),
    obtainedAt: timestamp("obtained_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    obtainedVia: text("obtained_via")
      .$type<ObtainedVia>()
      .notNull()
      .default("starter"),
  },
  (t) => [
    index("creatures_owner_id_idx").on(t.ownerId),
    index("creatures_owner_status_idx").on(t.ownerId, t.status),
  ],
);

/** Per-element upgrade materials (`flameShard`, `mistShard`, …). */
export const materials = createTable(
  "materials",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    element: elementEnum("element").notNull(),
    amount: integer("amount").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.element] })],
);

export const creaturesRelations = relations(creatures, ({ one }) => ({
  owner: one(users, { fields: [creatures.ownerId], references: [users.id] }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  user: one(users, { fields: [materials.userId], references: [users.id] }),
}));

export type Creature = typeof creatures.$inferSelect;
export type NewCreature = typeof creatures.$inferInsert;
export type MaterialRow = typeof materials.$inferSelect;
export type CreatureStatus = Creature["status"];
