/**
 * Stub — owned by Sprint 05 (Marketplace).
 *
 * Registered in `src/server/api/root.ts` as `market` already, so Sprint 05
 * only needs to fill in this file.
 */
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const marketRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => "ok"),
});
