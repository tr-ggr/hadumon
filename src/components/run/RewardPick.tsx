"use client";

import { useState, type ReactNode } from "react";

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
import { MatchResult } from "./MatchResult";
import { TableButton } from "./pieces";
import { TableArea, TableRail } from "./TableSurface";

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

function Heading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="max-w-[65ch]">
      <h2 className="text-print text-ink text-3xl">{title}</h2>
      <p className="text-ink mt-1 text-sm">{children}</p>
    </div>
  );
}

/** After a win: one cat, sometimes a relic, sometimes a trim. One confirm. */
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

  const nextRivalId = run.gauntlet[run.matchIndex + 1];
  const nextRival = nextRivalId ? getRival(nextRivalId) : null;
  const deckAfter = run.deck.length + (cat ? 1 : 0) - (trim ? 1 : 0);

  const summary = [
    cat ? `Adding ${getCat(cat).name}.` : "No new cat.",
    ...(offer.relics.length > 0
      ? [relic ? `Taking the ${getRelic(relic).name}.` : "No relic."]
      : []),
    ...(offer.canTrim
      ? [trim ? `Trimming one ${getCat(trim).name}.` : "No trim."]
      : []),
    `Deck: ${deckAfter} cards.`,
  ].join(" ");

  return (
    <>
      <TableArea className="space-y-5">
        {runStrip}
        {match ? <MatchResult match={match} /> : null}

        <section className="space-y-3">
          <Heading title="Add a cat">
            One of these joins your deck for the rest of the run. Or none: a
            smaller deck finds its best cats more often.
          </Heading>
          {offer.cats.length === 0 ? (
            <p className="text-ink text-sm">No cats were on offer this time.</p>
          ) : (
            <ul className="grid gap-x-3 gap-y-4 sm:grid-cols-3">
              {offer.cats.map((catId) => (
                <li key={catId}>
                  <CatPick
                    catId={catId}
                    verb="Add"
                    selected={cat === catId}
                    disabled={busy}
                    onSelect={() => setCat(cat === catId ? null : catId)}
                    onDetail={() => setDetail(catId)}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {offer.relics.length > 0 ? (
          <section className="space-y-3">
            <Heading title="Take a relic">
              A relic lasts the whole run. You hold{" "}
              {run.relics.map((id) => getRelic(id).name).join(", ")}.
            </Heading>
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

        {offer.canTrim ? (
          <section className="space-y-3">
            <Heading title="Trim a card">
              Your deck, spread out. Remove one card for good, if you like. It
              has {run.deck.length} cards and cannot go below {MIN_DECK}.
            </Heading>
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
                      onClick={() => setTrim(chosen ? null : catId)}
                      className={`piece border-ink text-ink flex min-h-10 items-center gap-1 border-2 py-0.5 pr-2 pl-0.5 text-xs font-bold ${chosen ? "is-chosen lift bg-white" : "bg-cream hover:bg-sky-soft liftable"}`}
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
      </TableArea>

      <TableRail>
        <p className="text-ink text-sm font-semibold" aria-live="polite">
          {summary}
        </p>
        <TableButton
          size="md"
          disabled={busy}
          onClick={() => onChoose({ cat, relic, trim })}
          className="sm:shrink-0"
        >
          {busy
            ? "Shuffling…"
            : nextRival
              ? `On to ${nextRival.name}`
              : "On to the next match"}
        </TableButton>
      </TableRail>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </>
  );
}
