import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import {
  ensureHandle,
  gainedCosmetics,
  lockProfile,
  readProfile,
} from "~/server/api/economy";
import { playerProfile, type PlayerProfile } from "~/server/api/players";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DbOrTx } from "~/server/db";
import { profiles } from "~/server/db/schema/economy";
import {
  COSMETIC_SLOTS,
  getCosmetic,
  lookOf,
  ownsCosmetic,
  type Look,
} from "~/server/game/cosmetics";

export interface ProfileView {
  name: string;
  /** What the account's profile is found under: `/players/<handle>`. */
  handle: string;
  /** Whether other players may see the account's runs. */
  runsPublic: boolean;
  coins: number;
  /** What is worn in every slot. */
  look: Look;
  /** The cosmetics the account has gained; the free ones are not listed. */
  cosmetics: string[];
}

/** An account's coins and look, for the shell and the profile page. */
export async function profileOf(
  db: DbOrTx,
  user: { id: string; displayName: string },
): Promise<ProfileView> {
  const [profile, gained] = await Promise.all([
    readProfile(db, user.id),
    gainedCosmetics(db, user.id),
  ]);
  // An account is given its handle the first time it is shown.
  const handle = profile.handle ?? (await ensureHandle(db, user.id));
  return {
    name: user.displayName,
    handle,
    runsPublic: profile.runsPublic,
    coins: profile.coins,
    look: lookOf(profile.look, gained),
    cosmetics: gained,
  };
}

export const profileRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => profileOf(ctx.db, ctx.user)),

  /** The account's own public profile: its numbers, achievements and runs. */
  record: protectedProcedure.query(async ({ ctx }): Promise<PlayerProfile> => {
    const handle = await ensureHandle(ctx.db, ctx.user.id);
    const profile = await playerProfile(ctx.db, handle, ctx.user.id);
    if (!profile) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "No profile row",
      });
    }
    return profile;
  }),

  /** Shows the account's runs to other players, or keeps them to itself. */
  setRunsPublic: protectedProcedure
    .input(z.object({ value: z.boolean() }))
    .mutation(async ({ ctx, input }): Promise<{ runsPublic: boolean }> => {
      return ctx.db.transaction(async (tx) => {
        await lockProfile(tx, ctx.user.id);
        await tx
          .update(profiles)
          .set({ runsPublic: input.value, updatedAt: new Date() })
          .where(eq(profiles.userId, ctx.user.id));
        return { runsPublic: input.value };
      });
    }),

  /** Wears one cosmetic in its slot. The free piece of a slot takes it off. */
  equip: protectedProcedure
    .input(
      z.object({
        slot: z.enum(COSMETIC_SLOTS),
        cosmeticId: z.string().min(1).max(40),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<ProfileView> => {
      return ctx.db.transaction(async (tx) => {
        const profile = await lockProfile(tx, ctx.user.id);
        const gained = await gainedCosmetics(tx, ctx.user.id);
        if (
          !ownsCosmetic(input.cosmeticId, gained) ||
          getCosmetic(input.cosmeticId).slot !== input.slot
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have that one yet.",
          });
        }
        const look = {
          ...lookOf(profile.look, gained),
          [input.slot]: input.cosmeticId,
        };
        await tx
          .update(profiles)
          .set({ look, updatedAt: new Date() })
          .where(eq(profiles.userId, ctx.user.id));
        return {
          name: ctx.user.displayName,
          handle: profile.handle ?? "",
          runsPublic: profile.runsPublic,
          coins: profile.coins,
          look,
          cosmetics: gained,
        };
      });
    }),
});
