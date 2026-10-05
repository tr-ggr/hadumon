"use client";

import { useId, useState } from "react";

import { Skeleton } from "~/components/ui";
import {
  DIFFICULTY,
  DIFFICULTY_LIST,
  difficultyOf,
  type DifficultyId,
} from "~/server/game/difficulty";
import { ELEMENTS, type Element } from "~/server/game/elements";
import { GAUNTLET, getRival } from "~/server/game/rival";
import { CLAN_LIST, CLANS } from "~/server/game/run";
import { UNLOCK_RULES } from "~/server/game/unlocks";
import { api } from "~/trpc/react";

import { PackCarousel, PackRowSkeleton, packTabId } from "./PackCarousel";
import { PackViewer } from "./PackViewer";
import { RelicTile, TableButton } from "./pieces";
import { stored, useStored } from "./stored";
import { TableArea, TableRail } from "./TableSurface";

function unlockHint(clanId: Element): string {
  const rule = UNLOCK_RULES.find((r) => r.kind === "clan" && r.key === clanId);
  return rule ? `Locked. ${rule.hint}` : "Locked.";
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

/**
 * No run in progress: choose a starter deck and begin. The clans are a row
 * of packs; the one in the middle is the one being looked at, and looking
 * at a pack does not choose it.
 */
export function ClanPick({ busy, onStart }: ClanPickProps) {
  const clans = api.run.clans.useQuery();
  const unlocked = clans.data ?? [];
  const [picked, setPicked] = useState<Element | null>(null);
  /** The pack turned to, once the row has been turned at all. */
  const [turnedTo, setTurnedTo] = useState<Element | null>(null);
  /** The pack whose cards are open in the viewer. */
  const [viewing, setViewing] = useState<Element | null>(null);
  const difficulty = useStored(lastDifficulty);
  const tier = DIFFICULTY[difficulty];
  const idBase = useId();
  const panelId = `${idBase}-panel`;

  const firstOpen = CLAN_LIST.find((clan) => unlocked.includes(clan.id));
  const chosen =
    picked && unlocked.includes(picked) ? picked : (firstOpen?.id ?? null);
  const chosenClan = CLAN_LIST.find((clan) => clan.id === chosen);
  const firstRival = GAUNTLET[0];

  const shown = CLANS[turnedTo ?? chosen ?? ELEMENTS[0]];
  const shownLocked = !unlocked.includes(shown.id);
  const shownChosen = chosen === shown.id;

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
          <>
            <PackRowSkeleton />
            <div className="mx-auto w-full max-w-xl space-y-2">
              <Skeleton className="mx-auto h-7 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </>
        ) : (
          <>
            <PackCarousel
              clans={CLAN_LIST}
              shown={shown.id}
              chosen={chosen}
              unlocked={unlocked}
              onShow={setTurnedTo}
              onOpen={setViewing}
              idBase={idBase}
              panelId={panelId}
            />

            <div
              role="tabpanel"
              id={panelId}
              aria-labelledby={packTabId(idBase, shown.id)}
              className="mx-auto w-full max-w-xl space-y-3 text-center"
            >
              <h2 aria-live="polite" className="text-print text-ink text-3xl">
                {shown.name}
              </h2>
              <p
                className={`text-ink text-sm leading-snug ${shownLocked ? "font-semibold" : ""}`}
              >
                {shownLocked ? unlockHint(shown.id) : shown.text}
              </p>
              <RelicTile relicId={shown.relicId} className="text-left" />
              <div className="flex flex-wrap justify-center gap-3 pt-1 pb-1.5">
                <TableButton
                  variant="secondary"
                  size="md"
                  onClick={() => setViewing(shown.id)}
                >
                  View cards
                </TableButton>
                <button
                  type="button"
                  disabled={shownLocked}
                  aria-pressed={shownChosen}
                  onClick={() => setPicked(shown.id)}
                  className={`piece border-ink min-h-12 shrink-0 border-2 px-4 text-sm font-black disabled:cursor-not-allowed ${shownChosen ? "bg-lime text-ink is-pressed" : shownLocked ? "text-ink bg-white" : "bg-cobalt hover:bg-cobalt-dark text-white"}`}
                >
                  {shownLocked ? "Locked" : shownChosen ? "Chosen" : "Choose"}
                </button>
              </div>
            </div>
          </>
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

      <PackViewer
        clanId={viewing}
        chosen={viewing !== null && viewing === chosen}
        locked={viewing !== null && !unlocked.includes(viewing)}
        onChoose={() => {
          if (viewing) setPicked(viewing);
          setViewing(null);
        }}
        onClose={() => setViewing(null)}
      />
    </>
  );
}
