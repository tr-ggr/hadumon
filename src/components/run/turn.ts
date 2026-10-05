/**
 * The choices a turn is built from, as the player assembles them before
 * anything is sent. Pure helpers over the redacted view; the server still
 * decides what is legal.
 */

import {
  getCat,
  playCost,
  ROW_LABELS,
  ROWS,
  type Row,
} from "~/server/game/cats";
import {
  ESSENCES,
  auraTotal,
  playPayment,
  swapOffer,
  type Board,
  type Essence,
  type SlotRef,
  type SwapOffer,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { essenceLabel, listWords } from "./describe";

/** What the player is in the middle of choosing. */
export type Mode =
  | { kind: "idle" }
  /** `swap` is the essence chosen so far to give up for pips the cat is short. */
  | { kind: "play"; hand: number; swap: Essence[] }
  | { kind: "hunt"; dice: number[] }
  | { kind: "den"; targets: SlotRef[] }
  | { kind: "prowl"; picks: ("deck" | number)[] }
  /** Answering a pending tuck: the hand card chosen so far. */
  | { kind: "tuck"; hand: number | null };

export const IDLE: Mode = { kind: "idle" };

/** How many dice a Hunt takes right now. */
export function huntTake(view: MatchView): number {
  return Math.min(view.rewards.hunt, view.feeder.length);
}

/** Yarn queued for one slot in a Den that has not been sent yet. */
export function queuedYarn(targets: readonly SlotRef[], slot: SlotRef): number {
  return targets.filter((t) => t.row === slot.row && t.col === slot.col).length;
}

/** How much more yarn a slot can take, counting what is already queued. */
export function yarnRoom(
  board: Board,
  targets: readonly SlotRef[],
  slot: SlotRef,
): number {
  const placed = board[slot.row][slot.col];
  if (!placed) return 0;
  return getCat(placed.catId).yarnCap - placed.yarn - queuedYarn(targets, slot);
}

/** Total yarn the board could still take. */
export function boardYarnRoom(board: Board): number {
  return ROWS.reduce(
    (sum, row) =>
      sum +
      board[row].reduce(
        (rowSum, placed) =>
          rowSum + Math.max(0, getCat(placed.catId).yarnCap - placed.yarn),
        0,
      ),
    0,
  );
}

/** Tops `targets` up to `limit` in board order, keeping what is already chosen. */
export function fillYarn(
  board: Board,
  targets: readonly SlotRef[],
  limit: number,
): SlotRef[] {
  const next = [...targets];
  for (const row of ROWS) {
    board[row].forEach((_, col) => {
      while (next.length < limit && yarnRoom(board, next, { row, col }) > 0) {
        next.push({ row, col });
      }
    });
  }
  return next;
}

/** What a hand card with no legal row is short of. */
export type PlayBlock = "food" | "room" | "yarn";

/** The same, in the few words a card's footer has room for. */
export const PLAY_BLOCK_LABELS: Record<PlayBlock, string> = {
  food: "Not enough food",
  room: "No room",
  yarn: "Not enough yarn",
};

/** What stops a hand card being played, or `null` if a row will take it. */
export function playBlock(view: MatchView, hand: number): PlayBlock | null {
  if ((view.playable[hand] ?? []).length > 0) return null;
  const catId = view.hand[hand];
  if (!catId) return null;
  if (handSwap(view, hand) === null) return "food";
  const open = getCat(catId).rows.some((row) => view.yarnCosts[row] !== null);
  return open ? "yarn" : "room";
}

/** One line on why a hand card has no legal row, or `null` if it has one. */
export function whyUnplayable(view: MatchView, hand: number): string | null {
  const block = playBlock(view, hand);
  const catId = view.hand[hand];
  if (block === null || !catId) return null;
  const cat = getCat(catId);
  if (block === "food") return `Not enough food for ${cat.name}.`;
  if (block === "room") {
    return `No room: ${listWords(cat.rows.map((row) => `the ${ROW_LABELS[row]}`))} ${cat.rows.length === 1 ? "is" : "are"} full.`;
  }
  const open = cat.rows.filter((row) => view.yarnCosts[row] !== null);
  const cheapest = Math.min(...open.map((row) => view.yarnCosts[row] ?? 0));
  return `Not enough yarn: the next slot costs ${cheapest} and your cats hold ${view.score.yarn}.`;
}

/**
 * The essence playing a hand card would spend, one entry each, or `null` if
 * it cannot be paid with this swap. The engine pays automatically (an "any"
 * pip avoids essence the rest of the hand needs), so the player is told
 * before confirming.
 */
export function essenceSpent(
  view: MatchView,
  hand: number,
  swap: readonly Essence[] = [],
): Essence[] | null {
  const left = playPayment(
    view.essence,
    view.hand,
    hand,
    swap,
    auraTotal(view.board, "discount"),
  );
  if (!left) return null;
  return ESSENCES.flatMap((kind) =>
    Array.from({ length: view.essence[kind] - left[kind] }, () => kind),
  );
}

/** How a hand card's cost stands against the essence held. */
export function handSwap(view: MatchView, hand: number): SwapOffer | null {
  const catId = view.hand[hand];
  return catId
    ? swapOffer(
        view.essence,
        playCost(catId, auraTotal(view.board, "discount")),
      )
    : null;
}

/** How many essence a play has to give up before it can be sent. */
export function swapOwed(view: MatchView, hand: number): number {
  return 2 * (handSwap(view, hand)?.short.length ?? 0);
}

/** How many of one kind a swap has taken so far. */
export function swapTaken(swap: readonly Essence[], kind: Essence): number {
  return swap.filter((taken) => taken === kind).length;
}

/** True if one more of `kind` can go into the swap being chosen. */
export function canSwapMore(
  view: MatchView,
  hand: number,
  swap: readonly Essence[],
  kind: Essence,
): boolean {
  const offer = handSwap(view, hand);
  return (
    offer !== null &&
    swap.length < 2 * offer.short.length &&
    offer.spare[kind] > swapTaken(swap, kind)
  );
}

/** "1 Mist", "2 Mist", "1 Mist and 1 Volt": what a cost is short of. */
export function shortWords(short: readonly Essence[]): string {
  return listWords(
    ESSENCES.flatMap((kind) => {
      const n = swapTaken(short, kind);
      return n > 0 ? [`${n} ${essenceLabel(kind)}`] : [];
    }),
  );
}

/** Toggles a die in a Hunt; when the take is full the oldest choice gives way. */
export function toggleDie(dice: readonly number[], die: number, take: number) {
  if (dice.includes(die)) return dice.filter((d) => d !== die);
  return [...dice, die].slice(-take);
}

export function deckPicks(picks: readonly ("deck" | number)[]): number {
  return picks.filter((pick) => pick === "deck").length;
}

export function rowsLabel(rows: readonly Row[]): string {
  return rows.map((row) => ROW_LABELS[row]).join(" · ");
}
