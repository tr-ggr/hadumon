/**
 * Marketplace & trading post tables (Sprint 05).
 *
 * `listings` are fixed-price gold sales of a single cat; `tradeOffers` are
 * direct 1:1 swaps between two trainers. Both reserve the creatures involved
 * by flipping `creatures.status` to `listed` / `trading`, so every mutation
 * that touches them must lock the creature rows inside the same transaction.
 */
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { createTable } from "./_table";
import { users } from "./auth";
import { creatures } from "./creatures";

export const listingStatusEnum = pgEnum("hadumon_listing_status", [
  "active",
  "sold",
  "cancelled",
]);

export const tradeOfferStatusEnum = pgEnum("hadumon_trade_offer_status", [
  "pending",
  "accepted",
  "declined",
  "cancelled",
]);

/** A fixed-price sale of one cat. Exactly one `active` row per creature. */
export const listings = createTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creatureId: uuid("creature_id")
      .notNull()
      .references(() => creatures.id, { onDelete: "cascade" }),
    price: integer("price").notNull(),
    status: listingStatusEnum("status").notNull().default("active"),
    buyerId: uuid("buyer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("listings_active_creature_uq")
      .on(t.creatureId)
      .where(sql`${t.status} = 'active'`),
    index("listings_status_created_idx").on(t.status, t.createdAt),
    index("listings_status_price_idx").on(t.status, t.price),
    index("listings_seller_idx").on(t.sellerId),
    index("listings_buyer_idx").on(t.buyerId),
  ],
);

/** A proposed 1:1 swap: one of the proposer's cats for one of the receiver's. */
export const tradeOffers = createTable(
  "trade_offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposerId: uuid("proposer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    proposerCreatureId: uuid("proposer_creature_id")
      .notNull()
      .references(() => creatures.id, { onDelete: "cascade" }),
    receiverCreatureId: uuid("receiver_creature_id")
      .notNull()
      .references(() => creatures.id, { onDelete: "cascade" }),
    /** Free-text note, capped at 140 characters by the router. */
    message: text("message"),
    status: tradeOfferStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("trade_offers_receiver_status_idx").on(t.receiverId, t.status),
    index("trade_offers_proposer_status_idx").on(t.proposerId, t.status),
    index("trade_offers_created_idx").on(t.createdAt),
  ],
);

export const listingsRelations = relations(listings, ({ one }) => ({
  seller: one(users, { fields: [listings.sellerId], references: [users.id] }),
  buyer: one(users, { fields: [listings.buyerId], references: [users.id] }),
  creature: one(creatures, {
    fields: [listings.creatureId],
    references: [creatures.id],
  }),
}));

export const tradeOffersRelations = relations(tradeOffers, ({ one }) => ({
  proposer: one(users, {
    fields: [tradeOffers.proposerId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [tradeOffers.receiverId],
    references: [users.id],
  }),
  proposerCreature: one(creatures, {
    fields: [tradeOffers.proposerCreatureId],
    references: [creatures.id],
  }),
  receiverCreature: one(creatures, {
    fields: [tradeOffers.receiverCreatureId],
    references: [creatures.id],
  }),
}));

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingStatus = Listing["status"];
export type TradeOffer = typeof tradeOffers.$inferSelect;
export type NewTradeOffer = typeof tradeOffers.$inferInsert;
export type TradeOfferStatus = TradeOffer["status"];
