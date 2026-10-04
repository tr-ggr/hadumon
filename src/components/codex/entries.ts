import type { RouterOutputs } from "~/trpc/react";

/** One cat, relic or clan as `codex.get` reports it. */
export type CodexEntry = RouterOutputs["codex"]["get"]["cats"][number];

/** What a locked entry shows in place of its rules. */
export function lockedText(entry: CodexEntry): string {
  return entry.hint ? `Locked. ${entry.hint}` : "Locked.";
}

export function countUnlocked(entries: readonly CodexEntry[]): number {
  return entries.filter((entry) => entry.unlocked).length;
}

/** "18 of 26", the way every codex count is written. */
export function progressText(entries: readonly CodexEntry[]): string {
  return `${countUnlocked(entries)} of ${entries.length}`;
}
