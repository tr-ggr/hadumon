import type { ReactNode } from "react";

import { PixelIcon } from "~/components/PixelIcon";
import type { IconName } from "~/components/sprites/icons";
import { getGoal } from "~/server/game/goals";
import {
  GOAL_LOSE_POINTS,
  GOAL_WIN_POINTS,
  type ScoreBreakdown,
} from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { goalText } from "./describe";
import { RollingNumber } from "./fx/RollingNumber";
import { GoalPays, GoalScore, RoundNumber } from "./pieces";

/** The lines of a score sheet, each with the icon that stands for it. */
const LINES = [
  ["cats", "Cats", "paw"],
  ["yarn", "Yarn", "yarn"],
  ["cached", "Cached", "cached"],
  ["tucked", "Tucked", "tucked"],
  ["goals", "Goals", "goal"],
  ["relics", "Relics", "chest"],
] as const satisfies readonly (readonly [
  keyof ScoreBreakdown,
  string,
  IconName,
])[];

/** A number on a sheet, in bold where it beats the other side's. */
function Cell({
  value,
  ahead,
  tally,
}: {
  value: number;
  ahead: boolean;
  /** Marks the number a finished match's tally ends on. */
  tally?: "total";
}) {
  return (
    <td
      data-tally={tally}
      className={`px-1 text-right tabular-nums ${ahead ? "font-black" : "font-normal"}`}
    >
      <RollingNumber value={value} />
    </td>
  );
}

/**
 * Both score sheets as one table: a line's icon, then the player's number
 * and the rival's under their coloured tags. Both sides are scored the same
 * way, so each line is named once. Each defaults to the live score.
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
    <div className="text-ink space-y-1.5">
      <table className="w-full border-collapse text-xs leading-[1.125rem]">
        <thead>
          <tr>
            <th className="w-full text-left">
              <span className="sr-only">Line</span>
            </th>
            <th className="pb-1 pl-1 text-right">
              <span className="border-ink bg-lime inline-block border-2 px-1 leading-5 font-black">
                You
              </span>
            </th>
            <th className="pb-1 pl-1 text-right">
              <span
                title={rival.name}
                className="border-ink bg-coral inline-block max-w-24 truncate border-2 px-1 align-bottom leading-5 font-black"
              >
                {rival.name}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {LINES.map(([key, label, icon]) => (
            <tr key={key} className="border-b border-black/10">
              <th scope="row" className="py-px text-left font-normal">
                <span className="flex items-center gap-1.5">
                  <PixelIcon name={icon} size={16} label={label} />
                  <span
                    aria-hidden
                    className="text-ink-soft hidden text-[11px] sm:inline"
                  >
                    {label}
                  </span>
                </span>
              </th>
              <Cell value={player[key]} ahead={player[key] > rivalScore[key]} />
              <Cell
                value={rivalScore[key]}
                ahead={rivalScore[key] > player[key]}
              />
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-ink text-print border-t-2 text-xl">
            <th scope="row" className="pt-1 text-left text-xs font-black">
              <span aria-hidden className="text-print text-base">
                =
              </span>
              <span className="sr-only">Total</span>
            </th>
            <Cell
              value={player.total}
              ahead={player.total > rivalScore.total}
              tally="total"
            />
            <Cell
              value={rivalScore.total}
              ahead={rivalScore.total > player.total}
            />
          </tr>
        </tfoot>
      </table>
      {note}
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
      <ol className="space-y-1 sm:hidden">
        {match.goals.map((goalId, round) => {
          const goal = getGoal(goalId);
          const scored = match.goalResults[round];
          return (
            <li
              key={`${round}-${goalId}`}
              className="flex items-center justify-between gap-2"
            >
              <span
                title={goal.text}
                className="flex min-w-0 items-center gap-1.5 text-xs font-black"
              >
                <RoundNumber round={round} />
                <span className="truncate">{goal.name}</span>
                <span className="sr-only">. {goal.text}</span>
              </span>
              {scored ? (
                <GoalScore
                  player={scored.player}
                  rival={scored.rival}
                  playerPoints={scored.playerPoints}
                  rivalPoints={scored.rivalPoints}
                  sentence={goalText(match.rivalId, scored)}
                />
              ) : (
                <GoalPays
                  win={GOAL_WIN_POINTS[round] ?? 0}
                  lose={GOAL_LOSE_POINTS[round] ?? 0}
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
