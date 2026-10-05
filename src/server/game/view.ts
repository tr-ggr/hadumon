/**
 * What the client is allowed to see. The stored state holds the deck order,
 * the rival's deck and the seed; none of them may leave the server. The view
 * also carries the few derived facts the UI needs to offer legal moves, so
 * the client never has to run the engine on state it does not have.
 */

import { ROWS, type RivalAction, type Row } from "./cats";
import { difficultyOf, type DifficultyId } from "./difficulty";
import {
  canPlay,
  canReroll,
  columnYarnCost,
  goalStanding,
  playerScore,
  prowlPickCount,
  rivalBankValue,
  rivalScore,
  rowReward,
  SLOTS,
  type Board,
  type Essence,
  type EssencePool,
  type GoalResult,
  type MatchPhase,
  type MatchResult,
  type MatchState,
  type Pending,
  type ScoreBreakdown,
} from "./match";
import type { Mods } from "./relics";
import { GAUNTLET } from "./rival";
import type {
  MatchRecord,
  RewardOffer,
  RunOutcome,
  RunPhase,
  RunState,
} from "./run";
import type { Element } from "./elements";

export interface RivalView {
  banked: number;
  bankValue: number;
  yarn: number;
  pushes: number;
  goalPoints: number;
  score: number;
  last: RivalAction | null;
  /** Cards already flipped since the rival last shuffled. */
  seen: RivalAction[];
  deckCount: number;
}

export interface MatchView {
  step: number;
  rivalId: string;
  phase: MatchPhase;
  round: number;
  turnsLeft: number;
  board: Board;
  hand: string[];
  tray: string[];
  setup: string[];
  essence: EssencePool;
  feeder: Essence[];
  goals: string[];
  goalResults: GoalResult[];
  pending: Pending | null;
  result: MatchResult | null;
  mods: Mods;
  /** The run's relics, which a board is scored with. */
  relics: string[];
  deckCount: number;
  discardCount: number;
  rival: RivalView;
  score: ScoreBreakdown;
  /** This round's goal as it would score if the round ended now. */
  standing: GoalResult | null;
  /** What activating each row gives right now. */
  rewards: Record<Row, number>;
  /** Yarn the next cat played into each row costs; `null` if the row is full. */
  yarnCosts: Record<Row, number | null>;
  /** For each hand index, the rows that cat can be played into now. */
  playable: Row[][];
  canReroll: boolean;
  /** How many cats a Prowl must pick. */
  prowlPicks: number;
}

export interface RunView {
  clanId: Element;
  difficulty: DifficultyId;
  /** Deck contents in a fixed order; the draw order stays on the server. */
  deck: string[];
  relics: string[];
  matchIndex: number;
  gauntlet: readonly string[];
  phase: RunPhase;
  match: MatchView | null;
  reward: RewardOffer | null;
  results: MatchRecord[];
  outcome: RunOutcome | null;
}

function byRow<T>(fn: (row: Row) => T): Record<Row, T> {
  return { hunt: fn("hunt"), den: fn("den"), prowl: fn("prowl") };
}

export function toMatchView(state: MatchState): MatchView {
  const turn = state.phase === "turn";
  return {
    step: state.step,
    rivalId: state.rivalId,
    phase: state.phase,
    round: state.round,
    turnsLeft: state.turnsLeft,
    board: state.board,
    hand: state.hand,
    tray: state.tray,
    setup: state.setup,
    essence: state.essence,
    feeder: state.feeder,
    goals: state.goals,
    goalResults: state.goalResults,
    pending: state.pending,
    result: state.result,
    mods: state.mods,
    relics: state.relics,
    deckCount: state.deck.length,
    discardCount: state.discard.length,
    rival: {
      banked: state.rival.banked,
      bankValue: rivalBankValue(state),
      yarn: state.rival.yarn,
      pushes: state.rival.pushes,
      goalPoints: state.rival.goalPoints,
      score: rivalScore(state),
      last: state.rival.last,
      seen: state.rival.discard,
      deckCount: state.rival.deck.length,
    },
    score: playerScore(state),
    standing: goalStanding(state),
    rewards: byRow((row) => rowReward(state, row)),
    yarnCosts: byRow((row) =>
      state.board[row].length >= SLOTS
        ? null
        : columnYarnCost(state.mods, state.board[row].length),
    ),
    playable: state.hand.map((_, hand) =>
      turn ? ROWS.filter((row) => canPlay(state, hand, row)) : [],
    ),
    canReroll: canReroll(state),
    prowlPicks: prowlPickCount(state),
  };
}

export function toRunView(run: RunState): RunView {
  return {
    clanId: run.clanId,
    difficulty: difficultyOf(run.difficulty).id,
    deck: [...run.deck].sort(),
    relics: run.relics,
    matchIndex: run.matchIndex,
    gauntlet: GAUNTLET,
    phase: run.phase,
    match: run.match ? toMatchView(run.match) : null,
    reward: run.reward,
    results: run.results,
    outcome: run.outcome,
  };
}
