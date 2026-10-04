"use client";

import { useEffect, useState } from "react";

import { Button, Modal } from "~/components/ui";
import { RIVAL_ACTIONS, type RivalAction } from "~/server/game/cats";
import { getGoal } from "~/server/game/goals";
import {
  GOAL_LOSE_POINTS,
  GOAL_WIN_POINTS,
  ROUND_TURNS,
} from "~/server/game/match";
import { getRival } from "~/server/game/rival";
import type { MatchView } from "~/server/game/view";

import {
  goalText,
  plural,
  rivalActionText,
  type GoalEvent,
  type LogEntry,
  type LogTone,
  type RivalNews,
} from "./describe";
import { Label } from "./pieces";

/** True for a moment after `key` changes, to draw the eye without moving anything. */
export function useFlash(key: number | null, ms = 1400): boolean {
  const [seen, setSeen] = useState(key);
  useEffect(() => {
    if (key === seen) return;
    const timer = setTimeout(() => setSeen(key), ms);
    return () => clearTimeout(timer);
  }, [key, seen, ms]);
  return key !== null && key !== seen;
}

export function rivalLastText(match: MatchView, news: RivalNews | null) {
  if (news) return news.text;
  if (!match.rival.last) return "Has not flipped a card yet";
  return rivalActionText(
    match.rivalId,
    match.rival.last,
    null,
    match.rival.bankValue,
  );
}

export function StatusStrip({ match }: { match: MatchView }) {
  const rival = getRival(match.rivalId);
  const cells: [string, string][] = [
    [
      "Round",
      `${Math.min(match.round, ROUND_TURNS.length - 1) + 1} of ${ROUND_TURNS.length}`,
    ],
    ["Turns left", String(match.turnsLeft)],
    ["You", String(match.score.total)],
    ["Rival", String(match.rival.score)],
  ];
  const standing = match.standing;
  return (
    <div className="panel-flat overflow-hidden">
      <dl
        aria-label={`Match against ${rival.name}`}
        className="grid grid-cols-4 divide-x divide-black/10"
      >
        {cells.map(([label, value]) => (
          <div key={label} className="px-2 py-2 text-center">
            <dt className="text-ink-soft text-[11px] leading-tight font-bold">
              {label}
            </dt>
            <dd className="text-pixel text-ink text-lg leading-tight tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {/* On a phone the goal panel sits below the board; its gist stays up here. */}
      {standing ? (
        <p className="text-ink border-t border-black/10 px-3 py-1.5 text-xs leading-snug lg:hidden">
          <span className="font-black">
            Goal, {getGoal(standing.goalId).name}:
          </span>{" "}
          {getGoal(standing.goalId).text}{" "}
          <span className="font-black tabular-nums">
            You {standing.player} · Rival {standing.rival}
          </span>
        </p>
      ) : null}
    </div>
  );
}

const ACTION_NAMES: Record<RivalAction, string> = {
  bank: "Bank",
  stash: "Stash",
  raid: "Raid",
  burn: "Burn",
  push: "Push",
};

/** The cards still in the rival's deck, worked out from what it has flipped. */
function cardsLeft(match: MatchView): string {
  const left = new Map<RivalAction, number>();
  for (const card of getRival(match.rivalId).deck) {
    left.set(card, (left.get(card) ?? 0) + 1);
  }
  for (const card of match.rival.seen) {
    left.set(card, (left.get(card) ?? 0) - 1);
  }
  return RIVAL_ACTIONS.flatMap((card) => {
    const n = left.get(card) ?? 0;
    return n > 0 ? [`${n} ${ACTION_NAMES[card]}`] : [];
  }).join(", ");
}

export function RivalPanel({
  match,
  news,
  className = "",
}: {
  match: MatchView;
  news: RivalNews | null;
  className?: string;
}) {
  const rival = getRival(match.rivalId);
  const { banked, bankValue, yarn, goalPoints, score, deckCount } = match.rival;
  const flash = useFlash(news?.id ?? null);

  return (
    <section className={`panel space-y-2 p-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-pixel text-ink text-lg leading-tight">
          {rival.name}
        </h2>
        <span className="text-ink-soft shrink-0 text-xs font-bold">
          {rival.boss ? "Boss · " : ""}Rival
        </span>
      </div>

      <div
        className={`border-ink text-ink border-2 px-2 py-1.5 transition-colors ${flash ? "bg-coral duration-150" : "bg-cream duration-700"}`}
      >
        <p className="text-[11px] leading-tight font-bold">Last card</p>
        <p className="text-sm leading-snug font-black">
          {rivalLastText(match, news)}
        </p>
      </div>

      <p className="text-ink text-sm leading-snug">
        {rival.trait ?? "No trait."}
      </p>
      <p className="text-ink-soft text-xs leading-snug">
        {deckCount > 0
          ? `${plural(deckCount, "card")} left in the deck: ${cardsLeft(match)}.`
          : "The deck is empty and is reshuffled before the next card."}
      </p>
      <p className="text-ink-soft text-xs leading-snug">
        Score {score}: {banked} banked at {bankValue} each, {yarn} yarn,{" "}
        {goalPoints} from goals.
      </p>
    </section>
  );
}

export function GoalPanel({
  match,
  className = "",
}: {
  match: MatchView;
  className?: string;
}) {
  const rival = getRival(match.rivalId);
  const standing = match.standing;
  const round = match.round;

  return (
    <section className={`panel space-y-2 p-3 ${className}`}>
      {standing ? (
        <>
          <div>
            <Label>Round {round + 1} goal</Label>
            <h2 className="text-pixel text-ink text-lg leading-tight">
              {getGoal(standing.goalId).name}
            </h2>
            <p className="text-ink text-sm leading-snug">
              {getGoal(standing.goalId).text}
            </p>
          </div>
          <p className="border-ink bg-lime text-ink border-2 px-2 py-1 text-sm font-black tabular-nums">
            You {standing.player} · Rival {standing.rival}
          </p>
          <p className="text-ink-soft text-xs leading-snug">
            As it stands you take {standing.playerPoints} and {rival.name} takes{" "}
            {standing.rivalPoints}. The higher count takes{" "}
            {GOAL_WIN_POINTS[round]}, the lower {GOAL_LOSE_POINTS[round]}; a tie
            splits them, and a count of 0 takes nothing.
            {match.rival.pushes > 0
              ? ` The rival's count includes ${plural(match.rival.pushes, "push", "pushes")}.`
              : ""}
          </p>
        </>
      ) : null}
      <ul className="text-ink-soft space-y-0.5 text-xs leading-snug">
        {match.goals.map((goalId, index) => {
          if (index === round) return null;
          const scored = match.goalResults[index];
          return (
            <li key={`${index}-${goalId}`}>
              <span className="font-bold">
                Round {index + 1}: {getGoal(goalId).name}.
              </span>{" "}
              {scored
                ? `You took ${scored.playerPoints}, ${rival.name} took ${scored.rivalPoints}.`
                : getGoal(goalId).text}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const LINE_TONES: Record<LogTone, string> = {
  power: "text-ink",
  note: "text-ink-soft",
  rival: "border-coral text-ink border-l-4 pl-2 font-bold",
  goal: "border-ink bg-lime text-ink border-2 px-2 py-1 font-bold",
};

export function EventLog({
  log,
  className = "",
}: {
  log: readonly LogEntry[];
  className?: string;
}) {
  return (
    <section className={`panel space-y-2 p-3 ${className}`}>
      <h2 className="text-pixel text-ink text-lg leading-tight">
        What just happened
      </h2>
      {log.length === 0 ? (
        <p className="text-ink-soft text-sm">
          Nothing yet. The log starts with your first move.
        </p>
      ) : (
        <ol aria-live="polite" className="space-y-2">
          {log.map((entry, index) => (
            <li
              key={entry.id}
              className={`space-y-1 text-sm leading-snug ${index === 0 ? "" : "border-t border-black/10 pt-2 opacity-75"}`}
            >
              <p className="text-ink font-bold">{entry.title}</p>
              {entry.lines.map((line, i) => (
                <p key={i} className={LINE_TONES[line.tone]}>
                  {line.text}
                </p>
              ))}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** A scored goal stops the game until it is acknowledged. */
export function GoalNotice({
  match,
  goal,
  onClose,
}: {
  match: MatchView;
  goal: GoalEvent | null;
  onClose: () => void;
}) {
  const nextGoal = match.goals[match.round];
  return (
    <Modal
      open={goal !== null}
      onClose={onClose}
      title={goal ? `Round ${goal.round + 1} scored` : ""}
      footer={
        <Button data-autofocus onClick={onClose}>
          Carry on
        </Button>
      }
    >
      {goal ? (
        <div className="space-y-3">
          <p className="border-ink bg-lime text-ink border-2 px-2 py-1.5 text-sm font-bold">
            {goalText(match.rivalId, goal)}
          </p>
          <p className="text-ink text-sm">
            The score is you {match.score.total}, {getRival(match.rivalId).name}{" "}
            {match.rival.score}.
          </p>
          {nextGoal ? (
            <p className="text-ink text-sm">
              Round {match.round + 1} has {plural(match.turnsLeft, "turn")}. Its
              goal is {getGoal(nextGoal).name}: {getGoal(nextGoal).text}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
