/**
 * How good a table looks to one seat. Points already scored count in full;
 * the rest is a guess at what the position will turn into, in the same
 * points. A rival's style is a tilt on the weights of that guess.
 */

import { getCat, ROWS } from "../cats";
import { ELEMENTS } from "../elements";
import {
  canPlay,
  sideScore,
  goalStanding,
  emptyPool,
  otherSide,
  payCost,
  placedCats,
  ROUND_TURNS,
  type Action,
  type MatchState,
  type Essence,
  type Side,
  type SideId,
} from "../match";

export interface Weights {
  /** This round's goal as it stands, before it is scored. */
  goal: number;
  /** Food held, up to what a turn or two can spend. */
  food: number;
  /** Cats in hand, up to what there is time to play. */
  hand: number;
  /** The best cat it could play on its next turn. */
  afford: number;
  /** Each cat on the board, for every turn it still has to work. */
  engine: number;
  /**
   * Each yarn on the board, on top of the point it already is, while there
   * are turns to come. Under zero, yarn is better laid late: a turn spent on
   * it early is one not spent on a cat that would work for the rest of the
   * match.
   */
  yarn: number;
  /** How much of the other seat's prospects count against the position. */
  deny: number;
}

/**
 * Measured over four rounds (`sprints/15-coins-packs-decks.md`): with 26
 * turns a seat, the cat it can play next and the turns a cat has left to
 * work count for more than they did over twelve, and early yarn for less.
 */
export const NEUTRAL: Weights = {
  goal: 0.7,
  food: 0.5,
  hand: 0.4,
  afford: 0.5,
  engine: 0.4,
  yarn: -0.25,
  deny: 1,
};

/** The most a style may move a weight from neutral, either way. */
export const TILT_LIMIT = 0.3;

/** `tilt` is a factor per weight, 1 for no change; `yarn` is added, not scaled. */
export function tilted(tilt: Partial<Weights>): Weights {
  return {
    goal: NEUTRAL.goal * (tilt.goal ?? 1),
    food: NEUTRAL.food * (tilt.food ?? 1),
    hand: NEUTRAL.hand * (tilt.hand ?? 1),
    afford: NEUTRAL.afford * (tilt.afford ?? 1),
    engine: NEUTRAL.engine * (tilt.engine ?? 1),
    yarn: NEUTRAL.yarn + (tilt.yarn ?? 0),
    deny: NEUTRAL.deny * (tilt.deny ?? 1),
  };
}

/** Turns a seat takes in a whole match. */
export const MATCH_TURNS = ROUND_TURNS.reduce<number>(
  (sum, turns) => sum + turns,
  0,
);

/** Turns to come for a seat with `turnsLeft` in `round`, this round's included. */
export function turnsToCome(round: number, turnsLeft: number): number {
  return ROUND_TURNS.slice(round + 1).reduce<number>(
    (sum, turns) => sum + turns,
    turnsLeft,
  );
}

/** Turns a seat still has in the match, this round's included. */
export function turnsAhead(state: MatchState, who: SideId): number {
  if (state.phase === "over") return 0;
  return turnsToCome(state.round, state.sides[who].turnsLeft);
}

/**
 * Food held, counted by what it is good for: a Treat pays for anything, a
 * food the hand's cats cost pays for one of them, and anything else only
 * goes two for one.
 */
function foodWorth(side: Pick<Side, "hand" | "essence">): number {
  const need: Partial<Record<Essence, number>> = {};
  for (const catId of side.hand) {
    for (const pip of getCat(catId).cost) {
      if (pip !== "any") need[pip] = (need[pip] ?? 0) + 1;
    }
  }
  let worth = side.essence.wild * 1.1;
  for (const element of ELEMENTS) {
    const held = side.essence[element];
    const wanted = Math.min(held, need[element] ?? 0);
    worth += wanted + (held - wanted) * 0.6;
  }
  return worth;
}

/** What a seat's position is likely to add to its score. */
function prospects(side: Side, ahead: number, w: Weights): number {
  const cats = placedCats(side.board);
  const yarn = cats.reduce((sum, placed) => sum + placed.yarn, 0);
  if (ahead <= 0) return 0;
  // Late in a match there is less time to turn food and cards into points.
  const time = Math.min(1, ahead / 3);
  const food = foodWorth(side);
  let best = 0;
  side.hand.forEach((catId, hand) => {
    if (ROWS.some((row) => canPlay(side, hand, row))) {
      best = Math.max(best, getCat(catId).points);
    }
  });
  return (
    w.food * Math.min(food, 4) * time +
    w.hand * Math.min(side.hand.length, 3) * time +
    w.afford * best +
    w.engine * cats.length * ahead +
    w.yarn * yarn * time
  );
}

/** The points a seat has on the table now. */
export function pointsLead(state: MatchState, me: SideId): number {
  return sideScore(state, me).total - sideScore(state, otherSide(me)).total;
}

/** The table's worth to `me`, in points ahead of the other seat. */
export function evaluate(state: MatchState, me: SideId, w: Weights): number {
  const them = otherSide(me);
  const lead = pointsLead(state, me);
  if (state.phase === "over") return lead;
  const goal = goalStanding(state);
  const share = goal
    ? me === "player"
      ? goal.playerPoints - goal.rivalPoints
      : goal.rivalPoints - goal.playerPoints
    : 0;
  return (
    lead +
    w.goal * share +
    prospects(state.sides[me], turnsAhead(state, me), w) -
    w.deny * prospects(state.sides[them], turnsAhead(state, them), NEUTRAL)
  );
}

/** Setup: favour cats the kept food can actually pay for. */
export function keepValue(setup: readonly string[], action: Action): number {
  if (action.type !== "keep") return 0;
  let pool = emptyPool();
  for (const element of action.essence) pool[element] += 1;
  const cats = action.cats
    .map((index) => getCat(setup[index] ?? ""))
    .sort((a, b) => a.cost.length - b.cost.length);
  let total = cats.length * 0.5;
  for (const cat of cats) {
    const paid = payCost(pool, cat.cost);
    if (!paid) continue;
    pool = paid;
    total += 3 + cat.points * 0.5;
  }
  return total;
}

/** The elements the cats in a hand cost, most wanted first. */
export function wantedFood(
  hand: readonly string[],
): (typeof ELEMENTS)[number][] {
  const need = new Map<(typeof ELEMENTS)[number], number>();
  for (const catId of hand) {
    for (const pip of getCat(catId).cost) {
      if (pip !== "any") need.set(pip, (need.get(pip) ?? 0) + 1);
    }
  }
  return ELEMENTS.filter((element) => need.has(element)).sort(
    (a, b) => (need.get(b) ?? 0) - (need.get(a) ?? 0),
  );
}
