/**
 * Round goals. One is scored at the end of each round, on what each side
 * really has: the higher count takes the larger share, a tie splits, and a
 * side with nothing towards the goal scores nothing.
 */

import { getCat, ROWS, type Row } from "./cats";
import type { PlacedCat, Side } from "./match";

/** What a goal counts: one seat's board, food and hand. */
export type Counted = Pick<Side, "board" | "essence" | "hand">;

export interface Goal {
  id: string;
  name: string;
  text: string;
  count(side: Counted): number;
}

function placedCats(match: Counted): PlacedCat[] {
  return ROWS.flatMap((row) => match.board[row]);
}

function rowGoal(id: string, name: string, row: Row, label: string): Goal {
  return {
    id,
    name,
    text: `Most cats in the ${label}.`,
    count: (match) => match.board[row].length,
  };
}

export const GOALS: Record<string, Goal> = Object.fromEntries(
  (
    [
      rowGoal("hunting-party", "Hunting Party", "hunt", "Hunt"),
      rowGoal("full-den", "Full Den", "den", "Den"),
      rowGoal("night-shift", "Night Shift", "prowl", "Prowl"),
      {
        id: "yarn-hoard",
        name: "Yarn Hoard",
        text: "Most yarn on the board.",
        count: (match: Counted) =>
          placedCats(match).reduce((sum, placed) => sum + placed.yarn, 0),
      },
      {
        id: "warm-den",
        name: "Warm Den",
        text: "Most yarn on cats in the Den.",
        count: (match: Counted) =>
          match.board.den.reduce((sum, placed) => sum + placed.yarn, 0),
      },
      {
        id: "mixed-company",
        name: "Mixed Company",
        text: "Most different elements on the board.",
        count: (match: Counted) =>
          new Set(placedCats(match).map((p) => getCat(p.catId).element)).size,
      },
      {
        id: "crowd",
        name: "Crowd",
        text: "Most cats on the board.",
        count: (match: Counted) => placedCats(match).length,
      },
      {
        id: "pantry",
        name: "Pantry",
        text: "Most food in hand.",
        count: (match: Counted) =>
          Object.values(match.essence).reduce((sum, n) => sum + n, 0),
      },
      {
        id: "pawful",
        name: "Pawful",
        text: "Most cats in hand.",
        count: (match: Counted) => match.hand.length,
      },
      {
        id: "stash",
        name: "Stash",
        text: "Most cached food and tucked cats.",
        count: (match: Counted) =>
          placedCats(match).reduce((sum, p) => sum + p.cached + p.tucked, 0),
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
