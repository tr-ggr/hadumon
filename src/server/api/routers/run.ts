import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

/** Placeholder: Sprint 11 replaces this with the real run procedures. */
export const runRouter = createTRPCRouter({
  /** The account's active run, or `null` when there is none. */
  current: protectedProcedure.query((): null => null),
});
