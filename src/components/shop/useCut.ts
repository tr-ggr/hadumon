"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";

import { trackTask } from "~/components/run/fx/registry";
import { ARRIVE, springTo } from "~/components/run/fx/spring";

/** How far across the top a cut has to get before letting go finishes it. */
export const CUT_THROUGH = 0.6;

/** A cut let go short of that closes again on this, over this long. */
const BACK = springTo(ARRIVE, 12);
const BACK_MS = 220;

/** How far across `el` a pointer is, from 0 at its left edge to 1. */
function across(el: Element, clientX: number): number {
  const box = el.getBoundingClientRect();
  if (box.width <= 0) return 0;
  return Math.min(1, Math.max(0, (clientX - box.left) / box.width));
}

export interface CutHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
}

/**
 * The cut across the top of a pack, as a drag. `--cut` on `target` follows
 * the pointer from 0 at the pack's left edge to 1 at its right and never
 * goes back while the pointer is down; let go past `CUT_THROUGH` and the top
 * is off (`onCut`), short of it and the cut closes again. The handlers go on
 * the strip the pointer drags along, and `measure` is what the cut is
 * measured across: the pack, which is narrower than the strip.
 *
 * The cut is a custom property and not state, so dragging renders nothing.
 */
export function useCut(
  target: () => HTMLElement | null,
  measure: () => HTMLElement | null,
  onCut: () => void,
): CutHandlers {
  /** How far the cut has got, or `null` while no pointer is down. */
  const cut = useRef<number | null>(null);
  const closing = useRef<(() => void) | null>(null);

  const set = useCallback(
    (value: number) => target()?.style.setProperty("--cut", value.toFixed(3)),
    [target],
  );

  /** Stops a cut that is closing where it is. */
  const hold = useCallback(() => {
    closing.current?.();
    closing.current = null;
  }, []);

  useEffect(() => hold, [hold]);

  const close = useCallback(
    (from: number) => {
      hold();
      const began = performance.now();
      let frame = 0;
      const end = () => {
        cancelAnimationFrame(frame);
        release();
        closing.current = null;
        set(0);
      };
      // A skip lands this with everything else in motion.
      const release = trackTask(end);
      const step = (now: number) => {
        const p = Math.min(1, (now - began) / BACK_MS);
        if (p >= 1) return end();
        const at = p * (BACK.values.length - 1);
        const low = Math.floor(at);
        const a = BACK.values[low] ?? 1;
        const b = BACK.values[low + 1] ?? 1;
        set(from * (1 - (a + (b - a) * (at - low))));
        frame = requestAnimationFrame(step);
      };
      closing.current = () => {
        cancelAnimationFrame(frame);
        release();
      };
      frame = requestAnimationFrame(step);
    },
    [hold, set],
  );

  const reach = (event: PointerEvent<HTMLElement>) => {
    const pack = measure();
    if (cut.current === null || !pack) return;
    cut.current = Math.max(cut.current, across(pack, event.clientX));
    set(cut.current);
  };

  const letGo = (cancelled: boolean) => {
    const got = cut.current;
    cut.current = null;
    if (got === null) return;
    if (!cancelled && got >= CUT_THROUGH) {
      set(1);
      onCut();
    } else {
      close(got);
    }
  };

  return {
    onPointerDown: (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      hold();
      event.currentTarget.setPointerCapture(event.pointerId);
      cut.current = 0;
      reach(event);
    },
    onPointerMove: reach,
    onPointerUp: (event) => {
      reach(event);
      letGo(false);
    },
    onPointerCancel: () => letGo(true),
  };
}
