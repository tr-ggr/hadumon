import { randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  addCards,
  addCoins,
  gainedCosmetics,
  lockProfile,
  ownedBy,
  readProfile,
  spendCoins,
} from "~/server/api/economy";
import { grantAchievements } from "~/server/api/achievements";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cosmetics, packOpens } from "~/server/db/schema/economy";
import {
  getPack,
  isPackId,
  openCatPack,
  openCosmeticPack,
  PACK_LIST,
  PACK_PRICE,
  piecesLeft,
  settleCats,
  type PackResult,
} from "~/server/game/packs";
import type { Achievement } from "~/server/game/achievements";
import { createRng } from "~/server/game/rng";

export interface ShelfPack {
  id: string;
  price: number;
  /** Pieces still to find in a cosmetic pack; `null` for a cat pack. */
  left: number | null;
}

export interface Opened {
  result: PackResult;
  /** The balance once the pack is paid for and any refund is back. */
  coins: number;
  /** True if this request had been answered before: nothing was bought. */
  replayed: boolean;
  /** Achievements the pack completed, each paid once; their coins are in `coins`. */
  achievements: Achievement[];
}

export const shopRouter = createTRPCRouter({
  /** The balance and the shelf. A pack's name and rules are static, read by id. */
  packs: protectedProcedure.query(async ({ ctx }) => {
    const [profile, gained] = await Promise.all([
      readProfile(ctx.db, ctx.user.id),
      gainedCosmetics(ctx.db, ctx.user.id),
    ]);
    return {
      coins: profile.coins,
      packs: PACK_LIST.map((pack): ShelfPack => ({
        id: pack.id,
        price: PACK_PRICE[pack.kind],
        left:
          pack.kind === "cosmetics" ? piecesLeft(pack, gained).length : null,
      })),
    };
  }),

  /**
   * Buys and opens one pack. `requestId` is made up by the client for each
   * press of the button: a request sent twice, by a retry or a double click,
   * is answered with the pack the first one opened.
   */
  open: protectedProcedure
    .input(
      z.object({
        packId: z.string().max(40).refine(isPackId, "There is no such pack."),
        requestId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<Opened> => {
      const userId = ctx.user.id;
      return ctx.db.transaction(async (tx) => {
        const profile = await lockProfile(tx, userId);
        const [before] = await tx
          .select({ result: packOpens.result })
          .from(packOpens)
          .where(
            and(
              eq(packOpens.userId, userId),
              eq(packOpens.requestId, input.requestId),
            ),
          )
          .limit(1);
        if (before) {
          return {
            result: before.result,
            coins: profile.coins,
            replayed: true,
            achievements: [],
          };
        }

        const pack = getPack(input.packId);
        const price = PACK_PRICE[pack.kind];
        const gained =
          pack.kind === "cosmetics" ? await gainedCosmetics(tx, userId) : [];
        if (
          pack.kind === "cosmetics" &&
          piecesLeft(pack, gained).length === 0
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have everything in this pack.",
          });
        }
        let coins = await spendCoins(tx, userId, price);
        if (coins === null) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `That pack is ${price} coins and you have ${profile.coins}.`,
          });
        }

        // Rolled here, from a seed no client sees or chooses.
        const rng = createRng(randomBytes(16).toString("hex"));
        let result: PackResult;
        if (pack.kind === "cats") {
          const settled = settleCats(
            openCatPack(pack, rng),
            await ownedBy(tx, userId),
          );
          await addCards(
            tx,
            userId,
            settled.cats.filter((cat) => cat.kept).map((cat) => cat.catId),
          );
          if (settled.refund > 0) {
            coins = await addCoins(tx, userId, settled.refund);
          }
          result = {
            kind: "cats",
            packId: pack.id,
            cats: settled.cats,
            refund: settled.refund,
          };
        } else {
          const pieces = openCosmeticPack(pack, gained, rng);
          await tx
            .insert(cosmetics)
            .values(pieces.map((cosmeticId) => ({ userId, cosmeticId })));
          result = { kind: "cosmetics", packId: pack.id, pieces };
        }
        await tx.insert(packOpens).values({
          userId,
          requestId: input.requestId,
          packId: pack.id,
          price,
          result,
        });
        const earned = await grantAchievements(tx, userId, null);
        coins += earned.reduce((sum, a) => sum + a.coins, 0);
        return { result, coins, replayed: false, achievements: earned };
      });
    }),
});
