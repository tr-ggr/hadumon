"use client";

import { useState } from "react";

import { PixelSprite } from "~/components/PixelSprite";
import { Button, Panel, Skeleton } from "~/components/ui";
import { getCat } from "~/server/game/cats";
import type { Element } from "~/server/game/elements";
import { getRelic } from "~/server/game/relics";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { CLAN_LIST, starterDeck, type Clan } from "~/server/game/run";
import { UNLOCK_RULES } from "~/server/game/unlocks";
import { api } from "~/trpc/react";

import { CatDetail } from "./CatPick";
import { Dock } from "./Dock";

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

export interface ClanPickProps {
  busy: boolean;
  onStart: (clanId: Element) => void;
}

/** No run in progress: choose a starter deck and begin. */
export function ClanPick({ busy, onStart }: ClanPickProps) {
  const clans = api.run.clans.useQuery();
  const unlocked = clans.data ?? [];
  const [picked, setPicked] = useState<Element | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const firstOpen = CLAN_LIST.find((clan) => unlocked.includes(clan.id));
  const chosen =
    picked && unlocked.includes(picked) ? picked : (firstOpen?.id ?? null);
  const chosenClan = CLAN_LIST.find((clan) => clan.id === chosen);
  const firstRival = GAUNTLET[0];

  return (
    <div className="space-y-3">
      <Panel title="Pick a clan" bodyClassName="space-y-2">
        <p className="text-ink">
          A run is {GAUNTLET.length} matches against {GAUNTLET.length} rivals.
          Lose one and it is over. The clan decides the deck you start with.
        </p>
        {clans.error ? (
          <p role="alert" className="text-ink font-semibold">
            The clans could not be loaded: {clans.error.message}
          </p>
        ) : null}
      </Panel>

      {clans.isLoading ? (
        <div className="panel space-y-2 p-4" role="status" aria-busy="true">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
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

      <Dock className="sm:flex-row sm:items-center sm:justify-between">
        <p className="text-ink text-sm">
          {chosenClan && firstRival
            ? `First rival: ${getRival(firstRival).name}.`
            : "No clan is open yet."}
        </p>
        <Button
          disabled={busy || !chosenClan}
          onClick={() => chosenClan && onStart(chosenClan.id)}
        >
          {busy
            ? "Dealing…"
            : chosenClan
              ? `Start a run with the ${chosenClan.name}`
              : "Start a run"}
        </Button>
      </Dock>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </div>
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
  const relic = getRelic(clan.relicId);
  const deck = starterDeck(clan.id);

  return (
    <div
      className={`panel flex h-full flex-col gap-3 p-4 ${selected ? "border-cobalt border-2" : ""} ${locked ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-pixel text-ink text-lg">{clan.name}</h3>
          <p className="text-ink-soft text-sm">{clan.text}</p>
        </div>
        <Button
          size="sm"
          variant={selected ? "primary" : "secondary"}
          disabled={locked}
          aria-pressed={selected}
          onClick={onSelect}
          className="shrink-0"
        >
          {locked ? "Locked" : selected ? "Chosen" : "Choose"}
        </Button>
      </div>

      {locked ? (
        <p className="text-ink text-sm font-semibold">{unlockHint(clan.id)}</p>
      ) : null}

      <p className="text-ink text-sm">
        <span className="font-bold">{relic.name}.</span> {relic.text}
      </p>

      <div>
        <p className="text-ink-soft text-xs font-bold">
          Starter deck, {deck.length} cards
        </p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {countCats(deck).map(([catId, copies]) => (
            <li key={catId}>
              <button
                type="button"
                onClick={() => onDetail(catId)}
                aria-label={`${copies} ${getCat(catId).name}, details`}
                className="border-ink bg-cream text-ink hover:bg-sky-soft flex items-center gap-1 border-2 py-0.5 pr-1.5 pl-0.5 text-xs font-bold"
              >
                <PixelSprite catId={catId} size={24} decorative />
                <span>
                  {copies}× {getCat(catId).name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
