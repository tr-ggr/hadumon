/**
 * Stub — owned by Sprint 03 (Idle Adventure).
 *
 * Registered in `src/server/api/root.ts` as `adventure` already, so Sprint 03
 * only needs to fill in this file.
 */
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const adventureRouter = createTRPCRouter({
  ping: protectedProcedure.query(() => "ok"),
});
