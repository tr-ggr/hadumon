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
    case "coins":
      return '[data-tally="coins"]';
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

/**
 * How far the table `el` is on has been magnified (`--fit`): 1 on the match
 * and on any window too small to fit. Measured, not read from the style, so
 * it is right in a browser that reports a zoomed box either way; snapped to
 * a quarter, since the box it is measured from is in whole pixels.
 */
export function zoomOf(el: Element | null): number {
  const table = el?.closest<HTMLElement>(".tabletop");
  if (!table || table.offsetWidth === 0) return 1;
  const ratio = table.getBoundingClientRect().width / table.offsetWidth;
  return Math.max(1, Math.round(ratio * 4) / 4);
}

/**
 * Where `el` is on the screen, in the lengths of its own table. An effect
 * is a fixed node inside the table, so on a magnified one its `left` and
 * `top` are magnified again; this is the box to place it by.
 */
export function placed(el: Element): DOMRect {
  const rect = el.getBoundingClientRect();
  const zoom = zoomOf(el);
  return zoom === 1
    ? rect
    : new DOMRect(
        rect.x / zoom,
        rect.y / zoom,
        rect.width / zoom,
        rect.height / zoom,
      );
}

/** The pieces a shake moves: the mat and the supply, never the table. */
export function shakeable(root: HTMLElement | null): HTMLElement[] {
  return [...(root?.querySelectorAll<HTMLElement>("[data-shake]") ?? [])];
}

export function prefersCalm(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A phone-sized table, which gets half the sparks: a phone held upright,
 * or one on its side (the height under which the match is `fit-compact`).
 */
export function isCompact(): boolean {
  return window.matchMedia("(max-width: 639.98px), (max-height: 37.49rem)")
    .matches;
}

/** True where a mouse can point at one card among several. */
export function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
