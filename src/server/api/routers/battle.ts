/**
 * Stub — owned by Sprint 04 (PvP Ladder).
 *
 * Registered in `src/server/api/root.ts` as `battle` already, so Sprint 04
 * only needs to fill in this file.
 */
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const battleRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => "ok"),
});
