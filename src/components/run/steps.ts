import type { RewardOffer } from "~/server/game/run";
import type { Unlock } from "~/server/game/unlocks";
import type { RunView } from "~/server/game/view";

/** The screens after a match is won, in the order they are shown. */
export type RewardStep = "result" | "cat" | "relic" | "trim" | "recap";
/** The screens after a run has ended, in the order they are shown. */
export type SummaryStep = "result" | "unlocks" | "summary";

/**
 * A step is there only when it has something on it: no relic step in a
 * match that pays no relic, no trim step for a deck at its floor. The recap
 * always closes the list, because it holds the one confirm.
 */
export function rewardSteps(
  offer: RewardOffer,
  hasResult: boolean,
): RewardStep[] {
  const steps: RewardStep[] = [];
  if (hasResult) steps.push("result");
  if (offer.cats.length > 0) steps.push("cat");
  if (offer.relics.length > 0) steps.push("relic");
  if (offer.canTrim) steps.push("trim");
  steps.push("recap");
  return steps;
}

/**
 * An abandoned run has no last match to show, and a run that unlocked
 * nothing has no unlocks screen: it would be a click through nothing.
 */
export function summarySteps(
  view: RunView,
  unlocked: readonly Unlock[],
): SummaryStep[] {
  const steps: SummaryStep[] = [];
  if (view.outcome !== "abandoned" && view.match?.result) steps.push("result");
  if (unlocked.length > 0) steps.push("unlocks");
  steps.push("summary");
  return steps;
}
