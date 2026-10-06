"use client";

import { useEffect, useState } from "react";

import { RoomFrame } from "~/components/runs/RoomFrame";
import { PlayerTag, RunRow } from "~/components/runs/RunRow";
import { plural } from "~/components/runs/runText";
import { When } from "~/components/runs/When";
import { Board, Field, Skeleton, TableButton } from "~/components/ui";
import { DIFFICULTY_LIST, type DifficultyId } from "~/server/game/difficulty";
import {
  LEADERBOARD_LABELS,
  LEADERBOARDS,
  percent,
  RANKED_RUNS,
  type Leaderboard,
} from "~/server/game/stats";
import { api } from "~/trpc/react";

const TABS = [
  { id: "players", label: "Players" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "feed", label: "Recent runs" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * Everyone else at the tower: a directory to find a player by name, the
 * leaderboard, and the runs lately finished by players who show theirs.
 * Nobody here is played against: rivals are the game's own.
 */
export function PlayersView() {
  const [tab, setTab] = useState<Tab>("players");

  return (
    <RoomFrame title="Players">
      <div role="tablist" aria-label="Players" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <TableButton
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            variant={tab === t.id ? "chosen" : "secondary"}
            size="md"
            className={tab === t.id ? "is-pressed" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </TableButton>
        ))}
      </div>
      <div role="tabpanel">
        {tab === "players" ? (
          <Directory />
        ) : tab === "leaderboard" ? (
          <LeaderboardBoard />
        ) : (
          <Feed />
        )}
      </div>
    </RoomFrame>
  );
}

/** A value that settles a moment after the last change to it. */
function useSettled<T>(value: T, ms = 250): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

function Failed({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p>The list would not come.</p>
      <TableButton
        variant="secondary"
        size="md"
        disabled={busy}
        onClick={onRetry}
      >
        {busy ? "Trying…" : "Try again"}
      </TableButton>
    </div>
  );
}

function Loading({ what }: { what: string }) {
  return (
    <div role="status" aria-busy="true" className="grid gap-2">
      <span className="sr-only">Loading {what}…</span>
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-full" />
      <Skeleton className="h-11 w-2/3" />
    </div>
  );
}

function Directory() {
  const [query, setQuery] = useState("");
  const search = useSettled(query.trim());
  const players = api.players.directory.useInfiniteQuery(
    { query: search },
    { getNextPageParam: (last) => last.nextCursor, retry: 1 },
  );
  const list = players.data?.pages.flatMap((page) => page.players) ?? [];

  return (
    <Board title="Directory">
      <div className="mb-5 max-w-sm">
        <Field
          label="Find a player by name"
          type="search"
          value={query}
          maxLength={20}
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {players.isPending ? (
        <Loading what="players" />
      ) : players.error && list.length === 0 ? (
        <Failed
          onRetry={() => void players.refetch()}
          busy={players.isFetching}
        />
      ) : list.length === 0 ? (
        <p className="text-ink-soft">
          {search
            ? `Nobody is called anything like ${search}.`
            : "Nobody here yet."}
        </p>
      ) : (
        <>
          <ul className="divide-ink/15 divide-y-2 divide-dashed">
            {list.map((player) => (
              <li
                key={player.handle}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 first:pt-0 last:pb-0"
              >
                <PlayerTag player={player} />
                <p className="text-ink-soft text-sm tabular-nums">
                  {plural(player.runsWon, "run")} won of {player.runsFinished}
                  {player.lastPlayed ? (
                    <>
                      {" "}
                      · played <When date={player.lastPlayed} ago />
                    </>
                  ) : (
                    " · not played yet"
                  )}
                </p>
              </li>
            ))}
          </ul>
          {players.hasNextPage ? (
            <TableButton
              variant="secondary"
              size="md"
              className="mt-5"
              disabled={players.isFetching}
              onClick={() => void players.fetchNextPage()}
            >
              {players.isFetching ? "Opening…" : "More players"}
            </TableButton>
          ) : null}
        </>
      )}
    </Board>
  );
}

function LeaderboardBoard() {
  const [by, setBy] = useState<Leaderboard>("runsWon");
  const [difficulty, setDifficulty] = useState<DifficultyId | undefined>();
  const board = api.players.leaderboard.useQuery(
    { by, difficulty },
    { retry: 1 },
  );

  const value = (place: NonNullable<typeof board.data>[number]) =>
    by === "bestRun"
      ? String(place.bestRun)
      : by === "winRate"
        ? percent(place.winRate)
        : String(place.runsWon);

  return (
    <Board title="Leaderboard">
      <div className="mb-5 flex flex-col gap-3">
        <div
          role="group"
          aria-label="Ranked by"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-ink-soft w-16 shrink-0 text-xs font-bold">
            Ranked by
          </span>
          {LEADERBOARDS.map((id) => (
            <TableButton
              key={id}
              variant={by === id ? "chosen" : "secondary"}
              aria-pressed={by === id}
              className={by === id ? "is-pressed" : ""}
              onClick={() => setBy(id)}
            >
              {LEADERBOARD_LABELS[id]}
            </TableButton>
          ))}
        </div>
        <div
          role="group"
          aria-label="Tier"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-ink-soft w-16 shrink-0 text-xs font-bold">
            Tier
          </span>
          {[undefined, ...DIFFICULTY_LIST.map((tier) => tier.id)].map((id) => {
            const chosen = difficulty === id;
            return (
              <TableButton
                key={id ?? "all"}
                variant={chosen ? "chosen" : "secondary"}
                aria-pressed={chosen}
                className={chosen ? "is-pressed" : ""}
                onClick={() => setDifficulty(id)}
              >
                {id
                  ? DIFFICULTY_LIST.find((tier) => tier.id === id)?.name
                  : "All"}
              </TableButton>
            );
          })}
        </div>
        <p className="text-ink-soft text-xs">
          {by === "winRate"
            ? `Share of finished runs won, for players who have finished ${RANKED_RUNS} or more.`
            : by === "bestRun"
              ? "The highest score of one run, summed over its matches."
              : "Runs won, to the top of the tower."}
        </p>
      </div>
      {board.isPending ? (
        <Loading what="the leaderboard" />
      ) : board.error ? (
        <Failed onRetry={() => void board.refetch()} busy={board.isFetching} />
      ) : board.data.length === 0 ? (
        <p className="text-ink-soft">Nobody is on this board yet.</p>
      ) : (
        <ol className="divide-ink/15 divide-y-2 divide-dashed">
          {board.data.map((place) => (
            <li
              key={place.handle}
              className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
            >
              <span
                className={`text-print w-8 shrink-0 text-right text-xl tabular-nums ${place.place <= 3 ? "" : "text-ink-soft"}`}
              >
                {place.place}
              </span>
              <span className="min-w-0 flex-1">
                <PlayerTag player={place} />
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="text-print text-xl tabular-nums">
                  {value(place)}
                </span>
                <span className="text-ink-soft text-[11px] font-bold tabular-nums">
                  {place.runsWon} of {place.runsFinished} won
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Board>
  );
}

function Feed() {
  const feed = api.players.feed.useInfiniteQuery(
    {},
    { getNextPageParam: (last) => last.nextCursor, retry: 1 },
  );
  const runs = feed.data?.pages.flatMap((page) => page.runs) ?? [];

  return (
    <Board title="Recent runs">
      {feed.isPending ? (
        <Loading what="recent runs" />
      ) : feed.error && runs.length === 0 ? (
        <Failed onRetry={() => void feed.refetch()} busy={feed.isFetching} />
      ) : runs.length === 0 ? (
        <p className="text-ink-soft">No runs finished lately.</p>
      ) : (
        <>
          <ol className="divide-ink/15 divide-y-2 divide-dashed">
            {runs.map((run) => (
              <RunRow key={run.id} run={run} player={run.player} />
            ))}
          </ol>
          {feed.hasNextPage ? (
            <TableButton
              variant="secondary"
              size="md"
              className="mt-5"
              disabled={feed.isFetching}
              onClick={() => void feed.fetchNextPage()}
            >
              {feed.isFetching ? "Opening…" : "Older runs"}
            </TableButton>
          ) : null}
        </>
      )}
    </Board>
  );
}
