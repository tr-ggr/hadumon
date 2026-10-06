/** How a finished run is put into words, wherever runs are listed. */

import { GAUNTLET, getRival } from "~/server/game/rival";

export type Ending = "won" | "lost" | "abandoned";

/** How a run ended, as the colour of its tag: the player's, the rival's, nobody's. */
export const ENDING_TAG: Record<Ending, string> = {
  won: "bg-lime",
  lost: "bg-coral",
  abandoned: "bg-white",
};

/** "Won", "Lost to Madame Mittens", or "Abandoned". */
export function outcomeText(run: {
  status: Ending;
  matchesWon: number;
}): string {
  if (run.status === "won") return "Won";
  if (run.status === "abandoned") return "Abandoned";
  // A lost run stopped at the match after its last win.
  const rivalId = GAUNTLET[run.matchesWon];
  return rivalId ? `Lost to ${getRival(rivalId).name}` : "Lost";
}

const AGO_UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

export function timeAgo(then: number, now: number): string {
  const elapsed = now - then;
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, size] of AGO_UNITS) {
    if (elapsed >= size)
      return format.format(-Math.floor(elapsed / size), unit);
  }
  return "just now";
}

/** How long a run took, as "42 min" or "1 h 5 min"; `null` if it never ended. */
export function duration(start: Date, end: Date | null): string | null {
  if (!end) return null;
  const minutes = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / 60_000),
  );
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
