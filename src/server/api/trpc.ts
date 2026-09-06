/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { getCurrentUser, getSessionToken } from "~/server/auth/session";
import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * Every request gets the database handle, the signed-in trainer (or `null`)
 * and the raw session token (so `auth.logout` can delete the row).
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const sessionToken = await getSessionToken();
  const user = await getCurrentUser();

  return {
    db,
    user,
    sessionToken,
    ...opts,
  };
};

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Unexpected errors (database failures, bugs) carry internals such as
    // raw SQL in their message. Log the real error and send a generic one.
    if (error.code === "INTERNAL_SERVER_ERROR") {
      console.error("[TRPC] internal error", error.cause ?? error);
    }
    return {
      ...shape,
      message:
        error.code === "INTERNAL_SERVER_ERROR"
          ? "Something went wrong. Please try again."
          : shape.message,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 */
export const createTRPCRouter = t.router;

/** Logs how long each procedure took. */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  return result;
});

/** Public (unauthenticated) procedure. */
export const publicProcedure = t.procedure.use(timingMiddleware);

/** Requires a valid session; `ctx.user` is non-null inside. */
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in",
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
