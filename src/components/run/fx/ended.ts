/**
 * Which match ended a moment ago, on this page. The table notes it as the
 * last turn lands; the result sheet that follows reads it to know whether
 * to count its score up. Nothing is stored, so a reload finds no match here
 * and the sheet is simply shown.
 */

import type { MatchView } from "~/server/game/view";

let ended: string | null = null;

function key(match: Pick<MatchView, "rivalId" | "step">): string {
  return `${match.rivalId}:${match.step}`;
}

export function markEnded(match: Pick<MatchView, "rivalId" | "step">): void {
  ended = key(match);
}

export function justEnded(match: Pick<MatchView, "rivalId" | "step">): boolean {
  return ended === key(match);
}

/** The sheet has been shown; coming back to it does not count it up again. */
export function clearEnded(): void {
  ended = null;
}
