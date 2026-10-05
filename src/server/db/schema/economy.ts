import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { PackResult } from "~/server/game/packs";
import { createTable } from "./_table";
import { users } from "./auth";

/**
 * What an account has besides its login: its coins, the look its hadu and
 * table wear, and the ticket its next run's chest and theft are drawn from.
 * It is a table of its own because `users` belongs to Better Auth. A row is
 * made the first time an account needs one.
 */
export const profiles = createTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    coins: integer("coins").notNull().default(0),
    /** The cosmetic worn in each slot; a slot left out wears its free piece. */
    look: jsonb("look").$type<Record<string, string>>().notNull().default({}),
    /** Goes up by one whenever a run ends with a match finished. */
    runTicket: integer("run_ticket").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("profiles_coins_not_negative", sql`${t.coins} >= 0`)],
);

/**
 * The copies of a cat an account has gained on top of the starter
 * collection every account owns (`game/collection.ts`).
 */
export const cards = createTable(
  "cards",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    catId: text("cat_id").notNull(),
    copies: integer("copies").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.catId] }),
    check("cards_copies_not_negative", sql`${t.copies} >= 0`),
  ],
);

/** The one deck an account has built: 24 cat ids. No row means the default deck. */
export const decks = createTable("decks", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  cards: jsonb("cards").$type<string[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** The cosmetics an account has gained; the free ones are never stored. */
export const cosmetics = createTable(
  "cosmetics",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cosmeticId: text("cosmetic_id").notNull(),
    gainedAt: timestamp("gained_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.cosmeticId] })],
);

/**
 * Every pack an account has opened, under the id the client made up for the
 * request. Asking again with the same id returns this row instead of buying
 * a second pack.
 */
export const packOpens = createTable(
  "pack_opens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    requestId: text("request_id").notNull(),
    packId: text("pack_id").notNull(),
    price: integer("price").notNull(),
    result: jsonb("result").$type<PackResult>().notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("pack_opens_user_request_idx").on(t.userId, t.requestId),
    index("pack_opens_user_opened_idx").on(t.userId, t.openedAt),
  ],
);

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

export type Profile = typeof profiles.$inferSelect;
export type PackOpen = typeof packOpens.$inferSelect;
