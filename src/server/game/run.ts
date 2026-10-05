/**
 * Run state: one gauntlet attempt. Stored as jsonb on the `runs` row.
 *
 * A run is played with the deck its player built. It opens with eight of
 * the deck's 24 cards stolen and a chest of three relics to take one from,
 * and then it is six matches against the rivals in `GAUNTLET`, each on a
 * deck of its own and played by the bot at the level the tier asks. The
 * board resets every match; the player's deck and relics carry through.
 * Winning a match takes one stolen card back, losing one ends the run. Like
 * the match engine, every function here is pure and returns a new state.
 */

import { rivalPolicy } from "./bot";
import { getCat } from "./cats";
import { DECK_SIZE, STOLEN } from "./deck";
import { difficultyOf, rivalLevel, type DifficultyId } from "./difficulty";
import { advance, openMatch } from "./duel";
import { ELEMENTS, type Element } from "./elements";
import {
  IllegalAction,
  type Action,
  type MatchConfig,
  type MatchEvent,
  type MatchState,
} from "./match";
import { getRelic } from "./relics";
import { GAUNTLET } from "./rival";
import { rivalDeck, rivalRelics } from "./rivalDecks";
import { createRng } from "./rng";

/**
 * The shape of a stored run. A run saved under an older one cannot be read
 * by this game; it is closed as abandoned (`retireRun`).
 */
export const RUN_VERSION = 3;

/**
 * A deck can be trimmed down to this many cards and no further: the size a
 * run starts at. Measured, a deck of 16 already finds nothing to draw about
 * three times a match by its end; a thinner one would only stall sooner.
 */
export const MIN_DECK = DECK_SIZE - STOLEN;
/** Stolen cards a win offers, to take one back. */
export const REWARD_RECLAIM = 3;
export const REWARD_RELICS = 3;
/** Relics in the chest a run opens with, to take one. */
export const CHEST_RELICS = 3;
/**
 * A clan charm pays for its element's cats, so one is only put in the chest
 * of a deck that holds at least this many of them.
 */
export const CHARM_CATS = 6;

/** What the account held when the run began. */
export interface RunPool {
  /** Every cat it owned a copy of; a rival's deck is drawn from these. */
  cats: string[];
  /** Every relic it had unlocked; the chest and the rewards offer these. */
  relics: string[];
}

export interface RewardOffer {
  /** Up to three of the cards still stolen, each a different cat. */
  reclaim: string[];
  /** Empty unless a relic is due: after matches 1, 3 and 5. */
  relics: string[];
  canTrim: boolean;
}

export interface RewardChoice {
  /** One of the offered stolen cards, or `null` to leave them. */
  reclaim: string | null;
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
  /** Round goals the player took the higher share of. */
  goalsWon: number;
  /** Round goals the match had. */
  goals: number;
}

export type RunPhase = "chest" | "match" | "reward" | "over";
export type RunOutcome = "won" | "lost" | "abandoned";

export interface RunState {
  v: typeof RUN_VERSION;
  seed: string;
  difficulty: DifficultyId;
  pool: RunPool;
  /** The deck as its player built it: all 24 cards, sorted. */
  built: string[];
  /** The cards of it the rivals still hold. */
  stolen: string[];
  /** The cards the run is played with. */
  deck: string[];
  relics: string[];
  /** The relics the opening chest holds. */
  chest: string[];
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
  /**
   * What the chest and the theft are drawn from. An account's ticket only
   * changes once a run of its has finished a match, so giving a run up at
   * the chest and starting again deals the same chest and the same theft.
   */
  ticket: string;
  /** The deck the player built: legal, as `validateDeck` has it. */
  deck: readonly string[];
  pool: RunPool;
  /** Kitten if left out. */
  difficulty?: DifficultyId;
}

/** How many cats of each element a deck holds. */
export function deckElements(deck: readonly string[]): Record<Element, number> {
  const counts = Object.fromEntries(ELEMENTS.map((e) => [e, 0])) as Record<
    Element,
    number
  >;
  for (const catId of deck) counts[getCat(catId).element] += 1;
  return counts;
}

/** The cards of a built deck the rivals make off with. */
export function theft(built: readonly string[], ticket: string): string[] {
  return createRng(`${ticket}:theft`)
    .shuffle([...built].sort())
    .slice(0, STOLEN)
    .sort();
}

/** `cards` with one copy of each of `taken` removed. */
function without(cards: readonly string[], taken: readonly string[]) {
  const left = [...cards];
  for (const catId of taken) {
    const index = left.indexOf(catId);
    if (index >= 0) left.splice(index, 1);
  }
  return left;
}

/**
 * The three relics in a run's chest, from the ones the account has
 * unlocked. A charm for an element the deck is thin in is left out, unless
 * there are too few relics without it.
 */
export function chestOffer(
  relics: readonly string[],
  built: readonly string[],
  ticket: string,
): string[] {
  const elements = deckElements(built);
  const fits = (relicId: string) => {
    const score = getRelic(relicId).score;
    return score?.per !== "element" || elements[score.element] >= CHARM_CATS;
  };
  const shuffled = createRng(`${ticket}:chest`).shuffle([...relics].sort());
  return [
    ...shuffled.filter(fits),
    ...shuffled.filter((relicId) => !fits(relicId)),
  ].slice(0, CHEST_RELICS);
}

/** The match a run is at, as the engine is asked for it. */
export function matchConfig(run: RunState): MatchConfig {
  const rivalId = GAUNTLET[run.matchIndex];
  if (!rivalId) throw new Error(`No rival for match ${run.matchIndex}`);
  return {
    seed: `${run.seed}:m${run.matchIndex}`,
    rivalId,
    level: rivalLevel(run.matchIndex, run.difficulty),
    player: { deck: run.deck, relics: run.relics },
    rival: {
      deck: rivalDeck(rivalId, run.matchIndex, run.pool.cats, run.built),
      relics: rivalRelics(rivalId),
    },
  };
}

/** The run with its match dealt, the rival's opening hand already kept. */
function withMatch(run: RunState): RunState {
  return { ...run, match: openMatch(matchConfig(run), rivalPolicy).state };
}

/** A new run, stopped at its chest: no match is dealt until a relic is taken. */
export function startRun(config: RunConfig): RunState {
  const built = [...config.deck].sort();
  const stolen = theft(built, config.ticket);
  return {
    v: RUN_VERSION,
    seed: config.seed,
    difficulty: difficultyOf(config.difficulty).id,
    pool: { cats: [...config.pool.cats], relics: [...config.pool.relics] },
    built,
    stolen,
    deck: without(built, stolen),
    relics: [],
    chest: chestOffer(config.pool.relics, built, config.ticket),
    matchIndex: 0,
    phase: "chest",
    match: null,
    reward: null,
    results: [],
    outcome: null,
  };
}

/**
 * Takes one relic from the chest, which is what a run starts with. No match
 * is dealt: `openChest` is this and the first match.
 */
export function takeChest(run: RunState, relicId: string): RunState {
  if (run.phase !== "chest") {
    throw new IllegalAction("There is no chest to open.");
  }
  if (!run.chest.includes(relicId)) {
    throw new IllegalAction("That relic is not in the chest.");
  }
  return { ...run, relics: [relicId], phase: "match" };
}

/** Takes a relic from the chest and deals the first match. */
export function openChest(run: RunState, relicId: string): RunState {
  return withMatch(takeChest(run, relicId));
}

/** True if a stored run is one this game can read. */
export function isCurrentRun(stored: unknown): stored is RunState {
  return (
    typeof stored === "object" &&
    stored !== null &&
    (stored as { v?: unknown }).v === RUN_VERSION
  );
}

const NO_ELEMENTS = deckElements([]);

/**
 * What a run saved by an older game comes to when it is closed: abandoned,
 * with the matches it had won still counting. Only the fields every version
 * has written are read.
 */
export function retireRun(stored: unknown): RunSummary {
  const old = (stored ?? {}) as Partial<
    Pick<RunState, "difficulty" | "results">
  >;
  const results = Array.isArray(old.results) ? old.results : [];
  return {
    difficulty: difficultyOf(old.difficulty).id,
    matchesWon: results.filter((r) => r?.won === true).length,
    matchesPlayed: results.length,
    won: false,
    bestMatchScore: Math.max(0, ...results.map((r) => Number(r?.player) || 0)),
    totalScore: results.reduce((sum, r) => sum + (Number(r?.player) || 0), 0),
    deckElements: NO_ELEMENTS,
    goalsSwept: 0,
    reclaimed: 0,
  };
}

/** A relic is offered after every other win, starting with the first. */
export function relicDue(matchIndex: number): boolean {
  return matchIndex % 2 === 0;
}

export function makeOffer(run: RunState): RewardOffer {
  const rng = createRng(`${run.seed}:reward:${run.matchIndex}`);
  const reclaim = rng
    .shuffle([...new Set(run.stolen)].sort())
    .slice(0, REWARD_RECLAIM);
  const relics = relicDue(run.matchIndex)
    ? rng
        .shuffle(run.pool.relics.filter((id) => !run.relics.includes(id)))
        .slice(0, REWARD_RELICS)
    : [];
  return { reclaim, relics, canTrim: run.deck.length > MIN_DECK };
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
 * A run once its match is over: the result goes on the record, and the run
 * ends on a loss or on the last win, or opens a reward.
 */
export function settleMatch(run: RunState, state: MatchState): RunState {
  const result = state.result;
  if (state.phase !== "over" || !result) return { ...run, match: state };
  const next: RunState = {
    ...run,
    match: state,
    results: [
      ...run.results,
      {
        rivalId: state.rivalId,
        player: result.player.total,
        rival: result.rival.total,
        won: result.won,
        goalsWon: state.goalResults.filter(
          (goal) => goal.playerPoints > goal.rivalPoints,
        ).length,
        goals: state.goalResults.length,
      },
    ],
  };
  if (!result.won) {
    next.phase = "over";
    next.outcome = "lost";
  } else if (run.matchIndex >= GAUNTLET.length - 1) {
    next.phase = "over";
    next.outcome = "won";
  } else {
    next.phase = "reward";
    next.reward = makeOffer(next);
  }
  return next;
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
  return { run: settleMatch(run, state), events, trail };
}

/**
 * What a reward does to a run: a stolen card comes back, a relic is taken,
 * a card is trimmed, and the run moves to its next match. No match is
 * dealt: `chooseReward` is this and the match.
 */
export function applyReward(run: RunState, choice: RewardChoice): RunState {
  const offer = run.reward;
  if (run.phase !== "reward" || !offer) {
    throw new IllegalAction("There is no reward to choose.");
  }
  if (choice.reclaim !== null && !offer.reclaim.includes(choice.reclaim)) {
    throw new IllegalAction("That card was not offered.");
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
  if (choice.reclaim !== null) deck.push(choice.reclaim);

  return {
    ...run,
    deck,
    stolen:
      choice.reclaim !== null
        ? without(run.stolen, [choice.reclaim])
        : run.stolen,
    relics: choice.relic !== null ? [...run.relics, choice.relic] : run.relics,
    matchIndex: run.matchIndex + 1,
    phase: "match",
    match: null,
    reward: null,
  };
}

export function chooseReward(run: RunState, choice: RewardChoice): RunState {
  return withMatch(applyReward(run, choice));
}

export function abandonRun(run: RunState): RunState {
  if (run.phase === "over") throw new IllegalAction("The run is already over.");
  return { ...run, phase: "over", outcome: "abandoned", reward: null };
}

/** The facts about a run that unlock rules, coins and the `runs` row read. */
export interface RunSummary {
  difficulty: DifficultyId;
  matchesWon: number;
  /** Matches finished, the lost one included. */
  matchesPlayed: number;
  won: boolean;
  bestMatchScore: number;
  totalScore: number;
  /** How many cats of each element the deck was built with. */
  deckElements: Record<Element, number>;
  /** Matches in which every round goal went to the player. */
  goalsSwept: number;
  /** Stolen cards taken back. */
  reclaimed: number;
}

export function summarizeRun(run: RunState): RunSummary {
  return {
    difficulty: difficultyOf(run.difficulty).id,
    matchesWon: run.results.filter((r) => r.won).length,
    matchesPlayed: run.results.length,
    won: run.outcome === "won",
    bestMatchScore: Math.max(0, ...run.results.map((r) => r.player)),
    totalScore: run.results.reduce((sum, r) => sum + r.player, 0),
    deckElements: deckElements(run.built),
    goalsSwept: run.results.filter((r) => r.goals > 0 && r.goalsWon === r.goals)
      .length,
    reclaimed: Math.max(
      0,
      Math.min(STOLEN, run.built.length) - run.stolen.length,
    ),
  };
}
