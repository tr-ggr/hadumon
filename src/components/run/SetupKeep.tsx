"use client";

import { useState, type ReactNode } from "react";

import { EssencePip } from "~/components/cats/CatCard";
import { ELEMENTS, FOOD_LABELS, type Element } from "~/server/game/elements";
import { SETUP_KEEP, type Action } from "~/server/game/match";
import type { MatchView, RunView } from "~/server/game/view";

import { CatDetail, CatPick } from "./CatPick";
import { plural } from "./describe";
import { Die, Label, Nameplate, Pile, RelicTiles, TableButton } from "./pieces";
import { RoundBoard, roundTurns } from "./RoundBoard";
import { playCat, playSound } from "./sfx/engine";
import { TableArea, TableRail } from "./TableSurface";

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((other) => other !== item)
    : [...list, item];
}

export interface SetupKeepProps {
  run: RunView;
  match: MatchView;
  busy: boolean;
  onAct: (action: Action) => void;
  /** The run's own strip: the gauntlet track and the way out. */
  runStrip: ReactNode;
}

/** Before the first turn: meet the rival and keep 5 of the 10 things dealt. */
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

  const chosen = cats.length + essence.length;
  const ready = chosen === SETUP_KEEP;
  const turns = match.goals.map((_, round) => roundTurns(match, round));

  return (
    <>
      <TableArea className="space-y-4">
        {runStrip}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="space-y-2">
            <h1 className="sr-only">
              Match {run.matchIndex + 1} of {run.gauntlet.length}
            </h1>
            <Nameplate
              rivalId={match.rivalId}
              difficulty={run.difficulty}
              flavor
            />
            <p className="text-ink text-sm leading-snug">
              Three rounds of {turns.join(", ").replace(/, (\d+)$/, " and $1")}{" "}
              turns. The rival flips one card after each of your turns. Score
              more than the rival to win.
            </p>
          </div>
          <section aria-label="The rounds of this match" className="mat p-2">
            <RoundBoard match={match} />
          </section>
        </div>

        <section className="space-y-3">
          <div className="max-w-[65ch]">
            <h2 className="text-print text-ink text-3xl">Keep {SETUP_KEEP}</h2>
            <p className="text-ink mt-1 text-sm">
              You were dealt five cats and one of each cat food. Keep any{" "}
              {SETUP_KEEP} in total. Cats cost food to play, so a hand of five
              cats is a hand you cannot afford.
            </p>
          </div>

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
                    onClick={() => setEssence((prev) => toggle(prev, element))}
                    className={`piece border-ink text-ink flex min-h-14 w-full flex-col items-center justify-center gap-1 border-2 px-1 py-1.5 ${kept ? "bg-lime is-chosen lift" : "hover:bg-sky-soft liftable bg-white"}`}
                  >
                    <EssencePip kind={element} size={24} />
                    <span className="text-[11px] leading-none font-bold">
                      {FOOD_LABELS[element]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-3 pt-2">
          <h2 className="text-print text-ink text-3xl">On the table</h2>
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
      </TableArea>

      <TableRail>
        <p className="text-ink text-sm font-semibold" aria-live="polite">
          {chosen} of {SETUP_KEEP} chosen: {plural(cats.length, "cat")},{" "}
          {essence.length} food.
          {chosen > SETUP_KEEP ? " That is too many." : ""}
        </p>
        <TableButton
          size="md"
          disabled={busy || !ready}
          onClick={() =>
            onAct({
              type: "keep",
              cats: [...cats].sort((a, b) => a - b),
              essence,
            })
          }
          className="sm:shrink-0"
        >
          {busy
            ? "Starting…"
            : ready
              ? `Keep these ${SETUP_KEEP}`
              : `Keep ${SETUP_KEEP} (${chosen} chosen)`}
        </TableButton>
      </TableRail>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </>
  );
}
