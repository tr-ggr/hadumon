"use client";

import { type CSSProperties, type ReactNode } from "react";

import { countUnlocked } from "~/components/codex/entries";
import { HaduAvatar } from "~/components/HaduAvatar";
import { Nameplate } from "~/components/run/pieces";
import { GauntletTrack } from "~/components/run/RunStrip";
import { RunRow } from "~/components/runs/RunRow";
import { useLook } from "~/components/skins/SkinProvider";
import { Board, Skeleton, TableButton, TableLink } from "~/components/ui";
import { difficultyOf } from "~/server/game/difficulty";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { api, type RouterOutputs } from "~/trpc/react";

export interface HomeDashboardProps {
  displayName: string;
}

type RunSnapshot = NonNullable<RouterOutputs["run"]["current"]>;

const HISTORY_LIMIT = 5;
/** A gauntlet nobody has started: every rival still to come. */
const NO_RUN = { gauntlet: GAUNTLET, matchIndex: -1, results: [] };

/**
 * The signed-in home, as the game's main menu. The tower stands behind the
 * page with the run on it; beside it are the one thing to do next, the record
 * of what happened lately, and the way to the codex.
 */
export function HomeDashboard({ displayName }: HomeDashboardProps) {
  // A run changes on another page, so a cached answer is never good enough.
  const run = api.run.current.useQuery(undefined, {
    refetchOnMount: "always",
    retry: 1,
  });

  return (
    <div className="flex flex-col gap-7">
      <div className="beside-tower first-screen flex flex-col items-start gap-5">
        {run.isPending ? (
          <MenuSkeleton displayName={displayName} />
        ) : run.error ? (
          <MenuError
            displayName={displayName}
            retrying={run.isFetching}
            onRetry={() => void run.refetch()}
          />
        ) : run.data ? (
          <RunInProgress displayName={displayName} snapshot={run.data} />
        ) : (
          <Menu
            displayName={displayName}
            title="Six rivals are waiting"
            detail="None of them are in a hurry."
            action="Start a run"
            rivalId={GAUNTLET[0]}
            rivalLabel="First across the table"
            track={<GauntletTrack run={NO_RUN} over />}
          />
        )}
      </div>

      <div className="beside-tower-wide grid items-start gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <RecentRuns />
        <CodexProgress />
      </div>
    </div>
  );
}

/**
 * The plaque and the ribbon: the game's name, cut out, and under it the one
 * line that says where things stand. A phone has the name on the lid.
 */
function Masthead({ children }: { children: ReactNode }) {
  return (
    <header className="above-tower flex flex-col items-start">
      <p
        className="piece border-ink bg-cream wordmark is-small border-2 px-5 pt-2 pb-4 max-sm:hidden"
        style={{ "--e": "5px" } as CSSProperties}
        aria-hidden
      >
        Hadu<span className="text-coral">Mon</span>
      </p>
      {children}
    </header>
  );
}

const RIBBON =
  "piece border-ink bg-lime text-print relative z-10 border-2 px-3.5 py-2 text-3xl text-balance sm:-mt-3 sm:ml-5 sm:px-5 sm:text-[40px]";

/** The mat the next thing to do is laid on. */
function MenuMat({
  displayName,
  children,
}: {
  displayName: string;
  children: ReactNode;
}) {
  const look = useLook();
  return (
    <section
      aria-label="Your run"
      className="mat flex w-full max-w-2xl flex-col gap-4 p-3 sm:flex-row sm:gap-6 sm:p-5"
    >
      <span className="relative shrink-0 self-start after:absolute after:inset-x-[18.75%] after:top-full after:h-[6.25%] after:bg-[var(--cast)] after:content-['']">
        <HaduAvatar
          look={look}
          size={96}
          className="h-16 w-16 sm:h-24 sm:w-24"
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
        <p className="text-sm font-bold break-words">
          Welcome back, {displayName}
        </p>
        {children}
      </div>
    </section>
  );
}

/** The one thing to do next: a headline, a line of context, one button. */
function Menu({
  displayName,
  title,
  detail,
  action,
  rivalId,
  rivalLabel,
  track,
}: {
  displayName: string;
  title: string;
  detail: string;
  action: string;
  /** Whoever is next across the table. */
  rivalId: string | undefined;
  rivalLabel: string;
  track: ReactNode;
}) {
  return (
    <>
      <Masthead>
        <h1 className={RIBBON}>{title}</h1>
      </Masthead>
      <MenuMat displayName={displayName}>
        <p className="text-base break-words sm:text-lg">{detail}</p>
        {rivalId ? (
          <div className="w-full max-w-sm space-y-1">
            <p className="text-xs font-bold">{rivalLabel}</p>
            <Nameplate rivalId={rivalId} />
          </div>
        ) : null}
        {/* On a phone the tower beside the menu is the track. */}
        <div className="max-sm:hidden">{track}</div>
        <TableLink
          href="/run"
          variant="primary"
          size="lg"
          className="mt-1 w-full max-sm:px-2 sm:w-auto"
        >
          {action}
        </TableLink>
      </MenuMat>
    </>
  );
}

function MenuSkeleton({ displayName }: { displayName: string }) {
  return (
    <>
      <Masthead>
        <h1 className={`${RIBBON} min-w-56`}>
          <span className="sr-only">HaduMon</span>
          <Skeleton className="h-[30px] w-full sm:h-10" />
        </h1>
      </Masthead>
      <MenuMat displayName={displayName}>
        <div role="status" aria-busy="true" className="w-full space-y-3">
          <span className="sr-only">Checking on your run…</span>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-12 w-full max-w-sm" />
          <Skeleton className="h-14 w-full sm:w-44" />
        </div>
      </MenuMat>
    </>
  );
}

function MenuError({
  displayName,
  retrying,
  onRetry,
}: {
  displayName: string;
  retrying: boolean;
  onRetry: () => void;
}) {
  return (
    <>
      <Masthead>
        <h1 className={RIBBON}>Your run did not answer</h1>
      </Masthead>
      <MenuMat displayName={displayName}>
        <div role="alert" className="space-y-3">
          <p className="text-base sm:text-lg">
            It is saved either way. Ask again, or go and look for yourself.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <TableButton size="lg" disabled={retrying} onClick={onRetry}>
              {retrying ? "Asking…" : "Try again"}
            </TableButton>
            <TableLink href="/run" size="lg">
              Go to Play
            </TableLink>
          </div>
        </div>
      </MenuMat>
    </>
  );
}

function RunInProgress({
  displayName,
  snapshot,
}: {
  displayName: string;
  snapshot: RunSnapshot;
}) {
  const { view } = snapshot;
  const tier = `A ${difficultyOf(view.difficulty).name} run`;
  const total = view.gauntlet.length;
  const rewardDue = view.phase === "reward";
  const chestDue = view.phase === "chest";
  // While a reward is waiting, `matchIndex` still points at the match just won.
  const upcoming = rewardDue ? view.matchIndex + 1 : view.matchIndex;
  const rivalId = view.gauntlet[upcoming] ?? GAUNTLET[0]!;
  const rival = getRival(rivalId);
  const place = `match ${upcoming + 1} of ${total}`;

  return (
    <Menu
      displayName={displayName}
      title={
        chestDue
          ? "A chest is waiting"
          : rewardDue
            ? "A reward is waiting"
            : `Up against ${rival.name}`
      }
      detail={
        chestDue
          ? `${tier}, not yet begun. Take a relic from the chest, then ${rival.name}.`
          : rewardDue
            ? `${tier}. Then ${rival.name}, ${place}${rival.boss ? ", a boss" : ""}.`
            : `${tier}, ${place}${rival.boss ? ", a boss" : ""}. ${rival.flavor}`
      }
      action="Continue run"
      rivalId={rivalId}
      rivalLabel={
        rewardDue || chestDue ? "Next across the table" : "Across the table"
      }
      track={<GauntletTrack run={view} />}
    />
  );
}

function RecentRuns() {
  const history = api.run.history.useQuery(
    { limit: HISTORY_LIMIT },
    { refetchOnMount: "always", retry: 1 },
  );

  return (
    <Board
      title="Record book"
      action={
        history.data && history.data.runs.length > 0 ? (
          <TableLink href="/runs" size="sm">
            See all runs
          </TableLink>
        ) : null
      }
    >
      {history.isPending ? (
        <div role="status" aria-busy="true" className="grid gap-2">
          <span className="sr-only">Loading recent runs…</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : history.error ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>The record book would not open.</p>
          <TableButton
            variant="secondary"
            size="md"
            disabled={history.isFetching}
            onClick={() => void history.refetch()}
          >
            {history.isFetching ? "Trying…" : "Try again"}
          </TableButton>
        </div>
      ) : history.data.runs.length === 0 ? (
        <p className="text-ink-soft">
          Nothing on record. Finish a run, win or lose, and it is written down
          here.
        </p>
      ) : (
        <ol className="divide-ink/15 divide-y-2 divide-dashed">
          {history.data.runs.map((past) => (
            <RunRow key={past.id} run={past} />
          ))}
        </ol>
      )}
    </Board>
  );
}

function CodexProgress() {
  const codex = api.codex.get.useQuery(undefined, { retry: 1 });

  return (
    <Board title="Codex">
      {codex.data ? (
        <dl className="flex gap-6">
          <Count
            have={countUnlocked(codex.data.cats)}
            of={codex.data.cats.length}
            label="cats owned"
          />
          <Count
            have={countUnlocked(codex.data.relics)}
            of={codex.data.relics.length}
            label="relics unlocked"
          />
        </dl>
      ) : codex.isPending ? (
        <div role="status" aria-busy="true">
          <span className="sr-only">Counting…</span>
          <Skeleton className="h-12 w-40" />
        </div>
      ) : null}
      <TableLink href="/codex" className="mt-5">
        Open the codex
      </TableLink>
    </Board>
  );
}

/** How many of something the account has, with the number in print. */
function Count({
  have,
  of,
  label,
}: {
  have: number;
  of: number;
  label: string;
}) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-ink-soft mt-1 text-xs font-bold">{label}</dt>
      <dd className="text-print text-3xl tabular-nums">
        {have}
        <span className="text-ink-soft"> / {of}</span>
      </dd>
    </div>
  );
}
