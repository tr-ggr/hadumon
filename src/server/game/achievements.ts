/**
 * Achievements: what an account has done over all its runs, each paid in
 * coins once, the first time it holds. Unlike an unlock (`unlocks.ts`),
 * which looks at one run, every rule here reads the account's career, so a
 * run played before achievements existed still counts towards them. Coins
 * are only ever earned by playing: an achievement is a thing done at the
 * table or with what the table paid.
 */

import { CAT_LIST } from "./cats";
import { isAtLeast, DIFFICULTIES, type DifficultyId } from "./difficulty";
import { ELEMENTS, type Element } from "./elements";
import { GAUNTLET } from "./rival";
import type { RunSummary } from "./run";
import { ELEMENT_DECK, HIGH_SCORE, TOP_SCORE } from "./unlocks";

/** The run score, summed over its matches, one achievement asks for. */
export const RUN_SCORE = 400;
/** Stolen cards a run can take back at most: one after every win but the last. */
export const MAX_RECLAIMED = GAUNTLET.length - 1;

/** What one finished run adds to a career. */
export type CareerRun = Pick<
  RunSummary,
  | "difficulty"
  | "matchesWon"
  | "matchesPlayed"
  | "won"
  | "bestMatchScore"
  | "totalScore"
  | "deckElements"
  | "goalsSwept"
  | "reclaimed"
>;

/** What an account has besides its runs, as the shop and the cupboard count it. */
export interface CareerExtras {
  /** Different cats owned, the starter collection's included. */
  catsOwned: number;
  packsOpened: number;
  /** Cosmetics gained; the free ones are not counted. */
  cosmeticsOwned: number;
}

export interface CareerStats extends CareerExtras {
  runsFinished: number;
  runsWon: number;
  /** Runs won on each tier exactly. */
  runsWonOn: Record<DifficultyId, number>;
  matchesWon: number;
  matchesPlayed: number;
  bestMatch: number;
  bestRun: number;
  /** The most matches one run won. */
  mostWins: number;
  /** Matches in which every round goal went to the player. */
  sweeps: number;
  /** The most stolen cards one run took back. */
  mostReclaimed: number;
  /** True once a run was won with half a deck's worth of one element. */
  elementRunWon: boolean;
}

const NO_TIERS = (): Record<DifficultyId, number> =>
  Object.fromEntries(DIFFICULTIES.map((id) => [id, 0])) as Record<
    DifficultyId,
    number
  >;

function builtOn(elements: Record<Element, number>): boolean {
  return ELEMENTS.some((element) => (elements[element] ?? 0) >= ELEMENT_DECK);
}

/** The career a list of finished runs and an account's holdings add up to. */
export function careerOf(
  runs: readonly CareerRun[],
  extras: CareerExtras,
): CareerStats {
  const stats: CareerStats = {
    ...extras,
    runsFinished: runs.length,
    runsWon: 0,
    runsWonOn: NO_TIERS(),
    matchesWon: 0,
    matchesPlayed: 0,
    bestMatch: 0,
    bestRun: 0,
    mostWins: 0,
    sweeps: 0,
    mostReclaimed: 0,
    elementRunWon: false,
  };
  for (const run of runs) {
    if (run.won) {
      stats.runsWon += 1;
      stats.runsWonOn[run.difficulty] += 1;
      if (builtOn(run.deckElements)) stats.elementRunWon = true;
    }
    stats.matchesWon += run.matchesWon;
    stats.matchesPlayed += run.matchesPlayed;
    stats.bestMatch = Math.max(stats.bestMatch, run.bestMatchScore);
    stats.bestRun = Math.max(stats.bestRun, run.totalScore);
    stats.mostWins = Math.max(stats.mostWins, run.matchesWon);
    stats.sweeps += run.goalsSwept;
    stats.mostReclaimed = Math.max(stats.mostReclaimed, run.reclaimed);
  }
  return stats;
}

/** Runs won on `tier` or a harder one. */
function wonAtLeast(stats: CareerStats, tier: DifficultyId): number {
  return DIFFICULTIES.filter((id) => isAtLeast(id, tier)).reduce(
    (sum, id) => sum + stats.runsWonOn[id],
    0,
  );
}

export interface Achievement {
  key: string;
  name: string;
  /** What to do, in one line; shown whether it is held or not. */
  hint: string;
  /** Paid once, the first time it holds. */
  coins: number;
}

export interface AchievementRule extends Achievement {
  test(stats: CareerStats): boolean;
}

/**
 * Coins are set against a cat pack (100): a small one is a quarter of a
 * pack, the hardest three packs.
 */
export const ACHIEVEMENTS: readonly AchievementRule[] = [
  {
    key: "first-win",
    name: "First paw forward",
    hint: "Win a match.",
    coins: 25,
    test: (s) => s.matchesWon >= 1,
  },
  {
    key: "past-mittens",
    name: "Past the Madame",
    hint: "Beat Madame Mittens.",
    coins: 50,
    test: (s) => s.mostWins >= 3,
  },
  {
    key: "nine-lives",
    name: "Audience with Nine Lives",
    hint: "Reach Old Nine Lives.",
    coins: 75,
    test: (s) => s.mostWins >= 5,
  },
  {
    key: "run-won",
    name: "Top of the tower",
    hint: "Win a run.",
    coins: 100,
    test: (s) => s.runsWon >= 1,
  },
  {
    key: "stray-won",
    name: "Street credentials",
    hint: "Win a run on Stray or harder.",
    coins: 150,
    test: (s) => wonAtLeast(s, "stray") >= 1,
  },
  {
    key: "apex-won",
    name: "Apex",
    hint: "Win a run on Apex.",
    coins: 300,
    test: (s) => wonAtLeast(s, "apex") >= 1,
  },
  {
    key: "runs-won-5",
    name: "Habit",
    hint: "Win 5 runs.",
    coins: 150,
    test: (s) => s.runsWon >= 5,
  },
  {
    key: "runs-won-25",
    name: "Landlord",
    hint: "Win 25 runs.",
    coins: 300,
    test: (s) => s.runsWon >= 25,
  },
  {
    key: "matches-won-25",
    name: "Regular",
    hint: "Win 25 matches.",
    coins: 50,
    test: (s) => s.matchesWon >= 25,
  },
  {
    key: "matches-won-100",
    name: "Part of the furniture",
    hint: "Win 100 matches.",
    coins: 150,
    test: (s) => s.matchesWon >= 100,
  },
  {
    key: "runs-10",
    name: "Ten climbs",
    hint: "Finish 10 runs, however they end.",
    coins: 25,
    test: (s) => s.runsFinished >= 10,
  },
  {
    key: "runs-50",
    name: "Knows the stairs",
    hint: "Finish 50 runs, however they end.",
    coins: 100,
    test: (s) => s.runsFinished >= 50,
  },
  {
    key: "high-score",
    name: "Showing off",
    hint: `Score ${HIGH_SCORE} in a single match.`,
    coins: 50,
    test: (s) => s.bestMatch >= HIGH_SCORE,
  },
  {
    key: "top-score",
    name: "Insufferable",
    hint: `Score ${TOP_SCORE} in a single match.`,
    coins: 100,
    test: (s) => s.bestMatch >= TOP_SCORE,
  },
  {
    key: "run-score",
    name: "Long tally",
    hint: `Score ${RUN_SCORE} over one run.`,
    coins: 100,
    test: (s) => s.bestRun >= RUN_SCORE,
  },
  {
    key: "sweep",
    name: "Clean sweep",
    hint: "Take every round goal in a match.",
    coins: 25,
    test: (s) => s.sweeps >= 1,
  },
  {
    key: "sweeps-10",
    name: "Tidy",
    hint: "Take every round goal in 10 matches.",
    coins: 75,
    test: (s) => s.sweeps >= 10,
  },
  {
    key: "reclaim-all",
    name: "Lost and found",
    hint: `Take back ${MAX_RECLAIMED} stolen cards in one run.`,
    coins: 50,
    test: (s) => s.mostReclaimed >= MAX_RECLAIMED,
  },
  {
    key: "one-element",
    name: "Single-minded",
    hint: `Win a run with ${ELEMENT_DECK} or more cats of one element in your deck.`,
    coins: 100,
    test: (s) => s.elementRunWon,
  },
  {
    key: "cats-50",
    name: "Cat person",
    hint: "Own 50 different cats.",
    coins: 75,
    test: (s) => s.catsOwned >= 50,
  },
  {
    key: "cats-all",
    name: "Every last one",
    hint: `Own all ${CAT_LIST.length} cats.`,
    coins: 300,
    test: (s) => s.catsOwned >= CAT_LIST.length,
  },
  {
    key: "packs-10",
    name: "Ten packs",
    hint: "Open 10 packs.",
    coins: 25,
    test: (s) => s.packsOpened >= 10,
  },
  {
    key: "packs-50",
    name: "Cardboard enthusiast",
    hint: "Open 50 packs.",
    coins: 100,
    test: (s) => s.packsOpened >= 50,
  },
  {
    key: "wardrobe-10",
    name: "Dressed for it",
    hint: "Own 10 cosmetics.",
    coins: 50,
    test: (s) => s.cosmeticsOwned >= 10,
  },
];

const BY_KEY: ReadonlyMap<string, AchievementRule> = new Map(
  ACHIEVEMENTS.map((rule) => [rule.key, rule]),
);

export function isAchievementKey(key: string): boolean {
  return BY_KEY.has(key);
}

export function getAchievement(key: string): Achievement {
  const rule = BY_KEY.get(key);
  if (!rule) throw new Error(`Unknown achievement: ${key}`);
  return {
    key: rule.key,
    name: rule.name,
    hint: rule.hint,
    coins: rule.coins,
  };
}

/** The achievements a career holds that the account has not been paid for. */
export function earnedAchievements(
  stats: CareerStats,
  held: readonly string[],
): Achievement[] {
  const have = new Set(held);
  return ACHIEVEMENTS.filter(
    (rule) => !have.has(rule.key) && rule.test(stats),
  ).map((rule) => getAchievement(rule.key));
}
