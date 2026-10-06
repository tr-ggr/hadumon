/**
 * Round goals. One is scored at the end of each round, on what each side
 * really has: the higher count takes the larger share, a tie splits, and a
 * side with nothing towards the goal scores nothing.
 */

import {
  getCat,
  ROW_LABELS,
  ROWS,
  type Cat,
  type Effect,
  type Row,
} from "./cats";
import { ELEMENT_LABELS } from "./elements";
import type { PlacedCat, Side } from "./match";

/** What a goal counts: one seat's board, food and hand. */
export type Counted = Pick<Side, "board" | "essence" | "hand">;

export interface Goal {
  id: string;
  name: string;
  text: string;
  count(side: Counted): number;
  /** How a cat can count towards the goal, in a few words, or `null`. */
  hint(cat: Cat): string | null;
}

function placedCats(match: Counted): PlacedCat[] {
  return ROWS.flatMap((row) => match.board[row]);
}

/** True if the cat's power is one of these kinds. */
function powerIs(cat: Cat, kinds: readonly Effect["kind"][]): boolean {
  return cat.power !== null && kinds.includes(cat.power.effect.kind);
}

function rowGoal(id: string, name: string, row: Row): Goal {
  const label = ROW_LABELS[row];
  return {
    id,
    name,
    text: `Most cats in the ${label}.`,
    count: (match) => match.board[row].length,
    hint: (cat) => (cat.rows.includes(row) ? `can live in the ${label}` : null),
  };
}

export const GOALS: Record<string, Goal> = Object.fromEntries(
  (
    [
      rowGoal("hunting-party", "Hunting Party", "hunt"),
      rowGoal("full-den", "Full Den", "den"),
      rowGoal("night-shift", "Night Shift", "prowl"),
      {
        id: "yarn-hoard",
        name: "Yarn Hoard",
        text: "Most yarn on the board.",
        count: (match: Counted) =>
          placedCats(match).reduce((sum, placed) => sum + placed.yarn, 0),
        hint: (cat: Cat) =>
          cat.yarnCap > 0 ? `holds up to ${cat.yarnCap} yarn` : null,
      },
      {
        id: "warm-den",
        name: "Warm Den",
        text: "Most yarn on cats in the Den.",
        count: (match: Counted) =>
          match.board.den.reduce((sum, placed) => sum + placed.yarn, 0),
        hint: (cat: Cat) =>
          cat.rows.includes("den") && cat.yarnCap > 0
            ? "holds yarn in the Den"
            : null,
      },
      {
        id: "mixed-company",
        name: "Mixed Company",
        text: "Most different elements on the board.",
        count: (match: Counted) =>
          new Set(placedCats(match).map((p) => getCat(p.catId).element)).size,
        hint: (cat: Cat) => `brings ${ELEMENT_LABELS[cat.element]}`,
      },
      {
        id: "crowd",
        name: "Crowd",
        text: "Most cats on the board.",
        count: (match: Counted) => placedCats(match).length,
        hint: () => "one more cat on the board",
      },
      {
        id: "pantry",
        name: "Pantry",
        text: "Most food in hand.",
        count: (match: Counted) =>
          Object.values(match.essence).reduce((sum, n) => sum + n, 0),
        hint: (cat: Cat) =>
          powerIs(cat, ["essence", "wild"]) ? "fetches food" : null,
      },
      {
        id: "pawful",
        name: "Pawful",
        text: "Most cats in hand.",
        count: (match: Counted) => match.hand.length,
        hint: () => "counts while in your hand",
      },
      {
        id: "stash",
        name: "Stash",
        text: "Most cached food and tucked cats.",
        count: (match: Counted) =>
          placedCats(match).reduce((sum, p) => sum + p.cached + p.tucked, 0),
        hint: (cat: Cat) =>
          powerIs(cat, ["cache", "tuckDeck", "pounce", "tuckHand"])
            ? "caches or tucks"
            : null,
      },
    ] satisfies Goal[]
  ).map((goal) => [goal.id, goal] as const),
);

export const GOAL_IDS: string[] = Object.keys(GOALS);

export function getGoal(goalId: string): Goal {
  const goal = GOALS[goalId];
  if (!goal) throw new Error(`Unknown goal: ${goalId}`);
  return goal;
}
