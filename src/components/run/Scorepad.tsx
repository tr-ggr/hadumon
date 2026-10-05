import { getGoal } from "~/server/game/goals";
import {
  GOAL_LOSE_POINTS,
  GOAL_WIN_POINTS,
  type ScoreBreakdown,
} from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import type { ReactNode } from "react";

import { RollingNumber } from "./fx/RollingNumber";

function Line({
  label,
  value,
  total = false,
  tally,
}: {
  label: string;
  value: number;
  total?: boolean;
  /** Marks the number a finished match's tally ends on. */
  tally?: "total";
}) {
  return (
    <div
      className={`flex justify-between gap-2 ${total ? "border-ink mt-0.5 items-center border-t-2 pt-1 font-black" : "items-baseline border-b border-black/10"}`}
    >
      <dt className="text-xs leading-[1.125rem]">{label}</dt>
      <dd
        data-tally={tally}
        className={`tabular-nums ${total ? "text-print text-xl" : "text-xs leading-[1.125rem] font-bold"}`}
      >
        <RollingNumber value={value} />
      </dd>
    </div>
  );
}

/**
 * Both score sheets, line by line: the same lines, since both sides are
 * scored the same way. Each defaults to the live score.
 */
export function ScoreSheets({
  match,
  player = match.score,
  rivalScore = match.rival.score,
  note,
}: {
  match: MatchView;
  player?: ScoreBreakdown;
  rivalScore?: ScoreBreakdown;
  /** A line under both sheets. */
  note?: ReactNode;
}) {
  const rival = getRival(match.rivalId);
  return (
    <div className="text-ink grid grid-cols-2 gap-3">
      <dl>
        <p className="border-ink bg-lime mb-1 inline-block border-2 px-1 text-xs leading-5 font-black">
          You
        </p>
        <Line label="Cats" value={player.cats} />
        <Line label="Yarn" value={player.yarn} />
        <Line label="Cached" value={player.cached} />
        <Line label="Tucked" value={player.tucked} />
        <Line label="Goals" value={player.goals} />
        <Line label="Relics" value={player.relics} />
        <Line label="Total" value={player.total} total tally="total" />
      </dl>
      <dl>
        <p className="border-ink bg-coral mb-1 inline-block max-w-full truncate border-2 px-1 align-bottom text-xs leading-5 font-black">
          {rival.name}
        </p>
        <Line label="Cats" value={rivalScore.cats} />
        <Line label="Yarn" value={rivalScore.yarn} />
        <Line label="Cached" value={rivalScore.cached} />
        <Line label="Tucked" value={rivalScore.tucked} />
        <Line label="Goals" value={rivalScore.goals} />
        <Line label="Relics" value={rivalScore.relics} />
        <Line label="Total" value={rivalScore.total} total />
      </dl>
      {note ? <div className="col-span-2">{note}</div> : null}
    </div>
  );
}

/**
 * The scorepad beside the table: both scores as they stand, and the three
 * goals with what each pays.
 */
export function Scorepad({
  match,
  className = "",
}: {
  match: MatchView;
  className?: string;
}) {
  const rival = getRival(match.rivalId).name;
  return (
    <section
      aria-label="Scorepad"
      className={`piece border-ink text-ink space-y-2 border-2 bg-white p-2.5 ${className}`}
    >
      <h2 className="sr-only">Scorepad</h2>
      <ScoreSheets
        match={match}
        note={
          <p className="text-ink-soft text-[11px] leading-snug">
            A tied goal splits the points. A count of 0 takes nothing.
          </p>
        }
      />
      <ol className="space-y-1 text-xs leading-snug sm:hidden">
        {match.goals.map((goalId, round) => {
          const scored = match.goalResults[round];
          return (
            <li key={`${round}-${goalId}`}>
              <span className="font-black">
                Round {round + 1}, {getGoal(goalId).name}:
              </span>{" "}
              {scored
                ? `you took ${scored.playerPoints}, ${rival} took ${scored.rivalPoints}.`
                : `${getGoal(goalId).text} ${GOAL_WIN_POINTS[round]} to the higher count, ${GOAL_LOSE_POINTS[round]} to the lower.`}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
