"use client";

import { useLayoutEffect, useRef } from "react";

import { useReducedMotion } from "../useStepper";
import { trackTask } from "./registry";

/** The quickest and the slowest a number rolls, however far it has to go. */
const ROLL_MIN_MS = 140;
const ROLL_MAX_MS = 520;
const ROLL_MS_PER_STEP = 70;

export function rollDuration(from: number, to: number): number {
  return Math.min(
    ROLL_MAX_MS,
    Math.max(ROLL_MIN_MS, Math.abs(to - from) * ROLL_MS_PER_STEP),
  );
}

/** The whole number shown `progress` of the way from one value to another. */
export function rolled(from: number, to: number, progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  // It runs fast and slows into the last digit.
  const eased = 1 - (1 - p) ** 3;
  return p >= 1 ? to : Math.round(from + (to - from) * eased);
}

/**
 * A count that rolls to its new value instead of jumping to it. The number
 * on the page is written by a frame timer and not by React, so a roll costs
 * no render; a skip finishes it at once, and under reduced motion it is
 * simply set. Give it the same `className` a plain number would have.
 */
export function RollingNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const node = useRef<HTMLSpanElement>(null);
  /** What the page shows right now, which a roll starts from. */
  const showing = useRef(value);
  const first = useRef(value);
  const calm = useReducedMotion();

  useLayoutEffect(() => {
    const el = node.current;
    if (!el) return;
    const from = showing.current;
    const set = (n: number) => {
      showing.current = n;
      el.textContent = String(n);
    };
    if (from === value) return;
    if (calm) return set(value);

    const duration = rollDuration(from, value);
    let start: number | null = null;
    let frame = 0;
    let untrack = () => undefined as void;
    const land = () => {
      cancelAnimationFrame(frame);
      untrack();
      set(value);
    };
    const tick = (now: number) => {
      start ??= now;
      const progress = (now - start) / duration;
      if (progress >= 1) return land();
      set(rolled(from, value, progress));
      frame = requestAnimationFrame(tick);
    };
    untrack = trackTask(land);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      untrack();
    };
  }, [value, calm]);

  // React writes the number once; after that the roll owns it.
  return (
    <span ref={node} className={className} suppressHydrationWarning>
      {first.current}
    </span>
  );
}
