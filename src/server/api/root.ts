import { authRouter } from "~/server/api/routers/auth";
import { codexRouter } from "~/server/api/routers/codex";
import { runRouter } from "~/server/api/routers/run";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/** The primary router for the HaduMon server. */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  run: runRouter,
  codex: codexRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.run.current();
 */
export const createCaller = createCallerFactory(appRouter);
