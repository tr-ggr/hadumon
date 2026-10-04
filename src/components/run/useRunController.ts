"use client";

import { useCallback, useRef, useState } from "react";

import { useToast } from "~/components/ui";
import type { Element } from "~/server/game/elements";
import type { Action } from "~/server/game/match";
import type { RewardChoice } from "~/server/game/run";
import { api, type RouterOutputs } from "~/trpc/react";

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

interface Recap {
  /** The run and match the recap belongs to; anything else is stale. */
  key: string;
  log: LogEntry[];
  /** The rival's last card with its details, which a reload cannot recover. */
  rival: RivalNews | null;
  /** A goal that was just scored and has not been acknowledged. */
  goal: GoalEvent | null;
}

const NO_RECAP: Recap = { key: "", log: [], rival: null, goal: null };

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
  const nextLogId = useRef(1);

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
          };
        });
      }
      store(update);
    },
    onError,
  });

  const reward = api.run.chooseReward.useMutation({
    onSuccess: (update) => {
      setRecap(NO_RECAP);
      store(update);
    },
    onError,
  });

  const abandon = api.run.abandon.useMutation({
    onSuccess: store,
    onError,
  });

  const snapshot = current.data ?? null;
  const live = snapshot && recap.key === matchKey(snapshot) ? recap : NO_RECAP;
  const version = snapshot?.version;

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
    dismissGoal: () => setRecap((prev) => ({ ...prev, goal: null })),
    start: (clanId: Element) => start.mutate({ clanId }),
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
    clearFinal: () => setFinal(null),
  };
}

export type RunController = ReturnType<typeof useRunController>;
