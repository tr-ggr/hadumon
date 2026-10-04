/**
 * Unlocks: the only thing that persists between runs. Each rule is checked
 * against the summary of a finished run; nothing here makes a run easier, it
 * only widens what a run can offer.
 */

import { CAT_LIST } from "./cats";
import type { RunPool, RunSummary } from "./run";

export const UNLOCK_KINDS = ["cat", "relic", "clan"] as const;
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

const wins = (n: number) => (run: RunSummary) => run.matchesWon >= n;
const scored = (n: number) => (run: RunSummary) => run.bestMatchScore >= n;

/** Open on a new account: one clan, every common and uncommon, ten relics. */
export const STARTING_UNLOCKS: Unlock[] = [
  { kind: "clan", key: "flame" },
  ...CAT_LIST.filter(
    (cat) => cat.rarity === "common" || cat.rarity === "uncommon",
  ).map((cat): Unlock => ({ kind: "cat", key: cat.id })),
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
  { kind: "clan", key: "mist", hint: "Win a match.", test: wins(1) },
  {
    kind: "clan",
    key: "volt",
    hint: "Win 2 matches in one run.",
    test: wins(2),
  },
  { kind: "clan", key: "thorn", hint: "Beat Madame Mittens.", test: wins(3) },
  { kind: "clan", key: "shade", hint: "Reach Old Nine Lives.", test: wins(5) },

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
    hint: "Score 35 in a single match.",
    test: scored(35),
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
    hint: "Score 42 in a single match.",
    test: scored(42),
  },
  {
    kind: "cat",
    key: "stormsabre",
    hint: "Win a run.",
    test: (run) => run.won,
  },
  {
    kind: "cat",
    key: "nyxaroth",
    hint: "Win a run with the Dusk Clan.",
    test: (run) => run.won && run.clanId === "shade",
  },
  {
    kind: "cat",
    key: "aurelynx",
    hint: "Win a run with the Static Clan.",
    test: (run) => run.won && run.clanId === "volt",
  },
  { kind: "cat", key: "hadu", hint: "Win a run.", test: (run) => run.won },

  { kind: "relic", key: "early-riser", hint: "Win a match.", test: wins(1) },
  {
    kind: "relic",
    key: "hoarders-basket",
    hint: "Score 35 in a single match.",
    test: scored(35),
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
    hint: "Win 4 matches in one run.",
    test: wins(4),
  },
  {
    kind: "relic",
    key: "quiet-corner",
    hint: "Win a run.",
    test: (run) => run.won,
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

export function poolFromUnlocks(held: readonly Unlock[]): RunPool {
  const keys = (kind: UnlockKind) =>
    held.filter((unlock) => unlock.kind === kind).map((unlock) => unlock.key);
  return { cats: keys("cat"), relics: keys("relic") };
}
