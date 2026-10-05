"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { countUnlocked } from "~/components/codex/entries";
import { PixelSprite } from "~/components/PixelSprite";
import { CLAN_MASCOTS } from "~/components/run/packs";
import { Nameplate } from "~/components/run/pieces";
import { GauntletTrack } from "~/components/run/RunStrip";
import { Board, Skeleton, TableButton, TableLink } from "~/components/ui";
import { difficultyOf } from "~/server/game/difficulty";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { CLANS, isClanId } from "~/server/game/run";
import { api, type RouterOutputs } from "~/trpc/react";

export interface HomeDashboardProps {
  displayName: string;
}

type RunSnapshot = NonNullable<RouterOutputs["run"]["current"]>;
type PastRun = RouterOutputs["run"]["history"][number];

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
            catId="flameclaw"
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
  catId,
  children,
}: {
  displayName: string;
  catId: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label="Your run"
      className="mat flex w-full max-w-2xl flex-col gap-4 p-3 sm:flex-row sm:gap-6 sm:p-5"
    >
      <span className="relative shrink-0 self-start after:absolute after:inset-x-[18.75%] after:top-full after:h-[6.25%] after:bg-[var(--cast)] after:content-['']">
        <PixelSprite
          catId={catId}
          size={96}
          decorative
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
  catId,
  rivalId,
  rivalLabel,
  track,
}: {
  displayName: string;
  title: string;
  detail: string;
  action: string;
  catId: string;
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
      <MenuMat displayName={displayName} catId={catId}>
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
      <MenuMat displayName={displayName} catId="flameclaw">
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
      <MenuMat displayName={displayName} catId="flameclaw">
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
  const clan = `${CLANS[view.clanId].name} on ${difficultyOf(view.difficulty).name}`;
  const total = view.gauntlet.length;
  const rewardDue = view.phase === "reward";
  // While a reward is waiting, `matchIndex` still points at the match just won.
  const upcoming = rewardDue ? view.matchIndex + 1 : view.matchIndex;
  const rivalId = view.gauntlet[upcoming] ?? GAUNTLET[0]!;
  const rival = getRival(rivalId);
  const place = `match ${upcoming + 1} of ${total}`;

  return (
    <Menu
      displayName={displayName}
      title={rewardDue ? "A reward is waiting" : `Up against ${rival.name}`}
      detail={
        rewardDue
          ? `${clan}. Then ${rival.name}, ${place}${rival.boss ? ", a boss" : ""}.`
          : `${clan}, ${place}${rival.boss ? ", a boss" : ""}. ${rival.flavor}`
      }
      action="Continue run"
      catId={CLAN_MASCOTS[view.clanId]}
      rivalId={rivalId}
      rivalLabel={rewardDue ? "Next across the table" : "Across the table"}
      track={<GauntletTrack run={view} />}
    />
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
    <Board title="Record book">
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
      ) : history.data.length === 0 ? (
        <p className="text-ink-soft">
          Nothing on record. Finish a run, win or lose, and it is written down
          here.
        </p>
      ) : (
        <ol className="divide-ink/15 divide-y-2 divide-dashed">
          {history.data.map((past) => (
            <PastRunRow key={past.id} run={past} now={now} />
          ))}
        </ol>
      )}
    </Board>
  );
}

/** How a past run ended, as the colour of its tag: the player's, the rival's, nobody's. */
const OUTCOME_TAG: Record<PastRun["status"], string> = {
  won: "bg-lime",
  lost: "bg-coral",
  abandoned: "bg-white",
  active: "bg-white",
};

function PastRunRow({ run, now }: { run: PastRun; now: number }) {
  const clan = isClanId(run.clanId) ? CLANS[run.clanId] : null;
  const ended = run.endedAt ?? run.startedAt;

  return (
    <li className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {clan ? <ElementMark element={clan.id} /> : null}
        <p className="min-w-0 font-bold break-words">
          {clan?.name ?? run.clanId}
          <span className="text-ink-soft font-normal">
            {" "}
            · {difficultyOf(run.difficulty).name}
          </span>
        </p>
        <span
          className={`border-ink border-2 px-1.5 text-xs leading-5 font-black ${OUTCOME_TAG[run.status]}`}
        >
          {outcomeText(run)}
        </span>
      </div>
      <p className="text-ink-soft text-sm tabular-nums">
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
    <Board title="Codex">
      {codex.data ? (
        <dl className="flex gap-6">
          <Count
            have={countUnlocked(codex.data.cats)}
            of={codex.data.cats.length}
            label="cats"
          />
          <Count
            have={countUnlocked(codex.data.relics)}
            of={codex.data.relics.length}
            label="relics"
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

/** How many of something are unlocked, with the number in print. */
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
      <dt className="text-ink-soft mt-1 text-xs font-bold">{label} unlocked</dt>
      <dd className="text-print text-3xl tabular-nums">
        {have}
        <span className="text-ink-soft"> / {of}</span>
      </dd>
    </div>
  );
}
