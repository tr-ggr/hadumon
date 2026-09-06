/**
 * Sprint 04 — Async PvP & ranked ladder.
 *
 * Every trainer parks a 1–4 cat defense team; other trainers spend one of ten
 * daily attacks on it. The battle resolves server-side with the shared engine
 * and the full log is persisted, so replays are a playback of stored data and
 * never a re-simulation.
 */
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { toCreatureView } from "~/server/api/routers/creatures";
import type { DbOrTx } from "~/server/db";
import { users } from "~/server/db/schema/auth";
import {
  attackQuota,
  battles,
  defenseTeams,
  type Battle,
} from "~/server/db/schema/battle";
import { creatures, type Creature } from "~/server/db/schema/creatures";
import {
  simulateBattle,
  type BattleResult,
  type Combatant,
} from "~/server/game/battle";
import type { Element } from "~/server/game/elements";
import {
  ATTACKS_PER_DAY,
  MAX_TEAM_SIZE,
  ratingTier,
  REMATCH_COOLDOWN_MS,
  updateRatings,
  WIN_GEM_REWARD,
  WIN_GOLD_REWARD,
} from "~/server/game/rating";
import type { Rarity } from "~/server/game/species";
import { adjustWallet } from "~/server/game/wallet";

/* -------------------------------------------------------------------------- */
/* Views                                                                       */
/* -------------------------------------------------------------------------- */

/** Compact cat used in team previews (sprite + level + power). */
export interface TeamMemberView {
  id: string;
  speciesId: string;
  name: string;
  level: number;
  power: number;
  element: Element;
  rarity: Rarity;
}

export interface QuotaView {
  used: number;
  limit: number;
  remaining: number;
  day: string;
}

export interface TrainerView {
  id: string;
  username: string;
  displayName: string;
  rating: number;
  isBot: boolean;
  tier: string;
}

export interface OpponentView extends TrainerView {
  team: TeamMemberView[];
  power: number;
}

export interface BattleSummaryView {
  id: string;
  createdAt: Date;
  role: "attacker" | "defender";
  won: boolean;
  opponent: { id: string; displayName: string; isBot: boolean };
  ratingBefore: number;
  ratingAfter: number;
  ratingDelta: number;
  reward: { gold: number; gems: number };
}

export interface BattleDetailView extends BattleSummaryView {
  seed: string;
  rounds: number;
  log: BattleResult;
  attackerTeam: Combatant[];
  defenderTeam: Combatant[];
  attacker: { id: string; displayName: string; isBot: boolean };
  defender: { id: string; displayName: string; isBot: boolean };
}

export interface LadderRowView extends TrainerView {
  rank: number;
  isMe: boolean;
  sprite: string | null;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const teamInput = z
  .array(z.string().uuid())
  .min(1, "Pick at least one cat")
  .max(MAX_TEAM_SIZE, `A team holds at most ${MAX_TEAM_SIZE} cats`)
  .refine(
    (ids) => new Set(ids).size === ids.length,
    "The same cat twice is cheating",
  );

/** The UTC calendar day quotas reset on. */
function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function toTeamMember(row: Creature): TeamMemberView {
  const view = toCreatureView(row);
  return {
    id: view.id,
    speciesId: view.speciesId,
    name: view.name,
    level: view.level,
    power: view.power,
    element: view.species.element,
    rarity: view.species.rarity,
  };
}

function toCombatant(row: Creature): Combatant {
  const view = toCreatureView(row);
  return {
    id: view.id,
    name: view.name,
    speciesId: view.speciesId,
    element: view.species.element,
    stats: view.stats,
  };
}

function teamPower(members: readonly TeamMemberView[]): number {
  return members.reduce((total, member) => total + member.power, 0);
}

/** Explicit field picks — `users` rows also carry a password hash. */
function toTrainer(row: {
  id: string;
  username: string;
  displayName: string;
  rating: number;
  isBot: boolean;
}): TrainerView {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    rating: row.rating,
    isBot: row.isBot,
    tier: ratingTier(row.rating),
  };
}

/**
 * Loads the given creature ids that `ownerId` still owns, in the order asked
 * for. Missing rows (sold, traded away) are silently dropped — a stale defense
 * team should shrink, not error.
 */
async function loadOwnedCreatures(
  tx: DbOrTx,
  ownerId: string,
  ids: readonly string[],
): Promise<Creature[]> {
  if (ids.length === 0) return [];

  const rows = await tx
    .select()
    .from(creatures)
    .where(
      and(eq(creatures.ownerId, ownerId), inArray(creatures.id, [...ids])),
    );

  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

async function readQuota(tx: DbOrTx, userId: string): Promise<QuotaView> {
  const day = utcDay();
  const [row] = await tx
    .select({ count: attackQuota.count })
    .from(attackQuota)
    .where(and(eq(attackQuota.userId, userId), eq(attackQuota.day, day)))
    .limit(1);

  const used = Math.min(ATTACKS_PER_DAY, row?.count ?? 0);
  return {
    used,
    limit: ATTACKS_PER_DAY,
    remaining: ATTACKS_PER_DAY - used,
    day,
  };
}

function toSummary(
  row: Pick<
    Battle,
    | "id"
    | "createdAt"
    | "attackerId"
    | "defenderId"
    | "winner"
    | "attackerRatingBefore"
    | "attackerRatingAfter"
    | "defenderRatingBefore"
    | "defenderRatingAfter"
    | "goldReward"
    | "gemReward"
  >,
  attacker: { id: string; displayName: string; isBot: boolean },
  defender: { id: string; displayName: string; isBot: boolean },
  viewerId: string,
): BattleSummaryView {
  const role = row.attackerId === viewerId ? "attacker" : "defender";
  const before =
    role === "attacker" ? row.attackerRatingBefore : row.defenderRatingBefore;
  const after =
    role === "attacker" ? row.attackerRatingAfter : row.defenderRatingAfter;

  return {
    id: row.id,
    createdAt: row.createdAt,
    role,
    won: row.winner === role,
    opponent: role === "attacker" ? defender : attacker,
    ratingBefore: before,
    ratingAfter: after,
    ratingDelta: after - before,
    reward:
      role === "attacker"
        ? { gold: row.goldReward, gems: row.gemReward }
        : { gold: 0, gems: 0 },
  };
}

/* -------------------------------------------------------------------------- */
/* Router                                                                      */
/* -------------------------------------------------------------------------- */

export const battleRouter = createTRPCRouter({
  /** The caller's defense team, its power, and today's attack quota. */
  getDefense: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(defenseTeams)
      .where(eq(defenseTeams.userId, ctx.user.id))
      .limit(1);

    const owned = await loadOwnedCreatures(
      ctx.db,
      ctx.user.id,
      row?.creatureIds ?? [],
    );
    const team = owned.map(toTeamMember);

    return {
      team,
      power: teamPower(team),
      updatedAt: row?.updatedAt ?? null,
      quota: await readQuota(ctx.db, ctx.user.id),
    };
  }),

  /** Sets the defense team. Any creature status is allowed. */
  setDefense: protectedProcedure
    .input(z.object({ creatureIds: teamInput }))
    .mutation(async ({ ctx, input }) => {
      const owned = await loadOwnedCreatures(
        ctx.db,
        ctx.user.id,
        input.creatureIds,
      );
      if (owned.length !== input.creatureIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You don't own all of those cats",
        });
      }

      const creatureIds = owned.map((row) => row.id);
      const [row] = await ctx.db
        .insert(defenseTeams)
        .values({ userId: ctx.user.id, creatureIds })
        .onConflictDoUpdate({
          target: defenseTeams.userId,
          set: { creatureIds, updatedAt: new Date() },
        })
        .returning();

      const team = owned.map(toTeamMember);
      return {
        team,
        power: teamPower(team),
        updatedAt: row?.updatedAt ?? new Date(),
      };
    }),

  /**
   * Up to 8 attackable trainers: the four rated just above the caller and the
   * four just below. Excludes the caller, trainers without a defense team, and
   * anyone the caller has already attacked in the last hour.
   */
  opponents: protectedProcedure.query(
    async ({ ctx }): Promise<OpponentView[]> => {
      const cutoff = new Date(Date.now() - REMATCH_COOLDOWN_MS);
      const recent = await ctx.db
        .selectDistinct({ id: battles.defenderId })
        .from(battles)
        .where(
          and(
            eq(battles.attackerId, ctx.user.id),
            gt(battles.createdAt, cutoff),
          ),
        );

      const excluded = new Set(recent.map((row) => row.id));
      excluded.add(ctx.user.id);

      const columns = {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        rating: users.rating,
        isBot: users.isBot,
        creatureIds: defenseTeams.creatureIds,
      };

      const notExcluded = notInArray(users.id, [...excluded]);

      const [above, below] = await Promise.all([
        ctx.db
          .select(columns)
          .from(defenseTeams)
          .innerJoin(users, eq(users.id, defenseTeams.userId))
          .where(and(gte(users.rating, ctx.user.rating), notExcluded))
          .orderBy(asc(users.rating), asc(users.id))
          .limit(4),
        ctx.db
          .select(columns)
          .from(defenseTeams)
          .innerJoin(users, eq(users.id, defenseTeams.userId))
          .where(and(lt(users.rating, ctx.user.rating), notExcluded))
          .orderBy(desc(users.rating), asc(users.id))
          .limit(4),
      ]);

      const rows = [...above, ...below];
      if (rows.length === 0) return [];

      const wantedIds = [...new Set(rows.flatMap((row) => row.creatureIds))];
      const creatureRows =
        wantedIds.length === 0
          ? []
          : await ctx.db
              .select()
              .from(creatures)
              .where(inArray(creatures.id, wantedIds));

      const byId = new Map(creatureRows.map((row) => [row.id, row]));

      return rows
        .map((row) => {
          const team = row.creatureIds
            .flatMap((id) => {
              const creature = byId.get(id);
              // Defense slots whose cat changed hands simply disappear.
              return creature?.ownerId === row.id ? [creature] : [];
            })
            .map(toTeamMember);

          return { ...toTrainer(row), team, power: teamPower(team) };
        })
        .filter((opponent) => opponent.team.length > 0)
        .sort((a, b) => b.rating - a.rating);
    },
  ),

  /**
   * Spends one attack. Locks both trainers' rows (ordered by id, so two
   * simultaneous attacks can never deadlock), resolves the battle from live
   * stats, moves both ratings and pays the winner — all in one transaction.
   */
  attack: protectedProcedure
    .input(z.object({ defenderId: z.string().uuid(), creatureIds: teamInput }))
    .mutation(async ({ ctx, input }): Promise<BattleDetailView> => {
      if (input.defenderId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot attack yourself",
        });
      }

      return ctx.db.transaction(async (tx) => {
        // Deterministic lock order avoids deadlocks between mutual attacks.
        const locked = await tx
          .select({
            id: users.id,
            displayName: users.displayName,
            rating: users.rating,
            isBot: users.isBot,
          })
          .from(users)
          .where(inArray(users.id, [ctx.user.id, input.defenderId]))
          .orderBy(asc(users.id))
          .for("update");

        const attacker = locked.find((row) => row.id === ctx.user.id);
        const defender = locked.find((row) => row.id === input.defenderId);
        if (!attacker || !defender) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Trainer not found",
          });
        }

        const day = utcDay();
        const [quotaRow] = await tx
          .select({ count: attackQuota.count })
          .from(attackQuota)
          .where(
            and(eq(attackQuota.userId, attacker.id), eq(attackQuota.day, day)),
          )
          .limit(1);

        const used = quotaRow?.count ?? 0;
        if (used >= ATTACKS_PER_DAY) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `You've used all ${ATTACKS_PER_DAY} attacks today. Come back tomorrow.`,
          });
        }

        const [defenseRow] = await tx
          .select({ creatureIds: defenseTeams.creatureIds })
          .from(defenseTeams)
          .where(eq(defenseTeams.userId, defender.id))
          .limit(1);

        const defenderRows = await loadOwnedCreatures(
          tx,
          defender.id,
          defenseRow?.creatureIds ?? [],
        );
        if (defenderRows.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${defender.displayName} has no defense team to fight`,
          });
        }

        const attackerRows = await loadOwnedCreatures(
          tx,
          attacker.id,
          input.creatureIds,
        );
        if (attackerRows.length !== input.creatureIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You don't own all of those cats",
          });
        }

        const attackerTeam = attackerRows.map(toCombatant);
        const defenderTeam = defenderRows.map(toCombatant);
        const seed = `pvp:${randomUUID()}`;
        const result = simulateBattle(attackerTeam, defenderTeam, seed);
        const attackerWon = result.winner === "A";

        const next = updateRatings(
          attacker.rating,
          defender.rating,
          attackerWon,
        );

        await tx
          .update(users)
          .set({ rating: next.attacker })
          .where(eq(users.id, attacker.id));
        await tx
          .update(users)
          .set({ rating: next.defender })
          .where(eq(users.id, defender.id));

        const reward = attackerWon
          ? { gold: WIN_GOLD_REWARD, gems: WIN_GEM_REWARD }
          : { gold: 0, gems: 0 };
        if (attackerWon) {
          await adjustWallet(tx, attacker.id, reward);
        }

        const [row] = await tx
          .insert(battles)
          .values({
            attackerId: attacker.id,
            defenderId: defender.id,
            winner: attackerWon ? "attacker" : "defender",
            attackerRatingBefore: attacker.rating,
            attackerRatingAfter: next.attacker,
            defenderRatingBefore: defender.rating,
            defenderRatingAfter: next.defender,
            seed,
            log: result,
            attackerTeam,
            defenderTeam,
            goldReward: reward.gold,
            gemReward: reward.gems,
          })
          .returning();

        if (!row) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Battle could not be recorded",
          });
        }

        await tx
          .insert(attackQuota)
          .values({ userId: attacker.id, day, count: 1 })
          .onConflictDoUpdate({
            target: [attackQuota.userId, attackQuota.day],
            set: { count: sql`${attackQuota.count} + 1` },
          });

        const attackerInfo = {
          id: attacker.id,
          displayName: attacker.displayName,
          isBot: attacker.isBot,
        };
        const defenderInfo = {
          id: defender.id,
          displayName: defender.displayName,
          isBot: defender.isBot,
        };

        return {
          ...toSummary(row, attackerInfo, defenderInfo, ctx.user.id),
          seed: row.seed,
          rounds: result.rounds,
          log: result,
          attackerTeam,
          defenderTeam,
          attacker: attackerInfo,
          defender: defenderInfo,
        };
      });
    }),

  /** One battle in full, for replay. Only the two participants may read it. */
  battle: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }): Promise<BattleDetailView> => {
      const attackerUser = alias(users, "attacker_user");
      const defenderUser = alias(users, "defender_user");

      const [row] = await ctx.db
        .select({
          battle: battles,
          attacker: {
            id: attackerUser.id,
            displayName: attackerUser.displayName,
            isBot: attackerUser.isBot,
          },
          defender: {
            id: defenderUser.id,
            displayName: defenderUser.displayName,
            isBot: defenderUser.isBot,
          },
        })
        .from(battles)
        .innerJoin(attackerUser, eq(attackerUser.id, battles.attackerId))
        .innerJoin(defenderUser, eq(defenderUser.id, battles.defenderId))
        .where(
          and(
            eq(battles.id, input.id),
            or(
              eq(battles.attackerId, ctx.user.id),
              eq(battles.defenderId, ctx.user.id),
            ),
          ),
        )
        .limit(1);

      if (!row)
        throw new TRPCError({ code: "NOT_FOUND", message: "Battle not found" });

      return {
        ...toSummary(row.battle, row.attacker, row.defender, ctx.user.id),
        seed: row.battle.seed,
        rounds: row.battle.log.rounds,
        log: row.battle.log,
        attackerTeam: row.battle.attackerTeam,
        defenderTeam: row.battle.defenderTeam,
        attacker: row.attacker,
        defender: row.defender,
      };
    }),

  /** Recent battles the caller fought — as attacker and as defender. */
  history: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().min(1).max(50).default(20) })
        .optional(),
    )
    .query(async ({ ctx, input }): Promise<BattleSummaryView[]> => {
      const attackerUser = alias(users, "attacker_user");
      const defenderUser = alias(users, "defender_user");

      const rows = await ctx.db
        .select({
          id: battles.id,
          createdAt: battles.createdAt,
          attackerId: battles.attackerId,
          defenderId: battles.defenderId,
          winner: battles.winner,
          attackerRatingBefore: battles.attackerRatingBefore,
          attackerRatingAfter: battles.attackerRatingAfter,
          defenderRatingBefore: battles.defenderRatingBefore,
          defenderRatingAfter: battles.defenderRatingAfter,
          goldReward: battles.goldReward,
          gemReward: battles.gemReward,
          attacker: {
            id: attackerUser.id,
            displayName: attackerUser.displayName,
            isBot: attackerUser.isBot,
          },
          defender: {
            id: defenderUser.id,
            displayName: defenderUser.displayName,
            isBot: defenderUser.isBot,
          },
        })
        .from(battles)
        .innerJoin(attackerUser, eq(attackerUser.id, battles.attackerId))
        .innerJoin(defenderUser, eq(defenderUser.id, battles.defenderId))
        .where(
          or(
            eq(battles.attackerId, ctx.user.id),
            eq(battles.defenderId, ctx.user.id),
          ),
        )
        .orderBy(desc(battles.createdAt))
        .limit(input?.limit ?? 20);

      return rows.map((row) =>
        toSummary(row, row.attacker, row.defender, ctx.user.id),
      );
    }),

  /** Top 50 by rating plus the caller's own rank. */
  ladder: protectedProcedure.query(async ({ ctx }) => {
    const top = await ctx.db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        rating: users.rating,
        isBot: users.isBot,
        creatureIds: defenseTeams.creatureIds,
      })
      .from(users)
      .leftJoin(defenseTeams, eq(defenseTeams.userId, users.id))
      .orderBy(desc(users.rating), asc(users.id))
      .limit(50);

    // Same ordering as the query above: rating desc, then id asc.
    const [ahead] = await ctx.db
      .select({ value: count() })
      .from(users)
      .where(
        or(
          gt(users.rating, ctx.user.rating),
          and(eq(users.rating, ctx.user.rating), lt(users.id, ctx.user.id)),
        ),
      );

    const myRank = (ahead?.value ?? 0) + 1;

    const firstIds = top.flatMap((row) => {
      const first = row.creatureIds?.[0];
      return first ? [first] : [];
    });
    const spriteRows =
      firstIds.length === 0
        ? []
        : await ctx.db
            .select({ id: creatures.id, speciesId: creatures.speciesId })
            .from(creatures)
            .where(inArray(creatures.id, firstIds));
    const spriteById = new Map(
      spriteRows.map((row) => [row.id, row.speciesId]),
    );

    const rows: LadderRowView[] = top.map((row, index) => ({
      ...toTrainer(row),
      rank: index + 1,
      isMe: row.id === ctx.user.id,
      sprite: spriteById.get(row.creatureIds?.[0] ?? "") ?? null,
    }));

    const inTop = rows.some((row) => row.isMe);
    const [myDefense] = inTop
      ? []
      : await ctx.db
          .select({ creatureIds: defenseTeams.creatureIds })
          .from(defenseTeams)
          .where(eq(defenseTeams.userId, ctx.user.id))
          .limit(1);

    const [mySprite] = myDefense?.creatureIds?.[0]
      ? await ctx.db
          .select({ speciesId: creatures.speciesId })
          .from(creatures)
          .where(eq(creatures.id, myDefense.creatureIds[0]))
          .limit(1)
      : [];

    const mine = rows.find((row) => row.isMe);
    const me: LadderRowView = mine ?? {
      ...toTrainer(ctx.user),
      rank: myRank,
      isMe: true,
      sprite: mySprite?.speciesId ?? null,
    };

    return { rows, me, inTop, total: rows.length };
  }),
});
