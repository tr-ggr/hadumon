import { adventureRouter } from "~/server/api/routers/adventure";
import { authRouter } from "~/server/api/routers/auth";
import { battleRouter } from "~/server/api/routers/battle";
import { creaturesRouter } from "~/server/api/routers/creatures";
import { gachaRouter } from "~/server/api/routers/gacha";
import { marketRouter } from "~/server/api/routers/market";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * The primary router for the HaduMon server.
 *
 * Every feature namespace is registered here up front (Sprints 02–05 ship as
 * stubs), so no later sprint needs to touch this file.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  creatures: creaturesRouter,
  gacha: gachaRouter,
  adventure: adventureRouter,
  battle: battleRouter,
  market: marketRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.creatures.list();
 */
export const createCaller = createCallerFactory(appRouter);
