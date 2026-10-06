"use client";

import { CatCard } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { COIN_COLOR } from "~/components/sprites/palettes";
import type { Achievement } from "~/server/game/achievements";
import { getCat } from "~/server/game/cats";
import { DIFFICULTY } from "~/server/game/difficulty";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import type { Unlock } from "~/server/game/unlocks";
import type { RunView } from "~/server/game/view";

import { plural } from "./describe";
import { factorText, lastPaid } from "./MatchCoins";
import { MatchResult } from "./MatchResult";
import { RelicTile, TableLink } from "./pieces";
import { GauntletTrack } from "./RunStrip";
import { summarySteps, type SummaryStep } from "./steps";
import { StepRail, TableArea } from "./TableSurface";
import { useSteps } from "./useSteps";

/** An unlock by its name and kind, e.g. "Nimbustail, a cat". */
export function unlockLabel(unlock: Unlock): string {
  switch (unlock.kind) {
    case "cat":
      return `${getCat(unlock.key).name}, a cat`;
    case "relic":
      return `${getRelic(unlock.key).name}, a relic`;
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

/** A new unlock as the piece it is: a card or a relic tile. */
function UnlockPiece({ unlock }: { unlock: Unlock }) {
  return unlock.kind === "cat" ? (
    <CatCard catId={unlock.key} className="h-full" />
  ) : (
    <RelicTile relicId={unlock.key} className="h-full" />
  );
}

export interface RunSummaryProps {
  /** The run, for the way to its record. */
  runId: string;
  view: RunView;
  unlocked: readonly Unlock[];
  /** Achievements the run completed, each paid once on top of its coins. */
  achievements: readonly Achievement[];
  /** What the run paid: the sum of what each of its matches paid as it ended. */
  coins: number;
  onAgain: () => void;
}

/**
 * The end of a run, one screen at a time: the last match, what the run
 * unlocked, the coins it paid, then the run as a whole. It exists only in
 * memory; a reload starts fresh, and the run's record (`/runs/<id>`) keeps
 * all of it.
 */
export function RunSummary({
  runId,
  view,
  unlocked,
  achievements,
  coins,
  onAgain,
}: RunSummaryProps) {
  const { title, text } = headline(view);
  const total = view.results.reduce((sum, result) => sum + result.player, 0);
  const lastMatch = view.outcome === "abandoned" ? null : view.match;

  const steps = summarySteps(view, unlocked, coins, achievements.length);
  const { step, index, count, isFirst, isLast, next, back, heading } =
    useSteps(steps);
  const following = steps[index + 1];

  const ahead =
    following === "unlocks"
      ? "What this run unlocked is next."
      : following === "achievements"
        ? "What this run achieved is next."
        : following === "coins"
          ? "What this run paid is next."
          : "The run, match by match, is next.";
  const sentence: Record<SummaryStep, string> = {
    result: ahead,
    unlocks: ahead,
    achievements: ahead,
    coins: ahead,
    summary: "A new run starts with your deck and a tier.",
  };

  return (
    <>
      <TableArea className="space-y-5">
        {step === "summary" ? null : <h1 className="sr-only">{title}</h1>}

        {step === "result" && lastMatch ? (
          <MatchResult
            match={lastMatch}
            paid={lastPaid(view)}
            headingRef={heading}
            className="fitted:my-auto"
          />
        ) : null}

        {step === "unlocks" ? (
          <section className="fitted:my-auto space-y-3 pt-2">
            <div className="max-w-[65ch]">
              <h2
                ref={heading}
                tabIndex={-1}
                className="text-print text-ink text-3xl"
              >
                Unlocked
              </h2>
              <p className="text-ink mt-1 text-sm">
                {plural(unlocked.length, "prize")} for what this run did. A cat
                goes into your collection; a relic can turn up in every chest
                and reward from here on.
              </p>
            </div>
            <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((unlock) => (
                <li key={`${unlock.kind}:${unlock.key}`}>
                  <span className="sr-only">{unlockLabel(unlock)}</span>
                  <UnlockPiece unlock={unlock} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "achievements" ? (
          <section className="fitted:my-auto space-y-3 pt-2">
            <div className="max-w-[65ch]">
              <h2
                ref={heading}
                tabIndex={-1}
                className="text-print text-ink text-3xl"
              >
                Achievements
              </h2>
              <p className="text-ink mt-1 text-sm">
                {plural(achievements.length, "achievement")} done for the first
                time. Each pays its coins once, and they are on your account
                already, on top of what the run paid.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <li
                  key={achievement.key}
                  className="piece piece-card border-ink text-ink flex gap-3 border-2 bg-white p-3"
                >
                  <PixelIcon name="medal" size={32} fill={COIN_COLOR} />
                  <div className="min-w-0">
                    <p className="text-print text-xl">{achievement.name}</p>
                    <p className="text-sm">{achievement.hint}</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm font-black tabular-nums">
                      <PixelIcon name="coin" size={16} fill={COIN_COLOR} />+
                      {plural(achievement.coins, "coin")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "coins" ? (
          <section className="fitted:my-auto space-y-4 pt-2">
            <div className="max-w-[65ch]">
              <h2
                ref={heading}
                tabIndex={-1}
                className="text-print text-ink text-3xl"
              >
                Coins
              </h2>
              <p className="text-ink mt-1 text-sm">
                What the run paid, match by match, each one the moment it ended.
                Coins open packs in the shop, and they are only ever earned at
                this table.
              </p>
            </div>
            <p className="piece piece-card border-ink text-ink flex w-fit items-center gap-3 border-2 bg-white py-3 pr-5 pl-3">
              <PixelIcon name="coin" size={32} fill={COIN_COLOR} />
              <span className="text-print text-[40px] tabular-nums">
                <span className="sr-only">You earned </span>
                {coins}
              </span>
              <span className="text-sm font-black">
                {coins === 1 ? "coin" : "coins"}
              </span>
            </p>
            <div className="pb-2">
              <TableLink href="/shop" variant="secondary">
                Open the shop
              </TableLink>
            </div>
          </section>
        ) : null}

        {step === "summary" ? (
          <>
            <header className="fitted:mt-auto space-y-3 pt-2">
              <h1
                ref={heading}
                tabIndex={-1}
                className="text-print text-ink text-3xl"
              >
                {title}
              </h1>
              <p className="text-ink max-w-[65ch]">{text}</p>
              <GauntletTrack run={view} over className="pt-1" />
            </header>

            {view.results.length > 0 ? (
              <section className="piece piece-card border-ink text-ink border-2 bg-white p-3 sm:p-4">
                <table className="w-full max-w-xl text-sm">
                  <caption className="text-print pb-2 text-left text-xl">
                    Match by match, on {DIFFICULTY[view.difficulty].name}
                  </caption>
                  <thead>
                    <tr className="border-ink border-b-2 text-left text-xs">
                      <th scope="col" className="py-1 pr-2 font-bold">
                        Match
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-right font-bold"
                      >
                        You
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-right font-bold"
                      >
                        Rival
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-1 text-right font-bold"
                      >
                        Result
                      </th>
                      <th
                        scope="col"
                        className="py-1 pl-2 text-right font-bold"
                      >
                        Coins
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
                        <td className="px-2 py-1.5 text-right">
                          <span
                            className={`border-ink border-2 px-1 font-bold ${result.won ? "bg-lime" : "bg-coral"}`}
                          >
                            {result.won ? "Won" : "Lost"}
                          </span>
                        </td>
                        <td className="py-1.5 pl-2 text-right tabular-nums">
                          {result.coins}{" "}
                          <span className="text-xs">
                            {factorText(result.factor)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th
                        scope="row"
                        className="py-1.5 pr-2 text-left font-black"
                      >
                        Run score
                      </th>
                      <td className="text-print px-2 py-1.5 text-right text-xl tabular-nums">
                        {total}
                      </td>
                      <td colSpan={2} />
                      <td className="py-1.5 pl-2 text-right font-black tabular-nums">
                        {coins}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            ) : null}

            <p className="text-ink text-sm">
              {coins > 0 ? `${plural(coins, "coin")} earned. ` : ""}
              {unlocked.length === 0 ? "Nothing new unlocked this time." : ""}
            </p>

            <div className="fitted:mb-auto flex flex-wrap gap-2 pt-1 pb-2">
              <TableLink href={`/runs/${runId}`}>View run summary</TableLink>
              <TableLink href="/codex">Open the codex</TableLink>
            </div>
          </>
        ) : null}
      </TableArea>

      <StepRail
        index={index}
        count={count}
        onBack={isFirst ? undefined : back}
        nextLabel={isLast ? "Start another run" : "Next"}
        onNext={isLast ? onAgain : next}
      >
        {sentence[step]}
      </StepRail>
    </>
  );
}
