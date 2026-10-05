/**
 * What the client is allowed to see. The stored state holds both decks in
 * order, the rival's hand and the seed; none of them may leave the server.
 * The player's own seat is laid flat on the view, as the table shows it, and
 * the rival's seat is the part of it that shows across the table. The view
 * also carries the few derived facts the UI needs to offer legal moves, so
 * the client never has to run the engine on state it does not have.
 */

import { ROWS, type Row } from "./cats";
import { difficultyOf, type DifficultyId } from "./difficulty";
import {
  canPlay,
  canReroll,
  columnYarnCost,
  goalStanding,
  prowlPickCount,
  rowReward,
  sideScore,
  SLOTS,
  tradeOffered,
  type Board,
  type Essence,
  type EssencePool,
  type GoalResult,
  type MatchPhase,
  type MatchResult,
  type MatchState,
  type Pending,
  type ScoreBreakdown,
  type SideId,
  type TurnMove,
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

/** The rival's seat, as far as it shows across the table. */
export interface RivalView {
  /** How well it plays, 0 the least. */
  level: number;
  /** Its cats, with the ones tucked under them counted and not named. */
  board: Board;
  tray: string[];
  essence: EssencePool;
  relics: string[];
  handCount: number;
  deckCount: number;
  discardCount: number;
  turnsLeft: number;
  score: ScoreBreakdown;
  /** The last whole turn it took. */
  last: TurnMove | null;
}

/**
 * The shared table after one of the rival's actions, for a turn's playback
 * to stop at on its way to the finished view.
 */
export interface RivalBeat {
  rival: RivalView;
  feeder: Essence[];
}

export interface MatchView {
  step: number;
  rivalId: string;
  phase: MatchPhase;
  round: number;
  /** Turns the player still has this round. */
  turnsLeft: number;
  /** Who takes the first turn of this round. */
  lead: SideId;
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
  /**
   * The rows whose trade can be made now: paid for, and one more taken than
   * the reward. A Hunt then takes `rewards.hunt + 1` dice, and so on.
   */
  trades: Record<Row, boolean>;
}

export interface RunView {
  difficulty: DifficultyId;
  /** Deck contents in a fixed order; the draw order stays on the server. */
  deck: string[];
  /** The cards of the built deck the rivals still hold, sorted. */
  stolen: string[];
  relics: string[];
  /** The relics in the opening chest, while it waits to be opened. */
  chest: string[] | null;
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

/** A board with its tucked cats turned face down. */
function faceDown(board: Board): Board {
  return byRow((row) =>
    board[row].map(({ catId, yarn, cached, tucked }) => ({
      catId,
      yarn,
      cached,
      tucked,
    })),
  );
}

export function toRivalView(state: MatchState): RivalView {
  const rival = state.sides.rival;
  return {
    level: state.level,
    board: faceDown(rival.board),
    tray: rival.tray,
    essence: rival.essence,
    relics: rival.relics,
    handCount: rival.hand.length + rival.setup.length,
    deckCount: rival.deck.length,
    discardCount: rival.discard.length,
    turnsLeft: rival.turnsLeft,
    score: sideScore(state, "rival"),
    last: state.last.rival,
  };
}

export function toRivalBeat(state: MatchState): RivalBeat {
  return { rival: toRivalView(state), feeder: state.feeder };
}

export function toMatchView(state: MatchState): MatchView {
  const player = state.sides.player;
  // The driver hands the match back only when the player is to act.
  const mine = state.active === "player";
  const turn = mine && state.phase === "turn";
  return {
    step: state.step,
    rivalId: state.rivalId,
    phase: state.phase,
    round: state.round,
    turnsLeft: player.turnsLeft,
    lead: state.lead,
    board: player.board,
    hand: player.hand,
    tray: player.tray,
    setup: player.setup,
    essence: player.essence,
    feeder: state.feeder,
    goals: state.goals,
    goalResults: state.goalResults,
    pending: mine ? state.pending : null,
    result: state.result,
    mods: player.mods,
    relics: player.relics,
    deckCount: player.deck.length,
    discardCount: player.discard.length,
    rival: toRivalView(state),
    score: sideScore(state, "player"),
    standing: goalStanding(state),
    rewards: byRow((row) => rowReward(player, row)),
    yarnCosts: byRow((row) =>
      player.board[row].length >= SLOTS
        ? null
        : columnYarnCost(player.mods, player.board[row].length),
    ),
    playable: player.hand.map((_, hand) =>
      turn ? ROWS.filter((row) => canPlay(player, hand, row)) : [],
    ),
    canReroll: mine && canReroll(state),
    prowlPicks: prowlPickCount(player),
    trades: byRow((row) => turn && tradeOffered(player, state.feeder, row)),
  };
}

export function toRunView(run: RunState): RunView {
  // The seed, the pool and the deck as it was built stay on the server.
  return {
    difficulty: difficultyOf(run.difficulty).id,
    deck: [...run.deck].sort(),
    stolen: [...run.stolen].sort(),
    relics: run.relics,
    chest: run.phase === "chest" ? run.chest : null,
    matchIndex: run.matchIndex,
    gauntlet: GAUNTLET,
    phase: run.phase,
    match: run.match ? toMatchView(run.match) : null,
    reward: run.reward,
    results: run.results,
    outcome: run.outcome,
  };
}
