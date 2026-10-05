/**
 * A match with one seat at the table, for tests. The rules of a turn are the
 * same whoever sits opposite, so most of them are easiest to test alone:
 * the player's seat is laid flat beside the table, and the rival's seat is
 * there but never has a turn to take. Events lose their `move` and their
 * `side`, which a test of one seat has no use for.
 */

import {
  applyAction,
  createMatch,
  legalActions,
  sideScore,
  type Action,
  type MatchResult,
  type MatchState,
  type ScoreBreakdown,
  type Side,
  type Table,
  type TurnEvent,
  type MatchEvent,
} from "./match";

export interface Solo extends Side, Table {
  seed: string;
  step: number;
  /** The seat across the table; it holds no turns. */
  rival: Side;
  result: MatchResult | null;
}

export type SoloEvent =
  TurnEvent | Extract<MatchEvent, { type: "refill" | "goal" | "over" }>;

/**
 * The whole match a solo table stands for, with the player to act. The seat
 * opposite holds `rivalTurns` turns: none, unless a test wants it answered.
 */
export function lift(solo: Solo, rivalTurns = 0): MatchState {
  const { seed, step, rival, result, ...rest } = solo;
  const { phase, round, feeder, goals, goalResults, queue, pending, ...side } =
    rest;
  return {
    v: 2,
    seed,
    step,
    rivalId: "alley-tom",
    level: 0,
    phase,
    round,
    feeder,
    goals,
    goalResults,
    queue,
    pending,
    sides: { player: side, rival: { ...rival, turnsLeft: rivalTurns } },
    active: "player",
    lead: "player",
    last: { player: null, rival: null },
    result,
  };
}

export function flatten(state: MatchState): Solo {
  const { phase, round, feeder, goals, goalResults, queue, pending } = state;
  return {
    ...state.sides.player,
    phase,
    round,
    feeder,
    goals,
    goalResults,
    queue,
    pending,
    seed: state.seed,
    step: state.step,
    rival: state.sides.rival,
    result: state.result,
  };
}

/** A dealt match whose rival has already kept, so the player is to keep. */
export function soloMatch(config: {
  seed: string;
  deck: readonly string[];
  relics: readonly string[];
}): Solo {
  const dealt = createMatch({
    seed: config.seed,
    rivalId: "alley-tom",
    level: 0,
    player: { deck: config.deck, relics: config.relics },
    rival: { deck: config.deck, relics: [] },
  });
  const rival = dealt.sides.rival;
  return flatten({
    ...dealt,
    sides: {
      player: dealt.sides.player,
      rival: { ...rival, hand: rival.setup, setup: [] },
    },
  });
}

export function soloApply(
  solo: Solo,
  action: Action,
): { state: Solo; events: SoloEvent[] } {
  const { state, events } = applyAction(lift(solo), action);
  return {
    state: flatten(state),
    events: events.flatMap((event): SoloEvent[] => {
      if (event.type === "move") return [];
      if (!("side" in event) || event.type === "refill") return [event];
      const rest: Partial<typeof event> = { ...event };
      delete rest.side;
      return [rest as SoloEvent];
    }),
  };
}

export function soloActions(solo: Solo): Action[] {
  return legalActions(lift(solo));
}

export function soloScore(solo: Solo): ScoreBreakdown {
  return sideScore(lift(solo), "player");
}
