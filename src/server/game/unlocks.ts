/**
 * Unlocks: the only thing that persists between runs. Each rule is checked
 * against the summary of a finished run; nothing here makes a run easier, it
 * only widens what a run can offer.
 */

import { isAtLeast, type DifficultyId } from "./difficulty";
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

/**
 * The two scores an unlock asks for. They were measured against the rivals
 * as they play now: a careful player on a new account reaches the first in
 * about two runs of five and the second in about one of fifty.
 */
export const HIGH_SCORE = 38;
export const TOP_SCORE = 45;

const wins = (n: number) => (run: RunSummary) => run.matchesWon >= n;
const scored = (n: number) => (run: RunSummary) => run.bestMatchScore >= n;
const won = (run: RunSummary) => run.won;
/** Holds only for a run on `tier` or a harder one. */
const atLeast =
  (tier: DifficultyId, test: (run: RunSummary) => boolean) =>
  (run: RunSummary) =>
    isAtLeast(run.difficulty, tier) && test(run);

/**
 * Open on a new account: one clan, fifteen cats and ten relics. The cats are
 * the two commons and the uncommon each clan's starting deck is made of,
 * written out so that a cat added to the catalogue is not opened by it. The
 * rest of the catalogue has no rule here yet: those cats are to come in packs.
 */
export const STARTING_UNLOCKS: Unlock[] = [
  { kind: "clan", key: "flame" },
  ...[
    "flameclaw",
    "emberkit",
    "cinderpounce",
    "mistpaw",
    "dewhisker",
    "brumefang",
    "voltwhisk",
    "sparkmew",
    "joltpad",
    "thornkit",
    "bramblepaw",
    "burrfang",
    "shadewhisker",
    "duskmew",
    "gloomtail",
  ].map((key): Unlock => ({ kind: "cat", key })),
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
    hint: "Win a run with the Dusk Clan.",
    test: (run) => run.won && run.clanId === "shade",
  },
  {
    kind: "cat",
    key: "aurelynx",
    hint: "Win a run with the Static Clan.",
    test: (run) => run.won && run.clanId === "volt",
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

export function poolFromUnlocks(held: readonly Unlock[]): RunPool {
  const keys = (kind: UnlockKind) =>
    held.filter((unlock) => unlock.kind === kind).map((unlock) => unlock.key);
  return { cats: keys("cat"), relics: keys("relic") };
}
