import type { Ref } from "react";

import { getGoal } from "~/server/game/goals";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { ScoreSheets } from "./Scorepad";

/**
 * A finished match as a sheet off the scorepad: both scores, line by line,
 * and how each goal went.
 */
export function MatchResult({
  match,
  headingRef,
  className = "",
}: {
  match: MatchView;
  /** Given when the sheet is a step of its own, so focus can be sent to it. */
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
}) {
  const result = match.result;
  if (!result) return null;
  const rival = getRival(match.rivalId);
  const { player } = result;
  const margin = Math.abs(player.total - result.rival);

  return (
    <section
      className={`piece piece-card border-ink text-ink space-y-3 border-2 bg-white p-3 sm:p-4 ${className}`}
    >
      <div>
        <h2
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="text-print text-3xl"
        >
          {result.won ? `You beat ${rival.name}` : `You lost to ${rival.name}`}
        </h2>
        <p className="mt-1.5 text-sm">
          <span
            className={`border-ink mr-1.5 border-2 px-1 font-black tabular-nums ${result.won ? "bg-lime" : "bg-coral"}`}
          >
            {player.total} to {result.rival}
          </span>
          {result.won
            ? margin <= 3
              ? "Close, and it still counts."
              : "Not close."
            : margin === 0
              ? "A tie goes to the rival."
              : `Short by ${margin}.`}
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <ScoreSheets match={match} player={player} rivalTotal={result.rival} />

        <ol className="space-y-1.5">
          {match.goalResults.map((goal, round) => (
            <li key={round} className="text-sm leading-snug">
              <span className="font-bold">
                Round {round + 1}, {getGoal(goal.goalId).name}:
              </span>{" "}
              you {goal.player}, {rival.name} {goal.rival}. You took{" "}
              {goal.playerPoints}, {rival.name} took {goal.rivalPoints}.
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
