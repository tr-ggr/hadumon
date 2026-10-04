/**
 * Relics: run-long passives. A relic either bends a rule through `mods` or
 * adds points at the end of every match through `score`.
 */

import { getCat, ROWS, type Row } from "./cats";
import { ELEMENT_LABELS, type Element } from "./elements";
import type { Board } from "./match";

/** Numeric rule changes, summed across every relic the run holds. */
export interface Mods {
  /** Wild essence granted at the start of each match. */
  startWild: number;
  huntBonus: number;
  denBonus: number;
  prowlBonus: number;
  /** Yarn taken off every column cost, never below zero. */
  yarnDiscount: number;
  /** Added to the points of each cat the rival banks (negative helps you). */
  rivalBankDelta: number;
  /** Added to your count on every round goal you have at least 1 of. */
  goalBonus: number;
  /** Extra turns in the first round. */
  extraTurns: number;
}

export const NO_MODS: Mods = {
  startWild: 0,
  huntBonus: 0,
  denBonus: 0,
  prowlBonus: 0,
  yarnDiscount: 0,
  rivalBankDelta: 0,
  goalBonus: 0,
  extraTurns: 0,
};

export type ScoreRule =
  | { per: "element"; element: Element; points: number }
  | { per: "row"; row: Row; points: number }
  | { per: "yarn"; every: number; points: number };

export interface Relic {
  id: string;
  name: string;
  text: string;
  mods?: Partial<Mods>;
  score?: ScoreRule;
}

function charm(id: string, name: string, element: Element): Relic {
  return {
    id,
    name,
    text: `2 points for each ${ELEMENT_LABELS[element]} cat on your board at the end of a match.`,
    score: { per: "element", element, points: 2 },
  };
}

export const RELICS: Record<string, Relic> = Object.fromEntries(
  (
    [
      charm("ember-charm", "Ember Charm", "flame"),
      charm("tide-charm", "Tide Charm", "mist"),
      charm("spark-charm", "Spark Charm", "volt"),
      charm("briar-charm", "Briar Charm", "thorn"),
      charm("dusk-charm", "Dusk Charm", "shade"),
      {
        id: "warm-saucer",
        name: "Warm Saucer",
        text: "Start every match with 1 Treat.",
        mods: { startWild: 1 },
      },
      {
        id: "ball-of-twine",
        name: "Ball of Twine",
        text: "The Den lays 1 extra yarn.",
        mods: { denBonus: 1 },
      },
      {
        id: "bent-whisker",
        name: "Bent Whisker",
        text: "The Hunt takes 1 extra die.",
        mods: { huntBonus: 1 },
      },
      {
        id: "night-map",
        name: "Night Map",
        text: "The Prowl draws 1 extra cat.",
        mods: { prowlBonus: 1 },
      },
      {
        id: "soft-landing",
        name: "Soft Landing",
        text: "Every column costs 1 less yarn.",
        mods: { yarnDiscount: 1 },
      },
      {
        id: "early-riser",
        name: "Early Riser",
        text: "Take 1 extra turn in the first round.",
        mods: { extraTurns: 1 },
      },
      {
        id: "lucky-collar",
        name: "Lucky Collar",
        text: "Count 1 extra on every round goal you have a start on.",
        mods: { goalBonus: 1 },
      },
      {
        id: "loud-bell",
        name: "Loud Bell",
        text: "Each cat the rival banks is worth 1 less.",
        mods: { rivalBankDelta: -1 },
      },
      {
        id: "hoarders-basket",
        name: "Hoarder's Basket",
        text: "1 point for every 3 yarn on your board at the end of a match.",
        score: { per: "yarn", every: 3, points: 1 },
      },
      {
        id: "quiet-corner",
        name: "Quiet Corner",
        text: "2 points for each cat in your Den at the end of a match.",
        score: { per: "row", row: "den", points: 2 },
      },
    ] satisfies Relic[]
  ).map((relic) => [relic.id, relic] as const),
);

export const RELIC_LIST: Relic[] = Object.values(RELICS);

export function getRelic(relicId: string): Relic {
  const relic = RELICS[relicId];
  if (!relic) throw new Error(`Unknown relic: ${relicId}`);
  return relic;
}

export function combineMods(relicIds: readonly string[]): Mods {
  const mods: Mods = { ...NO_MODS };
  for (const id of relicIds) {
    const extra = getRelic(id).mods;
    if (!extra) continue;
    for (const key of Object.keys(extra) as (keyof Mods)[]) {
      mods[key] += extra[key] ?? 0;
    }
  }
  return mods;
}

/** End-of-match points one relic adds for this board. */
export function relicScore(relicId: string, board: Board): number {
  const rule = getRelic(relicId).score;
  if (!rule) return 0;
  switch (rule.per) {
    case "element": {
      const count = ROWS.flatMap((row) => board[row]).filter(
        (placed) => getCat(placed.catId).element === rule.element,
      ).length;
      return count * rule.points;
    }
    case "row":
      return board[rule.row].length * rule.points;
    case "yarn": {
      const yarn = ROWS.flatMap((row) => board[row]).reduce(
        (sum, placed) => sum + placed.yarn,
        0,
      );
      return Math.floor(yarn / rule.every) * rule.points;
    }
  }
}
