/**
 * Bots playing each other. Nothing in the app ships this; it exists to
 * measure the levels against one another and to prove matches end.
 */

import { getCat, RARITIES } from "../cats";
import { starterDeck } from "../clans";
import type { DifficultyId } from "../difficulty";
import { ELEMENTS } from "../elements";
import {
  createMatch,
  drawMeter,
  stepMatch,
  type MatchConfig,
  type MatchState,
  type SideId,
} from "../match";
import { matchPayout } from "../payout";
import { createRng } from "../rng";
import {
  applyReward,
  matchConfig,
  settleMatch,
  startRun,
  takeChest,
  type RunPool,
  type RunState,
} from "../run";
import { observe } from "./observe";
import { botAt, TOP_LEVEL, type Bot } from "./levels";
import { styleOf } from "./styles";

/**
 * Plays a match to its end, each seat chosen for by its own bot. `count`,
 * if given, is added the draws that came up empty on the table itself, not
 * in a bot's head.
 */
export function playMatch(
  config: MatchConfig,
  bots: Record<SideId, Bot>,
  count?: { dry: number },
): MatchState {
  const state = createMatch(config);
  for (let guard = 0; guard < 1200 && state.phase !== "over"; guard++) {
    const who = state.active;
    const action = bots[who](
      observe(state, who),
      createRng(`${state.seed}:${state.step}:bot`),
    );
    const dry = drawMeter.dry;
    stepMatch(state, action);
    if (count) count.dry += drawMeter.dry - dry;
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
export function record(tally: Tally, state: MatchState, who: SideId): void {
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
    const config: MatchConfig = {
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
    record(tally, playMatch(config, { player: a, rival: b }), "player");
    record(tally, playMatch(config, { player: b, rival: a }), "rival");
  }
  return tally;
}

export interface GauntletMatch {
  rivalId: string;
  level: number;
  player: number;
  rival: number;
  won: boolean;
  /** Draws, by either seat, that found no card to draw. */
  dry: number;
}

export interface GauntletConfig {
  seed: string;
  /** The deck the stand-in built, and the cats and relics its account holds. */
  deck: readonly string[];
  pool: RunPool;
  tier: DifficultyId;
  /**
   * What-ifs for measuring, never used by a run: levels added to every
   * rival's, and relics handed to the rival at a match.
   */
  levelShift?: number;
  rivalRelics?: (rivalId: string, matchIndex: number) => string[];
}

export interface Gauntlet {
  matches: GauntletMatch[];
  /** The run as it ended, for what it pays and what it unlocks. */
  run: RunState;
}

/** The rarer a card, the sooner a stand-in takes it back. */
function rarest(cards: readonly string[]): string | null {
  return (
    [...cards].sort(
      (a, b) =>
        RARITIES.indexOf(getCat(b).rarity) -
          RARITIES.indexOf(getCat(a).rarity) || a.localeCompare(b),
    )[0] ?? null
  );
}

/**
 * A whole run with a bot in the player's seat, made with the run's own
 * transitions so it cannot drift from the game: the chest, six rivals in
 * order, each on its own deck with its clan's charm, at the level the tier
 * asks, until one of them wins. The stand-in takes the first relic in the
 * chest, and after a win the rarest stolen card offered and the first relic.
 */
export function playGauntlet(config: GauntletConfig, player: Bot): Gauntlet {
  let run = startRun({
    seed: config.seed,
    ticket: config.seed,
    deck: config.deck,
    pool: config.pool,
    difficulty: config.tier,
  });
  run = takeChest(run, run.chest[0] ?? "");
  const matches: GauntletMatch[] = [];
  while (run.phase === "match") {
    const matchIndex = run.matchIndex;
    const base = matchConfig(run);
    const level = Math.min(TOP_LEVEL, base.level + (config.levelShift ?? 0));
    const count = { dry: 0 };
    const state = playMatch(
      {
        ...base,
        level,
        rival: {
          ...base.rival,
          relics:
            config.rivalRelics?.(base.rivalId, matchIndex) ?? base.rival.relics,
        },
      },
      { player, rival: botAt(level, styleOf(base.rivalId)) },
      count,
    );
    const result = state.result;
    if (!result) break;
    matches.push({
      rivalId: base.rivalId,
      level,
      player: result.player.total,
      rival: result.rival.total,
      won: result.won,
      dry: count.dry,
    });
    run = settleMatch(run, state, matchPayout);
    if (run.phase === "reward" && run.reward) {
      run = applyReward(run, {
        reclaim: rarest(run.reward.reclaim),
        relic: run.reward.relics[0] ?? null,
        trim: null,
      });
    }
  }
  return { matches, run };
}
