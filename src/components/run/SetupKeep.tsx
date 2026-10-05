"use client";

import { useState, type ReactNode } from "react";

import { EssencePip } from "~/components/cats/CatCard";
import { ELEMENTS, FOOD_LABELS, type Element } from "~/server/game/elements";
import { SETUP_KEEP, type Action } from "~/server/game/match";
import type { MatchView, RunView } from "~/server/game/view";

import { CatDetail, CatPick } from "./CatPick";
import { listWords, plural } from "./describe";
import { Die, Label, Nameplate, Pile, RelicTiles } from "./pieces";
import { RoundBoard, roundTurns } from "./RoundBoard";
import { playCat, playSound } from "./sfx/engine";
import { SETUP_STEPS, type SetupStep } from "./steps";
import { RecapRow, StepHeading, StepRail, TableArea } from "./TableSurface";
import { useSteps } from "./useSteps";

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((other) => other !== item)
    : [...list, item];
}

/** A food on the opening hand: a tile to keep from, and the same tile kept. */
const FOOD_TILE =
  "piece border-ink text-ink flex min-h-14 w-full flex-col items-center justify-center gap-1 border-2 px-1 py-1.5";

function FoodFace({ element }: { element: Element }) {
  return (
    <>
      <EssencePip kind={element} size={24} />
      <span className="text-[11px] leading-none font-bold">
        {FOOD_LABELS[element]}
      </span>
    </>
  );
}

export interface SetupKeepProps {
  run: RunView;
  match: MatchView;
  busy: boolean;
  onAct: (action: Action) => void;
  /** The run's own strip: the gauntlet track and the way out. */
  runStrip: ReactNode;
}

/**
 * Before the first turn, one screen at a time: the rival, what is on the
 * table, keeping 5 of the 10 things dealt, then a recap that holds the one
 * confirm.
 */
export function SetupKeep({
  run,
  match,
  busy,
  onAct,
  runStrip,
}: SetupKeepProps) {
  const [cats, setCats] = useState<number[]>([]);
  const [essence, setEssence] = useState<Element[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  const showCard = (catId: string) => {
    playCat(catId);
    setDetail(catId);
  };

  const { step, index, count, isFirst, next, back, goTo, heading } =
    useSteps(SETUP_STEPS);

  const chosen = cats.length + essence.length;
  const ready = chosen === SETUP_KEEP;
  const turns = match.goals.map((_, round) => roundTurns(match, round));
  const matchNumber = run.matchIndex + 1;
  /** In the order they were dealt, whatever order they were chosen in. */
  const keptCats = [...cats].sort((a, b) => a - b);
  const keptFood = ELEMENTS.filter((element) => essence.includes(element));
  const left = match.setup.length - cats.length;

  const sentence: Record<SetupStep, string> = {
    rival: "What is on the table is next.",
    table: "Your opening hand is next.",
    keep: `${chosen} of ${SETUP_KEEP} chosen: ${plural(cats.length, "cat")}, ${essence.length} food.${chosen > SETUP_KEEP ? " That is too many." : ""}`,
    recap: `Match ${matchNumber} starts with ${plural(cats.length, "cat")} and ${essence.length} food.`,
  };
  const forward: Record<SetupStep, string> = {
    rival: "Next",
    table: "Next",
    keep: ready ? "Next" : `Keep ${SETUP_KEEP} (${chosen} chosen)`,
    recap: busy ? "Starting…" : "Start the match",
  };

  return (
    <>
      <TableArea className="space-y-4">
        {runStrip}
        <h1 className="sr-only">
          Match {matchNumber} of {run.gauntlet.length}
        </h1>

        {step === "rival" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title="Meet the rival" headingRef={heading}>
              {turns.length} rounds of {listWords(turns.map(String))} turns
              each. The rival plays the same game on a board of its own, turn
              about with you. Score more than the rival to win.
            </StepHeading>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <Nameplate
                rivalId={match.rivalId}
                difficulty={run.difficulty}
                flavor
                className="self-start"
              />
              <section
                aria-label="The rounds of this match"
                className="mat p-2"
              >
                <RoundBoard match={match} />
              </section>
            </div>
          </section>
        ) : null}

        {step === "table" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title="On the table" headingRef={heading}>
              What the match starts with: the dice in the feeder, your deck, the
              three cats in the tray, and your relics.
            </StepHeading>
            <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
              <div className="space-y-3">
                <div className="tray-well px-2 pt-2 pb-3">
                  <Label className="text-ink!">Feeder</Label>
                  <ul className="mt-1 grid grid-cols-5 gap-1.5">
                    {match.feeder.map((face, index) => (
                      <li key={index}>
                        <Die face={face} />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-3 pl-1">
                  <Pile count={match.deckCount} label="Your deck" />
                  <p className="text-ink-soft text-xs leading-snug font-semibold">
                    Your deck, {plural(match.deckCount, "card")} after the deal.
                  </p>
                </div>
              </div>
              <ul aria-label="Tray" className="grid gap-3 sm:grid-cols-3">
                {match.tray.map((catId, index) => (
                  <li key={`${index}-${catId}`}>
                    <CatPick
                      catId={catId}
                      onDetail={() => showCard(catId)}
                      className="h-full"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <section aria-label="Your relics" className="pt-1">
              <RelicTiles
                relicIds={run.relics}
                className="sm:grid-cols-2 lg:grid-cols-3"
              />
            </section>
          </section>
        ) : null}

        {step === "keep" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title={`Keep ${SETUP_KEEP}`} headingRef={heading}>
              You were dealt five cats and one of each cat food. Keep any{" "}
              {SETUP_KEEP} in total. Cats cost food to play, so a hand of five
              cats is a hand you cannot afford.
            </StepHeading>

            <ul
              aria-label="Cats you were dealt"
              className="grid gap-x-3 gap-y-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              {match.setup.map((catId, index) => (
                <li key={`${index}-${catId}`}>
                  <CatPick
                    catId={catId}
                    verb="Keep"
                    selected={cats.includes(index)}
                    disabled={busy}
                    onSelect={() => {
                      // A cat kept speaks up; one put back only clicks.
                      if (cats.includes(index)) playSound("click");
                      else playCat(catId);
                      setCats((prev) => toggle(prev, index));
                    }}
                    onDetail={() => showCard(catId)}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>

            <ul
              aria-label="Food you were dealt"
              className="grid max-w-md grid-cols-5 gap-2 pt-1"
            >
              {ELEMENTS.map((element) => {
                const kept = essence.includes(element);
                return (
                  <li key={element}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={kept}
                      aria-label={`Keep ${FOOD_LABELS[element]}`}
                      onClick={() =>
                        setEssence((prev) => toggle(prev, element))
                      }
                      className={`${FOOD_TILE} ${kept ? "bg-lime is-chosen lift" : "hover:bg-sky-soft liftable bg-white"}`}
                    >
                      <FoodFace element={element} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {step === "recap" ? (
          <section className="fitted:my-auto space-y-4">
            <StepHeading title="Your opening hand" headingRef={heading}>
              This is what you take into match {matchNumber}. Nothing is settled
              until you start.
            </StepHeading>
            <ul className="space-y-4">
              <RecapRow
                label="Cats kept"
                empty="No cats."
                busy={busy}
                onChange={() => goTo("keep")}
                wide
              >
                {keptCats.length > 0 ? (
                  <ul
                    aria-label="Cats kept"
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    {keptCats.map((dealt) => {
                      const catId = match.setup[dealt]!;
                      return (
                        <li key={`${dealt}-${catId}`}>
                          <CatPick
                            catId={catId}
                            onDetail={() => showCard(catId)}
                            className="h-full"
                          />
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </RecapRow>
              <RecapRow
                label="Food kept"
                empty="No food."
                busy={busy}
                onChange={() => goTo("keep")}
                wide
              >
                {keptFood.length > 0 ? (
                  <ul
                    aria-label="Food kept"
                    className="grid max-w-md grid-cols-5 gap-2"
                  >
                    {keptFood.map((element) => (
                      <li key={element} className={`${FOOD_TILE} bg-lime`}>
                        <FoodFace element={element} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </RecapRow>
            </ul>
            <p className="text-ink text-sm font-semibold">
              {left === 0
                ? "No cat is left behind."
                : left === 1
                  ? "The cat you leave behind goes to your discard pile."
                  : `The ${left} cats you leave behind go to your discard pile.`}
            </p>
          </section>
        ) : null}
      </TableArea>

      <StepRail
        index={index}
        count={count}
        onBack={isFirst ? undefined : back}
        nextLabel={forward[step]}
        onNext={
          step === "recap"
            ? () => onAct({ type: "keep", cats: keptCats, essence })
            : next
        }
        nextDisabled={step === "keep" && !ready}
        disabled={busy}
      >
        {sentence[step]}
      </StepRail>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </>
  );
}
