"use client";

import { useState, type ReactNode } from "react";

import { RelicIcon } from "~/components/RelicIcon";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import type { RunView } from "~/server/game/view";

import { DeckSpread } from "./DeckSpread";
import { plural } from "./describe";
import { RelicTile } from "./pieces";
import { playSound } from "./sfx/engine";
import { RecapRow, StepHeading, StepRail, TableArea } from "./TableSurface";
import { useSteps } from "./useSteps";

/** The screens a run opens on, in the order they are shown. */
export type ChestStep = "theft" | "chest" | "recap";
export const CHEST_STEPS: readonly ChestStep[] = ["theft", "chest", "recap"];

export interface ChestSceneProps {
  run: RunView;
  /** The relics in the chest. */
  chest: readonly string[];
  busy: boolean;
  onOpen: (relicId: string) => void;
  /** The run's own strip: the gauntlet track and the way out. */
  runStrip: ReactNode;
}

/**
 * How a run opens, one screen at a time: what the rivals took, the chest at
 * the foot of their tower and the one relic to take from it, then a recap
 * that holds the one confirm.
 */
export function ChestScene({
  run,
  chest,
  busy,
  onOpen,
  runStrip,
}: ChestSceneProps) {
  const [relic, setRelic] = useState<string | null>(null);
  const { step, index, count, isFirst, next, back, goTo, heading } =
    useSteps(CHEST_STEPS);
  const firstRival = getRival(run.gauntlet[0] ?? "alley-tom");

  const sentence: Record<ChestStep, string> = {
    theft: "A chest at the foot of the tower is next.",
    chest: relic
      ? `Taking the ${getRelic(relic).name}.`
      : "Take one. The other two stay in the chest.",
    recap: `${plural(run.deck.length, "card")} and one relic.`,
  };

  return (
    <>
      <TableArea className="space-y-5">
        {runStrip}
        <h1 className="sr-only">The start of the run</h1>

        {step === "theft" ? (
          <section className="fitted:my-auto space-y-4">
            <StepHeading title="They took eight" headingRef={heading}>
              The rivals hold {plural(run.stolen.length, "card")} of your deck.
              Beat one and you take a card back from the three it shows you. You
              climb with the {run.deck.length} they left.
            </StepHeading>
            <div className="space-y-2">
              <h3 className="text-ink text-xs font-black tracking-wide uppercase">
                Stolen
              </h3>
              <DeckSpread
                cards={run.stolen}
                label="Stolen cards"
                tone="coral"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-ink text-xs font-black tracking-wide uppercase">
                Left to you
              </h3>
              <DeckSpread cards={run.deck} label="The cards you start with" />
            </div>
          </section>
        ) : null}

        {step === "chest" ? (
          <section className="fitted:my-auto space-y-3">
            <StepHeading title="A chest by the door" headingRef={heading}>
              Somebody left it at the foot of the tower. Three relics are
              inside, and you can carry one. A relic lasts the whole run.
            </StepHeading>
            <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-3">
              {chest.map((id) => {
                const item = getRelic(id);
                const chosen = relic === id;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      disabled={busy}
                      aria-pressed={chosen}
                      onClick={() => {
                        playSound("click");
                        setRelic(chosen ? null : id);
                      }}
                      className={`piece border-ink text-ink flex h-full min-h-16 w-full items-start gap-2 border-2 p-2 text-left ${chosen ? "bg-lime is-chosen lift" : "bg-cream hover:bg-sky-soft liftable"}`}
                    >
                      <RelicIcon relicId={id} />
                      <span className="min-w-0">
                        <span className="text-pixel block text-sm">
                          {item.name}
                        </span>
                        <span className="mt-1 block text-xs leading-snug">
                          {item.text}
                        </span>
                      </span>
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
              title={`Ready for ${firstRival.name}`}
              headingRef={heading}
            >
              This is what you take up the tower. Nothing is settled until you
              go in.
            </StepHeading>
            <ul className="space-y-4">
              <RecapRow
                label="Relic"
                empty="No relic chosen."
                busy={busy}
                onChange={() => goTo("chest")}
              >
                {relic ? <RelicTile relicId={relic} /> : null}
              </RecapRow>
            </ul>
            <p className="text-ink text-sm font-semibold">
              Your deck is {plural(run.deck.length, "card")}.{" "}
              {plural(run.stolen.length, "card")} of it{" "}
              {run.stolen.length === 1 ? "is" : "are"} still stolen.
            </p>
          </section>
        ) : null}
      </TableArea>

      <StepRail
        index={index}
        count={count}
        onBack={isFirst ? undefined : back}
        nextLabel={
          step === "recap" ? (busy ? "Going in…" : "Enter the tower") : "Next"
        }
        onNext={
          step === "recap"
            ? () => (relic ? onOpen(relic) : goTo("chest"))
            : next
        }
        nextDisabled={step !== "theft" && relic === null}
        disabled={busy}
      >
        {sentence[step]}
      </StepRail>
    </>
  );
}
