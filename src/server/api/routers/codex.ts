import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CAT_LIST } from "~/server/game/cats";

/** Placeholder: Sprint 12 replaces this with the real codex procedures. */
export const codexRouter = createTRPCRouter({
  /** Every cat in the catalogue. */
  get: protectedProcedure.query(() => ({ cats: CAT_LIST })),
});
