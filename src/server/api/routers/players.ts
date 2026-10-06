import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNotNull,
  lt,
  max,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";

import { looksOf, type PlayerCard } from "~/server/api/looks";
import {
  playerByHandle,
  playerProfile,
  type PlayerProfile,
} from "~/server/api/players";
import { historyInput, historyOf, type RunPage } from "~/server/api/records";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema/auth";
import { profiles } from "~/server/db/schema/economy";
import { runs } from "~/server/db/schema/runs";
import { DIFFICULTIES, type DifficultyId } from "~/server/game/difficulty";
import { LEADERBOARDS, RANKED_RUNS, rate } from "~/server/game/stats";

/** Players a page of the directory lists. */
const DIRECTORY_PAGE = 24;
/** Places a leaderboard shows. */
const BOARD_PLACES = 50;
/** Runs a page of the feed lists. */
const FEED_PAGE = 20;

const handle = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9_-]+$/i);

export interface DirectoryEntry extends PlayerCard {
  runsWon: number;
  runsFinished: number;
  lastPlayed: Date | null;
}

export interface BoardPlace extends PlayerCard {
  place: number;
  runsWon: number;
  runsFinished: number;
  winRate: number | null;
  bestRun: number;
}

export interface FeedRun {
  id: string;
  difficulty: DifficultyId;
  status: "won" | "lost" | "abandoned";
  matchesWon: number;
  matchesPlayed: number;
  score: number;
  endedAt: Date;
  player: PlayerCard;
}

/** `%` and `_` typed into a search are looked for, not matched as wildcards. */
function likeEscape(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export const playersRouter = createTRPCRouter({
  /** Every player with a handle, by name, a page at a time. */
  directory: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().max(20).default(""),
        cursor: z.number().int().min(0).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = input.cursor ?? 0;
      const where: SQL[] = [isNotNull(profiles.handle)];
      if (input.query) {
        where.push(ilike(users.name, `%${likeEscape(input.query)}%`));
      }
      const finished =
        sql<number>`(select count(*) from ${runs} where ${runs.userId} = ${profiles.userId} and ${runs.status} <> 'active')`.mapWith(
          Number,
        );
      const won =
        sql<number>`(select count(*) from ${runs} where ${runs.userId} = ${profiles.userId} and ${runs.status} = 'won')`.mapWith(
          Number,
        );
      const lastPlayed =
        sql<Date | null>`(select max(${runs.startedAt}) from ${runs} where ${runs.userId} = ${profiles.userId})`.mapWith(
          runs.startedAt,
        );
      const rows = await ctx.db
        .select({
          userId: profiles.userId,
          handle: profiles.handle,
          name: users.name,
          look: profiles.look,
          runsWon: won,
          runsFinished: finished,
          lastPlayed,
        })
        .from(profiles)
        .innerJoin(users, eq(users.id, profiles.userId))
        .where(and(...where))
        .orderBy(asc(users.name), asc(profiles.handle))
        .limit(DIRECTORY_PAGE + 1)
        .offset(offset);
      const page = rows.slice(0, DIRECTORY_PAGE);
      const looks = await looksOf(ctx.db, page);
      return {
        players: page.map((row): DirectoryEntry => ({
          handle: row.handle ?? "",
          name: row.name,
          look: looks.get(row.userId)!,
          runsWon: row.runsWon,
          runsFinished: row.runsFinished,
          lastPlayed: row.lastPlayed,
        })),
        nextCursor:
          rows.length > DIRECTORY_PAGE ? offset + DIRECTORY_PAGE : null,
      };
    }),

  /**
   * The top players by runs won, by their best run's score, or by the share
   * of their runs they won once they have finished `RANKED_RUNS`. Every
   * account is ranked, whether or not it shows its runs: only the numbers
   * are shown.
   */
  leaderboard: protectedProcedure
    .input(
      z.object({
        by: z.enum(LEADERBOARDS).default("runsWon"),
        difficulty: z.enum(DIFFICULTIES).optional(),
      }),
    )
    .query(async ({ ctx, input }): Promise<BoardPlace[]> => {
      const where: SQL[] = [ne(runs.status, "active")];
      if (input.difficulty) where.push(eq(runs.difficulty, input.difficulty));
      const wonCount =
        sql<number>`count(*) filter (where ${runs.status} = 'won')`.mapWith(
          Number,
        );
      const tally = ctx.db
        .select({
          userId: runs.userId,
          runsWon: wonCount.as("runs_won"),
          runsFinished: count().as("runs_finished"),
          bestRun: max(runs.score).as("best_run"),
        })
        .from(runs)
        .where(and(...where))
        .groupBy(runs.userId)
        .as("tally");

      const winShare = sql`${tally.runsWon}::float / nullif(${tally.runsFinished}, 0)`;
      const order =
        input.by === "bestRun"
          ? [desc(tally.bestRun), desc(tally.runsWon)]
          : input.by === "winRate"
            ? [desc(winShare), desc(tally.runsWon)]
            : [desc(tally.runsWon), desc(tally.bestRun)];
      const filters: SQL[] = [isNotNull(profiles.handle)];
      if (input.by === "runsWon") filters.push(gte(tally.runsWon, 1));
      if (input.by === "winRate") {
        filters.push(gte(tally.runsFinished, RANKED_RUNS));
      }

      const rows = await ctx.db
        .select({
          userId: tally.userId,
          runsWon: tally.runsWon,
          runsFinished: tally.runsFinished,
          bestRun: tally.bestRun,
          handle: profiles.handle,
          name: users.name,
          look: profiles.look,
        })
        .from(tally)
        .innerJoin(profiles, eq(profiles.userId, tally.userId))
        .innerJoin(users, eq(users.id, tally.userId))
        .where(and(...filters))
        .orderBy(...order, asc(users.name))
        .limit(BOARD_PLACES);
      const looks = await looksOf(ctx.db, rows);
      return rows.map((row, i) => ({
        place: i + 1,
        handle: row.handle ?? "",
        name: row.name,
        look: looks.get(row.userId)!,
        runsWon: Number(row.runsWon),
        runsFinished: Number(row.runsFinished),
        winRate: rate(Number(row.runsWon), Number(row.runsFinished)),
        bestRun: Number(row.bestRun ?? 0),
      }));
    }),

  /** Runs lately ended by players who show their runs, newest first. */
  feed: protectedProcedure
    .input(
      z.object({
        cursor: z
          .object({ endedAt: z.date(), id: z.string().uuid() })
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: (SQL | undefined)[] = [
        ne(runs.status, "active"),
        isNotNull(runs.endedAt),
        eq(profiles.runsPublic, true),
        isNotNull(profiles.handle),
      ];
      if (input.cursor) {
        where.push(
          or(
            lt(runs.endedAt, input.cursor.endedAt),
            and(
              eq(runs.endedAt, input.cursor.endedAt),
              lt(runs.id, input.cursor.id),
            ),
          ),
        );
      }
      const rows = await ctx.db
        .select({
          id: runs.id,
          userId: runs.userId,
          difficulty: runs.difficulty,
          status: runs.status,
          matchesWon: runs.matchesWon,
          matchesPlayed: runs.matchesPlayed,
          score: runs.score,
          endedAt: runs.endedAt,
          handle: profiles.handle,
          name: users.name,
          look: profiles.look,
        })
        .from(runs)
        .innerJoin(profiles, eq(profiles.userId, runs.userId))
        .innerJoin(users, eq(users.id, runs.userId))
        .where(and(...where))
        .orderBy(desc(runs.endedAt), desc(runs.id))
        .limit(FEED_PAGE + 1);
      const page = rows.slice(0, FEED_PAGE);
      const looks = await looksOf(ctx.db, page);
      const last = page[page.length - 1];
      return {
        runs: page.map((row): FeedRun => ({
          id: row.id,
          difficulty: row.difficulty as DifficultyId,
          status: row.status === "active" ? "abandoned" : row.status,
          matchesWon: row.matchesWon,
          matchesPlayed: row.matchesPlayed,
          score: row.score,
          endedAt: row.endedAt ?? new Date(0),
          player: {
            handle: row.handle ?? "",
            name: row.name,
            look: looks.get(row.userId)!,
          },
        })),
        nextCursor:
          rows.length > FEED_PAGE && last?.endedAt
            ? { endedAt: last.endedAt, id: last.id }
            : null,
      };
    }),

  /** A player's profile, by handle. Anyone may read one, signed in or not. */
  profile: publicProcedure
    .input(z.object({ handle }))
    .query(async ({ ctx, input }): Promise<PlayerProfile> => {
      const profile = await playerProfile(
        ctx.db,
        input.handle,
        ctx.user?.id ?? null,
      );
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "There is no player by that name.",
        });
      }
      return profile;
    }),

  /** A page of a player's runs, if they show them, or if they are the viewer. */
  runs: publicProcedure
    .input(historyInput.extend({ handle }))
    .query(async ({ ctx, input }): Promise<RunPage> => {
      const player = await playerByHandle(ctx.db, input.handle);
      if (!player) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "There is no player by that name.",
        });
      }
      const isSelf = player.userId === ctx.user?.id;
      if (!isSelf && !player.runsPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Their runs are private.",
        });
      }
      return historyOf(ctx.db, player.userId, input, isSelf);
    }),
});
