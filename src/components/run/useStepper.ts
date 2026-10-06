"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

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

/** True for a press on something the steps leave alone: their own corner. */
function keepsPlaying(target: EventTarget | null): boolean {
  return (
    target instanceof Element && target.closest("[data-keep-playing]") !== null
  );
}

const NO_STOPS: readonly number[] = [];

/** The keys that press whatever control has the focus. */
const PRESS_KEYS = new Set(["Enter", " "]);

/**
 * Walks through a run of steps on a timer. `holds[i]` is how long step `i`
 * stays up; the last hold is a rest on the final step before `onDone` is
 * told, and may be 0. Any click or key skips to the end and drops the rest,
 * and reduced motion starts on the last step. Give `holds` a stable identity.
 *
 * A press inside `[data-keep-playing]` is not a skip: it reaches the control
 * it was meant for, and the steps carry on.
 *
 * `stops` are steps a skip does not go past unseen: it lands on the next of
 * them still to come, which is held as long as it would have been, and the
 * steps carry on from there. With none left a skip goes to the end.
 */
export function useStepper(
  id: number | null,
  holds: readonly number[],
  onDone: (id: number) => void,
  stops: readonly number[] = NO_STOPS,
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
  const live = useRef({ playing, id, last, index, stops });
  useEffect(() => {
    live.current = { playing, id, last, index, stops };
  });
  const skipNow = useCallback(() => {
    const now = live.current;
    if (!now.playing || now.id === null) return false;
    const stop = now.stops.find((at) => at > now.index && at < now.last);
    setAt(
      stop === undefined
        ? { id: now.id, index: now.last, skipped: true }
        : { id: now.id, index: stop, skipped: false },
    );
    return true;
  }, []);
  useEffect(() => {
    let swallow = false;
    const onPointerDown = (event: PointerEvent) => {
      swallow = keepsPlaying(event.target) ? false : skipNow();
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
      // Pressing a control of the corner is left to that control.
      if (PRESS_KEYS.has(event.key) && keepsPlaying(event.target)) return;
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
  }, [skipNow]);

  return { index, playing, skip: skipNow };
}
