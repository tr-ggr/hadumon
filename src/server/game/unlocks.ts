/**
 * Unlocks: the prizes for what a run did, each paid once. A relic's rule
 * opens that relic for every chest and reward after it. A cat's rule hands
 * over one copy of the cat, which can also be found in a pack. Each rule is
 * checked against the summary of a finished run; none makes a run easier.
 */

import { isAtLeast, type DifficultyId } from "./difficulty";
import { ownedIds, STARTER_COLLECTION } from "./collection";
import type { RunPool, RunSummary } from "./run";

export const UNLOCK_KINDS = ["cat", "relic"] as const;
export type UnlockKind = (typeof UNLOCK_KINDS)[number];

export interface Unlock {
  kind: UnlockKind;
  key: string;
}

export interface UnlockRule extends Unlock {
  /** Shown in the codex while the entry is still locked. */
  hint: string;
  test(run: RunSummary): boolean;
}

/**
 * The two scores an unlock asks for. They were measured against the rivals
 * as they play now, over four rounds: a careful player on a new account
 * reaches the first in about two runs of five and the second in about one
 * of fifty.
 */
export const HIGH_SCORE = 76;
export const TOP_SCORE = 87;

/** Cats of one element a deck needs to count as built on it: half of it. */
export const ELEMENT_DECK = 12;

const wins = (n: number) => (run: RunSummary) => run.matchesWon >= n;
const scored = (n: number) => (run: RunSummary) => run.bestMatchScore >= n;
const won = (run: RunSummary) => run.won;
/** Holds only for a run on `tier` or a harder one. */
const atLeast =
  (tier: DifficultyId, test: (run: RunSummary) => boolean) =>
  (run: RunSummary) =>
    isAtLeast(run.difficulty, tier) && test(run);

/**
 * Open on a new account: ten relics. Its cats are its starter collection
 * (`collection.ts`), which is not an unlock.
 */
export const STARTING_UNLOCKS: Unlock[] = [
  ...[
    "ember-charm",
    "tide-charm",
    "spark-charm",
    "briar-charm",
    "dusk-charm",
    "warm-saucer",
    "ball-of-twine",
    "bent-whisker",
    "night-map",
    "soft-landing",
  ].map((key): Unlock => ({ kind: "relic", key })),
];

export const UNLOCK_RULES: UnlockRule[] = [
  { kind: "cat", key: "nimbustail", hint: "Win a match.", test: wins(1) },
  {
    kind: "cat",
    key: "pyrelynx",
    hint: "Win 2 matches in one run.",
    test: wins(2),
  },
  { kind: "cat", key: "arcpurr", hint: "Beat Madame Mittens.", test: wins(3) },
  {
    kind: "cat",
    key: "umbralynx",
    hint: "Win 4 matches in one run.",
    test: wins(4),
  },
  {
    kind: "cat",
    key: "verdantmane",
    hint: `Score ${HIGH_SCORE} in a single match.`,
    test: scored(HIGH_SCORE),
  },
  {
    kind: "cat",
    key: "oraclemew",
    hint: "Reach Old Nine Lives.",
    test: wins(5),
  },
  {
    kind: "cat",
    key: "infernomane",
    hint: `Score ${TOP_SCORE} in a single match.`,
    test: scored(TOP_SCORE),
  },
  {
    kind: "cat",
    key: "stormsabre",
    hint: "Win a run.",
    test: won,
  },
  {
    kind: "cat",
    key: "nyxaroth",
    hint: `Win a run with ${ELEMENT_DECK} or more Shade cats in your deck.`,
    test: (run) => run.won && run.deckElements.shade >= ELEMENT_DECK,
  },
  {
    kind: "cat",
    key: "aurelynx",
    hint: `Win a run with ${ELEMENT_DECK} or more Volt cats in your deck.`,
    test: (run) => run.won && run.deckElements.volt >= ELEMENT_DECK,
  },
  {
    kind: "cat",
    key: "hadu",
    hint: "Win a run on Apex.",
    test: atLeast("apex", won),
  },

  { kind: "relic", key: "early-riser", hint: "Win a match.", test: wins(1) },
  {
    kind: "relic",
    key: "hoarders-basket",
    hint: `Score ${HIGH_SCORE} in a single match.`,
    test: scored(HIGH_SCORE),
  },
  {
    kind: "relic",
    key: "lucky-collar",
    hint: "Beat Madame Mittens.",
    test: wins(3),
  },
  {
    kind: "relic",
    key: "loud-bell",
    hint: "Beat Madame Mittens on Stray or harder.",
    test: atLeast("stray", wins(3)),
  },
  {
    kind: "relic",
    key: "quiet-corner",
    hint: "Win a run on Stray or harder.",
    test: atLeast("stray", won),
  },
];

export function unlockId(unlock: Unlock): string {
  return `${unlock.kind}:${unlock.key}`;
}

/** The rules this run satisfies that the player does not already hold. */
export function earnedUnlocks(
  run: RunSummary,
  held: readonly Unlock[],
): Unlock[] {
  const have = new Set(held.map(unlockId));
  return UNLOCK_RULES.filter(
    (rule) => !have.has(unlockId(rule)) && rule.test(run),
  ).map(({ kind, key }) => ({ kind, key }));
}

/** The relics an account has unlocked. */
export function relicsFromUnlocks(held: readonly Unlock[]): string[] {
  return held
    .filter((unlock) => unlock.kind === "relic")
    .map((unlock) => unlock.key);
}

/** What a run on a new account can draw on: its starter cats and relics. */
export function startingPool(): RunPool {
  return {
    cats: ownedIds(STARTER_COLLECTION),
    relics: relicsFromUnlocks(STARTING_UNLOCKS),
  };
}
