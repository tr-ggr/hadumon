"use client";

import { useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button, Panel } from "~/components/ui";
import { getCat } from "~/server/game/cats";
import { getRelic } from "~/server/game/relics";
import { getRival } from "~/server/game/rival";
import {
  MIN_DECK,
  type RewardChoice,
  type RewardOffer,
} from "~/server/game/run";
import type { RunView } from "~/server/game/view";

import { CatDetail, CatPick } from "./CatPick";
import { countCats } from "./ClanPick";
import { Dock } from "./Dock";

export interface RewardPickProps {
  run: RunView;
  offer: RewardOffer;
  busy: boolean;
  onChoose: (choice: RewardChoice) => void;
}

/** After a win: one cat, sometimes a relic, sometimes a trim. One confirm. */
export function RewardPick({ run, offer, busy, onChoose }: RewardPickProps) {
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
    <div className="space-y-3">
      <Panel title="Add a cat" bodyClassName="space-y-2">
        <p className="text-ink-soft text-sm">
          One of these joins your deck for the rest of the run. Or none: a
          smaller deck finds its best cats more often.
        </p>
        {offer.cats.length === 0 ? (
          <p className="text-ink text-sm">No cats were on offer this time.</p>
        ) : (
          <ul className="grid gap-2 p-1 sm:grid-cols-3">
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
      </Panel>

      {offer.relics.length > 0 ? (
        <Panel title="Take a relic" bodyClassName="space-y-2">
          <p className="text-ink-soft text-sm">
            A relic lasts the whole run. You hold{" "}
            {run.relics.map((id) => getRelic(id).name).join(", ")}.
          </p>
          <ul className="grid gap-2 p-1 sm:grid-cols-3">
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
                    className={`border-ink text-ink h-full w-full border-2 p-2 text-left ${chosen ? "ring-cobalt bg-lime ring-4" : "bg-cream hover:bg-sky-soft"}`}
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
        </Panel>
      ) : null}

      {offer.canTrim ? (
        <Panel title="Trim a card" bodyClassName="space-y-2">
          <p className="text-ink-soft text-sm">
            Remove one card from the deck for good, if you like. The deck has{" "}
            {run.deck.length} cards and cannot go below {MIN_DECK}.
          </p>
          <ul className="flex flex-wrap gap-1.5 p-1">
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
                    className={`border-ink text-ink flex min-h-10 items-center gap-1 border-2 py-0.5 pr-2 pl-0.5 text-xs font-bold ${chosen ? "ring-cobalt bg-coral ring-4" : "bg-cream hover:bg-sky-soft"}`}
                  >
                    <PixelSprite catId={catId} size={28} decorative />
                    <span>
                      {copies}× {getCat(catId).name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <Dock className="sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink text-sm" aria-live="polite">
          {summary}
        </p>
        <Button
          disabled={busy}
          onClick={() => onChoose({ cat, relic, trim })}
          className="sm:shrink-0"
        >
          {busy
            ? "Shuffling…"
            : nextRival
              ? `On to ${nextRival.name}`
              : "On to the next match"}
        </Button>
      </Dock>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
