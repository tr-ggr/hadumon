/**
 * The levels a bot can play at, 0 the least. A level is an algorithm; none is
 * a stronger one made to blunder at random.
 *
 *   0  a fixed list of priorities, no evaluation, never trades
 *   1  one step ahead, counting points only
 *   2  one step ahead with the full evaluation
 *   3  level 2 with more ways to make each move, averaged over 4 re-deals
 *   4  level 3, then the other seat's best reply to its 8 best moves
 *
 * Every level is a pure function of what its seat can see and an RNG, and
 * tries no more moves than `STEP_CAP` allows.
 */

import { getCat, playCost, ROWS, type Row } from "../cats";
import { ELEMENTS, type Element } from "../elements";
import {
  auraTotal,
  autoYarnTargets,
  boardYarnRoom,
  canPlay,
  canReroll,
  combinations,
  defaultSwap,
  ESSENCES,
  otherSide,
  rowReward,
  seatActions,
  SETUP_KEEP,
  SLOTS,
  swapOffer,
  type Action,
  type DuelState,
  type Essence,
  type SideId,
  type SlotRef,
} from "../match";
import type { Rng } from "../rng";
import { evaluate, keepValue, NEUTRAL, pointsLead, wantedFood } from "./eval";
import { fork, tryMove, type Budget } from "./fork";
import { imagine, type Observation, type OwnSeat } from "./observe";
import type { Habit, Style } from "./styles";

export type Bot = (seen: Observation, rng: Rng) => Action;

export const TOP_LEVEL = 4;

/** The most moves each level may try before it answers. */
export const STEP_CAP: readonly number[] = [0, 200, 200, 1200, 6000];

/* ------------------------------------------------------------ level 0 */

function habitOf(action: Action): Habit | null {
  return action.type === "play" ||
    action.type === "hunt" ||
    action.type === "den" ||
    action.type === "prowl"
    ? action.type
    : null;
}

/** The first three cats dealt, and the first two foods they cost. */
function firstKeep(setup: readonly string[]): Action {
  const cats = [0, 1, 2].filter((index) => index < setup.length);
  const wanted = wantedFood(cats.map((index) => setup[index] ?? ""));
  const essence = [...wanted, ...ELEMENTS.filter((e) => !wanted.includes(e))];
  return {
    type: "keep",
    cats,
    essence: essence.slice(0, SETUP_KEEP - cats.length),
  };
}

/** A row activated the plainest way: nothing chosen, nothing traded. */
function plainRow(seen: Observation, row: Row): Action {
  const own = seen.own;
  const reward = rowReward(own, row);
  if (row === "hunt") {
    const take = Math.min(reward, seen.feeder.length);
    return { type: "hunt", dice: Array.from({ length: take }, (_, i) => i) };
  }
  if (row === "den") {
    return { type: "den", targets: autoYarnTargets(own, reward) };
  }
  const fromDeck = own.unseen.length + own.discard.length;
  const want = Math.min(reward, own.tray.length + fromDeck);
  const fromTray = Math.min(want, own.tray.length);
  return {
    type: "prowl",
    picks: [
      ...Array.from({ length: fromTray }, (_, i) => i),
      ...Array.from({ length: want - fromTray }, () => "deck" as const),
    ],
  };
}

/** The first cat in hand that can be played, into the first row it fits. */
function firstPlay(own: OwnSeat): Action | null {
  for (const [hand, catId] of own.hand.entries()) {
    const row = getCat(catId).rows.find((r) => canPlay(own, hand, r));
    if (!row) continue;
    const swap = defaultSwap(
      own.essence,
      own.hand,
      hand,
      auraTotal(own.board, "discount"),
    );
    return swap.length > 0
      ? { type: "play", hand, row, swap }
      : { type: "play", hand, row };
  }
  return null;
}

/**
 * The fixed list: play a cat if one can be played; with no cats in hand,
 * prowl for some; with a cat that only yarn is keeping off the board, go to
 * the Den; otherwise hunt.
 */
function byRote(seen: Observation): Action {
  const own = seen.own;
  if (seen.phase === "setup") return firstKeep(own.setup);
  if (seen.phase === "pending") return { type: "resolve", choice: null };
  const play = firstPlay(own);
  if (play) return play;
  if (own.hand.length === 0) return plainRow(seen, "prowl");
  const discount = auraTotal(own.board, "discount");
  const fed = own.hand.some(
    (catId) =>
      swapOffer(own.essence, playCost(catId, discount)) !== null &&
      getCat(catId).rows.some((row) => own.board[row].length < SLOTS),
  );
  if (fed && boardYarnRoom(own.board) > 0) return plainRow(seen, "den");
  return plainRow(seen, "hunt");
}

/* ------------------------------------------------------ looking ahead */

/**
 * Rolls the feeder again, for nothing, when every die shows a food no cat in
 * hand costs.
 */
function wantsReroll(seen: Observation): boolean {
  const face = seen.feeder[0];
  if (!canReroll(seen) || face === undefined || face === "wild") return false;
  return !wantedFood(seen.own.hand).includes(face);
}

/** More ways to make a Den or a trade than the engine lists by default. */
function widen(state: DuelState, me: SideId, actions: Action[]): Action[] {
  const side = state.sides[me];
  const out = [...actions];
  const slots: SlotRef[] = ROWS.flatMap((row) =>
    side.board[row].map((_, col) => ({ row, col })),
  );
  /** Yarn laid by a different order of cats, to capacity. */
  const lay = (order: SlotRef[], n: number): SlotRef[] => {
    const targets: SlotRef[] = [];
    for (const slot of order) {
      const placed = side.board[slot.row][slot.col];
      if (!placed) continue;
      let room = getCat(placed.catId).yarnCap - placed.yarn;
      while (room > 0 && targets.length < n) {
        targets.push(slot);
        room -= 1;
      }
    }
    return targets;
  };
  const denFirst = [
    ...slots.filter((slot) => slot.row === "den"),
    ...slots.filter((slot) => slot.row !== "den"),
  ];
  const roomiest = [...slots].sort((a, b) => {
    const room = (slot: SlotRef) => {
      const placed = side.board[slot.row][slot.col];
      return placed ? getCat(placed.catId).yarnCap - placed.yarn : 0;
    };
    return room(b) - room(a);
  });
  const seen = new Set(actions.map((action) => JSON.stringify(action)));
  const add = (action: Action) => {
    const key = JSON.stringify(action);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(action);
  };

  for (const action of actions) {
    if (action.type === "den") {
      const foods: (Essence | undefined)[] =
        action.trade === undefined
          ? [undefined]
          : ESSENCES.filter((kind) => side.essence[kind] > 0);
      for (const order of [denFirst, roomiest]) {
        const targets = lay(order, action.targets.length);
        if (targets.length !== action.targets.length) continue;
        for (const trade of foods) {
          add(
            trade === undefined
              ? { type: "den", targets }
              : { type: "den", targets, trade },
          );
        }
      }
    }
    if (action.type === "prowl" && action.trade) {
      // Any cat holding yarn may pay, not only the richest.
      for (const slot of slots) {
        if ((side.board[slot.row][slot.col]?.yarn ?? 0) > 0) {
          add({ ...action, trade: slot });
        }
      }
    }
  }
  return out;
}

/** The moves worth weighing for `me`, who is to act on `state`. */
function movesFor(state: DuelState, me: SideId, wide: boolean): Action[] {
  const listed = seatActions(state, state.sides[me]).filter(
    (action) => action.type !== "reroll",
  );
  return wide && state.phase === "turn" ? widen(state, me, listed) : listed;
}

interface Thinking {
  style: Style;
  budget: Budget;
  /** Scores a table for a seat. */
  value: (state: DuelState, who: SideId) => number;
}

/** Answers every choice `who` owes on `state`, each the way that looks best. */
function settleChoices(state: DuelState, who: SideId, mind: Thinking): void {
  for (
    let guard = 0;
    guard < 8 && state.phase === "pending" && state.active === who;
    guard++
  ) {
    let best: DuelState | null = null;
    let bestValue = -Infinity;
    for (const action of movesFor(state, who, false)) {
      if (mind.budget.left <= 0 && best) break;
      const next = fork(state);
      tryMove(next, action, mind.budget);
      const value = mind.value(next, who);
      if (value > bestValue) {
        best = next;
        bestValue = value;
      }
    }
    if (!best) return;
    Object.assign(state, best);
  }
}

interface Ranked {
  action: Action;
  value: number;
  /** The table after the move, once for each deal. */
  after: DuelState[];
}

/** Every move for `me`, played on each deal and scored, best first. */
function rank(
  deals: readonly DuelState[],
  me: SideId,
  mind: Thinking,
  wide: boolean,
): Ranked[] {
  const first = deals[0];
  if (!first) return [];
  const habits = mind.style.habits;
  const order = (action: Action) => {
    const habit = habitOf(action);
    const at = habit ? habits.indexOf(habit) : -1;
    return at < 0 ? habits.length : at;
  };
  const ranked: Ranked[] = [];
  for (const action of movesFor(first, me, wide)) {
    if (mind.budget.left <= 0 && ranked.length > 0) break;
    let total = 0;
    const after: DuelState[] = [];
    for (const deal of deals) {
      const next = fork(deal);
      tryMove(next, action, mind.budget);
      settleChoices(next, me, mind);
      total += mind.value(next, me);
      after.push(next);
    }
    ranked.push({ action, value: total / deals.length, after });
  }
  // Even moves fall to the rival's habits; the sort keeps listed order after.
  return ranked.sort(
    (a, b) => b.value - a.value || order(a.action) - order(b.action),
  );
}

/** The best of a setup's 252 keeps; nothing is played out to choose it. */
function bestKeep(seen: Observation): Action {
  const setup = seen.own.setup;
  const cats = setup.length;
  let best: Action = firstKeep(setup);
  let bestValue = -Infinity;
  for (const combo of combinations(cats + ELEMENTS.length, SETUP_KEEP)) {
    const action: Action = {
      type: "keep",
      cats: combo.filter((i) => i < cats),
      essence: combo
        .filter((i) => i >= cats)
        .map((i) => ELEMENTS[i - cats])
        .filter((e): e is Element => e !== undefined),
    };
    const value = keepValue(setup, action);
    if (value > bestValue) {
      best = action;
      bestValue = value;
    }
  }
  return best;
}

/* ------------------------------------------------------------- levels */

/** Level 1: whatever puts the most points on the table this turn. */
function byPoints(seen: Observation, rng: Rng, style: Style): Action {
  const rote = byRote(seen);
  if (seen.phase !== "turn") return rote;
  const mind: Thinking = {
    style,
    budget: { left: STEP_CAP[1] ?? 0 },
    value: pointsLead,
  };
  const ranked = rank([imagine(seen, rng)], seen.me, mind, false);
  const top = ranked[0];
  if (!top) return rote;
  // With nothing to choose between them, it does what it would do by rote.
  const even = ranked.filter((entry) => entry.value === top.value);
  const key = JSON.stringify(rote);
  return (
    even.find((entry) => JSON.stringify(entry.action) === key)?.action ??
    top.action
  );
}

/**
 * Levels 2 to 4: the full evaluation, one step ahead. `deals` is how many
 * ways the unseen cats are dealt and averaged over; `wide` weighs more ways
 * to make each move; `replies` is how many of its best moves are tested
 * against the other seat's best answer.
 */
function byValue(
  seen: Observation,
  rng: Rng,
  style: Style,
  level: number,
  { deals, wide, replies }: { deals: number; wide: boolean; replies: number },
): Action {
  if (seen.phase === "setup") return bestKeep(seen);
  if (seen.phase === "turn" && wantsReroll(seen)) return { type: "reroll" };
  const me = seen.me;
  const them = otherSide(me);
  const mind: Thinking = {
    style,
    budget: { left: STEP_CAP[level] ?? 0 },
    value: (state, who) =>
      // The other seat is assumed to play without a manner.
      evaluate(state, who, who === me ? style.weights : NEUTRAL),
  };
  const tables = Array.from({ length: deals }, () => imagine(seen, rng));
  const ranked = rank(tables, me, mind, wide);
  const top = ranked[0];
  if (!top) return byRote(seen);
  if (replies <= 0) return top.action;

  let best = top;
  let bestValue = -Infinity;
  for (const entry of ranked.slice(0, replies)) {
    if (mind.budget.left <= 0) break;
    let total = 0;
    for (const table of entry.after) {
      // Only a table the other seat is about to act on has a reply to find.
      if (table.phase !== "turn" || table.active !== them) {
        total += mind.value(table, me);
        continue;
      }
      let worst = Infinity;
      let theirBest = -Infinity;
      for (const reply of movesFor(table, them, false)) {
        if (mind.budget.left <= 0 && worst < Infinity) break;
        const next = fork(table);
        tryMove(next, reply, mind.budget);
        settleChoices(next, them, mind);
        const theirs = mind.value(next, them);
        if (theirs > theirBest) {
          theirBest = theirs;
          worst = mind.value(next, me);
        }
      }
      total += worst === Infinity ? mind.value(table, me) : worst;
    }
    const value = total / entry.after.length;
    if (value > bestValue) {
      best = entry;
      bestValue = value;
    }
  }
  return best.action;
}

/** A bot that plays at `level` in the manner of `style`. */
export function botAt(level: number, style: Style): Bot {
  const at = Math.max(0, Math.min(TOP_LEVEL, Math.floor(level)));
  switch (at) {
    case 0:
      return (seen) => byRote(seen);
    case 1:
      return (seen, rng) => byPoints(seen, rng, style);
    case 2:
      return (seen, rng) =>
        byValue(seen, rng, style, 2, { deals: 1, wide: false, replies: 0 });
    case 3:
      return (seen, rng) =>
        byValue(seen, rng, style, 3, { deals: 4, wide: true, replies: 0 });
    default:
      return (seen, rng) =>
        byValue(seen, rng, style, 4, { deals: 4, wide: true, replies: 8 });
  }
}
