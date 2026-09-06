import { TRPCError } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { hashPassword, verifyPassword } from "~/server/auth/password";
import { createSession, deleteSession } from "~/server/auth/session";
import { creatures } from "~/server/db/schema/creatures";
import { users } from "~/server/db/schema/auth";
import { STARTER_SPECIES_IDS } from "~/server/game/species";
import { getWallet } from "~/server/game/wallet";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-z0-9_]+$/i, "Use letters, numbers and underscores only");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

const credentials = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const authRouter = createTRPCRouter({
  signup: publicProcedure
    .input(credentials)
    .mutation(async ({ ctx, input }) => {
      const username = input.username.toLowerCase();

      const existing = await ctx.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That username is taken",
        });
      }

      const passwordHash = await hashPassword(input.password);

      const userId = await ctx.db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({ username, displayName: input.username, passwordHash })
          .returning({ id: users.id });

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Signup failed",
          });
        }

        await tx.insert(creatures).values(
          STARTER_SPECIES_IDS.map((speciesId) => ({
            ownerId: created.id,
            speciesId,
            obtainedVia: "starter" as const,
          })),
        );

        return created.id;
      });

      await createSession(userId);
      return { id: userId, username };
    }),

  login: publicProcedure.input(credentials).mutation(async ({ ctx, input }) => {
    const username = input.username.toLowerCase();

    const [user] = await ctx.db
      .select({
        id: users.id,
        username: users.username,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const ok = user
      ? await verifyPassword(input.password, user.passwordHash)
      : false;
    if (!user || !ok) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Wrong username or password",
      });
    }

    await createSession(user.id);
    return { id: user.id, username: user.username };
  }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    await deleteSession(ctx.sessionToken);
    return { ok: true };
  }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getWallet(ctx.db, ctx.user.id);
    const [creatureCount] = await ctx.db
      .select({ value: count() })
      .from(creatures)
      .where(eq(creatures.ownerId, ctx.user.id));

    return {
      user: ctx.user,
      wallet,
      creatureCount: creatureCount?.value ?? 0,
    };
  }),
});
