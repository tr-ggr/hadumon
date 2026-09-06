import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { creatures, type Creature } from "~/server/db/schema/creatures";
import { getSpecies, type Species } from "~/server/game/species";
import { creaturePower, effectiveStats, xpForLevel, type Stats } from "~/server/game/stats";

/** A creature joined with its species and derived combat numbers. */
export interface CreatureView {
  id: string;
  speciesId: string;
  name: string;
  nickname: string | null;
  level: number;
  xp: number;
  xpToNext: number;
  upgradeTier: number;
  status: Creature["status"];
  obtainedVia: Creature["obtainedVia"];
  obtainedAt: Date;
  species: Species;
  stats: Stats;
  power: number;
}

export function toCreatureView(row: Creature): CreatureView {
  const species = getSpecies(row.speciesId);
  const stats = effectiveStats(species, row.level, row.upgradeTier);

  return {
    id: row.id,
    speciesId: row.speciesId,
    name: row.nickname ?? species.name,
    nickname: row.nickname,
    level: row.level,
    xp: row.xp,
    xpToNext: xpForLevel(row.level),
    upgradeTier: row.upgradeTier,
    status: row.status,
    obtainedVia: row.obtainedVia,
    obtainedAt: row.obtainedAt,
    species,
    stats,
    power: creaturePower(stats),
  };
}

export const creaturesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(creatures)
      .where(eq(creatures.ownerId, ctx.user.id))
      .orderBy(desc(creatures.obtainedAt));

    return rows.map(toCreatureView);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(creatures)
        .where(and(eq(creatures.id, input.id), eq(creatures.ownerId, ctx.user.id)))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Creature not found" });
      return toCreatureView(row);
    }),

  rename: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        nickname: z.string().trim().max(20).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const nickname = input.nickname && input.nickname.length > 0 ? input.nickname : null;

      const [row] = await ctx.db
        .update(creatures)
        .set({ nickname })
        .where(and(eq(creatures.id, input.id), eq(creatures.ownerId, ctx.user.id)))
        .returning();

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Creature not found" });
      return toCreatureView(row);
    }),
});
