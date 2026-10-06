/**
 * Relics: run-long passives. A relic either bends a rule through `mods` or
 * adds points at the end of every match through `score`.
 */

import { getCat, ROWS, type Rarity, type Row } from "./cats";
import { ELEMENT_LABELS, type Element } from "./elements";
import { SLOTS, type Board, type PlacedCat } from "./match";

/** Numeric rule changes, summed across every relic the run holds. */
export interface Mods {
  /** Wild essence granted at the start of each match. */
  startWild: number;
  huntBonus: number;
  denBonus: number;
  prowlBonus: number;
  /** Yarn taken off every column cost, never below zero. */
  yarnDiscount: number;
  /** Added to your count on every round goal you have at least 1 of. */
  goalBonus: number;
  /** Extra turns in the first round. */
  extraTurns: number;
  /** Treats gained whenever the feeder is rolled again, whoever emptied it. */
  refillTreat: number;
  /** Cats drawn from the deck once the opening hand is kept. */
  startDraw: number;
  /** Treats gained at the start of every round after the first. */
  roundTreat: number;
  /** Extra turns in the last round. */
  finalTurns: number;
}

export const NO_MODS: Mods = {
  startWild: 0,
  huntBonus: 0,
  denBonus: 0,
  prowlBonus: 0,
  yarnDiscount: 0,
  goalBonus: 0,
  extraTurns: 0,
  refillTreat: 0,
  startDraw: 0,
  roundTreat: 0,
  finalTurns: 0,
};

export type ScoreRule =
  | { per: "element"; element: Element; points: number }
  | { per: "row"; row: Row; points: number }
  | { per: "yarn"; every: number; points: number }
  | { per: "cached"; every: number; points: number }
  | { per: "tucked"; every: number; points: number }
  /** Paid for each row holding as many cats as it can. */
  | { per: "fullRow"; points: number }
  /** Paid for each element among the cats on the board. */
  | { per: "variety"; points: number }
  | { per: "rarity"; rarity: Rarity; points: number };

export interface Relic {
  id: string;
  name: string;
  text: string;
  mods?: Partial<Mods>;
  score?: ScoreRule;
}

/**
 * What a clan's charm pays for each cat of its element. Over four rounds a
 * board fills, and at 2 a cat a charm was worth eight or nine points, twice
 * any other relic; at 1 it is worth about what the best of them are.
 */
export const CHARM_POINTS = 1;

function charm(id: string, name: string, element: Element): Relic {
  return {
    id,
    name,
    text: `${CHARM_POINTS} point for each ${ELEMENT_LABELS[element]} cat on your board at the end of a match.`,
    score: { per: "element", element, points: CHARM_POINTS },
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
        text: "Whenever the feeder is refilled, gain 1 Treat.",
        mods: { refillTreat: 1 },
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
      {
        id: "hunters-tally",
        name: "Hunter's Tally",
        text: "1 point for each cat in your Hunt at the end of a match.",
        score: { per: "row", row: "hunt", points: 1 },
      },
      {
        id: "moonlit-path",
        name: "Moonlit Path",
        text: "2 points for each cat in your Prowl at the end of a match.",
        score: { per: "row", row: "prowl", points: 2 },
      },
      {
        id: "mouse-jar",
        name: "Mouse Jar",
        text: "1 point for each food cached on your cats at the end of a match.",
        score: { per: "cached", every: 1, points: 1 },
      },
      {
        id: "old-blanket",
        name: "Old Blanket",
        text: "1 point for each cat tucked under yours at the end of a match.",
        score: { per: "tucked", every: 1, points: 1 },
      },
      {
        id: "paper-bag",
        name: "Paper Bag",
        text: "Draw 1 extra cat when you keep your opening hand.",
        mods: { startDraw: 1 },
      },
      {
        id: "night-bowl",
        name: "Night Bowl",
        text: "Gain 1 Treat at the start of every round after the first.",
        mods: { roundTreat: 1 },
      },
      {
        id: "night-owl",
        name: "Night Owl",
        text: "Take 1 extra turn in the last round.",
        mods: { finalTurns: 1 },
      },
      {
        id: "crowded-sill",
        name: "Crowded Sill",
        text: "3 points for each full row on your board at the end of a match.",
        score: { per: "fullRow", points: 3 },
      },
      {
        id: "patchwork-quilt",
        name: "Patchwork Quilt",
        text: "1 point for each element among the cats on your board at the end of a match.",
        score: { per: "variety", points: 1 },
      },
      {
        id: "alley-crown",
        name: "Alley Crown",
        text: "1 point for each Common cat on your board at the end of a match.",
        score: { per: "rarity", rarity: "common", points: 1 },
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

/** The relics' mods summed, with `extra` laid on top. */
export function combineMods(
  relicIds: readonly string[],
  extra: Partial<Mods> = {},
): Mods {
  const mods: Mods = { ...NO_MODS };
  for (const part of [...relicIds.map((id) => getRelic(id).mods), extra]) {
    if (!part) continue;
    for (const key of Object.keys(part) as (keyof Mods)[]) {
      mods[key] += part[key] ?? 0;
    }
  }
  return mods;
}

/** `every`-sized bundles of one thing summed over the board's cats. */
function bundles(
  placed: readonly PlacedCat[],
  count: (cat: PlacedCat) => number,
  every: number,
): number {
  return Math.floor(placed.reduce((sum, p) => sum + count(p), 0) / every);
}

/** End-of-match points one relic adds for this board. */
export function relicScore(relicId: string, board: Board): number {
  const rule = getRelic(relicId).score;
  if (!rule) return 0;
  const placed = ROWS.flatMap((row) => board[row]);
  switch (rule.per) {
    case "element":
      return (
        placed.filter((p) => getCat(p.catId).element === rule.element).length *
        rule.points
      );
    case "row":
      return board[rule.row].length * rule.points;
    case "yarn":
      return bundles(placed, (p) => p.yarn, rule.every) * rule.points;
    case "cached":
      return bundles(placed, (p) => p.cached, rule.every) * rule.points;
    case "tucked":
      return bundles(placed, (p) => p.tucked, rule.every) * rule.points;
    case "fullRow":
      return (
        ROWS.filter((row) => board[row].length >= SLOTS).length * rule.points
      );
    case "variety":
      return (
        new Set(placed.map((p) => getCat(p.catId).element)).size * rule.points
      );
    case "rarity":
      return (
        placed.filter((p) => getCat(p.catId).rarity === rule.rarity).length *
        rule.points
      );
  }
}
