"use client";

import { PixelIcon } from "~/components/PixelIcon";
import { COIN_COLOR } from "~/components/sprites/palettes";
import type { MatchRecord } from "~/server/game/run";
import type { RunView } from "~/server/game/view";

import { RollingNumber } from "./fx/RollingNumber";

/** A floor's factor as it is printed: "×1", "×1.4". */
export function factorText(factor: number): string {
  return `×${Number(factor.toFixed(2))}`;
}

/** The last match on a run's record, with the floor it was played on. */
export function lastPaid(
  run: Pick<RunView, "results">,
): { record: MatchRecord; floor: number } | undefined {
  const record = run.results[run.results.length - 1];
  return record ? { record, floor: run.results.length } : undefined;
}

/** What a run's matches have paid between them. */
export function runCoins(run: Pick<RunView, "results">): number {
  return run.results.reduce((sum, result) => sum + result.coins, 0);
}

/**
 * What a finished match paid, the moment it ended, and the factor its floor
 * of the tower multiplied it by. The coins are on the account already;
 * `counted` only says how many of them the sheet has counted out so far,
 * and the number rolls up to it.
 */
export function MatchCoins({
  record,
  floor,
  counted,
}: {
  record: Pick<MatchRecord, "coins" | "factor">;
  /** Counted from 1, the first rival's. */
  floor: number;
  /** Omit to show the whole of it at once. */
  counted?: number;
}) {
  const { coins, factor } = record;
  return (
    <p
      data-tally="coins"
      className="piece border-ink text-ink bg-cream flex w-fit flex-wrap items-center gap-x-2 gap-y-1 border-2 py-1.5 pr-3 pl-2 text-sm"
    >
      <PixelIcon name="coin" size={16} fill={COIN_COLOR} />
      <span className="text-print text-xl tabular-nums">
        <span className="sr-only">You earned {coins}</span>
        <span aria-hidden>
          +<RollingNumber value={counted ?? coins} />
        </span>
      </span>
      <span className="sr-only">{coins === 1 ? "coin" : "coins"}</span>
      <span className="border-ink border-2 bg-white px-1 font-bold tabular-nums">
        <span className="sr-only">Floor {floor}, </span>
        <span aria-hidden>F{floor} </span>
        {factorText(factor)}
      </span>
    </p>
  );
}
