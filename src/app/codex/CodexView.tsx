"use client";

import { useMemo } from "react";

import type { Shelf } from "~/components/codex/book";
import { CodexBook } from "~/components/codex/CodexBook";
import { GAUNTLET } from "~/server/game/rival";
import { api } from "~/trpc/react";

/**
 * Everything in the game by id, with what this account has unlocked, bound
 * as a book. The room clips at the column's outer edge, so a leaf has the
 * gutter to swell into as it turns.
 */
export function CodexView() {
  const codex = api.codex.get.useQuery();
  const { data, error } = codex;

  const shelf = useMemo<Shelf>(
    () =>
      data
        ? { status: "ready", ...data, rivals: GAUNTLET }
        : {
            status: error ? "error" : "loading",
            cats: [],
            relics: [],
            clans: [],
            rivals: GAUNTLET,
          },
    [data, error],
  );

  return (
    <div className="in-room book-room -mx-3 px-3 sm:-mx-5 sm:px-5">
      <CodexBook
        shelf={shelf}
        onRetry={() => void codex.refetch()}
        retrying={codex.isFetching}
        problem={error?.message ?? null}
      />
    </div>
  );
}
