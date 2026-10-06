"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";

import {
  CLIMB_REST_CALM,
  buildClimb,
  buildOpening,
  type ClimbFrame,
  type ClimbRecord,
} from "./climb";
import { runFx } from "./fx/effects";
import { finishAll } from "./fx/registry";
import { playSound, playSounds, stopSound } from "./sfx/engine";
import { useReducedMotion, useStepper } from "./useStepper";

export interface Climbing {
  /** The frame to show, or `null` when there is no climb to show. */
  frame: ClimbFrame | null;
  /** Which frame of the climb it is, counted from 0. */
  beat: number;
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

  return { frame: climb ? (frames[index] ?? null) : null, beat: index, skip };
}

/** A run's opening, still to be shown. */
export interface OpeningRecord {
  id: number;
  /** The run it opens; shown for any other, it is stale. */
  runId: string;
}

export interface Opening {
  /** The frame to show: the rest by the chest once nothing is playing. */
  frame: ClimbFrame | null;
  /** Which frame of the opening it is, counted from 0. */
  beat: number;
  /** True until the opening has come to rest by the chest. */
  playing: boolean;
  skip: () => void;
}

/**
 * Plays a run's opening one frame at a time and stays on the last, Hadu by
 * the open chest, telling `onDone` it has got there. With no opening to
 * play, or with reduced motion, it is on the last frame from the start. Any
 * click or key goes straight there.
 */
export function useOpening(
  opening: OpeningRecord | null,
  gauntlet: readonly string[],
  stolen: number,
  onDone: (id: number) => void,
): Opening {
  const frames = useMemo(
    () => buildOpening(gauntlet, stolen),
    [gauntlet, stolen],
  );
  const holds = useMemo(() => frames.map((frame) => frame.ms), [frames]);
  const { index, playing, skip } = useStepper(
    opening && frames.length > 0 ? opening.id : null,
    holds,
    onDone,
  );
  return { frame: frames[index] ?? null, beat: index, playing, skip };
}

/**
 * Sets off what a frame of the climb is heard and felt as: its sounds, and a
 * jolt of whatever under `root` is marked to shake. A frame is played once.
 * Frames are expected one after another, so a beat that arrives any other
 * way is a skip (or reduced motion, which starts on the last): every sound
 * is cut and the picture settles with one soft thud.
 */
export function useClimbFx(
  root: RefObject<HTMLElement | null>,
  beat: number,
  frame: ClimbFrame,
): void {
  const calm = useReducedMotion();
  const last = useRef<number | null>(null);
  // The frame is read when its beat lands, not followed as it changes.
  const latest = useRef(frame);
  useLayoutEffect(() => {
    latest.current = frame;
  });

  useLayoutEffect(() => {
    const prev = last.current;
    if (prev === beat) return;
    last.current = beat;
    if (beat !== (prev === null ? 0 : prev + 1)) {
      finishAll();
      stopSound();
      playSound("settle");
      return;
    }
    const now = latest.current;
    playSounds(now.sounds);
    if (!calm && now.shake !== "none") {
      runFx(root.current, [
        { kind: "shake", strength: now.shake === "hard" ? 2 : 1, delay: 0 },
      ]);
    }
  }, [root, beat, calm]);
}
