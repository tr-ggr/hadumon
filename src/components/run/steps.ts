import type { RewardOffer } from "~/server/game/run";
import type { Unlock } from "~/server/game/unlocks";
import type { RunView } from "~/server/game/view";

/** The screens before a match's first turn, in the order they are shown. */
export type SetupStep = "rival" | "table" | "keep" | "recap";
/** The screens after a match is won, in the order they are shown. */
export type RewardStep = "result" | "reclaim" | "relic" | "trim" | "recap";
/** The screens after a run has ended, in the order they are shown. */
export type SummaryStep =
  "result" | "unlocks" | "achievements" | "coins" | "summary";

/**
 * Every match opens the same way, so the list is fixed: there is always a
 * rival to meet, a table to read and ten things to keep five of. The recap
 * closes it, because it holds the one confirm.
 */
export const SETUP_STEPS: readonly SetupStep[] = [
  "rival",
  "table",
  "keep",
  "recap",
];

/**
 * A step is there only when it has something on it: no card to take back
 * once none is stolen, no relic step in a match that pays no relic, no trim
 * step for a deck at its floor. The recap always closes the list, because
 * it holds the one confirm.
 */
export function rewardSteps(
  offer: RewardOffer,
  hasResult: boolean,
): RewardStep[] {
  const steps: RewardStep[] = [];
  if (hasResult) steps.push("result");
  if (offer.reclaim.length > 0) steps.push("reclaim");
  if (offer.relics.length > 0) steps.push("relic");
  if (offer.canTrim) steps.push("trim");
  steps.push("recap");
  return steps;
}

/**
 * An abandoned run has no last match to show, a run that unlocked nothing
 * has no unlocks screen, a run that completed no achievement has no
 * achievements screen, and a run that paid nothing has no coins to count:
 * each would be a click through nothing.
 */
export function summarySteps(
  view: RunView,
  unlocked: readonly Unlock[],
  coins = 0,
  achievements = 0,
): SummaryStep[] {
  const steps: SummaryStep[] = [];
  if (view.outcome !== "abandoned" && view.match?.result) steps.push("result");
  if (unlocked.length > 0) steps.push("unlocks");
  if (achievements > 0) steps.push("achievements");
  if (coins > 0) steps.push("coins");
  steps.push("summary");
  return steps;
}
