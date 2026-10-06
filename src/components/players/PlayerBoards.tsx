"use client";

import { PixelIcon } from "~/components/PixelIcon";
import { RunRow, type RunRowData } from "~/components/runs/RunRow";
import { plural } from "~/components/runs/runText";
import { When } from "~/components/runs/When";
import { COIN_COLOR } from "~/components/sprites/palettes";
import { Board, TableButton, TableLink, useToast } from "~/components/ui";
import { DIFFICULTY_LIST } from "~/server/game/difficulty";
import { percent, type PlayerStats } from "~/server/game/stats";
import { api } from "~/trpc/react";

import { achievementShelf } from "./shelf";

/** One number on the record, in print, with what it counts under it. */
function Stat({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-ink-soft mt-1 text-xs font-bold">
        {label}
        {note ? <span className="block font-semibold">{note}</span> : null}
      </dt>
      <dd className="text-print text-3xl tabular-nums">{value}</dd>
    </div>
  );
}

/** What a player's runs add up to: win rates, best scores, wins on each tier. */
export function StatsBoard({ stats }: { stats: PlayerStats }) {
  return (
    <Board title="Record">
      {stats.runsFinished === 0 ? (
        <p className="text-ink-soft">
          No runs finished yet. The numbers start with the first one.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <Stat
              value={percent(stats.runWinRate)}
              label="Runs won"
              note={`${stats.runsWon} of ${stats.runsFinished}`}
            />
            <Stat
              value={percent(stats.matchWinRate)}
              label="Matches won"
              note={`${stats.matchesWon} of ${stats.matchesPlayed}`}
            />
            <Stat value={String(stats.bestMatch)} label="Best match" />
            <Stat value={String(stats.bestRun)} label="Best run" />
          </dl>
          <p className="text-ink-soft mt-5 text-sm font-semibold tabular-nums">
            Runs won:{" "}
            {DIFFICULTY_LIST.map(
              (tier) => `${tier.name} ${stats.runsWonOn[tier.id]}`,
            ).join(" · ")}
          </p>
        </>
      )}
    </Board>
  );
}

/**
 * Every achievement, the held ones first: a held one is a white tile with
 * its medal in gold and the day it was earned, one still to do a dashed
 * space with what to do. Each says what it pays, once.
 */
export function AchievementsBoard({
  held,
}: {
  held: readonly { key: string; earnedAt: Date }[];
}) {
  const shelf = achievementShelf(held);
  const earned = shelf.filter((a) => a.earnedAt !== null).length;

  return (
    <Board
      title="Achievements"
      action={
        <p className="text-print text-xl tabular-nums">
          {earned} of {shelf.length}
        </p>
      }
    >
      <p className="mb-4 max-w-[60ch] text-sm leading-snug">
        Each one pays its coins once, the first time it is done. They count
        every run, the ones before them included.
      </p>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shelf.map((a) => (
          <li
            key={a.key}
            className={
              a.earnedAt
                ? "piece border-ink flex gap-3 border-2 bg-white p-3"
                : "border-ink/40 flex gap-3 border-2 border-dashed p-3"
            }
          >
            <span className={a.earnedAt ? "" : "opacity-45"}>
              <PixelIcon
                name="medal"
                size={32}
                fill={a.earnedAt ? COIN_COLOR : undefined}
              />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm leading-tight font-black break-words">
                {a.name}
              </p>
              <p className="text-xs leading-snug">{a.hint}</p>
              <p className="text-ink-soft inline-flex flex-wrap items-center gap-x-2 text-[11px] font-bold tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <PixelIcon name="coin" size={8} fill={COIN_COLOR} />
                  {plural(a.coins, "coin")}
                </span>
                {a.earnedAt ? (
                  <span>
                    Earned <When date={a.earnedAt} />
                  </span>
                ) : null}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Board>
  );
}

/** A player's latest runs, or why they are not shown. */
export function RecentRunsBoard({
  runs,
  allHref,
  name,
  isSelf,
}: {
  runs: RunRowData[] | null;
  allHref: string;
  name: string;
  isSelf: boolean;
}) {
  return (
    <Board
      title="Runs"
      action={
        runs && runs.length > 0 ? (
          <TableLink href={allHref} size="sm">
            See all runs
          </TableLink>
        ) : null
      }
    >
      {runs === null ? (
        <p className="text-ink-soft">
          {name}&rsquo;s runs are private. Their record and achievements still
          show.
        </p>
      ) : runs.length === 0 ? (
        <p className="text-ink-soft">
          {isSelf
            ? "Nothing on record. Finish a run, win or lose, and it is written down here."
            : `${name} has not finished a run yet.`}
        </p>
      ) : (
        <ol className="divide-ink/15 divide-y-2 divide-dashed">
          {runs.map((run) => (
            <RunRow key={run.id} run={run} />
          ))}
        </ol>
      )}
    </Board>
  );
}

/** Copies the link to a profile, to be sent to someone. */
export function ShareButton({ path }: { path: string }) {
  const notify = useToast();
  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("Link copied.", "ok");
    } catch {
      notify(`Copy this link: ${url}`);
    }
  };
  return (
    <TableButton variant="secondary" size="sm" onClick={() => void copy()}>
      Copy link
    </TableButton>
  );
}

/**
 * Whether other players may see the account's runs. Either way its record
 * and its achievements show, and it is ranked on the leaderboard.
 */
export function PrivacyBoard({ runsPublic }: { runsPublic: boolean }) {
  const notify = useToast();
  const utils = api.useUtils();
  const set = api.profile.setRunsPublic.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.profile.get.invalidate(),
        utils.profile.record.invalidate(),
      ]);
    },
    onError: () => notify("The setting did not save. Try again.", "error"),
  });
  const shown = set.isPending
    ? (set.variables?.value ?? runsPublic)
    : runsPublic;

  return (
    <Board title="Settings">
      <div
        role="group"
        aria-labelledby="runs-shown"
        className="flex flex-col gap-3"
      >
        <p id="runs-shown" className="text-sm font-bold">
          Who can see your runs
        </p>
        <div className="flex flex-wrap gap-2">
          <TableButton
            variant={shown ? "chosen" : "secondary"}
            size="md"
            aria-pressed={shown}
            className={shown ? "is-pressed" : ""}
            disabled={set.isPending}
            onClick={() => set.mutate({ value: true })}
          >
            Everyone
          </TableButton>
          <TableButton
            variant={shown ? "secondary" : "chosen"}
            size="md"
            aria-pressed={!shown}
            className={shown ? "" : "is-pressed"}
            disabled={set.isPending}
            onClick={() => set.mutate({ value: false })}
          >
            Only me
          </TableButton>
        </div>
        <p className="text-ink-soft max-w-[60ch] text-sm" aria-live="polite">
          {shown
            ? "Other players can see your runs and open every run's summary."
            : "Only you can see your runs. Your record and achievements still show, and you are still on the leaderboard."}
        </p>
      </div>
    </Board>
  );
}
