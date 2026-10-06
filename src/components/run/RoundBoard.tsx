import { EssencePip } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { getCat } from "~/server/game/cats";
import { FOOD_LABELS } from "~/server/game/elements";
import { getGoal } from "~/server/game/goals";
import {
  GOAL_LOSE_POINTS,
  GOAL_WIN_POINTS,
  roundTurns as seatRoundTurns,
} from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import { listWords, plural } from "./describe";
import type { KeptCount } from "./goalHints";
import { TurnCube } from "./pieces";

/** Turns in a round of this match; a relic can lengthen the first and the last. */
export function roundTurns(match: MatchView, round: number): number {
  return seatRoundTurns(match.mods, round);
}

/**
 * The rounds as tiles: the turns as cubes, the goal and what it pays,
 * and how the goal stands or how it went. In the match's rail they stack,
 * and the rounds that are not being played are cut down to a line or two.
 */
export function RoundBoard({
  match,
  rail = false,
  kept,
  className = "",
}: {
  match: MatchView;
  /** Stacked in the rail beside the table, from `lg` up. */
  rail?: boolean;
  /**
   * One entry per round of what is being kept that counts towards its goal.
   * A round with anything counting is lit, and shows the cats' faces and the
   * food.
   */
  kept?: readonly KeptCount[];
  className?: string;
}) {
  return (
    <ol
      aria-label="Rounds"
      className={`grid gap-2.5 sm:grid-cols-2 ${rail ? "lg:grid-cols-1 lg:gap-2" : ""} ${className}`}
    >
      {match.goals.map((goalId, round) => (
        <RoundTile
          key={`${round}-${goalId}`}
          match={match}
          round={round}
          rail={rail}
          kept={kept?.[round] ?? null}
        />
      ))}
    </ol>
  );
}

function RoundTile({
  match,
  round,
  rail,
  kept,
}: {
  match: MatchView;
  round: number;
  rail: boolean;
  kept: KeptCount | null;
}) {
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
  // In the rail a round that is not being played gives way to the one that is,
  // and on a short screen it is a single line: how it went, or what its goal
  // will be.
  const compact = rail && !current;
  const line = compact;
  const counted = kept !== null && kept.cats.length + kept.food.length > 0;

  return (
    <li
      aria-current={current ? "step" : undefined}
      className={`piece border-ink text-ink flex-col gap-1 border-2 px-2 py-1.5 ${compact ? "lg:gap-0.5 lg:py-1" : ""} ${line ? "lg:short:flex-row lg:short:flex-wrap lg:short:items-center lg:short:gap-x-2" : ""} ${current ? "flex bg-white" : playing ? "bg-cream hidden sm:flex" : counted ? "bg-lime is-chosen flex" : "bg-cream flex"} ${scored ? "opacity-80" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-print text-xl">Round {round + 1}</h3>
        {line && !scored ? (
          <p className="lg:short:block hidden min-w-0 truncate text-xs font-black">
            {goal.name}
          </p>
        ) : null}
        <p
          className={`flex flex-wrap items-center justify-end gap-1 ${line ? "lg:short:hidden" : ""}`}
        >
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

      <div
        className={
          compact && scored
            ? "flex flex-col gap-1 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-2"
            : "contents"
        }
      >
        <p
          className={`flex items-start gap-1.5 text-xs leading-snug ${compact ? "lg:text-[11px]" : ""} ${line ? "lg:short:sr-only" : ""}`}
        >
          <PixelIcon name="goal" size={16} className="mt-px" />
          <span className="min-w-0">
            <span className="font-black">{goal.name}.</span>{" "}
            {/* A round already scored keeps its name; how it went says the rest. */}
            <span className={compact && scored ? "lg:sr-only" : ""}>
              {goal.text}{" "}
              <span className="font-bold whitespace-nowrap tabular-nums">
                Pays {GOAL_WIN_POINTS[round]} or {GOAL_LOSE_POINTS[round]}.
              </span>
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
      </div>

      {kept && counted ? (
        <ul
          aria-label={`Counts towards ${goal.name}`}
          className="flex flex-wrap gap-1.5 pt-0.5"
        >
          {/* A face says who counts; how is in its name, read and on hover. */}
          {kept.cats.map(({ catId, hint }, index) => (
            <li key={`${index}-${catId}`} className={KEPT_CHIP}>
              <PixelSprite
                catId={catId}
                size={32}
                label={`${getCat(catId).name}: ${hint}`}
              />
            </li>
          ))}
          {kept.food.length > 0 ? (
            <li
              aria-label={`${listWords(kept.food.map((food) => FOOD_LABELS[food]))} kept`}
              className={`${KEPT_CHIP} gap-0.5 px-1`}
            >
              {kept.food.map((food) => (
                <EssencePip key={food} kind={food} size={20} />
              ))}
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

/** A kept cat's face, or the food kept, set on a lit round. */
const KEPT_CHIP =
  "border-ink bg-cream flex h-10 min-w-10 items-center justify-center border-2";

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
