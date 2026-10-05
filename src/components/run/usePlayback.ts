"use client";

import { useMemo } from "react";

import { buildSteps, type Frame } from "./playback";
import type { TurnRecord } from "./useRunController";
import { useStepper } from "./useStepper";

/** How long each step of a turn stays up before the next lands. */
export const STEP_MS = 380;

export interface Playback {
  /** The frame to show, or `null` when no turn is landing. */
  frame: Frame | null;
  /** True while steps are still to come; the table takes no input. */
  playing: boolean;
  skip: () => void;
}

/**
 * Plays a turn back one step at a time. Any click or key skips to the end,
 * and reduced motion lands the whole turn at once. `onDone` is told when the
 * last frame is up, which is the server's own view.
 */
export function usePlayback(
  turn: TurnRecord | null,
  onDone: (id: number) => void,
): Playback {
  const frames = useMemo(
    () =>
      turn ? buildSteps(turn.before, turn.after, turn.action, turn.events) : [],
    [turn],
  );
  // The last frame is the table itself, so nothing waits on it.
  const holds = useMemo(
    () => frames.map((_, index) => (index < frames.length - 1 ? STEP_MS : 0)),
    [frames],
  );
  const { index, playing, skip } = useStepper(turn?.id ?? null, holds, onDone);

  return {
    frame: turn ? (frames[index] ?? null) : null,
    playing,
    skip,
  };
}
