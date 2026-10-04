import { Button, ButtonLink, Panel } from "~/components/ui";
import { getCat } from "~/server/game/cats";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import { CLANS, isClanId } from "~/server/game/run";
import type { Unlock } from "~/server/game/unlocks";
import type { RunView } from "~/server/game/view";

import { plural } from "./describe";
import { MatchResult } from "./MatchResult";

/** An unlock by its name and kind, e.g. "Nimbustail, a cat". */
export function unlockLabel(unlock: Unlock): string {
  switch (unlock.kind) {
    case "cat":
      return `${getCat(unlock.key).name}, a cat`;
    case "relic":
      return `${getRelic(unlock.key).name}, a relic`;
    case "clan":
      return isClanId(unlock.key)
        ? `The ${CLANS[unlock.key].name}, a clan`
        : unlock.key;
  }
}

function headline(view: RunView): { title: string; text: string } {
  const wins = view.results.filter((result) => result.won).length;
  const total = view.gauntlet.length;
  const last = view.results[view.results.length - 1];
  if (view.outcome === "won") {
    return {
      title: "Run won",
      text: `All ${total} rivals beaten. None of them took it well.`,
    };
  }
  if (view.outcome === "abandoned") {
    return {
      title: "Run abandoned",
      text: `You walked away after ${plural(wins, "win")}. The rivals have already forgotten.`,
    };
  }
  return {
    title: "Run over",
    text: last
      ? `${getRival(last.rivalId).name} ended it at match ${view.results.length} of ${total}, after ${plural(wins, "win")}.`
      : "It ended before it began.",
  };
}

export interface RunSummaryProps {
  view: RunView;
  unlocked: readonly Unlock[];
  onAgain: () => void;
}

/** The end of a run. It exists only in memory; a reload starts fresh. */
export function RunSummary({ view, unlocked, onAgain }: RunSummaryProps) {
  const { title, text } = headline(view);
  const total = view.results.reduce((sum, result) => sum + result.player, 0);
  const lastMatch = view.outcome === "abandoned" ? null : view.match;

  return (
    <div className="space-y-3">
      <Panel title={title} bodyClassName="space-y-4">
        <p className="text-ink">{text}</p>

        {view.results.length > 0 ? (
          <table className="text-ink w-full text-sm">
            <caption className="text-ink-soft pb-1 text-left text-xs font-bold">
              Match by match, {CLANS[view.clanId].name}
            </caption>
            <thead>
              <tr className="border-ink border-b-2 text-left text-xs">
                <th scope="col" className="py-1 pr-2 font-bold">
                  Rival
                </th>
                <th scope="col" className="px-2 py-1 text-right font-bold">
                  You
                </th>
                <th scope="col" className="px-2 py-1 text-right font-bold">
                  Rival
                </th>
                <th scope="col" className="py-1 pl-2 text-right font-bold">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {view.results.map((result, index) => (
                <tr key={index} className="border-b border-black/10">
                  <th
                    scope="row"
                    className="py-1.5 pr-2 text-left font-semibold"
                  >
                    {index + 1}. {getRival(result.rivalId).name}
                  </th>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {result.player}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {result.rival}
                  </td>
                  <td className="py-1.5 pl-2 text-right font-bold">
                    {result.won ? "Won" : "Lost"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="py-1.5 pr-2 text-left font-black">
                  Run score
                </th>
                <td className="px-2 py-1.5 text-right font-black tabular-nums">
                  {total}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        ) : null}

        <div>
          <p className="text-ink-soft text-xs font-bold">Unlocked</p>
          {unlocked.length === 0 ? (
            <p className="text-ink text-sm">Nothing new this time.</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {unlocked.map((unlock) => (
                <li
                  key={`${unlock.kind}:${unlock.key}`}
                  className="border-ink bg-lime text-ink border-2 px-2 py-1 text-sm font-bold"
                >
                  {unlockLabel(unlock)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button data-autofocus onClick={onAgain}>
            Start another run
          </Button>
          <ButtonLink href="/codex" variant="secondary">
            Open the codex
          </ButtonLink>
        </div>
      </Panel>

      {lastMatch?.result ? <MatchResult match={lastMatch} /> : null}
    </div>
  );
}
