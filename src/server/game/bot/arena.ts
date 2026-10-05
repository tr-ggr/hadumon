/**
 * Bots playing each other. Nothing in the app ships this; it exists to
 * measure the levels against one another and to prove matches end.
 */

import { ELEMENTS } from "../elements";
import {
  createDuel,
  stepDuel,
  type DuelConfig,
  type DuelState,
  type SideId,
} from "../match";
import { createRng } from "../rng";
import { starterDeck } from "../run";
import { observe } from "./observe";
import type { Bot } from "./levels";

/** Plays a match to its end, each seat chosen for by its own bot. */
export function playDuel(
  config: DuelConfig,
  bots: Record<SideId, Bot>,
): DuelState {
  const state = createDuel(config);
  for (let guard = 0; guard < 600 && state.phase !== "over"; guard++) {
    const who = state.active;
    const action = bots[who](
      observe(state, who),
      createRng(`${state.seed}:${state.step}:bot`),
    );
    stepDuel(state, action);
  }
  if (state.phase !== "over") throw new Error("Match did not terminate");
  return state;
}

export interface Tally {
  games: number;
  wins: number;
  ties: number;
  losses: number;
  /** Mean points scored, and mean points conceded. */
  scored: number;
  conceded: number;
}

export function emptyTally(): Tally {
  return { games: 0, wins: 0, ties: 0, losses: 0, scored: 0, conceded: 0 };
}

/** Adds one finished match to `tally`, seen from `who`'s seat. */
export function record(tally: Tally, state: DuelState, who: SideId): void {
  const result = state.result;
  if (!result) return;
  const mine = who === "player" ? result.player.total : result.rival.total;
  const theirs = who === "player" ? result.rival.total : result.player.total;
  tally.games += 1;
  if (mine > theirs) tally.wins += 1;
  else if (mine < theirs) tally.losses += 1;
  else tally.ties += 1;
  tally.scored += (mine - tally.scored) / tally.games;
  tally.conceded += (theirs - tally.conceded) / tally.games;
}

/** Wins, with a tie counted as half of one. */
export function winRate(tally: Tally): number {
  return tally.games === 0 ? 0 : (tally.wins + tally.ties / 2) / tally.games;
}

/**
 * `a` against `b` over `games` pairs of matches on plain starter decks. Each
 * pair is one deal played twice with the seats swapped, so neither the first
 * turn nor the cards favour a side. The tally is `a`'s.
 */
export function faceOff(a: Bot, b: Bot, games: number, label: string): Tally {
  const tally = emptyTally();
  for (let game = 0; game < games; game++) {
    const config: DuelConfig = {
      seed: `${label}-${game}`,
      rivalId: "",
      level: 0,
      player: {
        deck: starterDeck(ELEMENTS[game % ELEMENTS.length] ?? "flame"),
        relics: [],
      },
      rival: {
        deck: starterDeck(ELEMENTS[(game + 2) % ELEMENTS.length] ?? "mist"),
        relics: [],
      },
    };
    record(tally, playDuel(config, { player: a, rival: b }), "player");
    record(tally, playDuel(config, { player: b, rival: a }), "rival");
  }
  return tally;
}
