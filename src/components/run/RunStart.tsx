"use client";

import { Skeleton } from "~/components/ui";
import { DECK_SIZE, STOLEN } from "~/server/game/deck";
import {
  DIFFICULTY,
  DIFFICULTY_LIST,
  difficultyOf,
  type DifficultyId,
} from "~/server/game/difficulty";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { api } from "~/trpc/react";

import { DeckSpread } from "./DeckSpread";
import { TableButton, TableLink } from "./pieces";
import { stored, useStored } from "./stored";
import { TableArea, TableRail } from "./TableSurface";

/** The tier of the last run started here, offered again the next time. */
const lastDifficulty = stored<DifficultyId>(
  "hadumon:difficulty",
  (raw) => difficultyOf(raw).id,
);

export interface RunStartProps {
  busy: boolean;
  onStart: (difficulty: DifficultyId) => void;
}

/**
 * No run in progress: choose how hard, look over the deck you built, and
 * begin. The deck is changed on its own page, never here.
 */
export function RunStart({ busy, onStart }: RunStartProps) {
  const deck = api.collection.deck.useQuery();
  const difficulty = useStored(lastDifficulty);
  const tier = DIFFICULTY[difficulty];
  const firstRival = getRival(GAUNTLET[0] ?? "alley-tom");
  const problems = deck.data?.problems ?? [];
  const ready = deck.data !== undefined && problems.length === 0;

  return (
    <>
      <TableArea className="space-y-4">
        <header className="max-w-[65ch] space-y-1.5 pt-2">
          <h1 className="text-print text-ink text-3xl">Start a run</h1>
          <p className="text-ink">
            The rivals have made off with {STOLEN} of your deck&apos;s{" "}
            {DECK_SIZE} cards. A run is {GAUNTLET.length} matches up their tower
            to take them back, one for every rival you beat. Lose a match and
            the run is over.
          </p>
        </header>

        <section aria-labelledby="tier-heading" className="space-y-2.5 pb-1.5">
          <h2 id="tier-heading" className="text-print text-ink text-xl">
            How hard
          </h2>
          <ul className="grid gap-x-3 gap-y-3.5 sm:grid-cols-3">
            {DIFFICULTY_LIST.map((option) => {
              const selected = option.id === difficulty;
              return (
                <li key={option.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => lastDifficulty.write(option.id)}
                    className={`piece border-ink text-ink flex h-full min-h-14 w-full flex-col justify-center gap-1 border-2 px-3 py-2 text-left ${selected ? "bg-lime is-pressed" : "bg-cream hover:bg-sky-soft"}`}
                  >
                    <span className="text-print text-xl">{option.name}</span>
                    <span className="text-xs leading-snug font-semibold">
                      {option.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="deck-heading" className="space-y-2.5">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="max-w-[65ch]">
              <h2 id="deck-heading" className="text-print text-ink text-xl">
                Your deck
              </h2>
              <p className="text-ink mt-1 text-sm">
                {deck.data?.built === false
                  ? `The deck every account starts with. Which ${STOLEN} are taken is not known until the run begins.`
                  : `Which ${STOLEN} are taken is not known until the run begins.`}
              </p>
            </div>
            <TableLink href="/deck" size="md" variant="secondary">
              Change the deck
            </TableLink>
          </div>
          {deck.isLoading ? (
            <div
              className="tray-well space-y-2 p-3"
              role="status"
              aria-busy="true"
            >
              <span className="sr-only">Loading your deck…</span>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </div>
          ) : deck.error ? (
            <p role="alert" className="text-ink font-semibold">
              Your deck could not be loaded: {deck.error.message}
            </p>
          ) : deck.data ? (
            <>
              {problems.length > 0 ? (
                <div
                  role="alert"
                  className="piece border-ink bg-coral text-ink border-2 px-3 py-2 text-sm font-semibold"
                >
                  <p className="font-black">This deck cannot be played.</p>
                  <ul className="mt-1 space-y-0.5">
                    {problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <DeckSpread cards={deck.data.cards} label="Your deck" />
            </>
          ) : null}
        </section>
      </TableArea>

      <TableRail>
        <p className="text-ink text-sm font-semibold" aria-live="polite">
          {deck.isLoading
            ? "Loading your deck."
            : ready
              ? `${tier.name}. First across the table: ${firstRival.name}.`
              : "Mend the deck on its own page, then come back."}
        </p>
        <TableButton
          size="md"
          disabled={busy || !ready}
          onClick={() => onStart(difficulty)}
          className="sm:shrink-0"
        >
          {busy ? "Setting out…" : "Start the run"}
        </TableButton>
      </TableRail>
    </>
  );
}
