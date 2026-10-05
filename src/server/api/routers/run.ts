import { randomBytes } from "node:crypto";

import { TRPCError } from "@trpc/server";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import {
  addCards,
  addCoins,
  lockProfile,
  ownedBy,
  savedDeck,
} from "~/server/api/economy";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DbOrTx, Transaction } from "~/server/db";
import { runs, unlocks, type Run } from "~/server/db/schema/runs";
import { ROWS } from "~/server/game/cats";
import { gainCards, ownedIds } from "~/server/game/collection";
import { describeProblem, validateDeck } from "~/server/game/deck";
import { DIFFICULTIES } from "~/server/game/difficulty";
import { profiles } from "~/server/db/schema/economy";
import { ELEMENTS } from "~/server/game/elements";
import {
  IllegalAction,
  MAX_ACTION_ITEMS,
  type MatchEvent,
} from "~/server/game/match";
import { payout } from "~/server/game/payout";
import {
  abandonRun,
  actInRun,
  chooseReward,
  isCurrentRun,
  openChest,
  retireRun,
  startRun,
  summarizeRun,
  type RunState,
  type RunSummary,
} from "~/server/game/run";
import {
  earnedUnlocks,
  relicsFromUnlocks,
  STARTING_UNLOCKS,
  UNLOCK_KINDS,
  type Unlock,
  type UnlockKind,
} from "~/server/game/unlocks";
import {
  toRivalBeat,
  toRunView,
  type RivalBeat,
  type RunView,
} from "~/server/game/view";

const index = z.number().int().min(0).max(63);

const food = z.enum([...ELEMENTS, "wild"]);
const slot = z.object({ row: z.enum(ROWS), col: index });

const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("keep"),
    cats: z.array(index).max(MAX_ACTION_ITEMS),
    essence: z.array(z.enum(ELEMENTS)).max(MAX_ACTION_ITEMS),
  }),
  z.object({
    type: z.literal("play"),
    hand: index,
    row: z.enum(ROWS),
    swap: z.array(food).max(MAX_ACTION_ITEMS).optional(),
  }),
  z.object({
    type: z.literal("hunt"),
    dice: z.array(index).max(MAX_ACTION_ITEMS),
    trade: index.optional(),
  }),
  z.object({
    type: z.literal("den"),
    targets: z.array(slot).max(MAX_ACTION_ITEMS),
    trade: food.optional(),
  }),
  z.object({
    type: z.literal("prowl"),
    picks: z.array(z.union([z.literal("deck"), index])).max(MAX_ACTION_ITEMS),
    trade: slot.optional(),
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
  /**
   * The rival's seat and the feeder after each of the rival's actions in
   * `events`, in order, for the table to play its turn back.
   */
  beats: RivalBeat[];
  /** What the run unlocked, set once when it ends. */
  unlocked: Unlock[];
  /** The coins the run paid, set once when it ends; `null` until then. */
  coins: number | null;
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
  // A run from an older game is closed the next time the page asks for it.
  if (!isCurrentRun(run.state)) {
    throw new TRPCError({
      code: "CONFLICT",
      message:
        "That run was saved by an older version of the game. Reload to start a new one.",
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

/**
 * Closes a run this game cannot read: abandoned, keeping the unlocks its won
 * matches earned, which is what abandoning it would have done.
 */
async function retireStaleRun(
  tx: Transaction,
  run: Pick<Run, "id" | "userId" | "version" | "state">,
): Promise<void> {
  const summary = retireRun(run.state);
  // Only the fields every version has written are read.
  const old = run.state as unknown as { results?: unknown } | null;
  const finished = Array.isArray(old?.results) ? old.results.length : 0;
  const coins = coinsFor(summary);
  const [closed] = await tx
    .update(runs)
    .set({
      version: run.version + 1,
      matchesWon: summary.matchesWon,
      score: summary.totalScore,
      coins,
      status: "abandoned",
      endedAt: new Date(),
    })
    .where(and(eq(runs.id, run.id), eq(runs.status, "active")))
    .returning({ id: runs.id });
  // Closed by another request since it was read: that one paid for it.
  if (!closed) return;
  await payRun(tx, run.userId, coins, finished);
  await award(tx, run.userId, summary);
}

/** The account's active run, if it has one; an unreadable one is closed first. */
async function activeRun(tx: Transaction, userId: string) {
  const [run] = await tx
    .select()
    .from(runs)
    .where(and(eq(runs.userId, userId), eq(runs.status, "active")))
    .limit(1)
    .for("update");
  if (!run) return null;
  if (isCurrentRun(run.state)) return run;
  await retireStaleRun(tx, run);
  return null;
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

/** The coins a closed run pays. What it is counted from never leaves the server. */
function coinsFor(summary: RunSummary): number {
  return payout(summary);
}

/**
 * Records what a closed run unlocked. A cat's rule is a prize paid once: it
 * goes on the ledger, and a copy of the cat goes into the collection unless
 * the account already holds all it can.
 */
async function award(
  tx: Transaction,
  userId: string,
  summary: RunSummary,
): Promise<Unlock[]> {
  const unlocked = earnedUnlocks(summary, await heldUnlocks(tx, userId));
  if (unlocked.length === 0) return unlocked;
  await tx
    .insert(unlocks)
    .values(unlocked.map((unlock) => ({ userId, ...unlock })))
    .onConflictDoNothing();
  const cats = unlocked.filter((u) => u.kind === "cat").map((u) => u.key);
  if (cats.length > 0) {
    const { gains } = gainCards(await ownedBy(tx, userId), cats);
    await addCards(
      tx,
      userId,
      gains.filter((gain) => gain.kept).map((gain) => gain.catId),
    );
  }
  return unlocked;
}

/**
 * Pays a run that has just been closed, in the transaction that closed it.
 * A run that finished a match also uses up the ticket its chest and its
 * theft were drawn from; one given up before that keeps it, so starting
 * again deals the same.
 */
async function payRun(
  tx: Transaction,
  userId: string,
  coins: number,
  finished: number,
): Promise<void> {
  // The run row is locked already: run first, then profile, everywhere.
  await lockProfile(tx, userId);
  if (coins > 0) await addCoins(tx, userId, coins);
  if (finished > 0) {
    await tx
      .update(profiles)
      .set({ runTicket: sql`${profiles.runTicket} + 1` })
      .where(eq(profiles.userId, userId));
  }
}

/**
 * Writes the next state and, if the run just ended, closes it, pays its
 * coins and awards its unlocks.
 */
async function persist(
  tx: Transaction,
  run: Run,
  state: RunState,
  events: MatchEvent[],
  beats: RivalBeat[] = [],
): Promise<RunUpdate> {
  const summary = summarizeRun(state);
  const ended = state.phase === "over" && state.outcome !== null;
  const nextVersion = run.version + 1;
  const coins = ended ? coinsFor(summary) : null;

  // Only a run still active is written, so one can never be closed, or
  // paid, twice.
  const [written] = await tx
    .update(runs)
    .set({
      state,
      version: nextVersion,
      matchesWon: summary.matchesWon,
      score: summary.totalScore,
      ...(ended
        ? {
            status: state.outcome ?? "lost",
            endedAt: new Date(),
            coins: coins ?? 0,
          }
        : {}),
    })
    .where(and(eq(runs.id, run.id), eq(runs.status, "active")))
    .returning({ id: runs.id });
  if (!written) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The run moved on in another tab. Reload to catch up.",
    });
  }

  let unlocked: Unlock[] = [];
  if (ended) {
    // The profile is locked by the payment, so the collection cannot move
    // under the prizes.
    await payRun(tx, run.userId, coins ?? 0, state.results.length);
    unlocked = await award(tx, run.userId, summary);
  }
  return {
    id: run.id,
    version: nextVersion,
    view: toRunView(state),
    events,
    beats,
    unlocked,
    coins,
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
      if (!run) return null;
      if (isCurrentRun(run.state)) return snapshot(run);
      // Saved by an older game: close it, and the account starts clean.
      await ctx.db.transaction((tx) => activeRun(tx, ctx.user.id));
      return null;
    },
  ),

  /**
   * Starts a run with the deck the account has saved. A deck that is no
   * longer legal is refused, never mended: its owner is sent to fix it.
   */
  start: protectedProcedure
    .input(z.object({ difficulty: z.enum(DIFFICULTIES).default("kitten") }))
    .mutation(async ({ ctx, input }): Promise<RunSnapshot> => {
      const userId = ctx.user.id;
      return ctx.db.transaction(async (tx) => {
        // An unreadable run left active would refuse the new one below.
        await activeRun(tx, userId);
        const profile = await lockProfile(tx, userId);
        const [held, owned, deck] = await Promise.all([
          heldUnlocks(tx, userId),
          ownedBy(tx, userId),
          savedDeck(tx, userId),
        ]);
        const [problem] = validateDeck(deck.cards, owned);
        if (problem) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Your deck cannot be played. ${describeProblem(problem)} Mend it on the Deck page.`,
          });
        }
        const seed = randomBytes(16).toString("hex");
        const state = startRun({
          seed,
          ticket: `${userId}:${profile.runTicket}`,
          deck: deck.cards,
          pool: { cats: ownedIds(owned), relics: relicsFromUnlocks(held) },
          difficulty: input.difficulty,
        });
        // The partial unique index refuses a second active run.
        const [run] = await tx
          .insert(runs)
          .values({ userId, difficulty: input.difficulty, seed, state })
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

  /** Takes one relic from the opening chest, which deals the first match. */
  openChest: protectedProcedure
    .input(z.object({ version, relic: z.string().min(1).max(40) }))
    .mutation(async ({ ctx, input }): Promise<RunUpdate> => {
      return ctx.db.transaction(async (tx) => {
        const run = await lockActiveRun(tx, ctx.user.id, input.version);
        const state = engine(() => openChest(run.state, input.relic));
        return persist(tx, run, state, []);
      });
    }),

  act: protectedProcedure
    .input(z.object({ version, action: actionSchema }))
    .mutation(async ({ ctx, input }): Promise<RunUpdate> => {
      return ctx.db.transaction(async (tx) => {
        const run = await lockActiveRun(tx, ctx.user.id, input.version);
        const result = engine(() => actInRun(run.state, input.action));
        // The first state on the trail is the player's own action.
        const beats = result.trail.slice(1).map(toRivalBeat);
        return persist(tx, run, result.run, result.events, beats);
      });
    }),

  chooseReward: protectedProcedure
    .input(
      z.object({
        version,
        reclaim: z.string().max(40).nullable(),
        relic: z.string().max(40).nullable(),
        trim: z.string().max(40).nullable(),
      }),
    )
    .mutation(async ({ ctx, input }): Promise<RunUpdate> => {
      return ctx.db.transaction(async (tx) => {
        const run = await lockActiveRun(tx, ctx.user.id, input.version);
        const { reclaim, relic, trim } = input;
        const state = engine(() =>
          chooseReward(run.state, { reclaim, relic, trim }),
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
          difficulty: runs.difficulty,
          status: runs.status,
          matchesWon: runs.matchesWon,
          score: runs.score,
          coins: runs.coins,
          startedAt: runs.startedAt,
          endedAt: runs.endedAt,
        })
        .from(runs)
        .where(and(eq(runs.userId, ctx.user.id), ne(runs.status, "active")))
        .orderBy(desc(runs.startedAt))
        .limit(input.limit),
    ),
});
