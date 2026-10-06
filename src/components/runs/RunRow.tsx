import Link from "next/link";

import { HaduAvatar } from "~/components/HaduAvatar";
import { TableLink } from "~/components/ui";
import { difficultyOf } from "~/server/game/difficulty";
import type { Look } from "~/server/game/cosmetics";
import { GAUNTLET } from "~/server/game/rival";

import { ENDING_TAG, outcomeText, plural, type Ending } from "./runText";
import { When } from "./When";

export interface RunRowData {
  id: string;
  difficulty: string;
  status: Ending;
  matchesWon: number;
  score: number;
  /** Shown only when it is the viewer's own run. */
  coins?: number | null;
  startedAt?: Date;
  endedAt: Date | null;
}

/** The player a row in someone else's list belongs to. */
export interface RunRowPlayer {
  handle: string;
  name: string;
  look: Look;
}

/**
 * One finished run on a list: its tier and how it ended, its numbers, when,
 * and the way to its record. A row in a list of several players' runs names
 * whose it was.
 */
export function RunRow({
  run,
  player,
}: {
  run: RunRowData;
  player?: RunRowPlayer;
}) {
  const ended = run.endedAt ?? run.startedAt;

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-1.5">
        {player ? <PlayerTag player={player} /> : null}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="min-w-0 font-bold break-words">
            {difficultyOf(run.difficulty).name}
          </p>
          <span
            className={`border-ink border-2 px-1.5 text-xs leading-5 font-black ${ENDING_TAG[run.status]}`}
          >
            {outcomeText(run)}
          </span>
        </div>
        <p className="text-ink-soft text-sm tabular-nums">
          {run.matchesWon} of {GAUNTLET.length} won · score {run.score}
          {typeof run.coins === "number"
            ? ` · ${plural(run.coins, "coin")}`
            : ""}{" "}
          {ended ? (
            <>
              · <When date={ended} ago />
            </>
          ) : null}
        </p>
      </div>
      <TableLink href={`/runs/${run.id}`} size="sm">
        View run summary
      </TableLink>
    </li>
  );
}

/** A player's hadu and name, linking to their profile. */
export function PlayerTag({
  player,
  size = 32,
}: {
  player: RunRowPlayer;
  size?: number;
}) {
  return (
    <Link
      href={`/players/${player.handle}`}
      className="inline-flex min-h-11 min-w-0 items-center gap-2 font-extrabold break-words underline-offset-2 hover:underline"
    >
      <span className="shrink-0 overflow-hidden">
        <HaduAvatar look={player.look} size={size} />
      </span>
      <span className="min-w-0">{player.name}</span>
    </Link>
  );
}
