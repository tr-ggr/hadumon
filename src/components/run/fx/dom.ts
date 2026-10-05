/**
 * Where an effect lands on the page. The table marks its pieces with data
 * attributes; this turns an anchor into the piece that is actually on
 * screen.
 */

import type { Anchor } from "./plan";

/**
 * The first match that is laid out. A zone the table renders twice and shows
 * once (the turn panel, with the food tokens in it) has a copy with no box.
 */
export function shown(
  root: HTMLElement | null,
  selector: string,
): HTMLElement | null {
  for (const el of root?.querySelectorAll<HTMLElement>(selector) ?? []) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

export function anchorSelector(anchor: Anchor): string {
  switch (anchor.on) {
    case "slot":
      return `[data-slot="${anchor.row}-${anchor.col}"]`;
    case "food":
      return `[data-essence="${anchor.kind}"]`;
    case "score":
      return '[data-score="you"]';
    case "rival":
      return '[data-score="rival"]';
    case "tally":
      return '[data-tally="total"]';
  }
}

export function anchored(
  root: HTMLElement | null,
  anchor: Anchor,
): HTMLElement | null {
  return shown(root, anchorSelector(anchor));
}

/**
 * The one layer that holds everything drawn over the table: pieces in
 * flight, floating numbers, sparks. It is fixed to the screen and outside
 * anything that shakes, so what is in it is placed in screen coordinates.
 */
export function fxLayer(root: HTMLElement | null): HTMLElement | null {
  return root?.querySelector<HTMLElement>("[data-fx-layer]") ?? root;
}

/** The pieces a shake moves: the mat and the supply, never the table. */
export function shakeable(root: HTMLElement | null): HTMLElement[] {
  return [...(root?.querySelectorAll<HTMLElement>("[data-shake]") ?? [])];
}

export function prefersCalm(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A phone-sized table, which gets half the sparks. */
export function isCompact(): boolean {
  return window.matchMedia("(max-width: 639.98px)").matches;
}

/** True where a mouse can point at one card among several. */
export function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
