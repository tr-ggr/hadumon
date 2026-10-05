/**
 * Round goals. One is scored at the end of each round: the player's count
 * against the rival's tally, which is the goal's par plus the rival's edge
 * and any pushes it made that round.
 */

import { getCat, ROWS, type Row } from "./cats";
import type { PlacedCat, Side } from "./match";

/** What a goal counts: one seat's board, food and hand. */
export type Counted = Pick<Side, "board" | "essence" | "hand">;

export interface Goal {
  id: string;
  name: string;
  text: string;
  /** What a steady player has by the end of rounds 1, 2 and 3. */
  par: readonly [number, number, number];
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
    par: [1, 1, 2],
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
        par: [2, 3, 5],
        count: (match: Counted) =>
          placedCats(match).reduce((sum, placed) => sum + placed.yarn, 0),
      },
      {
        id: "warm-den",
        name: "Warm Den",
        text: "Most yarn on cats in the Den.",
        par: [1, 2, 3],
        count: (match: Counted) =>
          match.board.den.reduce((sum, placed) => sum + placed.yarn, 0),
      },
      {
        id: "mixed-company",
        name: "Mixed Company",
        text: "Most different elements on the board.",
        par: [1, 2, 3],
        count: (match: Counted) =>
          new Set(placedCats(match).map((p) => getCat(p.catId).element)).size,
      },
      {
        id: "crowd",
        name: "Crowd",
        text: "Most cats on the board.",
        par: [2, 3, 4],
        count: (match: Counted) => placedCats(match).length,
      },
      {
        id: "pantry",
        name: "Pantry",
        text: "Most food in hand.",
        par: [1, 2, 2],
        count: (match: Counted) =>
          Object.values(match.essence).reduce((sum, n) => sum + n, 0),
      },
      {
        id: "pawful",
        name: "Pawful",
        text: "Most cats in hand.",
        par: [1, 2, 2],
        count: (match: Counted) => match.hand.length,
      },
      {
        id: "stash",
        name: "Stash",
        text: "Most cached food and tucked cats.",
        par: [1, 1, 2],
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
