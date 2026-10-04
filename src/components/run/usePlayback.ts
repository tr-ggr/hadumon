"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { buildSteps, type Frame } from "./playback";
import type { TurnRecord } from "./useRunController";

/** How long each step of a turn stays up before the next lands. */
export const STEP_MS = 380;

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
  const calm = useReducedMotion();
  const frames = useMemo(
    () =>
      turn ? buildSteps(turn.before, turn.after, turn.action, turn.events) : [],
    [turn],
  );
  const [at, setAt] = useState({ id: 0, index: 0 });
  const last = frames.length - 1;
  const index = !turn || calm ? last : at.id === turn.id ? at.index : 0;
  const playing = turn !== null && index < last;
  const turnId = turn?.id ?? null;

  useEffect(() => {
    if (turnId === null) return;
    if (index >= last) return onDone(turnId);
    const timer = setTimeout(
      () => setAt({ id: turnId, index: index + 1 }),
      STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [turnId, index, last, onDone]);

  // The listeners live as long as the table, so the click that skips can
  // still be swallowed after the skip has re-enabled every control.
  const live = useRef({ playing, turnId, last });
  useEffect(() => {
    live.current = { playing, turnId, last };
  });
  useEffect(() => {
    let swallow = false;
    const skipNow = () => {
      const now = live.current;
      if (!now.playing || now.turnId === null) return false;
      setAt({ id: now.turnId, index: now.last });
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
      if (skipNow()) {
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
    frame: turn ? (frames[index] ?? null) : null,
    playing,
    skip: () => {
      if (turnId !== null) setAt({ id: turnId, index: last });
    },
  };
}
