"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

import type { Frame } from "../playback";
import { playSound, playSounds, stopSound } from "../sfx/engine";
import { soundsFor } from "../sfx/recipes";
import { isCompact } from "./dom";
import { runFx } from "./effects";
import { planFx } from "./plan";
import { finishAll } from "./registry";

/**
 * Sets off the sound and the effects of each frame of a turn as it lands.
 *
 * A frame is played once: the same turn and index a second time (React's
 * strict mode runs an effect twice) does nothing. Frames are expected one
 * after another, so an index that moves any other way is a skip: every
 * animation is finished and every voice cut. A skip that ends the turn
 * settles the table with one sound; one that stops on a frame of its own
 * (the rival's move) plays that frame as if it had come in turn. Under
 * reduced motion the turn arrives on its last frame, which is a skip to the
 * end.
 */
export function useFrameFx(
  root: RefObject<HTMLElement | null>,
  turnId: number | null,
  index: number,
  frame: Frame | null,
  calm: boolean,
): void {
  const last = useRef<{ turnId: number | null; index: number }>({
    turnId: null,
    index: 0,
  });
  // The frame is read when its index lands, not followed as it changes.
  const latest = useRef(frame);
  useLayoutEffect(() => {
    latest.current = frame;
  });

  useLayoutEffect(() => {
    const prev = last.current;
    if (prev.turnId === turnId && prev.index === index) return;
    last.current = { turnId, index };
    const now = latest.current;
    if (turnId === null || !now) return;

    const expected = prev.turnId === turnId ? prev.index + 1 : 0;
    const skipped = index !== expected;
    if (skipped) {
      finishAll();
      stopSound();
    }
    if (now.cue.kind === "settle") {
      if (skipped) playSound("settle");
      return;
    }
    playSounds(soundsFor(now.cue));
    if (!calm) {
      runFx(root.current, planFx(now.cue, { compact: isCompact() }));
    }
  }, [root, turnId, index, calm]);
}
