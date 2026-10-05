import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/**
 * Signing in, up and out go through Better Auth at `/api/auth`. What is left
 * here is the one question the app asks of it: who is signed in.
 */
export const authRouter = createTRPCRouter({
  me: protectedProcedure.query(({ ctx }) => ({ user: ctx.user })),
});
