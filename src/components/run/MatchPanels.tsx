"use client";

import { useEffect, useRef, useState } from "react";

import { Modal, TableButton } from "~/components/ui";
import { getGoal } from "~/server/game/goals";
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

const LINE_TONES: Record<LogTone, string> = {
  power: "text-ink",
  note: "text-ink-soft",
  rival: "border-ink bg-coral text-ink border-2 px-1.5 py-0.5 font-bold",
  goal: "border-ink bg-lime text-ink border-2 px-1.5 py-0.5 font-bold",
};

export function EventLog({
  log,
  landed,
  className = "",
}: {
  log: readonly LogEntry[];
  /**
   * While a turn plays back, how many lines of the newest entry have landed.
   * Omit to show every line.
   */
  landed?: number;
  className?: string;
}) {
  // While a turn lands, the list follows the line that has just landed; once
  // it has settled, the newest entry is shown from its top.
  const list = useRef<HTMLOListElement>(null);
  const newest = log[0]?.id;
  useEffect(() => {
    const box = list.current;
    const line = box?.firstElementChild?.lastElementChild;
    if (!box) return;
    if (landed === undefined || !(line instanceof HTMLElement)) {
      box.scrollTop = 0;
      return;
    }
    const below = line.offsetTop + line.offsetHeight - box.clientHeight;
    box.scrollTop = Math.max(0, below + 10);
  }, [newest, landed]);

  return (
    <section
      aria-label="What just happened"
      className={`piece border-ink text-ink flex min-h-0 flex-col border-2 bg-white ${className}`}
    >
      <h2 className="text-print border-ink/15 border-b px-2.5 py-1 text-xl">
        What just happened
      </h2>
      {log.length === 0 ? (
        <p className="text-ink-soft p-2.5 text-sm">
          Nothing yet. Each move, and what the rival does next, lands here.
        </p>
      ) : (
        <ol
          ref={list}
          aria-live="polite"
          className="relative min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 py-2"
        >
          {log.map((entry, index) => {
            const lines =
              index === 0 && landed !== undefined
                ? entry.lines.slice(0, landed)
                : entry.lines;
            return (
              <li
                key={entry.id}
                className={`space-y-0.5 text-[13px] leading-[1.3] ${index === 0 ? "" : "border-t border-black/10 pt-2 opacity-75"}`}
              >
                <p className="text-ink font-bold">{entry.title}</p>
                {lines.map((line, i) => (
                  <p key={i} className={LINE_TONES[line.tone]}>
                    {line.text}
                  </p>
                ))}
              </li>
            );
          })}
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
        <TableButton size="md" data-autofocus onClick={onClose}>
          Carry on
        </TableButton>
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
