/**
 * Bots playing each other. Nothing in the app ships this; it exists to
 * measure the levels against one another and to prove matches end.
 */

import { getCat, RARITIES } from "../cats";
import { rivalLevel, type DifficultyId } from "../difficulty";
import { ELEMENTS, type Element } from "../elements";
import {
  createMatch,
  stepMatch,
  type MatchConfig,
  type MatchState,
  type SideId,
} from "../match";
import { GAUNTLET } from "../rival";
import { rivalDeck, rivalRelics } from "../rivalDecks";
import { createRng } from "../rng";
import {
  chooseReward,
  makeOffer,
  starterDeck,
  startRun,
  type RunPool,
} from "../run";
import { observe } from "./observe";
import { botAt, TOP_LEVEL, type Bot } from "./levels";
import { styleOf } from "./styles";

/** Plays a match to its end, each seat chosen for by its own bot. */
export function playMatch(
  config: MatchConfig,
  bots: Record<SideId, Bot>,
): MatchState {
  const state = createMatch(config);
  for (let guard = 0; guard < 600 && state.phase !== "over"; guard++) {
    const who = state.active;
    const action = bots[who](
      observe(state, who),
      createRng(`${state.seed}:${state.step}:bot`),
    );
    stepMatch(state, action);
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
}

export interface GauntletConfig {
  seed: string;
  clanId: Element;
  pool: RunPool;
  tier: DifficultyId;
  /**
   * What-ifs for measuring, never used by a run: levels added to every
   * rival's, and relics handed to the rival at a match.
   */
  levelShift?: number;
  rivalRelics?: (rivalId: string, matchIndex: number) => string[];
}

/**
 * A whole run with a bot in the player's seat: six rivals in order, each on
 * its own deck with its clan's charm, at the level the tier asks, until one
 * of them wins. After a
 * win the stand-in takes the rarest cat offered and the first relic, as a
 * run's reward screen would let it.
 */
export function playGauntlet(
  config: GauntletConfig,
  player: Bot,
): GauntletMatch[] {
  let run = startRun({
    seed: config.seed,
    clanId: config.clanId,
    pool: config.pool,
    difficulty: config.tier,
  });
  const played: GauntletMatch[] = [];
  for (const [matchIndex, rivalId] of GAUNTLET.entries()) {
    const level = Math.min(
      TOP_LEVEL,
      rivalLevel(matchIndex, config.tier) + (config.levelShift ?? 0),
    );
    const state = playMatch(
      {
        seed: `${config.seed}:m${matchIndex}`,
        rivalId,
        level,
        player: { deck: run.deck, relics: run.relics },
        rival: {
          deck: rivalDeck(rivalId, matchIndex, config.pool.cats),
          relics:
            config.rivalRelics?.(rivalId, matchIndex) ?? rivalRelics(rivalId),
        },
      },
      { player, rival: botAt(level, styleOf(rivalId)) },
    );
    const result = state.result;
    if (!result) break;
    played.push({
      rivalId,
      level,
      player: result.player.total,
      rival: result.rival.total,
      won: result.won,
    });
    if (!result.won || matchIndex === GAUNTLET.length - 1) break;

    const reward = makeOffer({ ...run, matchIndex });
    const cat = [...reward.cats].sort(
      (a, b) =>
        RARITIES.indexOf(getCat(b).rarity) - RARITIES.indexOf(getCat(a).rarity),
    )[0];
    run = chooseReward(
      { ...run, matchIndex, phase: "reward", reward },
      { cat: cat ?? null, relic: reward.relics[0] ?? null, trim: null },
    );
  }
  return played;
}
