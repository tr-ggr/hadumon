/**
 * Stub — owned by Sprint 02 (Gacha Summoning Hub).
 *
 * Registered in `src/server/api/root.ts` as `gacha` already, so Sprint 02
 * only needs to fill in this file.
 */
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const gachaRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => "ok"),
});
