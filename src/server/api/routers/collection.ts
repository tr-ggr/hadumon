import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { lockProfile, ownedBy, savedDeck } from "~/server/api/economy";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { decks } from "~/server/db/schema/economy";
import {
  DECK_SIZE,
  describeProblem,
  sortDeck,
  validateDeck,
} from "~/server/game/deck";

export const collectionRouter = createTRPCRouter({
  /** How many copies of each cat the account owns, by cat id. */
  get: protectedProcedure.query(({ ctx }) => ownedBy(ctx.db, ctx.user.id)),

  /**
   * The deck the account brings to its next run, and whether it can still
   * be played: a card can leave the game, and a deck is never mended for
   * its owner.
   */
  deck: protectedProcedure.query(async ({ ctx }) => {
    const [deck, owned] = await Promise.all([
      savedDeck(ctx.db, ctx.user.id),
      ownedBy(ctx.db, ctx.user.id),
    ]);
    return {
      cards: deck.cards,
      built: deck.built,
      problems: validateDeck(deck.cards, owned).map(describeProblem),
    };
  }),

  saveDeck: protectedProcedure
    .input(
      z.object({
        // Room for a deck that is over, so the refusal can say by how much.
        cards: z.array(z.string().min(1).max(40)).max(DECK_SIZE * 2),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        // The lock keeps a pack opened in another tab from moving the
        // collection between the check and the write.
        await lockProfile(tx, ctx.user.id);
        const owned = await ownedBy(tx, ctx.user.id);
        const [problem] = validateDeck(input.cards, owned);
        if (problem) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: describeProblem(problem),
          });
        }
        const cards = sortDeck(input.cards);
        await tx
          .insert(decks)
          .values({ userId: ctx.user.id, cards })
          .onConflictDoUpdate({
            target: decks.userId,
            set: { cards, updatedAt: new Date() },
          });
        return { cards, built: true, problems: [] as string[] };
      });
    }),
});
