import { randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DbOrTx, Transaction } from "~/server/db";
import { runs, unlocks, type Run } from "~/server/db/schema/runs";
import { ROWS } from "~/server/game/cats";
import { ELEMENTS } from "~/server/game/elements";
import { IllegalAction, type MatchEvent } from "~/server/game/match";
import {
  abandonRun,
  actInRun,
  chooseReward,
  startRun,
  summarizeRun,
  type RunState,
} from "~/server/game/run";
import {
  earnedUnlocks,
  poolFromUnlocks,
  STARTING_UNLOCKS,
  UNLOCK_KINDS,
  type Unlock,
  type UnlockKind,
} from "~/server/game/unlocks";
import { toRunView, type RunView } from "~/server/game/view";

const index = z.number().int().min(0).max(63);

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("keep"),
    cats: z.array(index).max(8),
    essence: z.array(z.enum(ELEMENTS)).max(8),
  }),
  z.object({ type: z.literal("play"), hand: index, row: z.enum(ROWS) }),
  z.object({ type: z.literal("hunt"), dice: z.array(index).max(8) }),
  z.object({
    type: z.literal("den"),
    targets: z.array(z.object({ row: z.enum(ROWS), col: index })).max(8),
  }),
  z.object({
    type: z.literal("prowl"),
    picks: z.array(z.union([z.literal("deck"), index])).max(8),
  }),
  z.object({ type: z.literal("reroll") }),
  z.object({ type: z.literal("resolve"), choice: index.nullable() }),
]);

const version = z.number().int().min(0);

export interface RunSnapshot {
  id: string;
  /** Send this back with the next action; a stale value is rejected. */
  version: number;
  view: RunView;
}

export interface RunUpdate extends RunSnapshot {
  events: MatchEvent[];
  /** What the run unlocked, set once when it ends. */
  unlocked: Unlock[];
}

function snapshot(run: Pick<Run, "id" | "version" | "state">): RunSnapshot {
  return { id: run.id, version: run.version, view: toRunView(run.state) };
}

function isUnlockKind(value: string): value is UnlockKind {
  return (UNLOCK_KINDS as readonly string[]).includes(value);
}

/** Everything the account holds: the starting set plus what runs have earned. */
export async function heldUnlocks(
  db: DbOrTx,
  userId: string,
): Promise<Unlock[]> {
  const rows = await db
    .select({ kind: unlocks.kind, key: unlocks.key })
    .from(unlocks)
    .where(eq(unlocks.userId, userId));
  const earned = rows.flatMap(({ kind, key }) =>
    isUnlockKind(kind) ? [{ kind, key }] : [],
  );
  return [...STARTING_UNLOCKS, ...earned];
}

async function lockActiveRun(
  tx: Transaction,
  userId: string,
  expected: number,
) {
  const [run] = await tx
    .select()
    .from(runs)
    .where(and(eq(runs.userId, userId), eq(runs.status, "active")))
    .limit(1)
    .for("update");
  if (!run) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "You have no run in progress.",
    });
  }
  if (run.version !== expected) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The run moved on in another tab. Reload to catch up.",
    });
  }
  return run;
}

/** Runs an engine call, turning a rules violation into a client error. */
function engine<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof IllegalAction) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    }
    throw error;
  }
}

/** Writes the next state and, if the run just ended, closes it and awards unlocks. */
async function persist(
  tx: Transaction,
  run: Run,
  state: RunState,
  events: MatchEvent[],
): Promise<RunUpdate> {
  const summary = summarizeRun(state);
  const ended = state.phase === "over" && state.outcome !== null;
  const nextVersion = run.version + 1;

  await tx
    .update(runs)
    .set({
      state,
      version: nextVersion,
      matchesWon: summary.matchesWon,
      score: summary.totalScore,
      ...(ended
        ? { status: state.outcome ?? "lost", endedAt: new Date() }
        : {}),
    })
    .where(eq(runs.id, run.id));

  let unlocked: Unlock[] = [];
  if (ended) {
    unlocked = earnedUnlocks(summary, await heldUnlocks(tx, run.userId));
    if (unlocked.length > 0) {
      await tx
        .insert(unlocks)
        .values(unlocked.map((unlock) => ({ userId: run.userId, ...unlock })))
        .onConflictDoNothing();
    }
  }
  return {
    id: run.id,
    version: nextVersion,
    view: toRunView(state),
    events,
    unlocked,
  };
}

export const runRouter = createTRPCRouter({
  /** The account's active run, or `null` when there is none. */
  current: protectedProcedure.query(
    async ({ ctx }): Promise<RunSnapshot | null> => {
      const [run] = await ctx.db
        .select({ id: runs.id, version: runs.version, state: runs.state })
        .from(runs)
        .where(and(eq(runs.userId, ctx.user.id), eq(runs.status, "active")))
        .limit(1);
      return run ? snapshot(run) : null;
    },
  ),

  /** Clans the account can start a run with. */
  clans: protectedProcedure.query(async ({ ctx }) => {
    const held = await heldUnlocks(ctx.db, ctx.user.id);
    return held.filter((u) => u.kind === "clan").map((u) => u.key);
  }),

  start: protectedProcedure
    .input(z.object({ clanId: z.enum(ELEMENTS) }))
    .mutation(async ({ ctx, input }): Promise<RunSnapshot> => {
      return ctx.db.transaction(async (tx) => {
        const held = await heldUnlocks(tx, ctx.user.id);
        if (!held.some((u) => u.kind === "clan" && u.key === input.clanId)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You have not unlocked that clan.",
          });
        }
        const seed = randomBytes(16).toString("hex");
        const state = startRun({
          seed,
          clanId: input.clanId,
          pool: poolFromUnlocks(held),
        });
        // The partial unique index refuses a second active run.
        const [run] = await tx
          .insert(runs)
          .values({ userId: ctx.user.id, clanId: input.clanId, seed, state })
          .onConflictDoNothing()
          .returning();
        if (!run) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You already have a run in progress.",
          });
        }
        return snapshot(run);
      });
    }),

  act: protectedProcedure
    .input(z.object({ version, action: actionSchema }))
    .mutation(async ({ ctx, input }): Promise<RunUpdate> => {
      return ctx.db.transaction(async (tx) => {
        const run = await lockActiveRun(tx, ctx.user.id, input.version);
        const result = engine(() => actInRun(run.state, input.action));
        return persist(tx, run, result.run, result.events);
      });
    }),

  chooseReward: protectedProcedure
    .input(
      z.object({
        version,
        cat: z.string().max(40).nullable(),
        relic: z.string().max(40).nullable(),
        trim: z.string().max(40).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<RunUpdate> => {
      return ctx.db.transaction(async (tx) => {
        const run = await lockActiveRun(tx, ctx.user.id, input.version);
        const { cat, relic, trim } = input;
        const state = engine(() =>
          chooseReward(run.state, { cat, relic, trim }),
        );
        return persist(tx, run, state, []);
      });
    }),

  abandon: protectedProcedure
    .input(z.object({ version }))
    .mutation(async ({ ctx, input }): Promise<RunUpdate> => {
      return ctx.db.transaction(async (tx) => {
        const run = await lockActiveRun(tx, ctx.user.id, input.version);
        return persist(
          tx,
          run,
          engine(() => abandonRun(run.state)),
          [],
        );
      });
    }),

  /** Finished runs, newest first. */
  history: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(({ ctx, input }) =>
      ctx.db
        .select({
          id: runs.id,
          clanId: runs.clanId,
          status: runs.status,
          matchesWon: runs.matchesWon,
          score: runs.score,
          startedAt: runs.startedAt,
          endedAt: runs.endedAt,
        })
        .from(runs)
        .where(and(eq(runs.userId, ctx.user.id), ne(runs.status, "active")))
        .orderBy(desc(runs.startedAt))
        .limit(input.limit),
    ),
});
