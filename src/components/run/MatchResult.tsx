"use client";

import { useEffect, useRef, useState, type Ref, type RefObject } from "react";

import { getGoal } from "~/server/game/goals";
import type { ScoreBreakdown } from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { tiebreakText } from "./describe";
import { runFx } from "./fx/effects";
import { clearEnded, justEnded } from "./fx/ended";
import type { Intent } from "./fx/plan";
import { ScoreSheets } from "./Scorepad";
import { playSound } from "./sfx/engine";
import { useReducedMotion } from "./useStepper";

/** The lines of the player's sheet, in the order they are counted up. */
const TALLY_LINES = [
  "cats",
  "yarn",
  "cached",
  "tucked",
  "goals",
  "relics",
] as const;
/** How long each line of the tally takes to land. */
const TALLY_STEP_MS = 190;
/** A breath before the first line, so the screen is seen first. */
const TALLY_START_MS = 320;
/** The total lands once its number has rolled up. */
const TALLY_LAND_MS = 160;

/** The sheet with only its first `counted` lines filled in, and their sum. */
export function tallied(
  player: ScoreBreakdown,
  counted: number,
): ScoreBreakdown {
  const sheet: ScoreBreakdown = {
    cats: 0,
    yarn: 0,
    cached: 0,
    tucked: 0,
    goals: 0,
    relics: 0,
    total: 0,
  };
  for (const line of TALLY_LINES.slice(0, Math.max(0, counted))) {
    sheet[line] = player[line];
    sheet.total += player[line];
  }
  return sheet;
}

/**
 * Counts the player's sheet up a line at a time, each with a tick a little
 * higher than the last, and ends on the total: a burst if the match was
 * won, a plain thud if not. Returns how many lines have landed.
 */
function useTally(
  on: boolean,
  won: boolean,
  root: RefObject<HTMLElement | null>,
): number {
  const [counted, setCounted] = useState(on ? 0 : TALLY_LINES.length);
  useEffect(() => {
    if (!on || counted >= TALLY_LINES.length) return;
    const timer = setTimeout(
      () => {
        const next = counted + 1;
        playSound("tick", next * 2);
        if (next === TALLY_LINES.length) {
          const at = { on: "tally" } as const;
          const landing: Intent[] = [
            { kind: "punch", at, delay: TALLY_LAND_MS },
          ];
          if (won) {
            landing.push({
              kind: "sparks",
              at,
              count: 12,
              tone: "lime",
              delay: TALLY_LAND_MS,
            });
          }
          playSound(won ? "goalWon" : "settle", 0, TALLY_LAND_MS / 1000);
          runFx(root.current, landing);
        }
        setCounted(next);
      },
      counted === 0 ? TALLY_START_MS : TALLY_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [on, won, counted, root]);
  return counted;
}

/**
 * A finished match as a sheet off the scorepad: both scores, line by line,
 * and how each goal went. Straight after the match the player's sheet is
 * counted up; come back to it, or reload, and it is simply there.
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
  const sheet = useRef<HTMLElement>(null);
  const calm = useReducedMotion();
  const result = match.result;
  // Read once, as the sheet first shows; leaving it forgets the match.
  const [fresh] = useState(() => justEnded(match));
  useEffect(() => clearEnded, []);
  const counted = useTally(
    fresh && !calm && result !== null,
    result?.won ?? false,
    sheet,
  );
  if (!result) return null;
  const rival = getRival(match.rivalId);
  const { player } = result;
  const margin = Math.abs(player.total - result.rival.total);
  const settled = tiebreakText(result.tiebreak);

  return (
    <section
      ref={sheet}
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
            {player.total} to {result.rival.total}
          </span>
          {settled ??
            (result.won
              ? margin <= 3
                ? "Close, and it still counts."
                : "Not close."
              : `Short by ${margin}.`)}
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-3 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
        <ScoreSheets
          match={match}
          player={tallied(player, counted)}
          rivalScore={result.rival}
        />

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
