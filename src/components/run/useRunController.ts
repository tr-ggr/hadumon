"use client";

import { useCallback, useRef, useState } from "react";

import { useToast } from "~/components/ui";
import type { DifficultyId } from "~/server/game/difficulty";
import type { Element } from "~/server/game/elements";
import type { Action, MatchEvent } from "~/server/game/match";
import type { RewardChoice } from "~/server/game/run";
import type { MatchView } from "~/server/game/view";
import { api, type RouterOutputs } from "~/trpc/react";

import { climbAfter, climbFits, type ClimbRecord } from "./climb";
import {
  describeAction,
  describeEvents,
  findGoal,
  latestRivalText,
  type GoalEvent,
  type LogEntry,
  type RivalNews,
} from "./describe";

export type RunSnapshot = NonNullable<RouterOutputs["run"]["current"]>;
export type RunUpdate = RouterOutputs["run"]["act"];

/** How many actions the log keeps. */
const LOG_LIMIT = 12;

/** One answered action, with everything needed to play it back on the table. */
export interface TurnRecord {
  /** The id of the log entry this turn wrote. */
  id: number;
  before: MatchView;
  after: MatchView;
  action: Action;
  events: MatchEvent[];
  /** What the rival's card read before this turn. */
  rivalBefore: RivalNews | null;
}

interface Recap {
  /** The run and match the recap belongs to; anything else is stale. */
  key: string;
  log: LogEntry[];
  /** The rival's last card with its details, which a reload cannot recover. */
  rival: RivalNews | null;
  /** A goal that was just scored and has not been acknowledged. */
  goal: GoalEvent | null;
  /** The last turn taken. The cache already holds its result. */
  turn: TurnRecord | null;
}

const NO_RECAP: Recap = {
  key: "",
  log: [],
  rival: null,
  goal: null,
  turn: null,
};

function matchKey(snapshot: Pick<RunSnapshot, "id" | "view">): string {
  return `${snapshot.id}:${snapshot.view.matchIndex}`;
}

/**
 * The one place the run screen talks to the API. `run.current` is the source
 * of truth; every mutation writes its returned snapshot into that cache
 * instead of refetching. A finished run is `null` on the server, so the last
 * update is held here for the summary.
 */
export function useRunController() {
  const notify = useToast();
  const utils = api.useUtils();
  const current = api.run.current.useQuery(undefined, { retry: false });

  const [final, setFinal] = useState<RunUpdate | null>(null);
  const [recap, setRecap] = useState<Recap>(NO_RECAP);
  /** The id of the last turn the table finished playing back. */
  const [played, setPlayed] = useState(0);
  /** The climb up the tower still to be shown. A reload simply skips it. */
  const [climb, setClimb] = useState<ClimbRecord | null>(null);
  const nextLogId = useRef(1);
  const nextClimbId = useRef(1);

  const climbFor = useCallback(
    (trigger: Parameters<typeof climbAfter>[0], update: RunSnapshot) => {
      const next = climbAfter(trigger, update.view);
      setClimb(
        next ? { id: nextClimbId.current++, runId: update.id, ...next } : null,
      );
    },
    [],
  );

  const store = useCallback(
    (update: RunSnapshot | RunUpdate) => {
      if (update.view.phase === "over" && "events" in update) {
        setFinal(update);
        utils.run.current.setData(undefined, null);
        return;
      }
      utils.run.current.setData(undefined, {
        id: update.id,
        version: update.version,
        view: update.view,
      });
    },
    [utils],
  );

  const onError = useCallback(
    (error: { message: string; data?: { code?: string } | null }) => {
      if (error.data?.code === "CONFLICT" || error.data?.code === "NOT_FOUND") {
        setClimb(null);
        notify("The run was updated somewhere else. Caught up now.", "error");
        void utils.run.current.invalidate();
        return;
      }
      notify(error.message, "error");
    },
    [notify, utils],
  );

  const start = api.run.start.useMutation({
    onSuccess: (snapshot) => {
      setFinal(null);
      setRecap(NO_RECAP);
      climbFor("start", snapshot);
      store(snapshot);
    },
    onError,
  });

  const act = api.run.act.useMutation({
    onSuccess: (update, variables) => {
      const before = utils.run.current.getData()?.view.match;
      const after = update.view.match;
      if (before && after) {
        const key = matchKey(update);
        const entry: LogEntry = {
          id: nextLogId.current++,
          title: describeAction(before, variables.action),
          lines: describeEvents(before, after, update.events),
        };
        const rivalText = latestRivalText(after, update.events);
        const rival = rivalText ? { id: entry.id, text: rivalText } : null;
        // The last round's goal is shown by the result screen instead.
        const goal = after.phase === "over" ? null : findGoal(update.events);
        setRecap((prev) => {
          const base = prev.key === key ? prev : { ...NO_RECAP, key };
          return {
            key,
            log: [entry, ...base.log].slice(0, LOG_LIMIT),
            rival: rival ?? base.rival,
            goal: goal ?? base.goal,
            turn: {
              id: entry.id,
              before,
              after,
              action: variables.action,
              events: update.events,
              rivalBefore: base.rival,
            },
          };
        });
      }
      climbFor("act", update);
      store(update);
    },
    onError,
  });

  const reward = api.run.chooseReward.useMutation({
    onSuccess: (update) => {
      setRecap(NO_RECAP);
      climbFor("reward", update);
      store(update);
    },
    onError,
  });

  const abandon = api.run.abandon.useMutation({
    onSuccess: (update) => {
      setClimb(null);
      store(update);
    },
    onError,
  });

  const snapshot = current.data ?? null;
  // The turn that ends a run leaves no snapshot; its recap is still the live one.
  const shown = snapshot ?? final;
  const live = shown && recap.key === matchKey(shown) ? recap : NO_RECAP;
  const version = snapshot?.version;
  const finishTurn = useCallback((id: number) => setPlayed(id), []);
  const finishClimb = useCallback(
    (id: number) => setClimb((prev) => (prev?.id === id ? null : prev)),
    [],
  );

  return {
    snapshot,
    final,
    loading: current.isLoading,
    error: current.error,
    retry: () => void current.refetch(),
    /** True while any mutation is in flight; every control is disabled. */
    busy:
      start.isPending ||
      act.isPending ||
      reward.isPending ||
      abandon.isPending ||
      current.isFetching,
    log: live.log,
    news: live.rival,
    goal: live.goal,
    /**
     * The last turn while the table is still playing it back, else `null`.
     * The cache is already at its result, so a reload simply skips it.
     */
    turn: live.turn && live.turn.id !== played ? live.turn : null,
    finishTurn,
    /**
     * The climb to show before the screen the run is on, else `null`. It is
     * dropped the moment the run is anywhere but where it was heading.
     */
    climb:
      climb && shown && climbFits(climb, shown.id, shown.view) ? climb : null,
    finishClimb,
    dismissGoal: () => setRecap((prev) => ({ ...prev, goal: null })),
    start: (clanId: Element, difficulty: DifficultyId) =>
      start.mutate({ clanId, difficulty }),
    act: (action: Action) => {
      if (version !== undefined) act.mutate({ version, action });
    },
    chooseReward: (choice: RewardChoice) => {
      if (version !== undefined) reward.mutate({ version, ...choice });
    },
    abandon: () => {
      if (version !== undefined) abandon.mutate({ version });
    },
    /** Leaves the summary of a finished run. */
    clearFinal: () => {
      setClimb(null);
      setFinal(null);
    },
  };
}

export type RunController = ReturnType<typeof useRunController>;
