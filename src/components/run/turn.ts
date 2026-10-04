/**
 * The choices a turn is built from, as the player assembles them before
 * anything is sent. Pure helpers over the redacted view; the server still
 * decides what is legal.
 */

import { getCat, ROW_LABELS, ROWS, type Row } from "~/server/game/cats";
import {
  ESSENCES,
  payCost,
  type Board,
  type Essence,
  type SlotRef,
} from "~/server/game/match";
import type { MatchView } from "~/server/game/view";

import { listWords } from "./describe";

/** What the player is in the middle of choosing. */
export type Mode =
  | { kind: "idle" }
  | { kind: "play"; hand: number }
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

/** One line on why a hand card has no legal row, or `null` if it has one. */
export function whyUnplayable(view: MatchView, hand: number): string | null {
  if ((view.playable[hand] ?? []).length > 0) return null;
  const catId = view.hand[hand];
  if (!catId) return null;
  const cat = getCat(catId);
  if (payCost(view.essence, cat.cost) === null) {
    return `Not enough essence for ${cat.name}.`;
  }
  const open = cat.rows.filter((row) => view.yarnCosts[row] !== null);
  if (open.length === 0) {
    return `No room: ${listWords(cat.rows.map((row) => `the ${ROW_LABELS[row]}`))} ${cat.rows.length === 1 ? "is" : "are"} full.`;
  }
  const cheapest = Math.min(...open.map((row) => view.yarnCosts[row] ?? 0));
  return `Not enough yarn: the next slot costs ${cheapest} and your cats hold ${view.score.yarn}.`;
}

/**
 * The essence playing a hand card would spend, one entry per pip, or `null`
 * if it cannot be paid. The engine pays automatically (an "any" pip takes from
 * the fullest element), so the player is told before confirming.
 */
export function essenceSpent(view: MatchView, hand: number): Essence[] | null {
  const catId = view.hand[hand];
  if (!catId) return null;
  const left = payCost(view.essence, getCat(catId).cost);
  if (!left) return null;
  return ESSENCES.flatMap((kind) =>
    Array.from({ length: view.essence[kind] - left[kind] }, () => kind),
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
