"use client";

import Link from "next/link";
import { useState } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { countUnlocked } from "~/components/codex/entries";
import { PixelSprite } from "~/components/PixelSprite";
import { Button, ButtonLink, Panel, Skeleton } from "~/components/ui";
import type { Element } from "~/server/game/elements";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { CLANS, isClanId } from "~/server/game/run";
import { api, type RouterOutputs } from "~/trpc/react";

export interface HomeDashboardProps {
  displayName: string;
}

type RunSnapshot = NonNullable<RouterOutputs["run"]["current"]>;
type PastRun = RouterOutputs["run"]["history"][number];

/** The common cat that fronts each clan's starter deck. */
const CLAN_MASCOTS: Record<Element, string> = {
  flame: "flameclaw",
  mist: "mistpaw",
  volt: "voltwhisk",
  thorn: "thornkit",
  shade: "shadewhisker",
};

const HISTORY_LIMIT = 5;

/** The signed-in home: what to do now, what happened lately, and the codex. */
export function HomeDashboard({ displayName }: HomeDashboardProps) {
  // A run changes on another page, so a cached answer is never good enough.
  const run = api.run.current.useQuery(undefined, {
    refetchOnMount: "always",
    retry: 1,
  });

  return (
    <div className="page-wrap space-y-4">
      <section className="surface-sky flex flex-col items-center gap-6 rounded-[28px] p-6 text-center sm:flex-row sm:gap-8 sm:p-9 sm:text-left">
        <PixelSprite
          catId={run.data ? CLAN_MASCOTS[run.data.view.clanId] : "flameclaw"}
          size={144}
          decorative
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-ink text-sm font-bold break-words">
            Welcome back, {displayName}
          </p>
          {run.isPending ? (
            <NextStepSkeleton />
          ) : run.error ? (
            <NextStepError
              retrying={run.isFetching}
              onRetry={() => void run.refetch()}
            />
          ) : run.data ? (
            <RunInProgress snapshot={run.data} />
          ) : (
            <NextStep
              title="Six rivals are waiting"
              detail="None of them are in a hurry."
              action="Start a run"
            />
          )}
        </div>
      </section>

      <RecentRuns />
      <CodexProgress />
    </div>
  );
}

/** The one thing to do next: a headline, a line of context, one button. */
function NextStep({
  title,
  detail,
  action,
  children,
}: {
  title: string;
  detail: string;
  action: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <h1 className="text-ink mt-2 text-3xl break-words sm:text-5xl">
        {title}
      </h1>
      <p className="text-ink mt-3 text-lg">{detail}</p>
      {children}
      <div className="mt-6">
        <ButtonLink href="/run" size="lg" className="w-full sm:w-auto">
          {action}
        </ButtonLink>
      </div>
    </>
  );
}

function NextStepSkeleton() {
  return (
    <div role="status" aria-busy="true" className="mt-3 space-y-3">
      <span className="sr-only">Checking on your run…</span>
      <Skeleton className="mx-auto h-9 w-3/4 sm:mx-0" />
      <Skeleton className="mx-auto h-5 w-1/2 sm:mx-0" />
      <Skeleton className="h-14 w-full rounded-full sm:w-44" />
    </div>
  );
}

function NextStepError({
  retrying,
  onRetry,
}: {
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div role="alert">
      <h1 className="text-ink mt-2 text-3xl break-words sm:text-5xl">
        Your run did not answer
      </h1>
      <p className="text-ink mt-3 text-lg">
        It is saved either way. Ask again, or go and look for yourself.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" disabled={retrying} onClick={onRetry}>
          {retrying ? "Asking…" : "Try again"}
        </Button>
        <ButtonLink href="/run" size="lg" variant="secondary">
          Go to Play
        </ButtonLink>
      </div>
    </div>
  );
}

function RunInProgress({ snapshot }: { snapshot: RunSnapshot }) {
  const { view } = snapshot;
  const clan = CLANS[view.clanId];
  const total = view.gauntlet.length;
  const rewardDue = view.phase === "reward";
  // While a reward is waiting, `matchIndex` still points at the match just won.
  const upcoming = rewardDue ? view.matchIndex + 1 : view.matchIndex;
  const rival = getRival(view.gauntlet[upcoming] ?? GAUNTLET[0]!);
  const place = `match ${upcoming + 1} of ${total}`;

  return (
    <NextStep
      title={rewardDue ? "A reward is waiting" : `Up against ${rival.name}`}
      detail={
        rewardDue
          ? `${clan.name}. Then ${rival.name}, ${place}${rival.boss ? ", a boss" : ""}.`
          : `${clan.name}, ${place}${rival.boss ? ", a boss" : ""}. ${rival.flavor}`
      }
      action="Continue run"
    >
      <GauntletTrack
        gauntlet={view.gauntlet}
        won={view.results.filter((result) => result.won).length}
        current={upcoming}
      />
    </NextStep>
  );
}

/** Six squares, one per match: won, being played, or still to come. */
function GauntletTrack({
  gauntlet,
  won,
  current,
}: {
  gauntlet: readonly string[];
  won: number;
  current: number;
}) {
  return (
    <ol
      aria-label="The gauntlet"
      className="mt-4 flex justify-center gap-1.5 sm:justify-start"
    >
      {gauntlet.map((rivalId, index) => {
        const rival = getRival(rivalId);
        const state =
          index < won ? "won" : index === current ? "next" : "to come";
        return (
          <li
            key={rivalId}
            title={`${rival.name}: ${state}`}
            className={`border-ink text-pixel text-ink grid h-7 w-7 place-items-center border-2 text-xs leading-none ${
              state === "won"
                ? "bg-lime"
                : state === "next"
                  ? "bg-white"
                  : "bg-sky-surface opacity-60"
            }`}
          >
            <span aria-hidden="true">{rival.boss ? "B" : index + 1}</span>
            <span className="sr-only">
              Match {index + 1}, {rival.name}
              {rival.boss ? ", boss" : ""}: {state}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function RecentRuns() {
  const history = api.run.history.useQuery(
    { limit: HISTORY_LIMIT },
    { refetchOnMount: "always", retry: 1 },
  );
  // Fixed once per mount so every row is measured against the same moment.
  const [now] = useState(() => Date.now());

  return (
    <Panel title="Recent runs">
      {history.isPending ? (
        <div role="status" aria-busy="true" className="grid gap-2">
          <span className="sr-only">Loading recent runs…</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : history.error ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-ink">The record book would not open.</p>
          <Button
            variant="secondary"
            size="sm"
            disabled={history.isFetching}
            onClick={() => void history.refetch()}
          >
            {history.isFetching ? "Trying…" : "Try again"}
          </Button>
        </div>
      ) : history.data.length === 0 ? (
        <p className="text-ink-soft">
          Nothing on record. Finish a run, win or lose, and it is written down
          here.
        </p>
      ) : (
        <ol className="divide-ink/10 divide-y">
          {history.data.map((past) => (
            <PastRunRow key={past.id} run={past} now={now} />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function PastRunRow({ run, now }: { run: PastRun; now: number }) {
  const clan = isClanId(run.clanId) ? CLANS[run.clanId] : null;
  const ended = run.endedAt ?? run.startedAt;

  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {clan ? <ElementMark element={clan.id} /> : null}
        <p className="text-ink min-w-0 font-bold break-words">
          {clan?.name ?? run.clanId}
          <span className="text-ink-soft font-normal">
            {" "}
            · {outcomeText(run)}
          </span>
        </p>
      </div>
      <p className="text-ink-soft text-sm tabular-nums sm:text-right">
        {run.matchesWon} of {GAUNTLET.length} won · score {run.score} ·{" "}
        <time dateTime={ended.toISOString()} title={ended.toLocaleString()}>
          {timeAgo(ended.getTime(), now)}
        </time>
      </p>
    </li>
  );
}

/** "Won", "Lost to Madame Mittens", or "Abandoned". */
function outcomeText(run: PastRun): string {
  if (run.status === "won") return "Won";
  if (run.status === "abandoned") return "Abandoned";
  // A lost run stopped at the match after its last win.
  const rivalId = GAUNTLET[run.matchesWon];
  return rivalId ? `Lost to ${getRival(rivalId).name}` : "Lost";
}

const AGO_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

function timeAgo(then: number, now: number): string {
  const elapsed = now - then;
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of AGO_UNITS) {
    if (elapsed >= size)
      return format.format(-Math.floor(elapsed / size), unit);
  }
  return "just now";
}

function CodexProgress() {
  const codex = api.codex.get.useQuery(undefined, { retry: 1 });

  return (
    <Link
      href="/codex"
      className="panel-flat hover:bg-sky-soft flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
    >
      <span className="text-ink min-w-0">
        <span className="font-extrabold">Codex</span>
        {codex.data ? (
          <span className="text-ink-soft">
            {" "}
            · {countUnlocked(codex.data.cats)} of {codex.data.cats.length} cats
            and {countUnlocked(codex.data.relics)} of {codex.data.relics.length}{" "}
            relics unlocked
          </span>
        ) : codex.isPending ? (
          <span className="sr-only"> · counting…</span>
        ) : null}
      </span>
      <span className="text-cobalt-dark font-extrabold underline underline-offset-4">
        Open the codex
      </span>
    </Link>
  );
}
