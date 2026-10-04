import { PixelIcon } from "~/components/PixelIcon";
import { getGoal } from "~/server/game/goals";
import {
  GOAL_LOSE_POINTS,
  GOAL_WIN_POINTS,
  ROUND_TURNS,
} from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { plural } from "./describe";
import { TurnCube } from "./pieces";

/** Turns in a round of this match; a relic can lengthen the first. */
export function roundTurns(match: MatchView, round: number): number {
  return (ROUND_TURNS[round] ?? 0) + (round === 0 ? match.mods.extraTurns : 0);
}

/**
 * The three rounds as tiles along the top of the mat: the turns as cubes, the
 * goal and what it pays, and how the goal stands or how it went.
 */
export function RoundBoard({
  match,
  className = "",
}: {
  match: MatchView;
  className?: string;
}) {
  return (
    <ol
      aria-label="Rounds"
      className={`grid gap-2.5 sm:grid-cols-3 ${className}`}
    >
      {match.goals.map((goalId, round) => (
        <RoundTile key={`${round}-${goalId}`} match={match} round={round} />
      ))}
    </ol>
  );
}

function RoundTile({ match, round }: { match: MatchView; round: number }) {
  const goal = getGoal(match.goals[round] ?? "");
  const rival = getRival(match.rivalId).name;
  const playing = match.phase !== "over" && match.phase !== "setup";
  const current = playing && round === match.round;
  const scored = match.goalResults[round];
  const turns = roundTurns(match, round);
  const left = current
    ? match.turnsLeft
    : playing && round < match.round
      ? 0
      : match.phase === "over"
        ? 0
        : turns;
  const standing = current ? match.standing : null;

  return (
    <li
      aria-current={current ? "step" : undefined}
      className={`piece border-ink text-ink flex-col gap-1 border-2 px-2 py-1.5 ${current ? "flex bg-white" : playing ? "bg-cream hidden sm:flex" : "bg-cream flex"} ${scored ? "opacity-80" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-print text-xl">Round {round + 1}</h3>
        <p className="flex items-center gap-1">
          {Array.from({ length: turns }, (_, i) => (
            <TurnCube key={i} spent={i >= left} />
          ))}
          <span className="sr-only">
            {current
              ? `${plural(left, "turn")} left of ${turns}`
              : scored
                ? "played"
                : plural(turns, "turn")}
          </span>
        </p>
      </div>

      <p className="flex items-start gap-1.5 text-xs leading-snug">
        <PixelIcon name="goal" size={16} className="mt-px" />
        <span className="min-w-0">
          <span className="font-black">{goal.name}.</span> {goal.text}{" "}
          <span className="font-bold whitespace-nowrap tabular-nums">
            Pays {GOAL_WIN_POINTS[round]} or {GOAL_LOSE_POINTS[round]}.
          </span>
        </span>
      </p>

      {standing ? (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-none font-bold tabular-nums">
          <Marker tone="lime">You {standing.player}</Marker>
          <Marker tone="coral">
            {rival} {standing.rival}
          </Marker>
          <span>
            Now: you {standing.playerPoints}, rival {standing.rivalPoints}.
          </span>
        </p>
      ) : scored ? (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-none font-bold tabular-nums">
          <Marker tone="lime">You took {scored.playerPoints}</Marker>
          <Marker tone="coral">
            {rival} took {scored.rivalPoints}
          </Marker>
        </p>
      ) : null}
    </li>
  );
}

function Marker({
  tone,
  children,
}: {
  tone: "lime" | "coral";
  children: React.ReactNode;
}) {
  return (
    <span
      className={`border-ink border-2 px-1 py-0.5 ${tone === "lime" ? "bg-lime" : "bg-coral"}`}
    >
      {children}
    </span>
  );
}
