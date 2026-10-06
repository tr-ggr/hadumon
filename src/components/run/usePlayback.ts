"use client";

import { useMemo } from "react";

import { buildSteps, stepDuration, type Frame } from "./playback";
import type { TurnRecord } from "./useRunController";
import { useStepper } from "./useStepper";

/** True for the move that is a seat's whole turn, not a reroll or an answer. */
function isTurnMove(move: Frame["cue"]["rivalMove"]): boolean {
  return (
    move === "play" || move === "hunt" || move === "den" || move === "prowl"
  );
}

export interface Playback {
  /** The frame to show, or `null` when no turn is landing. */
  frame: Frame | null;
  /** Which frame of the turn that is. */
  index: number;
  /** True while steps are still to come; the table takes no input. */
  playing: boolean;
  skip: () => void;
}

/**
 * Plays a turn back one step at a time. Any click or key skips to the end,
 * and reduced motion lands the whole turn at once. `onDone` is told when the
 * last frame is up, which is the server's own view.
 *
 * A skip does not carry the rival's turn off with it: it stops on the move
 * the rival makes, if that has not been shown yet, and the next skip ends
 * the turn.
 */
export function usePlayback(
  turn: TurnRecord | null,
  onDone: (id: number) => void,
): Playback {
  const frames = useMemo(
    () =>
      turn
        ? buildSteps(
            turn.before,
            turn.after,
            turn.action,
            turn.events,
            turn.chainStart,
            turn.beats,
          )
        : [],
    [turn],
  );
  const holds = useMemo(
    () => frames.map((_, index) => stepDuration(frames, index)),
    [frames],
  );
  const stops = useMemo(
    () =>
      frames.flatMap((frame, index) =>
        frame.cue.kind === "rival" && isTurnMove(frame.cue.rivalMove)
          ? [index]
          : [],
      ),
    [frames],
  );
  const { index, playing, skip } = useStepper(
    turn?.id ?? null,
    holds,
    onDone,
    stops,
  );

  return {
    frame: turn ? (frames[index] ?? null) : null,
    index,
    playing,
    skip,
  };
}
