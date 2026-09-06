import { randomUUID } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  toCreatureView,
  type CreatureView,
} from "~/server/api/routers/creatures";
import type { Transaction } from "~/server/db";
import { creatures } from "~/server/db/schema/creatures";
import { pityCounters, pulls } from "~/server/db/schema/gacha";
import {
  BANNER_IDS,
  MULTI_COUNT,
  bannerRates,
  getBanner,
  getBanners,
  pullCost,
  rollMulti,
  type Banner,
  type PullResult,
} from "~/server/game/gacha";
import { createRng } from "~/server/game/rng";
import { getSpecies, type Rarity, type Species } from "~/server/game/species";
import { adjustWallet } from "~/server/game/wallet";

const bannerId = z.enum(BANNER_IDS);

/** A banner as the Summon page needs it. */
export interface BannerView {
  id: Banner["id"];
  name: string;
  description: string;
  singleCost: number;
  multiCost: number;
  multiCount: number;
  /** Rarity → percentage chance, already normalised for display. */
  rates: Record<Rarity, number>;
  featured: Species | null;
  pityCount: number;
  pityThreshold: number;
}

/** One revealed cat. */
export interface PullView {
  speciesId: string;
  species: Species;
  rarity: Rarity;
  wasPity: boolean;
  guaranteed: boolean;
  /** First time this trainer has owned this species. */
  isNew: boolean;
  creature: CreatureView;
}

export interface PullSummary {
  bannerId: Banner["id"];
  cost: number;
  results: PullView[];
  pityCount: number;
  pityThreshold: number;
  gems: number;
  gold: number;
}

export interface HistoryEntry {
  id: string;
  bannerId: string;
  speciesId: string;
  species: Species;
  rarity: Rarity;
  wasPity: boolean;
  creatureId: string | null;
  createdAt: Date;
}

export const gachaRouter = createTRPCRouter({
  /** Every banner with its rates, featured cat and this trainer's pity. */
  banners: protectedProcedure.query(async ({ ctx }): Promise<BannerView[]> => {
    const rows = await ctx.db
      .select({ bannerId: pityCounters.bannerId, count: pityCounters.count })
      .from(pityCounters)
      .where(eq(pityCounters.userId, ctx.user.id));

    const pityByBanner = new Map(rows.map((row) => [row.bannerId, row.count]));

    return getBanners().map((banner) => ({
      id: banner.id,
      name: banner.name,
      description: banner.description,
      singleCost: banner.singleCost,
      multiCost: banner.multiCost,
      multiCount: banner.multiCount,
      rates: bannerRates(banner),
      featured: banner.featuredSpeciesId
        ? getSpecies(banner.featuredSpeciesId)
        : null,
      pityCount: pityByBanner.get(banner.id) ?? 0,
      pityThreshold: banner.pityThreshold,
    }));
  }),

  /**
   * Spends gems and summons `count` cats.
   *
   * Everything happens in one transaction: the wallet is debited first (it
   * throws when the trainer cannot afford it), then the pity row is locked
   * `FOR UPDATE` so two concurrent pulls can never read the same counter.
   */
  pull: protectedProcedure
    .input(
      z.object({
        bannerId,
        count: z.union([z.literal(1), z.literal(MULTI_COUNT)]),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<PullSummary> => {
      const banner = getBanner(input.bannerId);
      const cost = pullCost(banner, input.count);

      return ctx.db.transaction(async (tx) => {
        const balance = await adjustWallet(tx, ctx.user.id, { gems: -cost });
        const pityBefore = await lockPityCount(tx, ctx.user.id, banner.id);

        // Fresh, unpredictable entropy per summon; the roll itself stays pure.
        const rng = createRng(randomUUID());
        const rolled = rollMulti(banner, rng, pityBefore, input.count);

        const ownedSpecies = await tx
          .selectDistinct({ speciesId: creatures.speciesId })
          .from(creatures)
          .where(eq(creatures.ownerId, ctx.user.id));

        const owned = new Set(ownedSpecies.map((row) => row.speciesId));
        const isNew = rolled.results.map((result) => {
          const first = !owned.has(result.speciesId);
          owned.add(result.speciesId);
          return first;
        });

        const created = await tx
          .insert(creatures)
          .values(
            rolled.results.map((result) => ({
              ownerId: ctx.user.id,
              speciesId: result.speciesId,
              obtainedVia: "gacha" as const,
            })),
          )
          .returning();

        if (created.length !== rolled.results.length) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Summon failed — no cats were created",
          });
        }

        await tx.insert(pulls).values(
          rolled.results.map((result, i) => ({
            userId: ctx.user.id,
            bannerId: banner.id,
            speciesId: result.speciesId,
            rarity: result.rarity,
            wasPity: result.wasPity,
            creatureId: created[i]?.id ?? null,
          })),
        );

        await tx
          .insert(pityCounters)
          .values({
            userId: ctx.user.id,
            bannerId: banner.id,
            count: rolled.pityCount,
          })
          .onConflictDoUpdate({
            target: [pityCounters.userId, pityCounters.bannerId],
            set: { count: rolled.pityCount, updatedAt: sql`now()` },
          });

        return {
          bannerId: banner.id,
          cost,
          pityCount: rolled.pityCount,
          pityThreshold: banner.pityThreshold,
          gems: balance.gems,
          gold: balance.gold,
          results: rolled.results.map((result, i) =>
            toPullView(result, created[i], isNew[i] ?? false),
          ),
        };
      });
    }),

  /** Most recent summons, newest first. */
  history: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(100).default(50) })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<HistoryEntry[]> => {
      const rows = await ctx.db
        .select()
        .from(pulls)
        .where(eq(pulls.userId, ctx.user.id))
        .orderBy(desc(pulls.seq))
        .limit(input?.limit ?? 50);

      return rows.map((row) => ({
        id: row.id,
        bannerId: row.bannerId,
        speciesId: row.speciesId,
        species: getSpecies(row.speciesId),
        rarity: row.rarity,
        wasPity: row.wasPity,
        creatureId: row.creatureId,
        createdAt: row.createdAt,
      }));
    }),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Reads the trainer's pity counter for a banner and holds a row lock on it
 * for the rest of the transaction, creating the row if it is missing.
 */
async function lockPityCount(
  tx: Transaction,
  userId: string,
  banner: string,
): Promise<number> {
  await tx
    .insert(pityCounters)
    .values({ userId, bannerId: banner, count: 0 })
    .onConflictDoNothing({
      target: [pityCounters.userId, pityCounters.bannerId],
    });

  const [row] = await tx
    .select({ count: pityCounters.count })
    .from(pityCounters)
    .where(
      and(eq(pityCounters.userId, userId), eq(pityCounters.bannerId, banner)),
    )
    .for("update")
    .limit(1);

  return row?.count ?? 0;
}

function toPullView(
  result: PullResult,
  creature: typeof creatures.$inferSelect | undefined,
  isNew: boolean,
): PullView {
  if (!creature) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Summon failed — a cat went missing",
    });
  }

  return {
    speciesId: result.speciesId,
    species: getSpecies(result.speciesId),
    rarity: result.rarity,
    wasPity: result.wasPity,
    guaranteed: result.guaranteed,
    isNew,
    creature: toCreatureView(creature),
  };
}
