import type { PointerEvent } from "react";

import { prefersCalm } from "./dom";

/** How far a raised piece leans toward the pointer, in degrees. */
export const LEAN = 5;

/**
 * Leans a piece toward a mouse held over it: a raised card in the hand, the
 * pack in the middle of the row. The two angles are written straight onto
 * the element the pointer is over as CSS variables, so the pointer moving
 * costs no render; the stylesheet turns whatever inside it leans. Touch and
 * reduced motion leave the piece flat.
 */
export function lean(event: PointerEvent<HTMLElement>): void {
  if (event.pointerType !== "mouse" || prefersCalm()) return;
  const piece = event.currentTarget;
  const box = piece.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width - 0.5;
  const y = (event.clientY - box.top) / box.height - 0.5;
  const clamp = (n: number) => Math.max(-0.5, Math.min(0.5, n));
  piece.style.setProperty("--lean-y", (clamp(x) * 2 * LEAN).toFixed(2));
  piece.style.setProperty("--lean-x", (clamp(y) * -2 * LEAN).toFixed(2));
}

/** Lays the piece flat again as the pointer leaves it. */
export function settle(event: PointerEvent<HTMLElement>): void {
  event.currentTarget.style.removeProperty("--lean-x");
  event.currentTarget.style.removeProperty("--lean-y");
}
