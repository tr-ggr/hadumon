/**
 * The book's state, and what each page does while a leaf turns. Pure: the
 * component holds the timers and hands the reducer what happened.
 *
 * A turn is two half-turns that meet edge-on. The page being left stands up
 * about the spine until it is edge-on; then the page arrived at, on the
 * other side of the spine, comes down from edge-on to flat. No page is ever
 * seen from behind, so the pages themselves are the leaves.
 */

import {
  NO_FILTERS,
  type Anchor,
  type ChapterId,
  type Filters,
  type Up,
} from "./book";

/**
 * How long the book takes to come up out of the dark, once the camera has
 * stopped in the room. The stylesheet's wall takes the same (`room-near`).
 */
export const ENTER_MS = 640;
/** How long the shut book lies on the table, once it is there, before it opens. */
export const BEAT_MS = 420;
/** One half of a turn. A phone's single page is wider on its screen. */
export const LEAF_MS: Record<Up, number> = { 1: 300, 2: 220 };
/** The cover is a board, not a leaf: it opens this much more slowly. */
export const COVER_PACE = 1.3;

export interface BookState {
  phase: "closed" | "opening" | "open";
  /** Where the book lies open, or the place being left while a leaf turns. */
  at: Anchor;
  filters: Filters;
  /** The leaf in the air, and where it is going. */
  turn: { id: number; to: Anchor } | null;
  seq: number;
}

export const SHUT_BOOK: BookState = {
  phase: "closed",
  at: { chapter: "cats", item: 0 },
  filters: NO_FILTERS,
  turn: null,
  seq: 0,
};

export type BookAction =
  /** The chapter to open at, from the address. Only while the book is shut. */
  | { type: "start"; chapter: ChapterId }
  | { type: "open" }
  | { type: "opened" }
  /** Turn to a place. `calm` cuts to it: reduced motion turns no leaf. */
  | { type: "go"; to: Anchor; calm: boolean }
  | { type: "landed"; id: number }
  /** Lay whatever is in the air down at once. */
  | { type: "settle" }
  | { type: "filter"; filters: Filters };

function sameAnchor(a: Anchor, b: Anchor): boolean {
  return a.chapter === b.chapter && a.item === b.item;
}

export function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case "start":
      if (state.phase !== "closed") return state;
      return { ...state, at: { chapter: action.chapter, item: 0 } };
    case "open":
      return state.phase === "closed" ? { ...state, phase: "opening" } : state;
    case "opened":
      return state.phase === "open" ? state : { ...state, phase: "open" };
    case "go": {
      if (state.phase !== "open") return state;
      // The latest request wins: the leaf in the air is laid down first.
      const at = state.turn?.to ?? state.at;
      if (action.calm || sameAnchor(at, action.to)) {
        return { ...state, at: action.to, turn: null };
      }
      const seq = state.seq + 1;
      return { ...state, at, turn: { id: seq, to: action.to }, seq };
    }
    case "landed":
      if (state.turn?.id !== action.id) return state;
      return { ...state, at: state.turn.to, turn: null };
    case "settle":
      return state.turn ? { ...state, at: state.turn.to, turn: null } : state;
    case "filter":
      // Every cat page is printed again, so there is no leaf to turn to it.
      return {
        ...state,
        filters: action.filters,
        at: { chapter: "cats", item: 0 },
        turn: null,
      };
  }
}

export interface Leaf {
  /**
   * `lift` stands up to edge-on and `lay` comes down from it; `under` lies
   * flat beneath one of them; `rest` lies open with nothing moving.
   */
  role: "rest" | "under" | "lift" | "lay";
  /** An `under` page darkens as a leaf comes down on it, or clears as one leaves. */
  shade: "dim" | "clear" | null;
  /** How long it waits before it moves or changes shade. */
  waitMs: number;
}

export type LeafKey = number | "cover";

const leaf = (
  role: Leaf["role"],
  shade: Leaf["shade"] = null,
  waitMs = 0,
): Leaf => ({ role, shade, waitMs });

/**
 * What every page on show does while the book goes from one spread to
 * another, or opens from its cover onto `to`. `leafMs` is one half-turn.
 * Spreads are `[page]` one-up and `[left, right]` two-up.
 */
export function leafPlan(
  up: Up,
  from: readonly number[] | "cover",
  to: readonly number[],
  leafMs: number,
): ReadonlyMap<LeafKey, Leaf> {
  const plan = new Map<LeafKey, Leaf>();
  const [toLeft, toRight] = to;
  if (toLeft === undefined) return plan;

  if (from === "cover") {
    plan.set("cover", leaf("lift"));
    if (up === 2 && toRight !== undefined) {
      plan.set(toLeft, leaf("lay", null, leafMs));
      plan.set(toRight, leaf("under", "clear"));
    } else {
      plan.set(toLeft, leaf("under", "clear"));
    }
    return plan;
  }

  const [fromLeft, fromRight] = from;
  if (fromLeft === undefined || fromLeft === toLeft) {
    for (const page of to) plan.set(page, leaf("rest"));
    return plan;
  }
  const forward = toLeft > fromLeft;

  if (up === 1 || fromRight === undefined || toRight === undefined) {
    // One page: going on, it lifts off the next; going back, the last one
    // comes down over it.
    if (forward) {
      plan.set(fromLeft, leaf("lift"));
      plan.set(toLeft, leaf("under", "clear"));
    } else {
      plan.set(fromLeft, leaf("under", "dim"));
      plan.set(toLeft, leaf("lay"));
    }
    return plan;
  }

  if (forward) {
    plan.set(fromRight, leaf("lift"));
    plan.set(toRight, leaf("under", "clear"));
    plan.set(toLeft, leaf("lay", null, leafMs));
    plan.set(fromLeft, leaf("under", "dim", leafMs));
  } else {
    plan.set(fromLeft, leaf("lift"));
    plan.set(toLeft, leaf("under", "clear"));
    plan.set(toRight, leaf("lay", null, leafMs));
    plan.set(fromRight, leaf("under", "dim", leafMs));
  }
  return plan;
}

/** How long the whole of a turn takes, both halves where there are two. */
export function turnMs(up: Up, leafMs: number): number {
  return up === 2 ? leafMs * 2 : leafMs;
}
