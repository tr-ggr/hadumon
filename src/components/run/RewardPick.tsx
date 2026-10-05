"use client";

import { useState, type ReactNode } from "react";

import { CatCard } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import { getCat } from "~/server/game/cats";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import {
  MIN_DECK,
  type RewardChoice,
  type RewardOffer,
} from "~/server/game/run";
import type { MatchView, RunView } from "~/server/game/view";

import { CatDetail, CatPick } from "./CatPick";
import { countCats } from "./ClanPick";
import { plural } from "./describe";
import { MatchResult } from "./MatchResult";
import { RelicTile } from "./pieces";
import { playCat, playSound } from "./sfx/engine";
import { rewardSteps, type RewardStep } from "./steps";
import { RecapRow, StepHeading, StepRail, TableArea } from "./TableSurface";
import { useSteps } from "./useSteps";

export interface RewardPickProps {
  run: RunView;
  offer: RewardOffer;
  /** The match just won, for its score sheet. */
  match: MatchView | null;
  busy: boolean;
  onChoose: (choice: RewardChoice) => void;
  /** The run's own strip: the gauntlet track and the way out. */
  runStrip: ReactNode;
}

/** A card of the deck as a small tile, on the trim step and on the recap. */
const DECK_CHIP =
  "piece border-ink text-ink flex min-h-10 items-center gap-1 border-2 py-0.5 pr-2 pl-0.5 text-xs font-bold";

/**
 * After a win, one screen at a time: the result, a cat, sometimes a relic,
 * sometimes a trim, then a recap that holds the one confirm.
 */
export function RewardPick({
  run,
  offer,
  match,
  busy,
  onChoose,
  runStrip,
}: RewardPickProps) {
  const [cat, setCat] = useState<string | null>(null);
  const [relic, setRelic] = useState<string | null>(null);
  const [trim, setTrim] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  /** A cat chosen speaks up; one put back only clicks. */
  const heard = (catId: string, chosen: boolean) => {
    if (chosen) playSound("click");
    else playCat(catId);
  };

  const steps = rewardSteps(offer, Boolean(match?.result));
  const { step, index, count, isFirst, next, back, goTo, heading } =
    useSteps(steps);

  const nextRivalId = run.gauntlet[run.matchIndex + 1];
  const nextRival = nextRivalId ? getRival(nextRivalId) : null;
  const deckAfter = run.deck.length + (cat ? 1 : 0) - (trim ? 1 : 0);

  const sentence: Record<RewardStep, string> = {
    result: "Your reward is next.",
    cat: cat ? `Adding ${getCat(cat).name}.` : "No new cat.",
    relic: relic ? `Taking the ${getRelic(relic).name}.` : "No relic.",
    trim: trim ? `Trimming one ${getCat(trim).name}.` : "No trim.",
    recap: `Deck: ${deckAfter} cards.`,
  };
  const picked: Record<RewardStep, boolean> = {
    result: true,
    cat: cat !== null,
    relic: relic !== null,
    trim: trim !== null,
    recap: true,
  };
  const confirm = busy
    ? "Shuffling…"
    : nextRival
      ? `On to ${nextRival.name}`
      : "On to the next match";

  return (
    <>
      <TableArea className="space-y-5">
        {runStrip}

        {step === "result" && match ? (
          <MatchResult
            match={match}
            headingRef={heading}
            className="fitted:my-auto"
          />
        ) : null}

        {step === "cat" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title="Add a cat" headingRef={heading}>
              One of these joins your deck for the rest of the run. Or none: a
              smaller deck finds its best cats more often.
            </StepHeading>
            <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-3">
              {offer.cats.map((catId) => (
                <li key={catId}>
                  <CatPick
                    catId={catId}
                    verb="Add"
                    selected={cat === catId}
                    disabled={busy}
                    onSelect={() => {
                      heard(catId, cat === catId);
                      setCat(cat === catId ? null : catId);
                    }}
                    onDetail={() => {
                      playCat(catId);
                      setDetail(catId);
                    }}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {step === "relic" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title="Take a relic" headingRef={heading}>
              A relic lasts the whole run. You hold{" "}
              {run.relics.map((id) => getRelic(id).name).join(", ")}.
            </StepHeading>
            <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-3">
              {offer.relics.map((id) => {
                const item = getRelic(id);
                const chosen = relic === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={chosen}
                      onClick={() => setRelic(chosen ? null : id)}
                      className={`piece border-ink text-ink flex h-full min-h-16 w-full flex-col justify-start border-2 p-2 text-left ${chosen ? "bg-lime is-chosen lift" : "bg-cream hover:bg-sky-soft liftable"}`}
                    >
                      <span className="text-pixel block text-sm">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-xs leading-snug">
                        {item.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {step === "trim" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title="Trim a card" headingRef={heading}>
              Your deck, spread out. Remove one card for good, if you like. It
              has {run.deck.length} cards and cannot go below {MIN_DECK}.
            </StepHeading>
            <ul className="flex flex-wrap gap-x-2 gap-y-3.5 pb-2">
              {countCats(run.deck).map(([catId, copies]) => {
                const chosen = trim === catId;
                return (
                  <li key={catId}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={chosen}
                      aria-label={`Trim one ${getCat(catId).name}, ${copies} in the deck`}
                      onClick={() => {
                        heard(catId, chosen);
                        setTrim(chosen ? null : catId);
                      }}
                      className={`${DECK_CHIP} ${chosen ? "is-chosen lift bg-white" : "bg-cream hover:bg-sky-soft liftable"}`}
                    >
                      <PixelSprite catId={catId} size={32} decorative />
                      <span className="tabular-nums">
                        {copies}× {getCat(catId).name}
                      </span>
                      {chosen ? (
                        <span className="bg-ink text-cream px-1 leading-4">
                          Trim 1
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {step === "recap" ? (
          <section className="fitted:my-auto space-y-4">
            <StepHeading
              title={
                nextRival
                  ? `Ready for ${nextRival.name}`
                  : "Ready for the next match"
              }
              headingRef={heading}
            >
              This is what you take into match {run.matchIndex + 2}. Nothing is
              settled until you go on.
            </StepHeading>
            <ul className="space-y-4">
              {steps.includes("cat") ? (
                <RecapRow
                  label="New cat"
                  empty="No new cat."
                  busy={busy}
                  onChange={() => goTo("cat")}
                >
                  {cat ? <CatCard catId={cat} /> : null}
                </RecapRow>
              ) : null}
              {steps.includes("relic") ? (
                <RecapRow
                  label="Relic"
                  empty="No relic."
                  busy={busy}
                  onChange={() => goTo("relic")}
                >
                  {relic ? <RelicTile relicId={relic} /> : null}
                </RecapRow>
              ) : null}
              {steps.includes("trim") ? (
                <RecapRow
                  label="Trim"
                  empty="No trim."
                  busy={busy}
                  onChange={() => goTo("trim")}
                >
                  {trim ? (
                    <div className={`${DECK_CHIP} w-fit bg-white`}>
                      <PixelSprite catId={trim} size={32} decorative />
                      <span>{getCat(trim).name}</span>
                      <span className="bg-ink text-cream px-1 leading-4">
                        Trim 1
                      </span>
                    </div>
                  ) : null}
                </RecapRow>
              ) : null}
            </ul>
            <p className="text-ink text-sm font-semibold">
              {deckAfter === run.deck.length
                ? `Your deck stays at ${plural(deckAfter, "card")}.`
                : `Your deck goes from ${run.deck.length} cards to ${deckAfter}.`}
            </p>
          </section>
        ) : null}
      </TableArea>

      <StepRail
        index={index}
        count={count}
        onBack={isFirst ? undefined : back}
        nextLabel={step === "recap" ? confirm : picked[step] ? "Next" : "Skip"}
        onNext={step === "recap" ? () => onChoose({ cat, relic, trim }) : next}
        disabled={busy}
      >
        {sentence[step]}
      </StepRail>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </>
  );
}
