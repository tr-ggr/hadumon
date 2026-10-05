"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True when the visitor has asked for less motion. False on the server. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false,
  );
}

export interface Stepper {
  /** The step to show. The last one when nothing is playing. */
  index: number;
  /** True until `onDone` is due; whatever is under the steps takes no input. */
  playing: boolean;
  skip: () => void;
}

/**
 * Walks through a run of steps on a timer. `holds[i]` is how long step `i`
 * stays up; the last hold is a rest on the final step before `onDone` is
 * told, and may be 0. Any click or key skips to the end and drops the rest,
 * and reduced motion starts on the last step. Give `holds` a stable identity.
 */
export function useStepper(
  id: number | null,
  holds: readonly number[],
  onDone: (id: number) => void,
): Stepper {
  const calm = useReducedMotion();
  const [at, setAt] = useState({ id: 0, index: 0, skipped: false });
  const last = holds.length - 1;
  const mine = id !== null && at.id === id;
  const index = id === null || calm ? last : mine ? at.index : 0;
  const skipped = mine && at.skipped;
  const ended = index >= last;
  const hold = ended && skipped ? 0 : (holds[Math.min(index, last)] ?? 0);
  const playing = id !== null && (!ended || hold > 0);

  useEffect(() => {
    if (id === null) return;
    if (ended && hold <= 0) return onDone(id);
    const timer = setTimeout(
      () =>
        ended ? onDone(id) : setAt({ id, index: index + 1, skipped: false }),
      hold,
    );
    return () => clearTimeout(timer);
  }, [id, index, ended, hold, onDone]);

  // The listeners live as long as the caller, so the click that skips can
  // still be swallowed after the skip has re-enabled every control.
  const live = useRef({ playing, id, last });
  useEffect(() => {
    live.current = { playing, id, last };
  });
  useEffect(() => {
    let swallow = false;
    const skipNow = () => {
      const now = live.current;
      if (!now.playing || now.id === null) return false;
      setAt({ id: now.id, index: now.last, skipped: true });
      return true;
    };
    const onPointerDown = () => {
      swallow = skipNow();
    };
    const onClick = (event: MouseEvent) => {
      if (!swallow) return;
      swallow = false;
      event.stopPropagation();
      event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key === "Shift") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // A key still held from the press that started the steps is not a skip.
      if (event.repeat ? live.current.playing : skipNow()) {
        event.stopPropagation();
        event.preventDefault();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return {
    index,
    playing,
    skip: () => {
      if (id !== null) setAt({ id, index: last, skipped: true });
    },
  };
}
