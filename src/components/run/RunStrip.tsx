import { DIFFICULTY } from "~/server/game/difficulty";
import { getRival } from "~/server/game/rival";
import type { RunView } from "~/server/game/view";

import { plural } from "./describe";

/**
 * The gauntlet as a track of six markers: lime for a rival beaten, coral for
 * the one across the table (or the one that ended the run), a printed space
 * for those to come. Bosses stand a little taller.
 */
export function GauntletTrack({
  run,
  over = false,
  className = "",
}: {
  /** A run, or as much of one as there is: no run is no results at all. */
  run: Pick<RunView, "gauntlet" | "matchIndex" | "results">;
  /** The run has ended, so no rival is across the table any more. */
  over?: boolean;
  className?: string;
}) {
  const wins = run.results.filter((result) => result.won).length;
  const currentId = run.gauntlet[run.matchIndex];
  const current = currentId ? getRival(currentId) : null;
  return (
    <ol
      aria-label={
        over
          ? `${plural(wins, "rival")} of ${run.gauntlet.length} beaten.`
          : `Match ${Math.min(run.matchIndex + 1, run.gauntlet.length)} of ${run.gauntlet.length}, against ${current?.name}. ${plural(wins, "rival")} beaten.`
      }
      className={`flex items-end gap-1.5 ${className}`}
    >
      {run.gauntlet.map((rivalId, index) => {
        const rival = getRival(rivalId);
        const result = run.results[index];
        const here = !over && !result && index === run.matchIndex;
        const state = result
          ? result.won
            ? "beaten"
            : "lost to"
          : here
            ? "now"
            : "to come";
        return (
          <li
            key={rivalId}
            title={`${index + 1}. ${rival.name}${rival.boss ? ", boss" : ""}: ${state}`}
            aria-current={here ? "step" : undefined}
            className={`text-print text-ink grid w-7 shrink-0 place-items-center border-2 text-xl tabular-nums ${rival.boss ? "h-9" : "h-7"} ${
              result?.won
                ? "piece border-ink bg-lime"
                : result || here
                  ? "piece border-ink bg-coral"
                  : "border-ink/40 border-dashed"
            } ${here ? "lift" : ""}`}
          >
            <span aria-hidden>{index + 1}</span>
            <span className="sr-only">
              {rival.name}
              {rival.boss ? ", boss" : ""}: {state}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The run at a glance, with the way out of it. */
export function RunStrip({
  run,
  busy,
  onAbandon,
  compact = false,
}: {
  run: RunView;
  busy: boolean;
  onAbandon: () => void;
  /** Leaves out the deck size, where the table says it elsewhere. */
  compact?: boolean;
}) {
  const tier = DIFFICULTY[run.difficulty];
  return (
    <div
      className={`flex flex-wrap items-end justify-between gap-y-1.5 pt-1 pb-1.5 ${compact ? "gap-x-2" : "gap-x-3"}`}
    >
      <GauntletTrack run={run} />
      <div
        className={`text-ink-soft flex min-w-max flex-1 items-baseline justify-between gap-3 text-xs leading-tight font-semibold`}
      >
        {compact ? (
          <p className="whitespace-nowrap">
            <span className="sr-only">Difficulty: </span>
            {tier.name}
          </p>
        ) : (
          <p className="whitespace-nowrap">
            {tier.name} · {plural(run.deck.length, "card")}
            {run.stolen.length > 0 ? ` · ${run.stolen.length} stolen` : ""}
          </p>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={onAbandon}
          className="hover:text-ink relative font-bold whitespace-nowrap underline underline-offset-2 before:absolute before:-inset-x-2 before:-inset-y-3 before:content-[''] disabled:opacity-45"
        >
          Abandon run
        </button>
      </div>
    </div>
  );
}
