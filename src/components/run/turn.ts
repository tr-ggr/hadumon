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
  boardYarnRoom,
  placedCats,
  totalYarn,
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
  /**
   * `swap` is the essence chosen so far to give up for pips the cat is short.
   * Once a lane is chosen whose yarn could come from more than one cat,
   * `row` is set and `yarnFrom` holds the cats paying, one entry per yarn.
   */
  | {
      kind: "play";
      hand: number;
      swap: Essence[];
      row: Row | null;
      yarnFrom: SlotRef[];
    }
  /**
   * The three lanes. `trade` is what the lane's trade spot is paid with, once
   * chosen: a hand card for the Hunt, a food for the Den, a cat's yarn for
   * the Prowl. With it set the lane takes one more.
   */
  | { kind: "hunt"; dice: number[]; trade: number | null }
  | { kind: "den"; targets: SlotRef[]; trade: Essence | null }
  | { kind: "prowl"; picks: ("deck" | number)[]; trade: SlotRef | null }
  /** Answering a pending tuck: the hand card chosen so far. */
  | { kind: "tuck"; hand: number | null };

export const IDLE: Mode = { kind: "idle" };

/** A hand card raised to be played, with nothing about it chosen yet. */
export function choosePlay(hand: number): Mode {
  return { kind: "play", hand, swap: [], row: null, yarnFrom: [] };
}

/** How many dice a Hunt takes right now, one more with its trade made. */
export function huntTake(view: MatchView, trading = false): number {
  return Math.min(view.rewards.hunt, view.feeder.length) + (trading ? 1 : 0);
}

/** How much yarn the Den being chosen may lay. */
export function denLimit(view: MatchView, mode: Mode): number {
  return view.rewards.den + (mode.kind === "den" && mode.trade ? 1 : 0);
}

/** How many cats the Prowl being chosen draws. */
export function prowlWant(view: MatchView, mode: Mode): number {
  return view.prowlPicks + (mode.kind === "prowl" && mode.trade ? 1 : 0);
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

export { boardYarnRoom };

/**
 * True when the `cost` yarn of a play could come from more than one set of
 * cats, so the player is asked. With one cat holding yarn, or exactly enough
 * yarn on the mat, there is nothing to choose.
 */
export function yarnChoice(board: Board, cost: number): boolean {
  const holders = placedCats(board).filter((placed) => placed.yarn > 0);
  return cost > 0 && holders.length > 1 && totalYarn(board) > cost;
}

/**
 * Taps a cat to pay a play's yarn. A cat with yarn not yet spoken for gives
 * one more, and past `cost` the oldest choice gives way; a cat already giving
 * all it holds is taken back out.
 */
export function togglePayer(
  board: Board,
  yarnFrom: readonly SlotRef[],
  slot: SlotRef,
  cost: number,
): SlotRef[] {
  const held = board[slot.row][slot.col]?.yarn ?? 0;
  const same = (other: SlotRef) =>
    other.row === slot.row && other.col === slot.col;
  if (queuedYarn(yarnFrom, slot) >= held) {
    return yarnFrom.filter((other) => !same(other));
  }
  return [...yarnFrom, slot].slice(-cost);
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
