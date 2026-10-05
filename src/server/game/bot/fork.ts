/**
 * Tables a bot plays on in its head. A fork is a copy the bot owns, so it is
 * stepped in place, and every step is counted against a budget: thinking is
 * capped by how many moves are tried, never by the clock, so the same
 * position always gets the same answer.
 */

import { ROWS } from "../cats";
import {
  stepMatch,
  type Action,
  type Board,
  type MatchState,
  type Side,
} from "../match";

function copyBoard(board: Board): Board {
  const out = { hunt: [], den: [], prowl: [] } as Board;
  for (const row of ROWS) {
    out[row] = board[row].map((placed) => ({
      ...placed,
      under: placed.under ? [...placed.under] : undefined,
    }));
  }
  return out;
}

function copySide(side: Side): Side {
  return {
    relics: side.relics,
    mods: side.mods,
    turnsLeft: side.turnsLeft,
    board: copyBoard(side.board),
    hand: [...side.hand],
    deck: [...side.deck],
    discard: [...side.discard],
    tray: [...side.tray],
    setup: [...side.setup],
    essence: { ...side.essence },
  };
}

/** A copy that shares nothing the reducer writes to. */
export function fork(state: MatchState): MatchState {
  return {
    ...state,
    feeder: [...state.feeder],
    goalResults: [...state.goalResults],
    queue: state.queue.map((slot) => ({ ...slot })),
    pending: state.pending && {
      ...state.pending,
      slot: { ...state.pending.slot },
    },
    sides: {
      player: copySide(state.sides.player),
      rival: copySide(state.sides.rival),
    },
    last: { ...state.last },
  };
}

/** How many more moves a bot may try before it must answer. */
export interface Budget {
  left: number;
}

/** Every move any bot has tried, for tests and benchmarks to read. */
export const meter = { steps: 0 };

/** Plays `action` on a fork the caller owns, and counts it. */
export function tryMove(
  state: MatchState,
  action: Action,
  budget: Budget,
): void {
  budget.left -= 1;
  meter.steps += 1;
  stepMatch(state, action);
}
