"use client";

import { useState } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelSprite } from "~/components/PixelSprite";
import { Skeleton } from "~/components/ui";
import { getCat } from "~/server/game/cats";
import {
  DIFFICULTY,
  DIFFICULTY_LIST,
  difficultyOf,
  type DifficultyId,
} from "~/server/game/difficulty";
import { ELEMENT_LABELS, type Element } from "~/server/game/elements";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { CLAN_LIST, starterDeck, type Clan } from "~/server/game/run";
import { UNLOCK_RULES } from "~/server/game/unlocks";
import { api } from "~/trpc/react";

import { CatDetail } from "./CatPick";
import { Pile, RelicTile, TableButton } from "./pieces";
import { playCat } from "./sfx/engine";
import { stored, useStored } from "./stored";
import { TableArea, TableRail } from "./TableSurface";

/** A deck as `[catId, copies]`, most copies first. */
export function countCats(deck: readonly string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const catId of deck) counts.set(catId, (counts.get(catId) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function unlockHint(clanId: Element): string {
  const rule = UNLOCK_RULES.find((r) => r.kind === "clan" && r.key === clanId);
  return rule ? `Locked. ${rule.hint}` : "Locked.";
}

/** One kind of cat in a deck, as a chip that opens its card in its own voice. */
export function DeckChip({
  catId,
  copies,
  onDetail,
}: {
  catId: string;
  copies: number;
  onDetail: (catId: string) => void;
}) {
  const cat = getCat(catId);
  return (
    <button
      type="button"
      onClick={() => {
        playCat(catId);
        onDetail(catId);
      }}
      aria-label={`${copies} ${cat.name}, ${ELEMENT_LABELS[cat.element]}, details`}
      className="piece border-ink bg-cream text-ink hover:bg-sky-soft flex min-h-10 items-center gap-1 border-2 py-0.5 pr-2 pl-0.5 text-xs font-bold"
    >
      <PixelSprite catId={catId} size={32} decorative />
      <ElementMark element={cat.element} />
      <span className="tabular-nums">
        {copies}× {cat.name}
      </span>
    </button>
  );
}

/** The tier of the last run started here, offered again the next time. */
const lastDifficulty = stored<DifficultyId>(
  "hadumon:difficulty",
  (raw) => difficultyOf(raw).id,
);

export interface ClanPickProps {
  busy: boolean;
  onStart: (clanId: Element, difficulty: DifficultyId) => void;
}

/** No run in progress: choose a starter deck and begin. */
export function ClanPick({ busy, onStart }: ClanPickProps) {
  const clans = api.run.clans.useQuery();
  const unlocked = clans.data ?? [];
  const [picked, setPicked] = useState<Element | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const difficulty = useStored(lastDifficulty);
  const tier = DIFFICULTY[difficulty];

  const firstOpen = CLAN_LIST.find((clan) => unlocked.includes(clan.id));
  const chosen =
    picked && unlocked.includes(picked) ? picked : (firstOpen?.id ?? null);
  const chosenClan = CLAN_LIST.find((clan) => clan.id === chosen);
  const firstRival = GAUNTLET[0];

  return (
    <>
      <TableArea className="space-y-4">
        <header className="max-w-[65ch] space-y-1.5 pt-2">
          <h1 className="text-print text-ink text-3xl">Pick a clan</h1>
          <p className="text-ink">
            A run is {GAUNTLET.length} matches against {GAUNTLET.length} rivals.
            Lose one and it is over. The clan decides the deck you start with
            and the relic you carry.
          </p>
          {clans.error ? (
            <p role="alert" className="text-ink font-semibold">
              The clans could not be loaded: {clans.error.message}
            </p>
          ) : null}
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

        {clans.isLoading ? (
          <div
            className="tray-well space-y-2 p-4"
            role="status"
            aria-busy="true"
          >
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {CLAN_LIST.map((clan) => (
              <li key={clan.id}>
                <ClanOption
                  clan={clan}
                  locked={!unlocked.includes(clan.id)}
                  selected={chosen === clan.id}
                  onSelect={() => setPicked(clan.id)}
                  onDetail={setDetail}
                />
              </li>
            ))}
          </ul>
        )}
      </TableArea>

      <TableRail>
        <p className="text-ink text-sm font-semibold">
          {chosenClan && firstRival
            ? `${chosenClan.name} on ${tier.name}. First across the table: ${getRival(firstRival).name}.`
            : clans.isLoading
              ? "Loading your clans."
              : "No clan is open yet."}
        </p>
        <TableButton
          size="md"
          disabled={busy || !chosenClan}
          onClick={() => chosenClan && onStart(chosenClan.id, difficulty)}
          className="sm:shrink-0"
        >
          {busy
            ? "Dealing…"
            : chosenClan
              ? `Start a run with the ${chosenClan.name}`
              : "Start a run"}
        </TableButton>
      </TableRail>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function ClanOption({
  clan,
  locked,
  selected,
  onSelect,
  onDetail,
}: {
  clan: Clan;
  locked: boolean;
  selected: boolean;
  onSelect: () => void;
  onDetail: (catId: string) => void;
}) {
  const deck = starterDeck(clan.id);

  return (
    <div
      className={`tray-well flex h-full flex-col gap-3 p-3 ${selected ? "outline-cobalt outline-4 -outline-offset-2" : ""}`}
    >
      <div className="flex items-start gap-3">
        <Pile
          count={deck.length}
          label={`${clan.name} starter deck`}
          className={selected ? "lift" : locked ? "opacity-50" : ""}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-print text-ink text-xl">{clan.name}</h2>
          <p
            className={`text-ink mt-1 text-sm leading-snug ${locked ? "font-semibold" : ""}`}
          >
            {locked ? unlockHint(clan.id) : clan.text}
          </p>
        </div>
        <button
          type="button"
          disabled={locked}
          aria-pressed={selected}
          onClick={onSelect}
          className={`piece border-ink min-h-11 shrink-0 border-2 px-3 text-sm font-black disabled:cursor-not-allowed ${selected ? "bg-lime text-ink is-pressed" : locked ? "text-ink bg-white" : "bg-cobalt hover:bg-cobalt-dark text-white"}`}
        >
          {locked ? "Locked" : selected ? "Chosen" : "Choose"}
        </button>
      </div>

      <RelicTile
        relicId={clan.relicId}
        className={locked ? "opacity-50" : ""}
      />

      <ul
        aria-label={`Starter deck, ${deck.length} cards`}
        className={`flex flex-wrap gap-x-2 gap-y-3 pb-1.5 ${locked ? "opacity-50" : ""}`}
      >
        {countCats(deck).map(([catId, copies]) => (
          <li key={catId}>
            <DeckChip catId={catId} copies={copies} onDetail={onDetail} />
          </li>
        ))}
      </ul>
    </div>
  );
}
