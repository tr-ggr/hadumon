"use client";

import { useMemo } from "react";

import {
  CLIMB_REST_CALM,
  buildClimb,
  type ClimbFrame,
  type ClimbRecord,
} from "./climb";
import { useReducedMotion, useStepper } from "./useStepper";

export interface Climbing {
  /** The frame to show, or `null` when there is no climb to show. */
  frame: ClimbFrame | null;
  skip: () => void;
}

/**
 * Plays a climb one frame at a time, rests on the last, then tells `onDone`.
 * Any click or key leaves at once. Reduced motion shows the last frame alone
 * and gives it longer, so the climb is still seen without anything moving.
 */
export function useClimb(
  climb: ClimbRecord | null,
  gauntlet: readonly string[],
  onDone: (id: number) => void,
): Climbing {
  const calm = useReducedMotion();
  const frames = useMemo(
    () => (climb ? buildClimb(climb.kind, climb.to, gauntlet) : []),
    [climb, gauntlet],
  );
  const holds = useMemo(
    () =>
      frames.map((frame, index) =>
        calm && index === frames.length - 1 ? CLIMB_REST_CALM : frame.ms,
      ),
    [frames, calm],
  );
  const { index, skip } = useStepper(
    climb && frames.length > 0 ? climb.id : null,
    holds,
    onDone,
  );

  return { frame: climb ? (frames[index] ?? null) : null, skip };
}
