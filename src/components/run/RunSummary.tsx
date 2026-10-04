import { CatCard } from "~/components/cats/CatCard";
import { getCat } from "~/server/game/cats";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import { CLANS, isClanId } from "~/server/game/run";
import type { Unlock } from "~/server/game/unlocks";
import type { RunView } from "~/server/game/view";

import { plural } from "./describe";
import { MatchResult } from "./MatchResult";
import { RelicTile, TableButton, TableLink } from "./pieces";
import { GauntletTrack } from "./RunStrip";
import { TableArea } from "./TableSurface";

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

/** A new unlock as the piece it is: a card, a relic tile, or a clan plate. */
function UnlockPiece({ unlock }: { unlock: Unlock }) {
  if (unlock.kind === "cat") {
    return <CatCard catId={unlock.key} className="h-full" />;
  }
  if (unlock.kind === "relic") {
    return <RelicTile relicId={unlock.key} className="h-full" />;
  }
  const clan = isClanId(unlock.key) ? CLANS[unlock.key] : null;
  return (
    <div className="piece border-ink bg-lime text-ink h-full border-2 px-2 py-1.5">
      <p className="text-pixel text-sm leading-tight">
        {clan ? clan.name : unlock.key}
      </p>
      {clan ? <p className="mt-0.5 text-xs leading-snug">{clan.text}</p> : null}
    </div>
  );
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
    <TableArea className="space-y-5">
      <header className="space-y-3 pt-2">
        <h1 className="text-print text-ink text-3xl">{title}</h1>
        <p className="text-ink max-w-[65ch]">{text}</p>
        <GauntletTrack run={view} over className="pt-1" />
      </header>

      {view.results.length > 0 ? (
        <section className="piece piece-card border-ink text-ink border-2 bg-white p-3 sm:p-4">
          <table className="w-full max-w-xl text-sm">
            <caption className="text-print pb-2 text-left text-xl">
              Match by match, {CLANS[view.clanId].name}
            </caption>
            <thead>
              <tr className="border-ink border-b-2 text-left text-xs">
                <th scope="col" className="py-1 pr-2 font-bold">
                  Match
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
                  <td className="py-1.5 pl-2 text-right">
                    <span
                      className={`border-ink border-2 px-1 font-bold ${result.won ? "bg-lime" : "bg-coral"}`}
                    >
                      {result.won ? "Won" : "Lost"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" className="py-1.5 pr-2 text-left font-black">
                  Run score
                </th>
                <td className="text-print px-2 py-1.5 text-right text-xl tabular-nums">
                  {total}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-print text-ink text-3xl">Unlocked</h2>
        {unlocked.length === 0 ? (
          <p className="text-ink text-sm">Nothing new this time.</p>
        ) : (
          <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((unlock) => (
              <li key={`${unlock.kind}:${unlock.key}`}>
                <span className="sr-only">{unlockLabel(unlock)}</span>
                <UnlockPiece unlock={unlock} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-3 pt-1 pb-2 sm:flex-row">
        <TableButton size="md" data-autofocus onClick={onAgain}>
          Start another run
        </TableButton>
        <TableLink href="/codex">Open the codex</TableLink>
      </div>

      {lastMatch?.result ? <MatchResult match={lastMatch} /> : null}
    </TableArea>
  );
}
