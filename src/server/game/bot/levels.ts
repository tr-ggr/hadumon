/**
 * The levels a bot can play at, 0 the least. A level is an algorithm; none is
 * a stronger one made to blunder at random.
 *
 *   0  a fixed list of priorities, no evaluation, never trades
 *   1  the same list, choosing its cat, its dice and its keep with care
 *   2  one step ahead, counting points only
 *   3  one step ahead, counting points and the round goal
 *   4  one step ahead with the full evaluation
 *   5  its 3 best moves, each played out twice to the end of the round
 *   6  its 6 best moves, each played out 6 times to the end of the match
 *   7  its 8 best moves and 256 playouts to the end of the match, spent on
 *      the moves still in the running
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
import {
  evaluate,
  keepValue,
  NEUTRAL,
  pointsLead,
  wantedFood,
  type Weights,
} from "./eval";
import { fork, tryMove, type Budget } from "./fork";
import { imagine, type Observation, type OwnSeat } from "./observe";
import { pickDice, quickKeep, quickMove } from "./quick";
import type { Habit, Style } from "./styles";

export type Bot = (seen: Observation, rng: Rng) => Action;

/**
 * What a level is made of. `cap` is the most moves it may try before it
 * answers.
 */
export type LevelSpec =
  /** The fixed list. `sharp` picks its cat, its dice and its keep with care. */
  | { kind: "rote"; sharp: boolean }
  /** One step ahead on points alone, or on points and the round goal. */
  | { kind: "points"; goal: boolean; cap: number }
  /** One step ahead with the full evaluation. */
  | {
      kind: "value";
      deals: number;
      wide: boolean;
      replies: number;
      cap: number;
    }
  /** Its best moves played out. */
  | ({ kind: "playouts"; cap: number } & Playouts);

interface Playouts {
  /** How many of its best moves, by one step ahead, are played out. */
  moves: number;
  /** Playouts in each stage; after a stage only the better half goes on. */
  stages: readonly number[];
  /** Where a playout stops. */
  until: "round" | "match";
  /** What a finished playout is scored on. */
  by: "value" | "points" | "wins";
}

/**
 * The eight levels as first planned. Measured, three of them did not beat
 * the level below (see `sprints/14-real-rival.md`); they are kept so that
 * measurement can be run again.
 */
export const PLANNED: readonly LevelSpec[] = [
  { kind: "rote", sharp: false },
  { kind: "points", goal: false, cap: 200 },
  { kind: "value", deals: 1, wide: false, replies: 0, cap: 200 },
  { kind: "value", deals: 4, wide: true, replies: 0, cap: 1200 },
  { kind: "value", deals: 4, wide: true, replies: 8, cap: 6000 },
  {
    kind: "playouts",
    moves: 5,
    stages: [4],
    until: "round",
    by: "value",
    cap: 1500,
  },
  {
    kind: "playouts",
    moves: 6,
    stages: [6],
    until: "match",
    by: "points",
    cap: 2500,
  },
  {
    kind: "playouts",
    moves: 8,
    stages: [6, 6, 12],
    until: "match",
    by: "wins",
    cap: 5000,
  },
];

/**
 * The levels a rival plays at, 0 the least. Each beat the one below it in
 * at least 56 matches of 100 when it was measured.
 */
export const LEVELS: readonly LevelSpec[] = [
  { kind: "rote", sharp: false },
  { kind: "rote", sharp: true },
  { kind: "points", goal: false, cap: 400 },
  { kind: "points", goal: true, cap: 400 },
  { kind: "value", deals: 1, wide: false, replies: 0, cap: 400 },
  {
    kind: "playouts",
    moves: 3,
    stages: [2],
    until: "round",
    by: "value",
    cap: 1000,
  },
  {
    kind: "playouts",
    moves: 6,
    stages: [6],
    until: "match",
    by: "points",
    cap: 2500,
  },
  {
    kind: "playouts",
    moves: 8,
    stages: [16, 16, 32],
    until: "match",
    by: "points",
    cap: 9000,
  },
];

export const TOP_LEVEL = LEVELS.length - 1;

/** The most moves each level may try before it answers. */
export const STEP_CAP: readonly number[] = LEVELS.map((spec) =>
  spec.kind === "rote" ? 0 : spec.cap,
);

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
function firstPlay(own: OwnSeat, sharp: boolean): Action | null {
  // Sharp, the cat worth the most is tried first.
  const order = [...own.hand.entries()];
  if (sharp) {
    order.sort(([, a], [, b]) => getCat(b).points - getCat(a).points);
  }
  for (const [hand, catId] of order) {
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
function byRote(seen: Observation, sharp = false): Action {
  const own = seen.own;
  if (seen.phase === "setup") {
    return sharp ? quickKeep(own.setup) : firstKeep(own.setup);
  }
  if (seen.phase === "pending") {
    // Sharp, it tucks the cat worth least; plain, it declines every choice.
    if (!sharp || seen.pending?.kind !== "tuckHand") {
      return { type: "resolve", choice: null };
    }
    let choice = 0;
    own.hand.forEach((catId, hand) => {
      if (getCat(catId).points < getCat(own.hand[choice] ?? catId).points) {
        choice = hand;
      }
    });
    return { type: "resolve", choice };
  }
  const play = firstPlay(own, sharp);
  if (play) return play;
  if (own.hand.length === 0) return plainRow(seen, "prowl");
  const discount = auraTotal(own.board, "discount");
  const fed = own.hand.some(
    (catId) =>
      swapOffer(own.essence, playCost(catId, discount)) !== null &&
      getCat(catId).rows.some((row) => own.board[row].length < SLOTS),
  );
  if (fed && boardYarnRoom(own.board) > 0) return plainRow(seen, "den");
  const hunt = plainRow(seen, "hunt");
  return sharp && hunt.type === "hunt"
    ? { type: "hunt", dice: pickDice(own, seen.feeder, hunt.dice.length) }
    : hunt;
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

/** Points on the table and the round goal as it stands; nothing of what is to come. */
const GOAL_ONLY: Weights = {
  goal: NEUTRAL.goal,
  food: 0,
  hand: 0,
  afford: 0,
  engine: 0,
  yarn: 0,
  deny: 0,
};

/** Whatever puts the most points on the table this turn. */
function byPoints(
  seen: Observation,
  rng: Rng,
  style: Style,
  { goal, cap }: { goal: boolean; cap: number },
): Action {
  // Counting the goal, it also takes the care a sharp list does.
  const rote = byRote(seen, goal);
  if (seen.phase !== "turn") return rote;
  const mind: Thinking = {
    style,
    budget: { left: cap },
    value: goal ? (state, who) => evaluate(state, who, GOAL_ONLY) : pointsLead,
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
  {
    deals,
    wide,
    replies,
    cap,
  }: { deals: number; wide: boolean; replies: number; cap: number },
): Action {
  if (seen.phase === "setup") return bestKeep(seen);
  if (seen.phase === "turn" && wantsReroll(seen)) return { type: "reroll" };
  const me = seen.me;
  const them = otherSide(me);
  const mind: Thinking = {
    style,
    budget: { left: cap },
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

/* ----------------------------------------------------------- playouts */

/** The lead, in points, at which a playout counts as about three-quarters won. */
const WIN_MARGIN = 3;

/** Plays a fork on with `quickMove` for both seats until it should stop. */
function playOut(state: DuelState, until: Playouts["until"], budget: Budget) {
  const round = state.round;
  for (let guard = 0; guard < 80 && state.phase !== "over"; guard++) {
    if (until === "round" && state.round !== round) return;
    tryMove(state, quickMove(state), budget);
  }
}

/**
 * Levels 5 to 7: the moves that look best one step ahead are each played out
 * to the end of the round or the match, on tables dealt afresh for every
 * playout and shared by every move, and the one that comes out best is made.
 */
function byPlayouts(
  seen: Observation,
  rng: Rng,
  style: Style,
  plan: Playouts & { cap: number },
): Action {
  if (seen.phase === "setup") return bestKeep(seen);
  if (seen.phase === "turn" && wantsReroll(seen)) return { type: "reroll" };
  const me = seen.me;
  const mind: Thinking = {
    style,
    budget: { left: plan.cap },
    value: (state, who) =>
      evaluate(state, who, who === me ? style.weights : NEUTRAL),
  };
  const ranked = rank([imagine(seen, rng), imagine(seen, rng)], me, mind, true);
  let running = ranked
    .slice(0, plan.moves)
    .map((entry) => ({ action: entry.action, total: 0, n: 0 }));
  const top = running[0];
  if (!top) return byRote(seen);
  if (running.length === 1) return top.action;

  const score = (state: DuelState): number => {
    if (plan.by === "value") return mind.value(state, me);
    const lead = pointsLead(state, me);
    if (plan.by === "points") return lead;
    // A playout is one deal of many: a narrow lead is a match half won.
    return 1 / (1 + Math.exp(-lead / WIN_MARGIN));
  };
  const mean = (entry: (typeof running)[number]) =>
    entry.n === 0 ? -Infinity : entry.total / entry.n;

  for (const playouts of plan.stages) {
    for (let i = 0; i < playouts; i++) {
      // Enough left to play every move still running to the end once more.
      if (mind.budget.left < running.length * 40) break;
      const table = imagine(seen, rng);
      for (const entry of running) {
        const next = fork(table);
        tryMove(next, entry.action, mind.budget);
        playOut(next, plan.until, mind.budget);
        entry.total += score(next);
        entry.n += 1;
      }
    }
    running.sort((a, b) => mean(b) - mean(a));
    if (running.length > 2) {
      running = running.slice(0, Math.ceil(running.length / 2));
    }
  }
  return (running[0] ?? top).action;
}

/** A bot built to `spec`, playing in the manner of `style`. */
export function botFrom(spec: LevelSpec, style: Style): Bot {
  switch (spec.kind) {
    case "rote":
      return (seen) => byRote(seen, spec.sharp);
    case "points":
      return (seen, rng) => byPoints(seen, rng, style, spec);
    case "value":
      return (seen, rng) => byValue(seen, rng, style, spec);
    case "playouts":
      return (seen, rng) => byPlayouts(seen, rng, style, spec);
  }
}

/** A bot that plays at `level` in the manner of `style`. */
export function botAt(level: number, style: Style): Bot {
  const at = Math.max(0, Math.min(TOP_LEVEL, Math.floor(level)));
  const spec = LEVELS[at];
  if (!spec) throw new Error(`No level ${level}`);
  return botFrom(spec, style);
}
