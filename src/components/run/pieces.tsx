import type { ReactNode } from "react";

import { EssencePip } from "~/components/cats/CatCard";
import { getGoal } from "~/server/game/goals";
import {
  GOAL_LOSE_POINTS,
  GOAL_WIN_POINTS,
  type Essence,
} from "~/server/game/match";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";

import { essenceLabel } from "./describe";

/** Small caps-free label above a group of game pieces. */
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-ink-soft text-xs font-bold ${className}`}>{children}</p>
  );
}

export interface DieProps {
  face: Essence;
  /** Omit for a die that is only shown. */
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

/** One feeder die. A button only while dice are being chosen. */
export function Die({ face, onClick, selected = false, disabled }: DieProps) {
  const body = (
    <>
      <EssencePip kind={face} size={22} />
      <span className="text-[10px] leading-none font-bold">
        {essenceLabel(face)}
      </span>
    </>
  );
  const box = `border-ink text-ink flex min-h-12 w-full flex-col items-center justify-center gap-1 border-2 px-1 py-1.5 ${selected ? "bg-lime" : "bg-white"}`;
  if (!onClick) return <div className={box}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${essenceLabel(face)} die`}
      className={`${box} hover:bg-sky-soft aria-pressed:hover:bg-lime disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {body}
    </button>
  );
}

/** Relics with their rules text; the board has to carry every rule. */
export function RelicList({ relicIds }: { relicIds: readonly string[] }) {
  if (relicIds.length === 0) {
    return <p className="text-ink-soft text-sm">No relics yet.</p>;
  }
  return (
    <ul className="space-y-1">
      {relicIds.map((id) => {
        const relic = getRelic(id);
        return (
          <li key={id} className="text-ink text-sm leading-snug">
            <span className="font-bold">{relic.name}.</span> {relic.text}
          </li>
        );
      })}
    </ul>
  );
}

/** Who the match is against: name, boss mark, flavor and trait. */
export function RivalIntro({
  rivalId,
  matchIndex,
  matches,
}: {
  rivalId: string;
  matchIndex: number;
  matches: number;
}) {
  const rival = getRival(rivalId);
  return (
    <div className="space-y-1">
      <Label>
        Match {matchIndex + 1} of {matches}
        {rival.boss ? " · Boss" : ""}
      </Label>
      <h2 className="text-pixel text-ink text-xl sm:text-2xl">{rival.name}</h2>
      <p className="text-ink-soft text-sm italic">{rival.flavor}</p>
      <p className="text-ink text-sm">
        {rival.trait ??
          "No tricks: banks, stashes, raids, burns and pushes like anyone."}
      </p>
    </div>
  );
}

/** The three round goals, with what each is worth. */
export function GoalList({
  goalIds,
  current,
}: {
  goalIds: readonly string[];
  /** The round being played, to mark it; omit before the match starts. */
  current?: number;
}) {
  return (
    <ol className="space-y-1">
      {goalIds.map((id, round) => {
        const goal = getGoal(id);
        return (
          <li
            key={`${round}-${id}`}
            className={`text-sm leading-snug ${round === current ? "text-ink" : "text-ink-soft"}`}
          >
            <span className="font-bold">
              Round {round + 1}: {goal.name}.
            </span>{" "}
            {goal.text} {GOAL_WIN_POINTS[round]} to the winner,{" "}
            {GOAL_LOSE_POINTS[round]} to the other.
          </li>
        );
      })}
    </ol>
  );
}
