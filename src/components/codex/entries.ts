import type { RouterOutputs } from "~/trpc/react";

/** One cat or relic as `codex.get` reports it. */
export type CodexEntry = RouterOutputs["codex"]["get"]["cats"][number];

/** What an entry the account does not hold shows in place of its rules. */
export function lockedText(entry: CodexEntry): string {
  const state = entry.copies === null ? "Locked." : "Not owned.";
  return entry.hint ? `${state} ${entry.hint}` : state;
}

/** "2 of 3": the copies of a cat an account owns, out of the most it can. */
export function copiesText(entry: CodexEntry): string | null {
  return entry.copies === null || entry.cap === null
    ? null
    : `${entry.copies} of ${entry.cap}`;
}

export function countUnlocked(entries: readonly CodexEntry[]): number {
  return entries.filter((entry) => entry.unlocked).length;
}

/** "18 of 26", the way every codex count is written. */
export function progressText(entries: readonly CodexEntry[]): string {
  return `${countUnlocked(entries)} of ${entries.length}`;
}
