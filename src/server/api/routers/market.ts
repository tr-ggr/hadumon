/**
 * Trading Post & Marketplace (Sprint 05).
 *
 * Every mutation runs inside a single transaction and takes `FOR UPDATE` locks
 * on the rows it is about to mutate (the listing/offer first, then the
 * creatures in a deterministic id order) so concurrent buyers or responders
 * serialise instead of double-spending. All gold movement goes through
 * `adjustWallet`.
 */
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  ne,
  notInArray,
  or,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  toCreatureView,
  type CreatureView,
} from "~/server/api/routers/creatures";
import type { DbOrTx, Transaction } from "~/server/db";
import { users } from "~/server/db/schema/auth";
import { creatures, type Creature } from "~/server/db/schema/creatures";
import {
  listings,
  tradeOffers,
  type Listing,
  type ListingStatus,
  type TradeOffer,
  type TradeOfferStatus,
} from "~/server/db/schema/market";
import { ELEMENTS, type Element } from "~/server/game/elements";
import {
  canBuy,
  canList,
  MAX_PRICE,
  MIN_PRICE,
  sellerProceeds,
  validateTrade,
  type MarketCheck,
} from "~/server/game/market";
import { RARITIES, SPECIES_LIST, type Rarity } from "~/server/game/species";
import { adjustWallet } from "~/server/game/wallet";

/* -------------------------------------------------------------------------- */
/* View types                                                                  */
/* -------------------------------------------------------------------------- */

export interface TrainerRef {
  id: string;
  username: string;
  displayName: string;
}

export interface ListingView {
  id: string;
  price: number;
  /** What the seller nets after the 5% fee. */
  proceeds: number;
  status: ListingStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  seller: TrainerRef;
  buyer: TrainerRef | null;
  creature: CreatureView;
  isMine: boolean;
}

export interface TradeOfferView {
  id: string;
  status: TradeOfferStatus;
  message: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  direction: "incoming" | "outgoing";
  proposer: TrainerRef;
  receiver: TrainerRef;
  proposerCreature: CreatureView;
  receiverCreature: CreatureView;
}

/* -------------------------------------------------------------------------- */
/* Input schemas                                                               */
/* -------------------------------------------------------------------------- */

export const BROWSE_LIMIT = 24;
/** How many matching listings an in-memory `power` sort will consider. */
const POWER_SCAN_LIMIT = 500;

const SORTS = ["newest", "priceAsc", "priceDesc", "power"] as const;

const browseInput = z.object({
  element: z.enum(ELEMENTS).optional(),
  rarity: z.enum(RARITIES).optional(),
  minPrice: z.number().int().min(0).max(MAX_PRICE).optional(),
  maxPrice: z.number().int().min(0).max(MAX_PRICE).optional(),
  sort: z.enum(SORTS).default("newest"),
  cursor: z.number().int().min(0).nullish(),
  limit: z.number().int().min(1).max(48).default(BROWSE_LIMIT),
});

const priceInput = z.number().int().min(MIN_PRICE).max(MAX_PRICE);

/* -------------------------------------------------------------------------- */
/* Row helpers                                                                 */
/* -------------------------------------------------------------------------- */

const sellerUser = alias(users, "seller_user");
const buyerUser = alias(users, "buyer_user");
const proposerUser = alias(users, "proposer_user");
const receiverUser = alias(users, "receiver_user");
const proposerCreature = alias(creatures, "proposer_creature");
const receiverCreature = alias(creatures, "receiver_creature");

/** The public slice of a trainer row, per alias. */
const SELLER_REF = {
  id: sellerUser.id,
  username: sellerUser.username,
  displayName: sellerUser.displayName,
};
const PROPOSER_REF = {
  id: proposerUser.id,
  username: proposerUser.username,
  displayName: proposerUser.displayName,
};
const RECEIVER_REF = {
  id: receiverUser.id,
  username: receiverUser.username,
  displayName: receiverUser.displayName,
};
const TRAINER_REF = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
};

interface ListingRow {
  listing: Listing;
  creature: Creature;
  seller: TrainerRef;
  buyerId: string | null;
  buyerUsername: string | null;
  buyerDisplayName: string | null;
}

function toListingView(row: ListingRow, viewerId: string): ListingView {
  return {
    id: row.listing.id,
    price: row.listing.price,
    proceeds: sellerProceeds(row.listing.price),
    status: row.listing.status,
    createdAt: row.listing.createdAt,
    resolvedAt: row.listing.resolvedAt,
    seller: row.seller,
    buyer:
      row.buyerId && row.buyerUsername && row.buyerDisplayName
        ? {
            id: row.buyerId,
            username: row.buyerUsername,
            displayName: row.buyerDisplayName,
          }
        : null,
    creature: toCreatureView(row.creature),
    isMine: row.listing.sellerId === viewerId,
  };
}

function listingSelection(db: DbOrTx) {
  return db
    .select({
      listing: listings,
      creature: creatures,
      seller: SELLER_REF,
      buyerId: buyerUser.id,
      buyerUsername: buyerUser.username,
      buyerDisplayName: buyerUser.displayName,
    })
    .from(listings)
    .innerJoin(creatures, eq(creatures.id, listings.creatureId))
    .innerJoin(sellerUser, eq(sellerUser.id, listings.sellerId))
    .leftJoin(buyerUser, eq(buyerUser.id, listings.buyerId));
}

interface TradeRow {
  offer: TradeOffer;
  proposer: TrainerRef;
  receiver: TrainerRef;
  proposerCreature: Creature;
  receiverCreature: Creature;
}

function toTradeOfferView(row: TradeRow, viewerId: string): TradeOfferView {
  return {
    id: row.offer.id,
    status: row.offer.status,
    message: row.offer.message,
    createdAt: row.offer.createdAt,
    resolvedAt: row.offer.resolvedAt,
    direction: row.offer.receiverId === viewerId ? "incoming" : "outgoing",
    proposer: row.proposer,
    receiver: row.receiver,
    proposerCreature: toCreatureView(row.proposerCreature),
    receiverCreature: toCreatureView(row.receiverCreature),
  };
}

function tradeSelection(db: DbOrTx) {
  return db
    .select({
      offer: tradeOffers,
      proposer: PROPOSER_REF,
      receiver: RECEIVER_REF,
      proposerCreature,
      receiverCreature,
    })
    .from(tradeOffers)
    .innerJoin(proposerUser, eq(proposerUser.id, tradeOffers.proposerId))
    .innerJoin(receiverUser, eq(receiverUser.id, tradeOffers.receiverId))
    .innerJoin(
      proposerCreature,
      eq(proposerCreature.id, tradeOffers.proposerCreatureId),
    )
    .innerJoin(
      receiverCreature,
      eq(receiverCreature.id, tradeOffers.receiverCreatureId),
    );
}

/* -------------------------------------------------------------------------- */
/* Transaction helpers                                                         */
/* -------------------------------------------------------------------------- */

/** Locks one creature row for the rest of the transaction. */
async function lockCreature(
  tx: Transaction,
  id: string,
): Promise<Creature | undefined> {
  const [row] = await tx
    .select()
    .from(creatures)
    .where(eq(creatures.id, id))
    .limit(1)
    .for("update");
  return row;
}

/**
 * Locks several creatures in ascending id order — a stable order stops two
 * transactions touching the same pair from deadlocking against each other.
 */
async function lockCreatures(
  tx: Transaction,
  ids: string[],
): Promise<Map<string, Creature>> {
  const found = new Map<string, Creature>();
  for (const id of [...new Set(ids)].sort()) {
    const row = await lockCreature(tx, id);
    if (row) found.set(id, row);
  }
  return found;
}

/** Cats the trainer still holds that are not tied up by a listing or trade. */
async function availableCount(tx: DbOrTx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ value: count() })
    .from(creatures)
    .where(
      and(
        eq(creatures.ownerId, userId),
        notInArray(creatures.status, ["listed", "trading"]),
      ),
    );
  return row?.value ?? 0;
}

/** Turns a rules-layer rejection into the matching tRPC error. */
function assertOk(check: MarketCheck): void {
  if (check.ok) return;
  throw new TRPCError({
    code: check.code === "NOT_OWNED" ? "FORBIDDEN" : "BAD_REQUEST",
    message: check.message,
  });
}

function speciesIdsFor(element?: Element, rarity?: Rarity): string[] | null {
  if (!element && !rarity) return null;
  return SPECIES_LIST.filter(
    (species) =>
      (!element || species.element === element) &&
      (!rarity || species.rarity === rarity),
  ).map((species) => species.id);
}

/* -------------------------------------------------------------------------- */
/* Router                                                                      */
/* -------------------------------------------------------------------------- */

export const marketRouter = createTRPCRouter({
  /** Active listings from other trainers, filtered and paginated. */
  browse: protectedProcedure
    .input(browseInput)
    .query(async ({ ctx, input }) => {
      const speciesIds = speciesIdsFor(input.element, input.rarity);
      if (speciesIds !== null && speciesIds.length === 0) {
        return { items: [] as ListingView[], nextCursor: null };
      }

      const filters = [
        eq(listings.status, "active"),
        ne(listings.sellerId, ctx.user.id),
        ...(speciesIds ? [inArray(creatures.speciesId, speciesIds)] : []),
        ...(input.minPrice !== undefined
          ? [gte(listings.price, input.minPrice)]
          : []),
        ...(input.maxPrice !== undefined
          ? [lte(listings.price, input.maxPrice)]
          : []),
      ];

      const offset = input.cursor ?? 0;

      // `power` is derived from species base stats, so it cannot be ordered in
      // SQL: scan a bounded window of matches and rank them in memory instead.
      if (input.sort === "power") {
        const rows = await listingSelection(ctx.db)
          .where(and(...filters))
          .orderBy(desc(listings.createdAt))
          .limit(POWER_SCAN_LIMIT);

        const ranked = rows
          .map((row) => toListingView(row, ctx.user.id))
          .sort(
            (a, b) => b.creature.power - a.creature.power || a.price - b.price,
          );
        const page = ranked.slice(offset, offset + input.limit);

        return {
          items: page,
          nextCursor:
            offset + page.length < ranked.length ? offset + page.length : null,
        };
      }

      const orderBy =
        input.sort === "priceAsc"
          ? [asc(listings.price), desc(listings.createdAt)]
          : input.sort === "priceDesc"
            ? [desc(listings.price), desc(listings.createdAt)]
            : [desc(listings.createdAt)];

      const rows = await listingSelection(ctx.db)
        .where(and(...filters))
        .orderBy(...orderBy)
        .limit(input.limit + 1)
        .offset(offset);

      const hasMore = rows.length > input.limit;
      const items = rows
        .slice(0, input.limit)
        .map((row) => toListingView(row, ctx.user.id));

      return { items, nextCursor: hasMore ? offset + items.length : null };
    }),

  /** Everything this trainer has ever put up for sale, newest first. */
  myListings: protectedProcedure.query(async ({ ctx }) => {
    const rows = await listingSelection(ctx.db)
      .where(eq(listings.sellerId, ctx.user.id))
      .orderBy(desc(listings.createdAt))
      .limit(100);

    return rows.map((row) => toListingView(row, ctx.user.id));
  }),

  /** The trainer's idle cats — the ones eligible to be listed or traded. */
  listableCreatures: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(creatures)
      .where(
        and(eq(creatures.ownerId, ctx.user.id), eq(creatures.status, "idle")),
      )
      .orderBy(desc(creatures.obtainedAt));

    const available = await availableCount(ctx.db, ctx.user.id);
    return { creatures: rows.map(toCreatureView), canOfferAny: available >= 2 };
  }),

  /** Reserves an idle cat and puts it on the board at a fixed gold price. */
  list: protectedProcedure
    .input(z.object({ creatureId: z.string().uuid(), price: priceInput }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const creature = await lockCreature(tx, input.creatureId);
        if (!creature) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Creature not found",
          });
        }

        assertOk(
          canList({
            creature,
            actorId: ctx.user.id,
            availableCount: await availableCount(tx, ctx.user.id),
            price: input.price,
          }),
        );

        await tx
          .update(creatures)
          .set({ status: "listed" })
          .where(
            and(eq(creatures.id, creature.id), eq(creatures.status, "idle")),
          );

        const [created] = await tx
          .insert(listings)
          .values({
            sellerId: ctx.user.id,
            creatureId: creature.id,
            price: input.price,
          })
          .returning();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Listing failed",
          });
        }

        return {
          id: created.id,
          price: created.price,
          proceeds: sellerProceeds(created.price),
        };
      });
    }),

  /** Withdraws an active listing and releases the cat back to `idle`. */
  cancel: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const listing = await lockListing(tx, input.listingId);
        if (!listing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });
        }
        if (listing.sellerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "That listing is not yours",
          });
        }
        if (listing.status !== "active") {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              listing.status === "sold"
                ? "That cat has already been sold"
                : "That listing was already withdrawn",
          });
        }

        await lockCreature(tx, listing.creatureId);
        await tx
          .update(creatures)
          .set({ status: "idle" })
          .where(
            and(
              eq(creatures.id, listing.creatureId),
              eq(creatures.status, "listed"),
            ),
          );

        await tx
          .update(listings)
          .set({ status: "cancelled", resolvedAt: new Date() })
          .where(
            and(eq(listings.id, listing.id), eq(listings.status, "active")),
          );

        return { id: listing.id, status: "cancelled" as const };
      });
    }),

  /**
   * Buys a listing: debit the buyer, credit the seller their 95%, hand over
   * the cat and close the listing — all under the listing's row lock, so two
   * simultaneous buyers can only ever produce one sale.
   */
  buy: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const listing = await lockListing(tx, input.listingId);
        if (!listing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Listing not found",
          });
        }

        const [wallet] = await tx
          .select({ gold: users.gold })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        const check = canBuy(listing, ctx.user.id, wallet?.gold ?? 0);
        if (!check.ok) {
          throw new TRPCError({
            code:
              check.code === "INSUFFICIENT_GOLD" ? "BAD_REQUEST" : "CONFLICT",
            message: check.message,
          });
        }

        const creature = await lockCreature(tx, listing.creatureId);
        if (creature?.ownerId !== listing.sellerId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That cat is no longer available",
          });
        }

        const proceeds = sellerProceeds(listing.price);
        const balance = await adjustWallet(tx, ctx.user.id, {
          gold: -listing.price,
        });
        await adjustWallet(tx, listing.sellerId, { gold: proceeds });

        await tx
          .update(creatures)
          .set({ ownerId: ctx.user.id, status: "idle", obtainedVia: "market" })
          .where(eq(creatures.id, creature.id));

        const [sold] = await tx
          .update(listings)
          .set({ status: "sold", buyerId: ctx.user.id, resolvedAt: new Date() })
          .where(
            and(eq(listings.id, listing.id), eq(listings.status, "active")),
          )
          .returning({ id: listings.id });

        // Belt and braces: the FOR UPDATE lock above already serialises buyers.
        if (!sold) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That cat has already been sold",
          });
        }

        return {
          listingId: listing.id,
          price: listing.price,
          goldRemaining: balance.gold,
          creature: toCreatureView({
            ...creature,
            ownerId: ctx.user.id,
            status: "idle",
            obtainedVia: "market",
          }),
        };
      });
    }),

  /* ---------------------------------------------------------------- trades */

  /** Another trainer's idle roster, for picking what to ask for. */
  browseUserRoster: protectedProcedure
    .input(z.object({ username: z.string().trim().min(1).max(20) }))
    .query(async ({ ctx, input }) => {
      const username = input.username.toLowerCase();
      const [trainer] = await ctx.db
        .select(TRAINER_REF)
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!trainer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No trainer called ${input.username}`,
        });
      }
      if (trainer.id === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot trade with yourself",
        });
      }

      const rows = await ctx.db
        .select()
        .from(creatures)
        .where(
          and(eq(creatures.ownerId, trainer.id), eq(creatures.status, "idle")),
        )
        .orderBy(desc(creatures.obtainedAt));

      return { trainer, creatures: rows.map(toCreatureView) };
    }),

  /** Reserves both cats and records a pending 1:1 offer. */
  proposeTrade: protectedProcedure
    .input(
      z
        .object({
          receiverId: z.string().uuid().optional(),
          receiverUsername: z.string().trim().min(1).max(20).optional(),
          myCreatureId: z.string().uuid(),
          theirCreatureId: z.string().uuid(),
          message: z.string().trim().max(140).optional(),
        })
        .refine((v) => Boolean(v.receiverId ?? v.receiverUsername), {
          message: "Name the trainer you want to trade with",
        }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [receiver] = await tx
          .select(TRAINER_REF)
          .from(users)
          .where(
            input.receiverId
              ? eq(users.id, input.receiverId)
              : eq(
                  users.username,
                  (input.receiverUsername ?? "").toLowerCase(),
                ),
          )
          .limit(1);

        if (!receiver) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "That trainer does not exist",
          });
        }

        const locked = await lockCreatures(tx, [
          input.myCreatureId,
          input.theirCreatureId,
        ]);
        const mine = locked.get(input.myCreatureId);
        const theirs = locked.get(input.theirCreatureId);
        if (!mine || !theirs) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Creature not found",
          });
        }
        if (mine.id === theirs.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pick two different cats",
          });
        }
        if (theirs.ownerId !== receiver.id) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "That cat no longer belongs to that trainer",
          });
        }

        assertOk(
          validateTrade({
            proposer: {
              userId: ctx.user.id,
              creatures: [mine],
              availableCount: await availableCount(tx, ctx.user.id),
            },
            receiver: {
              userId: receiver.id,
              creatures: [theirs],
              availableCount: await availableCount(tx, receiver.id),
            },
          }),
        );

        await tx
          .update(creatures)
          .set({ status: "trading" })
          .where(
            and(
              inArray(creatures.id, [mine.id, theirs.id]),
              eq(creatures.status, "idle"),
            ),
          );

        const [offer] = await tx
          .insert(tradeOffers)
          .values({
            proposerId: ctx.user.id,
            receiverId: receiver.id,
            proposerCreatureId: mine.id,
            receiverCreatureId: theirs.id,
            message:
              input.message && input.message.length > 0 ? input.message : null,
          })
          .returning({ id: tradeOffers.id });

        if (!offer) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Trade failed",
          });
        }
        return { id: offer.id, receiver };
      });
    }),

  /** Receiver-only: accept (swap owners atomically) or decline (release both). */
  respondTrade: protectedProcedure
    .input(z.object({ offerId: z.string().uuid(), accept: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const offer = await lockPendingOffer(tx, input.offerId);
        if (offer.receiverId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "That offer is not addressed to you",
          });
        }

        const locked = await lockCreatures(tx, [
          offer.proposerCreatureId,
          offer.receiverCreatureId,
        ]);
        const proposerCat = locked.get(offer.proposerCreatureId);
        const receiverCat = locked.get(offer.receiverCreatureId);

        if (!input.accept) {
          await releaseTradeCreatures(tx, offer);
          await resolveOffer(tx, offer.id, "declined");
          return { id: offer.id, status: "declined" as const };
        }

        if (
          !proposerCat ||
          !receiverCat ||
          proposerCat.ownerId !== offer.proposerId ||
          receiverCat.ownerId !== offer.receiverId
        ) {
          await releaseTradeCreatures(tx, offer);
          await resolveOffer(tx, offer.id, "cancelled");
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "One of these cats has changed hands — the offer was cancelled",
          });
        }

        await tx
          .update(creatures)
          .set({
            ownerId: offer.receiverId,
            status: "idle",
            obtainedVia: "trade",
          })
          .where(eq(creatures.id, proposerCat.id));

        await tx
          .update(creatures)
          .set({
            ownerId: offer.proposerId,
            status: "idle",
            obtainedVia: "trade",
          })
          .where(eq(creatures.id, receiverCat.id));

        await resolveOffer(tx, offer.id, "accepted");
        return {
          id: offer.id,
          status: "accepted" as const,
          received: toCreatureView({
            ...proposerCat,
            ownerId: offer.receiverId,
            status: "idle",
            obtainedVia: "trade",
          }),
        };
      });
    }),

  /** Proposer-only: withdraw a pending offer and release both cats. */
  cancelTrade: protectedProcedure
    .input(z.object({ offerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const offer = await lockPendingOffer(tx, input.offerId);
        if (offer.proposerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "That offer is not yours",
          });
        }

        await lockCreatures(tx, [
          offer.proposerCreatureId,
          offer.receiverCreatureId,
        ]);
        await releaseTradeCreatures(tx, offer);
        await resolveOffer(tx, offer.id, "cancelled");

        return { id: offer.id, status: "cancelled" as const };
      });
    }),

  incomingTrades: protectedProcedure.query(async ({ ctx }) => {
    const rows = await tradeSelection(ctx.db)
      .where(
        and(
          eq(tradeOffers.receiverId, ctx.user.id),
          eq(tradeOffers.status, "pending"),
        ),
      )
      .orderBy(desc(tradeOffers.createdAt));
    return rows.map((row) => toTradeOfferView(row, ctx.user.id));
  }),

  outgoingTrades: protectedProcedure.query(async ({ ctx }) => {
    const rows = await tradeSelection(ctx.db)
      .where(
        and(
          eq(tradeOffers.proposerId, ctx.user.id),
          eq(tradeOffers.status, "pending"),
        ),
      )
      .orderBy(desc(tradeOffers.createdAt));
    return rows.map((row) => toTradeOfferView(row, ctx.user.id));
  }),

  tradeHistory: protectedProcedure.query(async ({ ctx }) => {
    const rows = await tradeSelection(ctx.db)
      .where(
        and(
          or(
            eq(tradeOffers.proposerId, ctx.user.id),
            eq(tradeOffers.receiverId, ctx.user.id),
          ),
          ne(tradeOffers.status, "pending"),
        ),
      )
      .orderBy(desc(tradeOffers.resolvedAt), desc(tradeOffers.createdAt))
      .limit(30);
    return rows.map((row) => toTradeOfferView(row, ctx.user.id));
  }),
});

/* -------------------------------------------------------------------------- */
/* Locking primitives                                                          */
/* -------------------------------------------------------------------------- */

async function lockListing(
  tx: Transaction,
  id: string,
): Promise<Listing | undefined> {
  const [row] = await tx
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1)
    .for("update");
  return row;
}

async function lockPendingOffer(
  tx: Transaction,
  id: string,
): Promise<TradeOffer> {
  const [row] = await tx
    .select()
    .from(tradeOffers)
    .where(eq(tradeOffers.id, id))
    .limit(1)
    .for("update");

  if (!row)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trade offer not found",
    });
  if (row.status !== "pending") {
    throw new TRPCError({
      code: "CONFLICT",
      message: `That offer was already ${row.status}`,
    });
  }
  return row;
}

/** Sends both reserved cats back to `idle` (only if still `trading`). */
async function releaseTradeCreatures(
  tx: Transaction,
  offer: TradeOffer,
): Promise<void> {
  await tx
    .update(creatures)
    .set({ status: "idle" })
    .where(
      and(
        inArray(creatures.id, [
          offer.proposerCreatureId,
          offer.receiverCreatureId,
        ]),
        eq(creatures.status, "trading"),
      ),
    );
}

async function resolveOffer(
  tx: Transaction,
  id: string,
  status: Exclude<TradeOfferStatus, "pending">,
): Promise<void> {
  await tx
    .update(tradeOffers)
    .set({ status, resolvedAt: new Date() })
    .where(and(eq(tradeOffers.id, id), eq(tradeOffers.status, "pending")));
}
