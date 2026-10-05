/**
 * What a seat may know. A bot is never handed the match; it is handed an
 * `Observation`, built here from a whitelist, so what it cannot see it cannot
 * use. The seed, the order of either deck, the other seat's hand, and the
 * cats tucked face down under the other seat's cats are never in it.
 *
 * To look ahead, a bot deals the cats it cannot see back out at random and
 * plays on from there (`imagine`). The table it imagines has a seed of its
 * own, so its dice are not the dice to come.
 */

import { ROWS } from "../cats";
import {
  otherSide,
  type Board,
  type MatchState,
  type Essence,
  type EssencePool,
  type GoalResult,
  type MatchPhase,
  type Pending,
  type Side,
  type SideId,
  type SlotRef,
  type TurnMove,
} from "../match";
import type { Mods } from "../relics";
import type { Rng } from "../rng";

/** The seat a bot sits in, in full, except the order of its deck. */
export interface OwnSeat {
  relics: string[];
  mods: Mods;
  turnsLeft: number;
  board: Board;
  hand: string[];
  tray: string[];
  setup: string[];
  essence: EssencePool;
  /** What it has discarded. The pile is shuffled before it is drawn from. */
  discard: string[];
  /** The cats in its deck, sorted: what is there, not what comes next. */
  unseen: string[];
}

/** The other seat, as far as it shows across the table. */
export interface OtherSeat {
  relics: string[];
  mods: Mods;
  turnsLeft: number;
  /** Its cats, with the ones tucked under them counted and not named. */
  board: Board;
  tray: string[];
  essence: EssencePool;
  handCount: number;
  setupCount: number;
  deckCount: number;
  discardCount: number;
  /** Its hand, deck, discard pile and tucked cats together, sorted. */
  unseen: string[];
}

export interface Observation {
  me: SideId;
  step: number;
  phase: MatchPhase;
  round: number;
  feeder: Essence[];
  goals: string[];
  goalResults: GoalResult[];
  queue: SlotRef[];
  pending: Pending | null;
  active: SideId;
  lead: SideId;
  last: Record<SideId, TurnMove | null>;
  own: OwnSeat;
  other: OtherSeat;
}

function tuckedCats(board: Board): string[] {
  return ROWS.flatMap((row) => board[row].flatMap((p) => p.under ?? []));
}

/** A board with its tucked cats turned face down. */
function faceDown(board: Board): Board {
  const hide = (row: (typeof ROWS)[number]) =>
    board[row].map(({ catId, yarn, cached, tucked }) => ({
      catId,
      yarn,
      cached,
      tucked,
    }));
  return { hunt: hide("hunt"), den: hide("den"), prowl: hide("prowl") };
}

export function observe(state: MatchState, me: SideId): Observation {
  const own = state.sides[me];
  const other = state.sides[otherSide(me)];
  return structuredClone({
    me,
    step: state.step,
    phase: state.phase,
    round: state.round,
    feeder: state.feeder,
    goals: state.goals,
    goalResults: state.goalResults,
    queue: state.queue,
    pending: state.pending,
    active: state.active,
    lead: state.lead,
    last: state.last,
    own: {
      relics: own.relics,
      mods: own.mods,
      turnsLeft: own.turnsLeft,
      board: own.board,
      hand: own.hand,
      tray: own.tray,
      setup: own.setup,
      essence: own.essence,
      discard: [...own.discard].sort(),
      unseen: [...own.deck].sort(),
    },
    other: {
      relics: other.relics,
      mods: other.mods,
      turnsLeft: other.turnsLeft,
      board: faceDown(other.board),
      tray: other.tray,
      essence: other.essence,
      handCount: other.hand.length,
      setupCount: other.setup.length,
      deckCount: other.deck.length,
      discardCount: other.discard.length,
      unseen: [
        ...other.hand,
        ...other.setup,
        ...other.deck,
        ...other.discard,
        ...tuckedCats(other.board),
      ].sort(),
    },
  });
}

/**
 * One table the observation could be of. The bot's own deck is shuffled, and
 * the other seat's unseen cats are dealt at random into its hand, under its
 * cats, into its discard pile and its deck, in the numbers that show. The
 * seed is drawn from `rng`, so nothing rolled here is rolled at the real
 * table.
 */
export function imagine(seen: Observation, rng: Rng): MatchState {
  const { own, other } = structuredClone(seen);
  const pool = rng.shuffle(other.unseen);
  const take = (n: number) => pool.splice(0, n);

  const hand = take(other.handCount);
  const setup = take(other.setupCount);
  const board = other.board;
  for (const row of ROWS) {
    for (const placed of board[row]) placed.under = take(placed.tucked);
  }
  const discard = take(other.discardCount);

  const mine: Side = {
    relics: own.relics,
    mods: own.mods,
    turnsLeft: own.turnsLeft,
    board: own.board,
    hand: own.hand,
    deck: rng.shuffle(own.unseen),
    discard: own.discard,
    tray: own.tray,
    setup: own.setup,
    essence: own.essence,
  };
  const theirs: Side = {
    relics: other.relics,
    mods: other.mods,
    turnsLeft: other.turnsLeft,
    board,
    hand,
    deck: pool,
    discard,
    tray: other.tray,
    setup,
    essence: other.essence,
  };
  return {
    v: 2,
    seed: `imagined:${rng.next()}`,
    step: seen.step,
    rivalId: "",
    level: 0,
    phase: seen.phase,
    round: seen.round,
    feeder: [...seen.feeder],
    goals: [...seen.goals],
    goalResults: structuredClone(seen.goalResults),
    queue: structuredClone(seen.queue),
    pending: structuredClone(seen.pending),
    sides:
      seen.me === "player"
        ? { player: mine, rival: theirs }
        : { player: theirs, rival: mine },
    active: seen.active,
    lead: seen.lead,
    last: structuredClone(seen.last),
    result: null,
  };
}
