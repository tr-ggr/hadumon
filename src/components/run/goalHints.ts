/**
 * What an opening hand being kept does for the match's round goals, so the
 * goals can light up as the hand is chosen. Pure, so it is tested without a
 * browser.
 */

import { getCat } from "~/server/game/cats";
import type { Element } from "~/server/game/elements";
import { getGoal } from "~/server/game/goals";
import { emptyPool } from "~/server/game/match";

/** One kept cat that counts towards a goal, and how, e.g. "brings Shade". */
export interface CountingCat {
  catId: string;
  hint: string;
}

/** What is kept that counts towards one round's goal. */
export interface KeptCount {
  cats: CountingCat[];
  /** The kept food, when the goal counts food held; else empty. */
  food: Element[];
}

/**
 * One entry per round: the kept cats that count towards its goal, each with
 * how, and the kept food if the goal counts it. A round nothing kept counts
 * towards has both lists empty.
 */
export function keepHints(
  goals: readonly string[],
  catIds: readonly string[],
  food: readonly Element[],
): KeptCount[] {
  const essence = emptyPool();
  for (const element of food) essence[element] += 1;
  return goals.map((goalId) => {
    const goal = getGoal(goalId);
    const cats = catIds.flatMap((catId) => {
      const hint = goal.hint(getCat(catId));
      return hint ? [{ catId, hint }] : [];
    });
    // Food kept is food held, which a goal may count on its own.
    const held = goal.count({
      board: { hunt: [], den: [], prowl: [] },
      essence,
      hand: [],
    });
    return { cats, food: held > 0 ? [...food] : [] };
  });
}
