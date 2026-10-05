"use client";

import { useEffect, useMemo, useState } from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { FilterChips, type FilterOption } from "~/components/codex/FilterChips";
import { CardStack } from "~/components/run/CardStack";
import { CatDetail, CatPick, InfoButton } from "~/components/run/CatPick";
import { playCat, playSound } from "~/components/run/sfx/engine";
import {
  Board,
  Skeleton,
  TableButton,
  TableLink,
  useToast,
} from "~/components/ui";
import {
  CAT_LIST,
  getCat,
  RARITIES,
  RARITY_LABELS,
  type Rarity,
} from "~/server/game/cats";
import { DECK_SIZE, STOLEN } from "~/server/game/deck";
import { ELEMENT_LABELS, ELEMENTS, type Element } from "~/server/game/elements";
import { packOf } from "~/server/game/packs";
import { api } from "~/trpc/react";

import {
  addCard,
  deckStatus,
  elementCounts,
  NO_FILTERS,
  removeCard,
  shelve,
  stacks,
  type Filters,
} from "./build";

const ELEMENT_OPTIONS: FilterOption<Element>[] = ELEMENTS.map((element) => ({
  value: element,
  label: ELEMENT_LABELS[element],
  mark: <ElementMark element={element} />,
}));

const RARITY_OPTIONS: FilterOption<Rarity>[] = RARITIES.map((rarity) => ({
  value: rarity,
  label: RARITY_LABELS[rarity],
}));

/**
 * The deck an account brings to its next run: the deck being built, as
 * stacks, beside the collection it is built from. A press on a card of the
 * collection puts a copy in; a press on a stack takes one out. Nothing is
 * kept until it is saved, and the rail says what stands in the way.
 */
export function DeckBuilder() {
  const notify = useToast();
  const utils = api.useUtils();
  const collection = api.collection.get.useQuery();
  const saved = api.collection.deck.useQuery();
  const run = api.run.current.useQuery(undefined, { retry: false });

  /** The deck as it has been changed here; `null` until it is. */
  const [draft, setDraft] = useState<string[] | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [detail, setDetail] = useState<string | null>(null);
  /** Why the last press did nothing, until the next one that does. */
  const [refused, setRefused] = useState<string | null>(null);

  const save = api.collection.saveDeck.useMutation({
    onSuccess: (deck) => {
      utils.collection.deck.setData(undefined, deck);
      setDraft(null);
      setRefused(null);
      playSound("confirm");
    },
    onError: (error) => {
      playSound("illegal");
      notify(error.message, "error");
    },
  });

  const owned = collection.data;
  const deck = draft ?? saved.data?.cards ?? null;
  const status = useMemo(
    () =>
      owned && deck && saved.data
        ? deckStatus(deck, owned, saved.data.cards)
        : null,
    [owned, deck, saved.data],
  );
  const shelf = useMemo(
    () => (owned && deck ? shelve(owned, deck, filters) : []),
    [owned, deck, filters],
  );

  // A deck changed and not saved is lost with the tab: ask before it goes.
  const dirty = status?.dirty ?? false;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const show = (catId: string) => {
    playCat(catId);
    setDetail(catId);
  };

  if (collection.isLoading || saved.isLoading) {
    return (
      <div className="in-room space-y-4" role="status" aria-busy="true">
        <span className="sr-only">Loading your deck…</span>
        <Board title="Your deck">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </Board>
        <Board title="Collection">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </Board>
      </div>
    );
  }

  if (!owned || !deck || !saved.data || !status) {
    const problem = collection.error ?? saved.error;
    return (
      <div className="in-room">
        <Board title="Your deck">
          <div role="alert" className="flex flex-col items-start gap-3">
            <p>
              Your cards did not load
              {problem ? `: ${problem.message}` : "."}
            </p>
            <TableButton
              size="md"
              variant="secondary"
              disabled={collection.isFetching || saved.isFetching}
              onClick={() => {
                void collection.refetch();
                void saved.refetch();
              }}
            >
              Try again
            </TableButton>
          </div>
        </Board>
      </div>
    );
  }

  const add = (catId: string, refusal: string | null) => {
    if (refusal) {
      playSound("illegal");
      setRefused(refusal);
      return;
    }
    playCat(catId);
    setRefused(null);
    setDraft(addCard(deck, catId, owned));
  };
  const takeOut = (catId: string) => {
    playSound("click");
    setRefused(null);
    setDraft(removeCard(deck, catId));
  };

  const piles = stacks(deck);
  const short = Math.max(0, DECK_SIZE - deck.length);
  const over = deck.length > DECK_SIZE;
  const ownedCount = Object.keys(owned).length;

  return (
    <div className="in-room space-y-4">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_24.5rem]">
        <Board
          title="Your deck"
          className="min-w-0 lg:sticky lg:top-20 lg:order-2"
          action={
            <p
              className={`text-print text-xl tabular-nums ${over ? "bg-coral border-ink border-2 px-1.5" : ""}`}
            >
              {deck.length} of {DECK_SIZE}
            </p>
          }
        >
          <p className="max-w-[60ch] text-sm leading-snug">
            The {DECK_SIZE} cards you bring to a run. The rivals make off with{" "}
            {STOLEN} of them as it begins, and you win them back one at a time.
            Press a stack to take one copy out.
          </p>
          <ul
            aria-label="Cats of each element in the deck"
            className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-xs font-bold tabular-nums"
          >
            {elementCounts(deck).map(([element, count]) => (
              <li key={element} className="flex items-center gap-1">
                <ElementMark element={element} />
                {ELEMENT_LABELS[element]} {count}
              </li>
            ))}
          </ul>
          {/* On a phone the deck is one tray that scrolls sideways, so the
              collection under it is never far; beside the collection it wraps. */}
          <ul
            aria-label={`Your deck, ${deck.length} of ${DECK_SIZE} cards`}
            className="tray-well -mx-1 mt-3 flex gap-x-3 gap-y-8 overflow-x-auto px-3 pt-3 pb-8 lg:max-h-[calc(100dvh-24rem)] lg:min-h-44 lg:flex-wrap lg:overflow-x-visible lg:overflow-y-auto"
          >
            {piles.map(([catId, copies]) => (
              <li key={catId} className="relative w-24 shrink-0">
                <CardStack
                  catId={catId}
                  copies={copies}
                  onShow={() => takeOut(catId)}
                  action="Take one out"
                />
                <span className="absolute -right-1 -bottom-6 z-10 flex">
                  <InfoButton
                    name={getCat(catId).name}
                    onClick={() => show(catId)}
                    className="leading-4"
                  />
                </span>
              </li>
            ))}
            {short > 0 ? (
              <li
                className="border-ink/55 text-ink flex h-32 w-24 shrink-0 flex-col items-center justify-center gap-1 border-2 border-dashed bg-white/45 text-center text-xs leading-tight font-bold"
                aria-label={`${short} more to add`}
              >
                <span className="text-print text-3xl tabular-nums">
                  {short}
                </span>
                more to add
              </li>
            ) : null}
          </ul>
          {run.data ? (
            <p className="mt-3 text-xs leading-snug font-semibold">
              A run is in progress. It keeps the deck it began with; what you
              save here is for the next one.
            </p>
          ) : null}
        </Board>

        <Board
          title="Collection"
          className="min-w-0 lg:order-1"
          action={
            <p className="text-sm font-bold tabular-nums">
              {ownedCount} of {CAT_LIST.length} cats owned
            </p>
          }
        >
          <div className="space-y-3">
            <FilterChips
              label="Element"
              options={ELEMENT_OPTIONS}
              value={filters.element}
              onChange={(element) => setFilters({ ...filters, element })}
            />
            <FilterChips
              label="Rarity"
              options={RARITY_OPTIONS}
              value={filters.rarity}
              onChange={(rarity) => setFilters({ ...filters, rarity })}
            />
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <button
                type="button"
                role="switch"
                aria-checked={!filters.ownedOnly}
                onClick={() =>
                  setFilters({ ...filters, ownedOnly: !filters.ownedOnly })
                }
                className={`piece border-ink text-ink inline-flex min-h-11 items-center border-2 px-3 text-sm font-bold ${filters.ownedOnly ? "hover:bg-sky-soft bg-white" : "bg-lime is-chosen"}`}
              >
                Show cats you do not own
              </button>
              <p aria-live="polite" className="text-sm">
                {shelf.length} {shelf.length === 1 ? "cat" : "cats"} shown.
                Press one to put a copy in the deck.
              </p>
            </div>
          </div>

          {shelf.length === 0 ? (
            <p className="tray-well mt-4 px-3 py-6 text-center text-sm font-semibold">
              No cat you own matches. Packs in the shop hold the rest.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 xl:grid-cols-4">
              {shelf.map(({ cat, owned: copies, inDeck, refusal }) => (
                <li key={cat.id}>
                  {copies > 0 ? (
                    <CatPick
                      catId={cat.id}
                      verb="Add"
                      dimmed={refusal !== null}
                      note={`${inDeck} of ${copies} in deck`}
                      onSelect={() => add(cat.id, refusal)}
                      onDetail={() => show(cat.id)}
                      className="h-full"
                    />
                  ) : (
                    <CatPick
                      catId={cat.id}
                      dimmed
                      note={packOf(cat.id).name}
                      onDetail={() => show(cat.id)}
                      className="h-full"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Board>
      </div>

      {/* The rail: what stands in the way, and the one save. It rides above
          the dock on a phone. */}
      <div className="piece piece-card border-ink text-ink sticky bottom-[5.75rem] z-20 flex flex-col gap-2 border-2 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between md:bottom-4">
        <p className="min-w-0 text-sm font-semibold" aria-live="polite">
          {refused ?? status.sentence}
        </p>
        <div className="flex gap-2 sm:shrink-0">
          {status.dirty ? (
            <TableButton
              size="md"
              variant="secondary"
              disabled={save.isPending}
              onClick={() => {
                setDraft(null);
                setRefused(null);
              }}
            >
              Undo changes
            </TableButton>
          ) : (
            <TableLink href="/shop" size="md" variant="secondary">
              Get more cats
            </TableLink>
          )}
          <TableButton
            size="md"
            disabled={!status.canSave || save.isPending}
            onClick={() => save.mutate({ cards: deck })}
          >
            {save.isPending ? "Saving…" : "Save deck"}
          </TableButton>
        </div>
      </div>

      <CatDetail catId={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
