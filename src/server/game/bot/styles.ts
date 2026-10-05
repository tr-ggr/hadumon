/**
 * How each rival plays. A style is a tilt on the neutral evaluation, never
 * more than `TILT_LIMIT` either way, and an order of habits that settles a
 * choice the evaluation calls even. It gives a rival a manner; how well it
 * plays is its level's doing.
 */

import type { Row } from "../cats";
import { NEUTRAL, tilted, type Weights } from "./eval";

export type Habit = "play" | Row;

export interface Style {
  /** How it plays, in one line. */
  line: string;
  weights: Weights;
  /** What it reaches for first when nothing sets two moves apart. */
  habits: readonly Habit[];
}

export const STYLES: Record<string, Style> = {
  "alley-tom": {
    line: "Plays the first cat he can pay for and thinks about it afterwards.",
    weights: tilted({ afford: 1.3, engine: 1.2, hand: 0.8, goal: 0.8 }),
    habits: ["play", "hunt", "prowl", "den"],
  },
  "dockside-twins": {
    line: "Goes to the Den early and often; the yarn is the plan.",
    weights: tilted({ yarn: 0.3, food: 0.8 }),
    habits: ["play", "den", "hunt", "prowl"],
  },
  "madame-mittens": {
    line: "Hunts first. Counts what you need and takes that.",
    weights: tilted({ food: 1.3, deny: 1.3 }),
    habits: ["hunt", "play", "prowl", "den"],
  },
  "rooftop-syndicate": {
    line: "Fills rows wide before it builds anything tall.",
    weights: tilted({ engine: 1.3, hand: 1.2, yarn: -0.15 }),
    habits: ["play", "prowl", "hunt", "den"],
  },
  "the-archivist": {
    line: "Plays the round goal, every round, to the last count.",
    weights: tilted({ goal: 1.3 }),
    habits: ["play", "den", "prowl", "hunt"],
  },
  "old-nine-lives": {
    line: "No habits left. Takes whichever line scores.",
    weights: NEUTRAL,
    habits: ["play", "hunt", "den", "prowl"],
  },
};

/** A seat with no manner of its own: the stand-in for a player. */
export const PLAIN: Style = {
  line: "",
  weights: NEUTRAL,
  habits: ["play", "hunt", "den", "prowl"],
};

export function styleOf(rivalId: string): Style {
  return STYLES[rivalId] ?? PLAIN;
}
