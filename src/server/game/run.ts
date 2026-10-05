/**
 * Run state: one gauntlet attempt. Stored as jsonb on the `runs` row.
 *
 * A run is six matches against the rivals in `GAUNTLET`, each on its own
 * deck and played by the bot at the level the tier asks. The board resets
 * every match; the player's deck and relics carry through. Winning a match opens a
 * reward, losing one ends the run. Like the match engine, every function here
 * is pure and returns a new state.
 */

import { rivalPolicy } from "./bot";
import { getCat, type Rarity } from "./cats";
import { CLANS, starterDeck } from "./clans";
import { difficultyOf, rivalLevel, type DifficultyId } from "./difficulty";
import { advance, openMatch } from "./duel";
import type { Element } from "./elements";
import {
  IllegalAction,
  type Action,
  type MatchEvent,
  type MatchState,
} from "./match";
import { GAUNTLET } from "./rival";
import { rivalDeck, rivalRelics } from "./rivalDecks";
import { createRng, type Rng } from "./rng";

export { CLAN_LIST, CLANS, isClanId, starterDeck, type Clan } from "./clans";

/**
 * The shape of a stored run. A run saved under an older one cannot be read
 * by this game; it is closed as abandoned (`retireRun`).
 */
export const RUN_VERSION = 2;

/** A deck can be trimmed down to this many cards and no further. */
export const MIN_DECK = 12;
export const REWARD_CATS = 3;
export const REWARD_RELICS = 3;

/** What rewards can be offered: the player's unlocks when the run began. */
export interface RunPool {
  cats: string[];
  relics: string[];
}

export interface RewardOffer {
  cats: string[];
  /** Empty unless a relic is due: after matches 1, 3 and 5. */
  relics: string[];
  canTrim: boolean;
}

export interface RewardChoice {
  /** One of the offered cats, or `null` to skip. */
  cat: string | null;
  /** One of the offered relics, or `null` to skip. */
  relic: string | null;
  /** A cat id to remove one copy of from the deck, or `null`. */
  trim: string | null;
}

export interface MatchRecord {
  rivalId: string;
  player: number;
  rival: number;
  won: boolean;
}

export type RunPhase = "match" | "reward" | "over";
export type RunOutcome = "won" | "lost" | "abandoned";

export interface RunState {
  v: typeof RUN_VERSION;
  seed: string;
  clanId: Element;
  /** Missing on a run saved before tiers existed, which is a Kitten run. */
  difficulty?: DifficultyId;
  pool: RunPool;
  deck: string[];
  relics: string[];
  /** Index into `GAUNTLET` of the current (or next) match. */
  matchIndex: number;
  phase: RunPhase;
  match: MatchState | null;
  reward: RewardOffer | null;
  results: MatchRecord[];
  outcome: RunOutcome | null;
}

export interface RunConfig {
  seed: string;
  clanId: Element;
  pool: RunPool;
  /** Kitten if left out. */
  difficulty?: DifficultyId;
}

function matchFor(run: RunState): MatchState {
  const rivalId = GAUNTLET[run.matchIndex];
  if (!rivalId) throw new Error(`No rival for match ${run.matchIndex}`);
  // The rival keeps its opening hand as the match is dealt.
  return openMatch(
    {
      seed: `${run.seed}:m${run.matchIndex}`,
      rivalId,
      level: rivalLevel(run.matchIndex, run.difficulty),
      player: { deck: run.deck, relics: run.relics },
      rival: {
        deck: rivalDeck(rivalId, run.matchIndex, run.pool.cats),
        relics: rivalRelics(rivalId),
      },
    },
    rivalPolicy,
  ).state;
}

export function startRun(config: RunConfig): RunState {
  const run: RunState = {
    v: RUN_VERSION,
    seed: config.seed,
    clanId: config.clanId,
    difficulty: difficultyOf(config.difficulty).id,
    pool: { cats: [...config.pool.cats], relics: [...config.pool.relics] },
    deck: starterDeck(config.clanId),
    relics: [CLANS[config.clanId].relicId],
    matchIndex: 0,
    phase: "match",
    match: null,
    reward: null,
    results: [],
    outcome: null,
  };
  run.match = matchFor(run);
  return run;
}

/** True if a stored run is one this game can read. */
export function isCurrentRun(stored: unknown): stored is RunState {
  return (
    typeof stored === "object" &&
    stored !== null &&
    (stored as { v?: unknown }).v === RUN_VERSION
  );
}

/**
 * What a run saved by an older game comes to when it is closed: abandoned,
 * with the matches it had won still counting towards unlocks. Only the
 * fields every version has written are read.
 */
export function retireRun(stored: unknown): RunSummary {
  const old = (stored ?? {}) as Partial<
    Pick<RunState, "clanId" | "difficulty" | "results">
  >;
  const results = Array.isArray(old.results) ? old.results : [];
  return {
    clanId: old.clanId && old.clanId in CLANS ? old.clanId : "flame",
    difficulty: difficultyOf(old.difficulty).id,
    matchesWon: results.filter((r) => r?.won === true).length,
    won: false,
    bestMatchScore: Math.max(0, ...results.map((r) => Number(r?.player) || 0)),
    totalScore: results.reduce((sum, r) => sum + (Number(r?.player) || 0), 0),
  };
}

/** Chance weights of each rarity in a cat offer, by the match just won. */
const OFFER_WEIGHTS: readonly Record<Rarity, number>[] = [
  { common: 55, uncommon: 35, rare: 10, epic: 0, legendary: 0 },
  { common: 55, uncommon: 35, rare: 10, epic: 0, legendary: 0 },
  { common: 30, uncommon: 35, rare: 25, epic: 9, legendary: 1 },
  { common: 30, uncommon: 35, rare: 25, epic: 9, legendary: 1 },
  { common: 15, uncommon: 30, rare: 30, epic: 18, legendary: 7 },
];

export function offerWeights(matchIndex: number): Record<Rarity, number> {
  const weights = OFFER_WEIGHTS[Math.min(matchIndex, OFFER_WEIGHTS.length - 1)];
  if (!weights) throw new Error("No offer weights");
  return weights;
}

/** Weighted sample without replacement. */
function sample<T>(
  items: readonly T[],
  weight: (item: T) => number,
  n: number,
  rng: Rng,
): T[] {
  const left = items.filter((item) => weight(item) > 0);
  const out: T[] = [];
  while (out.length < n && left.length > 0) {
    const total = left.reduce((sum, item) => sum + weight(item), 0);
    let roll = rng.float(0, total);
    let index = left.findIndex((item) => (roll -= weight(item)) < 0);
    if (index < 0) index = left.length - 1;
    out.push(...left.splice(index, 1));
  }
  return out;
}

/** A relic is offered after every other win, starting with the first. */
export function relicDue(matchIndex: number): boolean {
  return matchIndex % 2 === 0;
}

export function makeOffer(run: RunState): RewardOffer {
  const rng = createRng(`${run.seed}:reward:${run.matchIndex}`);
  const weights = offerWeights(run.matchIndex);
  const cats = sample(
    run.pool.cats,
    (id) => weights[getCat(id).rarity],
    REWARD_CATS,
    rng,
  );
  const relics = relicDue(run.matchIndex)
    ? rng
        .shuffle(run.pool.relics.filter((id) => !run.relics.includes(id)))
        .slice(0, REWARD_RELICS)
    : [];
  return { cats, relics, canTrim: run.deck.length > MIN_DECK };
}

export interface RunActionResult {
  run: RunState;
  events: MatchEvent[];
  /**
   * The match after each action the call applied: the player's, then each
   * of the rival's. See `Advance` in `duel.ts`.
   */
  trail: MatchState[];
}

/**
 * Applies the player's action and every rival action that follows it, and
 * when the match ends, moves the run on.
 */
export function actInRun(run: RunState, action: Action): RunActionResult {
  if (run.phase !== "match" || !run.match) {
    throw new IllegalAction("There is no match in progress.");
  }
  const { state, events, trail } = advance(run.match, action, rivalPolicy);
  const next: RunState = { ...run, match: state };
  if (state.phase !== "over" || !state.result) {
    return { run: next, events, trail };
  }

  next.results = [
    ...run.results,
    {
      rivalId: state.rivalId,
      player: state.result.player.total,
      rival: state.result.rival.total,
      won: state.result.won,
    },
  ];
  if (!state.result.won) {
    next.phase = "over";
    next.outcome = "lost";
  } else if (run.matchIndex >= GAUNTLET.length - 1) {
    next.phase = "over";
    next.outcome = "won";
  } else {
    next.phase = "reward";
    next.reward = makeOffer(next);
  }
  return { run: next, events, trail };
}

export function chooseReward(run: RunState, choice: RewardChoice): RunState {
  const offer = run.reward;
  if (run.phase !== "reward" || !offer) {
    throw new IllegalAction("There is no reward to choose.");
  }
  if (choice.cat !== null && !offer.cats.includes(choice.cat)) {
    throw new IllegalAction("That cat was not offered.");
  }
  if (choice.relic !== null && !offer.relics.includes(choice.relic)) {
    throw new IllegalAction("That relic was not offered.");
  }
  const deck = [...run.deck];
  if (choice.trim !== null) {
    const index = deck.indexOf(choice.trim);
    if (!offer.canTrim || index < 0) {
      throw new IllegalAction("That card cannot be trimmed.");
    }
    deck.splice(index, 1);
  }
  if (choice.cat !== null) deck.push(choice.cat);

  const next: RunState = {
    ...run,
    deck,
    relics: choice.relic !== null ? [...run.relics, choice.relic] : run.relics,
    matchIndex: run.matchIndex + 1,
    phase: "match",
    reward: null,
  };
  next.match = matchFor(next);
  return next;
}

export function abandonRun(run: RunState): RunState {
  if (run.phase === "over") throw new IllegalAction("The run is already over.");
  return { ...run, phase: "over", outcome: "abandoned", reward: null };
}

/** The facts about a run that unlock rules and the `runs` row read. */
export interface RunSummary {
  clanId: Element;
  difficulty: DifficultyId;
  matchesWon: number;
  won: boolean;
  bestMatchScore: number;
  totalScore: number;
}

export function summarizeRun(run: RunState): RunSummary {
  return {
    clanId: run.clanId,
    difficulty: difficultyOf(run.difficulty).id,
    matchesWon: run.results.filter((r) => r.won).length,
    won: run.outcome === "won",
    bestMatchScore: Math.max(0, ...run.results.map((r) => r.player)),
    totalScore: run.results.reduce((sum, r) => sum + r.player, 0),
  };
}
