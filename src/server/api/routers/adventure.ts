import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  toCreatureView,
  type CreatureView,
} from "~/server/api/routers/creatures";
import type { DbOrTx, Transaction } from "~/server/db";
import {
  expeditionMembers,
  expeditions,
  zoneProgress,
  type Expedition,
} from "~/server/db/schema/adventure";
import { creatures, type Creature } from "~/server/db/schema/creatures";
import type { Element } from "~/server/game/elements";
import { getSpecies } from "~/server/game/species";
import {
  nextClaimedAt,
  pendingEncounters,
  resolveExpedition,
  secondsToNextEncounter,
  type CreatureXpGain,
  type EncounterSummary,
  type LatestFight,
  type SquadCreature,
} from "~/server/game/idle";
import {
  nextUpgradeCost,
  upgradeCost,
  MAX_UPGRADE_TIER,
} from "~/server/game/progression";
import { squadPower } from "~/server/game/stats";
import { adjustMaterials, adjustWallet } from "~/server/game/wallet";
import {
  findZone,
  getZone,
  isZoneUnlocked,
  MAX_OFFLINE_SECONDS,
  ZONES,
  type Zone,
} from "~/server/game/zones";

/** Encounters kept in the claim payload — the modal only scrolls the tail. */
const ENCOUNTER_LOG_LIMIT = 25;

export const MAX_SQUAD_SIZE = 4;

export interface ZoneView extends Zone {
  unlocked: boolean;
  wins: number;
  /** Wins still needed in the prerequisite zone, or 0 when unlocked. */
  winsNeeded: number;
  unlockZoneName: string | null;
}

export interface ClaimSummary {
  expeditionId: string;
  zoneId: string;
  zoneName: string;
  encounterCount: number;
  winCount: number;
  lossCount: number;
  rewards: {
    gold: number;
    gems: number;
    xp: number;
    materialElement: Element;
    materials: number;
  };
  xpPerCreature: CreatureXpGain[];
  /** Tail of the encounter list (most recent last), capped for payload size. */
  encounters: EncounterSummary[];
  latestFight: LatestFight | null;
  retreated: boolean;
  /** True when the expedition is over (retreat or recall). */
  ended: boolean;
  zoneWins: number;
}

export const adventureRouter = createTRPCRouter({
  /** Every zone with its unlock state and the trainer's wins there. */
  zones: protectedProcedure.query(async ({ ctx }) => {
    const winsByZone = await readZoneWins(ctx.db, ctx.user.id);
    const [active] = await ctx.db
      .select({ id: expeditions.id, zoneId: expeditions.zoneId })
      .from(expeditions)
      .where(
        and(
          eq(expeditions.userId, ctx.user.id),
          eq(expeditions.status, "active"),
        ),
      )
      .limit(1);

    return {
      zones: ZONES.map((zone) => toZoneView(zone, winsByZone)),
      activeZoneId: active?.zoneId ?? null,
      maxOfflineSeconds: MAX_OFFLINE_SECONDS,
    };
  }),

  /** The trainer's idle cats, ready to be assigned to a squad. */
  availableSquad: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(creatures)
      .where(
        and(eq(creatures.ownerId, ctx.user.id), eq(creatures.status, "idle")),
      )
      .orderBy(desc(creatures.level));

    return rows.map(toCreatureView);
  }),

  /** The running expedition, or `null`. Pending encounters are computed, never stored. */
  current: protectedProcedure.query(async ({ ctx }) => {
    const [expedition] = await ctx.db
      .select()
      .from(expeditions)
      .where(
        and(
          eq(expeditions.userId, ctx.user.id),
          eq(expeditions.status, "active"),
        ),
      )
      .limit(1);

    if (!expedition) return null;

    const zone = getZone(expedition.zoneId);
    const squad = await readSquad(ctx.db, expedition.id);
    const now = new Date();

    return {
      expedition: {
        id: expedition.id,
        zoneId: expedition.zoneId,
        status: expedition.status,
        startedAt: expedition.startedAt,
        lastClaimedAt: expedition.lastClaimedAt,
        winCount: expedition.winCount,
        lossCount: expedition.lossCount,
        totalGold: expedition.totalGold,
        totalXp: expedition.totalXp,
      },
      zone,
      squad,
      squadPower: squadPower(squad.map((c) => c.stats)),
      pendingEncounters: pendingEncounters(expedition.lastClaimedAt, now, zone),
      secondsToNextEncounter: secondsToNextEncounter(
        expedition.lastClaimedAt,
        now,
        zone,
      ),
      maxOfflineSeconds: MAX_OFFLINE_SECONDS,
      lastBattleLog: expedition.lastBattleLog ?? null,
      serverNow: now,
    };
  }),

  /** Sends 1–4 idle cats to an unlocked zone. */
  start: protectedProcedure
    .input(
      z.object({
        zoneId: z.string().min(1),
        creatureIds: z
          .array(z.string().uuid())
          .min(1, "Pick at least one cat")
          .max(MAX_SQUAD_SIZE, `A squad holds at most ${MAX_SQUAD_SIZE} cats`),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const zone = findZone(input.zoneId);
      if (!zone)
        throw new TRPCError({ code: "NOT_FOUND", message: "Unknown zone" });

      const creatureIds = [...new Set(input.creatureIds)];
      if (creatureIds.length !== input.creatureIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Duplicate cat in the squad",
        });
      }

      return ctx.db.transaction(async (tx) => {
        const userId = ctx.user.id;

        const active = await tx
          .select({ id: expeditions.id })
          .from(expeditions)
          .where(
            and(
              eq(expeditions.userId, userId),
              eq(expeditions.status, "active"),
            ),
          )
          .for("update");

        if (active.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "An expedition is already running. Claim or recall it first.",
          });
        }

        const winsByZone = await readZoneWins(tx, userId);
        if (!isZoneUnlocked(zone, winsByZone)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `${zone.name} is still locked`,
          });
        }

        const rows = await lockCreatures(tx, userId, creatureIds);
        const notIdle = rows.find((row) => row.status !== "idle");
        if (notIdle) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One of those cats is not idle right now",
          });
        }

        const now = new Date();
        const [created] = await tx
          .insert(expeditions)
          .values({
            userId,
            zoneId: zone.id,
            startedAt: now,
            lastClaimedAt: now,
          })
          .returning();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not start the expedition",
          });
        }

        await tx.insert(expeditionMembers).values(
          creatureIds.map((creatureId, slot) => ({
            expeditionId: created.id,
            creatureId,
            slot,
          })),
        );

        await tx
          .update(creatures)
          .set({ status: "expedition" })
          .where(inArray(creatures.id, creatureIds));

        return { expeditionId: created.id, zoneId: zone.id };
      });
    }),

  /** Resolves everything that has come due and pays it out. */
  claim: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.transaction(async (tx) =>
      settleExpedition(tx, ctx.user.id, { recall: false }),
    );
  }),

  /** Claims, then ends the expedition and releases the squad. */
  recall: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.transaction(async (tx) =>
      settleExpedition(tx, ctx.user.id, { recall: true }),
    );
  }),

  /** Finished expeditions, newest first. */
  history: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(50).default(20) })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: expeditions.id,
          zoneId: expeditions.zoneId,
          status: expeditions.status,
          startedAt: expeditions.startedAt,
          endedAt: expeditions.endedAt,
          winCount: expeditions.winCount,
          lossCount: expeditions.lossCount,
          totalGold: expeditions.totalGold,
          totalXp: expeditions.totalXp,
        })
        .from(expeditions)
        .where(
          and(
            eq(expeditions.userId, ctx.user.id),
            ne(expeditions.status, "active"),
          ),
        )
        .orderBy(desc(expeditions.startedAt))
        .limit(input.limit);

      return rows.map((row) => ({
        ...row,
        zoneName: getZone(row.zoneId).name,
        durationSec: Math.max(
          0,
          Math.floor(
            ((row.endedAt ?? row.startedAt).getTime() -
              row.startedAt.getTime()) /
              1000,
          ),
        ),
      }));
    }),

  /** Spends gold + element shards to raise a cat's upgrade tier. */
  upgrade: protectedProcedure
    .input(z.object({ creatureId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [row] = await tx
          .select()
          .from(creatures)
          .where(
            and(
              eq(creatures.id, input.creatureId),
              eq(creatures.ownerId, ctx.user.id),
            ),
          )
          .for("update");

        if (!row) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Creature not found",
          });
        }
        if (row.upgradeTier >= MAX_UPGRADE_TIER) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Already at the maximum upgrade tier (${MAX_UPGRADE_TIER})`,
          });
        }

        const cost = upgradeCost(row);
        await adjustWallet(tx, ctx.user.id, { gold: -cost.gold });
        await adjustMaterials(
          tx,
          ctx.user.id,
          cost.materials.element,
          -cost.materials.amount,
        );

        const [updated] = await tx
          .update(creatures)
          .set({ upgradeTier: row.upgradeTier + 1 })
          .where(eq(creatures.id, row.id))
          .returning();

        if (!updated) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Upgrade failed",
          });
        }

        return {
          creature: toCreatureView(updated),
          spent: cost,
          nextCost: nextUpgradeCost(updated),
        };
      });
    }),
});

/* -------------------------------------------------------------------------- */
/* Internals                                                                   */
/* -------------------------------------------------------------------------- */

type Tx = Transaction;

/**
 * The shared body of `claim` and `recall`.
 *
 * Locks the expedition first, then its squad (in id order, so concurrent
 * mutations queue rather than deadlock), resolves every due encounter, and
 * pays out through `adjustWallet` / `adjustMaterials` only.
 */
async function settleExpedition(
  tx: Tx,
  userId: string,
  opts: { recall: boolean },
): Promise<ClaimSummary> {
  const [expedition] = await tx
    .select()
    .from(expeditions)
    .where(
      and(eq(expeditions.userId, userId), eq(expeditions.status, "active")),
    )
    .for("update");

  if (!expedition) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No expedition is running",
    });
  }

  const zone = getZone(expedition.zoneId);
  const memberIds = await readMemberIds(tx, expedition.id);
  const rows = await lockCreatures(tx, userId, memberIds);
  const byId = new Map(rows.map((row) => [row.id, row]));
  const squad: SquadCreature[] = memberIds
    .map((id) => byId.get(id))
    .filter((row): row is Creature => row !== undefined)
    .map(toSquadCreature);

  const now = new Date();
  const result = resolveExpedition({ expedition, squad, zone, now });

  // 1. XP and levels.
  for (const gain of result.xpPerCreature) {
    if (gain.xpGained === 0) continue;
    await tx
      .update(creatures)
      .set({ level: gain.levelAfter, xp: gain.xpAfter })
      .where(eq(creatures.id, gain.creatureId));
  }

  // 2. Currency and materials — never touched directly.
  if (result.rewards.gold > 0 || result.rewards.gems > 0) {
    await adjustWallet(tx, userId, {
      gold: result.rewards.gold,
      gems: result.rewards.gems,
    });
  }
  if (result.rewards.materials > 0) {
    await adjustMaterials(tx, userId, zone.element, result.rewards.materials);
  }

  // 3. Zone progress.
  let zoneWins = 0;
  if (result.winCount > 0) {
    const [progress] = await tx
      .insert(zoneProgress)
      .values({ userId, zoneId: zone.id, wins: result.winCount })
      .onConflictDoUpdate({
        target: [zoneProgress.userId, zoneProgress.zoneId],
        set: { wins: sql`${zoneProgress.wins} + ${result.winCount}` },
      })
      .returning({ wins: zoneProgress.wins });
    zoneWins = progress?.wins ?? result.winCount;
  } else {
    zoneWins = (await readZoneWins(tx, userId))[zone.id] ?? 0;
  }

  // 4. The expedition row itself.
  const ended = result.retreated || opts.recall;
  await tx
    .update(expeditions)
    .set({
      winCount: expedition.winCount + result.winCount,
      lossCount: expedition.lossCount + result.lossCount,
      totalGold: expedition.totalGold + result.rewards.gold,
      totalXp: expedition.totalXp + result.rewards.xp,
      lastClaimedAt: nextClaimedAt(
        expedition.lastClaimedAt,
        now,
        result.secondsConsumed,
      ),
      lastBattleLog: result.latestFight ?? expedition.lastBattleLog,
      status: ended ? (result.retreated ? "retreated" : "completed") : "active",
      endedAt: ended ? now : null,
    })
    .where(eq(expeditions.id, expedition.id));

  // 5. Release the squad when the run is over.
  if (ended && memberIds.length > 0) {
    await tx
      .update(creatures)
      .set({ status: "idle" })
      .where(
        and(eq(creatures.ownerId, userId), inArray(creatures.id, memberIds)),
      );
  }

  return {
    expeditionId: expedition.id,
    zoneId: zone.id,
    zoneName: zone.name,
    encounterCount: result.encounters.length,
    winCount: result.winCount,
    lossCount: result.lossCount,
    rewards: result.rewards,
    xpPerCreature: result.xpPerCreature,
    encounters: result.encounters.slice(-ENCOUNTER_LOG_LIMIT),
    latestFight: result.latestFight,
    retreated: result.retreated,
    ended,
    zoneWins,
  };
}

function toZoneView(zone: Zone, winsByZone: Record<string, number>): ZoneView {
  const req = zone.unlockRequirement;
  const wins = winsByZone[zone.id] ?? 0;
  const unlocked = isZoneUnlocked(zone, winsByZone);

  return {
    ...zone,
    unlocked,
    wins,
    winsNeeded:
      req && !unlocked
        ? Math.max(0, req.wins - (winsByZone[req.zoneId] ?? 0))
        : 0,
    unlockZoneName: req ? getZone(req.zoneId).name : null,
  };
}

async function readZoneWins(
  tx: DbOrTx,
  userId: string,
): Promise<Record<string, number>> {
  const rows = await tx
    .select({ zoneId: zoneProgress.zoneId, wins: zoneProgress.wins })
    .from(zoneProgress)
    .where(eq(zoneProgress.userId, userId));

  return Object.fromEntries(rows.map((row) => [row.zoneId, row.wins] as const));
}

async function readMemberIds(tx: Tx, expeditionId: string): Promise<string[]> {
  const rows = await tx
    .select({ creatureId: expeditionMembers.creatureId })
    .from(expeditionMembers)
    .where(eq(expeditionMembers.expeditionId, expeditionId))
    .orderBy(asc(expeditionMembers.slot));

  return rows.map((row) => row.creatureId);
}

/** Locks the trainer's creatures in a stable order and verifies ownership. */
async function lockCreatures(
  tx: Tx,
  userId: string,
  creatureIds: readonly string[],
): Promise<Creature[]> {
  if (creatureIds.length === 0) return [];

  const rows = await tx
    .select()
    .from(creatures)
    .where(
      and(
        eq(creatures.ownerId, userId),
        inArray(creatures.id, [...creatureIds]),
      ),
    )
    .orderBy(asc(creatures.id))
    .for("update");

  if (rows.length !== new Set(creatureIds).size) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "One of those cats is not in your collection",
    });
  }

  return rows;
}

async function readSquad(
  db: DbOrTx,
  expeditionId: string,
): Promise<CreatureView[]> {
  const rows = await db
    .select({ creature: creatures })
    .from(expeditionMembers)
    .innerJoin(creatures, eq(creatures.id, expeditionMembers.creatureId))
    .where(eq(expeditionMembers.expeditionId, expeditionId))
    .orderBy(asc(expeditionMembers.slot));

  return rows.map((row) => toCreatureView(row.creature));
}

function toSquadCreature(row: Creature): SquadCreature {
  return {
    id: row.id,
    name: row.nickname ?? getSpecies(row.speciesId).name,
    speciesId: row.speciesId,
    level: row.level,
    xp: row.xp,
    upgradeTier: row.upgradeTier,
  };
}

export type { Expedition };
