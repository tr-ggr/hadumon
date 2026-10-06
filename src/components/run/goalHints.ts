/**
 * What an opening hand being kept does for the match's round goals, so the
 * goals can light up as the hand is chosen. Pure, so it is tested without a
 * browser.
 */

import { getCat } from "~/server/game/cats";
import type { Element } from "~/server/game/elements";
import { getGoal } from "~/server/game/goals";
import { emptyPool } from "~/server/game/match";

import { listWords } from "./describe";

/**
 * One list per round of the short lines saying how the kept cats and food
 * count towards its goal, e.g. "Flameclaw and Mistpaw: can live in the
 * Hunt". Cats that count the same way share a line. A round nothing kept
 * counts towards has an empty list.
 */
export function keepHints(
  goals: readonly string[],
  catIds: readonly string[],
  food: readonly Element[],
): string[][] {
  const essence = emptyPool();
  for (const element of food) essence[element] += 1;
  return goals.map((goalId) => {
    const goal = getGoal(goalId);
    const byHint = new Map<string, string[]>();
    for (const catId of catIds) {
      const cat = getCat(catId);
      const hint = goal.hint(cat);
      if (hint) byHint.set(hint, [...(byHint.get(hint) ?? []), cat.name]);
    }
    const lines = [...byHint].map(
      ([hint, names]) => `${listWords(names)}: ${hint}`,
    );
    // Food kept is food held, which a goal may count on its own.
    const held = goal.count({
      board: { hunt: [], den: [], prowl: [] },
      essence,
      hand: [],
    });
    if (held > 0) lines.push(`${food.length} food kept`);
    return lines;
  });
}
