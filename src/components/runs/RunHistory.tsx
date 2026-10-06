"use client";

import { useState } from "react";

import { Board, Skeleton, TableButton, TableLink } from "~/components/ui";
import { DIFFICULTY_LIST, type DifficultyId } from "~/server/game/difficulty";
import { api } from "~/trpc/react";

import { RoomFrame } from "./RoomFrame";
import { RunRow, type RunRowData } from "./RunRow";
import type { Ending } from "./runText";

/** Runs a page of a history loads at a time. */
const PAGE = 20;

const ENDINGS: { id: Ending; label: string }[] = [
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "abandoned", label: "Abandoned" },
];

interface Filters {
  difficulty?: DifficultyId;
  outcome?: Ending;
}

/** The account's own runs, every one, at `/runs`. */
export function OwnRunsView() {
  const [filters, setFilters] = useState<Filters>({});
  const history = api.run.history.useInfiniteQuery(
    { limit: PAGE, ...filters },
    {
      getNextPageParam: (last) => last.nextCursor,
      refetchOnMount: "always",
      retry: 1,
    },
  );

  return (
    <RoomFrame
      title="Your runs"
      lead={
        <TableLink href="/profile" size="sm">
          Back to your profile
        </TableLink>
      }
    >
      <HistoryBoard
        filters={filters}
        onFilters={setFilters}
        runs={history.data?.pages.flatMap((page) => page.runs) ?? null}
        error={history.error?.message ?? null}
        pending={history.isPending}
        fetching={history.isFetching}
        more={history.hasNextPage}
        onMore={() => void history.fetchNextPage()}
        onRetry={() => void history.refetch()}
        empty="Nothing on record. Finish a run, win or lose, and it is written down here."
      />
    </RoomFrame>
  );
}

/** A player's runs, at `/players/<handle>/runs`, if they show them. */
export function PlayerRunsView({ handle }: { handle: string }) {
  const [filters, setFilters] = useState<Filters>({});
  const history = api.players.runs.useInfiniteQuery(
    { handle, limit: PAGE, ...filters },
    {
      getNextPageParam: (last) => last.nextCursor,
      retry: (count, error) =>
        error.data?.code !== "FORBIDDEN" &&
        error.data?.code !== "NOT_FOUND" &&
        count < 1,
    },
  );
  const refused = history.error?.data?.code;

  return (
    <RoomFrame
      title={`${handle}'s runs`}
      lead={
        <TableLink href={`/players/${handle}`} size="sm">
          Back to the profile
        </TableLink>
      }
    >
      {refused === "FORBIDDEN" || refused === "NOT_FOUND" ? (
        <Board
          title={refused === "FORBIDDEN" ? "Private" : "Nobody by that name"}
        >
          <p className="text-ink-soft">
            {refused === "FORBIDDEN"
              ? `${handle} keeps their runs to themselves.`
              : `There is no player called ${handle}.`}
          </p>
        </Board>
      ) : (
        <HistoryBoard
          filters={filters}
          onFilters={setFilters}
          runs={history.data?.pages.flatMap((page) => page.runs) ?? null}
          error={history.error?.message ?? null}
          pending={history.isPending}
          fetching={history.isFetching}
          more={history.hasNextPage}
          onMore={() => void history.fetchNextPage()}
          onRetry={() => void history.refetch()}
          empty={`${handle} has no runs like that on record.`}
        />
      )}
    </RoomFrame>
  );
}

function HistoryBoard({
  filters,
  onFilters,
  runs,
  error,
  pending,
  fetching,
  more,
  onMore,
  onRetry,
  empty,
}: {
  filters: Filters;
  onFilters: (filters: Filters) => void;
  runs: RunRowData[] | null;
  error: string | null;
  pending: boolean;
  fetching: boolean;
  more: boolean;
  onMore: () => void;
  onRetry: () => void;
  empty: string;
}) {
  const filtered = filters.difficulty ?? filters.outcome;

  return (
    <Board title="Record book">
      <div className="mb-5 flex flex-col gap-3">
        <FilterRow
          label="Tier"
          options={DIFFICULTY_LIST.map((tier) => ({
            id: tier.id,
            label: tier.name,
          }))}
          value={filters.difficulty}
          onChange={(difficulty) => onFilters({ ...filters, difficulty })}
        />
        <FilterRow
          label="Ending"
          options={ENDINGS}
          value={filters.outcome}
          onChange={(outcome) => onFilters({ ...filters, outcome })}
        />
      </div>
      {pending ? (
        <div role="status" aria-busy="true" className="grid gap-2">
          <span className="sr-only">Loading runs…</span>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      ) : error && !runs ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p>The record book would not open.</p>
          <TableButton
            variant="secondary"
            size="md"
            disabled={fetching}
            onClick={onRetry}
          >
            {fetching ? "Trying…" : "Try again"}
          </TableButton>
        </div>
      ) : !runs || runs.length === 0 ? (
        <p className="text-ink-soft">
          {filtered ? "No run on record matches that." : empty}
        </p>
      ) : (
        <>
          <ol className="divide-ink/15 divide-y-2 divide-dashed">
            {runs.map((run) => (
              <RunRow key={run.id} run={run} />
            ))}
          </ol>
          {more ? (
            <TableButton
              variant="secondary"
              size="md"
              className="mt-5"
              disabled={fetching}
              onClick={onMore}
            >
              {fetching ? "Opening…" : "Older runs"}
            </TableButton>
          ) : null}
        </>
      )}
    </Board>
  );
}

/** A set of filter buttons, one in force or none: "All" is none. */
function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: T; label: string }[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  const all = [{ id: undefined, label: "All" }, ...options];
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-ink-soft w-16 shrink-0 text-xs font-bold">
        {label}
      </span>
      {all.map((option) => {
        const chosen = option.id === value;
        return (
          <TableButton
            key={option.label}
            variant={chosen ? "chosen" : "secondary"}
            aria-pressed={chosen}
            className={chosen ? "is-pressed" : ""}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </TableButton>
        );
      })}
    </div>
  );
}
