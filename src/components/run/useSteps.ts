"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export interface Steps<T> {
  step: T;
  /** Zero-based. */
  index: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  back: () => void;
  /** Jumps to a step by name. A step that is not in the list is ignored. */
  goTo: (step: T) => void;
  /** For the heading of the step on show, which takes `tabIndex={-1}`. */
  heading: RefObject<HTMLHeadingElement | null>;
}

/**
 * Walks a list of screens one at a time, by hand. `steps` must not be
 * empty. A new step starts at the top of the page with focus on its
 * heading, so a keyboard or a screen reader lands on what has just arrived.
 */
export function useSteps<T>(steps: readonly T[]): Steps<T> {
  const [at, setAt] = useState(0);
  const count = steps.length;
  const index = Math.min(at, count - 1);
  const heading = useRef<HTMLHeadingElement>(null);

  const shown = useRef(index);
  useEffect(() => {
    if (shown.current === index) return;
    shown.current = index;
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [index]);

  return {
    step: steps[index]!,
    index,
    count,
    isFirst: index === 0,
    isLast: index === count - 1,
    next: () => setAt(Math.min(index + 1, count - 1)),
    back: () => setAt(Math.max(index - 1, 0)),
    goTo: (step) => {
      const found = steps.indexOf(step);
      if (found >= 0) setAt(found);
    },
    heading,
  };
}
