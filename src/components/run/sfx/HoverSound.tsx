"use client";

import { useEffect } from "react";

import { hasFinePointer } from "../fx/dom";
import { pressable } from "./ClickSound";
import { playSound } from "./engine";

/** The least time between two ticks, so a fast sweep does not rattle. */
const HOVER_GAP_MS = 40;

/**
 * Ticks as a mouse comes onto anything that can be pressed: a button, a
 * link, a card. One listener on `window`, so a dialog's buttons are covered
 * too. Touch and pen make no sound, a held control makes none, and moving
 * about inside one control is not coming onto it again. A control that
 * turns up under a pointer at rest (a new step, a scrolled page) was not
 * pointed at, so it is silent as well: the tick is the player's own move.
 */
export function HoverSound() {
  useEffect(() => {
    let ticked = -Infinity;
    /** Where the pointer was last seen, to tell a move from a new screen. */
    let seen: { x: number; y: number } | null = null;
    const see = (event: PointerEvent) => {
      seen = { x: event.clientX, y: event.clientY };
    };
    const onOver = (event: PointerEvent) => {
      const rested = seen?.x === event.clientX && seen?.y === event.clientY;
      see(event);
      if (rested || event.pointerType !== "mouse" || !hasFinePointer()) return;
      const control = pressable(event.target);
      if (!control) return;
      const from = event.relatedTarget;
      if (from instanceof Node && control.contains(from)) return;
      if (event.timeStamp - ticked < HOVER_GAP_MS) return;
      ticked = event.timeStamp;
      playSound("hover");
    };
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointermove", see, { passive: true });
    window.addEventListener("pointerdown", see, true);
    return () => {
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointermove", see);
      window.removeEventListener("pointerdown", see, true);
    };
  }, []);

  return null;
}
