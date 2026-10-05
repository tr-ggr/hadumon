"use client";

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import { CatCard } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import { PixelSprite } from "~/components/PixelSprite";
import { RelicIcon } from "~/components/RelicIcon";
import { Modal } from "~/components/ui";
import { getCat } from "~/server/game/cats";
import type { Element } from "~/server/game/elements";
import { getRelic } from "~/server/game/relics";
import { CLANS, starterDeck, type Clan } from "~/server/game/run";

import { CardStack } from "./CardStack";
import { plural } from "./describe";
import { countCats, turned } from "./packs";
import { INK, TableButton } from "./pieces";
import { playCat } from "./sfx/engine";

export interface PackViewerProps {
  /** The clan whose pack is open; `null` shuts the viewer. */
  clanId: Element | null;
  /** This is the clan a run would start with. */
  chosen: boolean;
  locked: boolean;
  onChoose: () => void;
  onClose: () => void;
}

/**
 * What is in a clan's pack, in a dialog. Two ways of seeing the same sixteen
 * cards: all of them from above, the copies of a cat as one stack, or one
 * full card at a time. Rendered once per screen, outside the row of packs,
 * so a key pressed in here is not also a key pressed on the row.
 */
export function PackViewer({
  clanId,
  chosen,
  locked,
  onChoose,
  onClose,
}: PackViewerProps) {
  const clan = clanId ? CLANS[clanId] : null;
  return (
    <Modal
      open={clan !== null}
      onClose={onClose}
      title={clan ? `${clan.name} pack` : ""}
      size="wide"
      className="anim-land"
    >
      {clan ? (
        <PackCards
          key={clan.id}
          clan={clan}
          canChoose={!locked && !chosen}
          onChoose={onChoose}
          onClose={onClose}
        />
      ) : null}
    </Modal>
  );
}

type View = "all" | "one";
/** Which side the card on show came in from. */
type Came = "next" | "prev";

const CAME_CLASS: Record<Came, string> = {
  next: "card-next",
  prev: "card-prev",
};

function PackCards({
  clan,
  canChoose,
  onChoose,
  onClose,
}: {
  clan: Clan;
  canChoose: boolean;
  onChoose: () => void;
  onClose: () => void;
}) {
  const deck = useMemo(() => starterDeck(clan.id), [clan.id]);
  const stacks = useMemo(() => countCats(deck), [deck]);
  const [view, setView] = useState<View>("all");
  const [at, setAt] = useState(0);
  const [came, setCame] = useState<Came | null>(null);
  const picks = useRef<(HTMLButtonElement | null)[]>([]);

  const count = stacks.length;
  const [catId, copies] = stacks[at] ?? ["", 0];
  const relic = getRelic(clan.relicId);

  /** Turns to a card, in its own voice. */
  const go = (index: number, how: Came) => {
    const next = turned(index, 0, count);
    const cat = stacks[next]?.[0];
    if (cat === undefined || next === at) return next;
    playCat(cat);
    setCame(how);
    setAt(next);
    return next;
  };
  const jump = (index: number) => go(index, index < at ? "prev" : "next");

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (view !== "one") return;
    // The strip is a radio group, so the up and down keys move along it too.
    const onStrip =
      event.target instanceof HTMLElement &&
      event.target.getAttribute("role") === "radio";
    let next: number;
    if (event.key === "ArrowRight" || (onStrip && event.key === "ArrowDown")) {
      next = go(at + 1, "next");
    } else if (
      event.key === "ArrowLeft" ||
      (onStrip && event.key === "ArrowUp")
    ) {
      next = go(at - 1, "prev");
    } else if (event.key === "Home") next = jump(0);
    else if (event.key === "End") next = jump(count - 1);
    else return;
    event.preventDefault();
    if (onStrip) picks.current[next]?.focus();
  };

  return (
    <div onKeyDown={onKeyDown}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
        <RelicIcon relicId={clan.relicId} size={16} />
        <span>{relic.name}.</span>
        <span>
          {plural(deck.length, "card")}, {count} different cats.
        </span>
      </p>

      {/* Stays at the top of the sheet as the cards scroll under it, so the
          way out is always in reach. */}
      <div className="border-ink/20 bg-cream sticky top-0 z-10 -mx-4 mt-2 flex flex-wrap items-center gap-x-2 gap-y-3 border-b px-4 pt-2 pb-3 sm:-mx-5 sm:px-5">
        <div
          role="group"
          aria-label="How the cards are shown"
          className="flex gap-2"
        >
          {(
            [
              ["one", "One at a time"],
              ["all", "All cards"],
            ] as const
          ).map(([id, label]) => (
            <TableButton
              key={id}
              variant={view === id ? "chosen" : "secondary"}
              aria-pressed={view === id}
              data-autofocus={view === id ? true : undefined}
              onClick={() => setView(id)}
              className={view === id ? "is-pressed" : ""}
            >
              {label}
            </TableButton>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          {canChoose ? (
            <TableButton onClick={onChoose}>Choose this pack</TableButton>
          ) : null}
          <TableButton variant="secondary" onClick={onClose}>
            Close
          </TableButton>
        </div>
      </div>

      {view === "all" ? (
        <div className="mat mt-4 mb-3 px-0.5 pt-2 pb-4 sm:px-3">
          <ul
            aria-label={`All ${plural(deck.length, "card")}, as ${count} stacks`}
            className="stack-grid"
          >
            {stacks.map(([id, n], index) => (
              <li
                key={id}
                className="deal"
                style={{ "--i": index } as CSSProperties}
              >
                <CardStack
                  catId={id}
                  copies={n}
                  onShow={() => {
                    playCat(id);
                    setCame(null);
                    setAt(index);
                    setView("one");
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {/* Every card is in the one cell, so the sheet is as tall as the
              tallest of them whichever is on show. */}
          <div className="mx-auto grid max-w-md pb-2">
            {stacks.map(([id], index) => (
              <div
                key={id}
                className={`col-start-1 row-start-1 ${index === at ? (came ? CAME_CLASS[came] : "") : "invisible"}`}
              >
                <CatCard catId={id} variant="full" className="h-full" />
              </div>
            ))}
          </div>

          <div className="mx-auto flex max-w-md items-center gap-3">
            <TableButton
              variant="secondary"
              size="icon"
              aria-label="Previous card"
              onClick={() => go(at - 1, "prev")}
            >
              <PixelIcon name="chevron" size={16} ink={INK} />
            </TableButton>
            <p
              aria-live="polite"
              className="min-w-0 flex-1 text-center text-sm font-semibold tabular-nums"
            >
              {getCat(catId).name}, {copies} in the deck. {at + 1} of {count}.
            </p>
            <TableButton
              variant="secondary"
              size="icon"
              aria-label="Next card"
              onClick={() => go(at + 1, "next")}
            >
              <PixelIcon
                name="chevron"
                size={16}
                ink={INK}
                className="-scale-x-100"
              />
            </TableButton>
          </div>

          <div
            role="radiogroup"
            aria-label={`The ${count} cats in this pack`}
            className="tray-well grid grid-cols-6 gap-y-1 px-1.5 pt-2.5 pb-2 sm:grid-cols-[repeat(11,minmax(0,1fr))]"
          >
            {stacks.map(([id, n], index) => {
              const here = index === at;
              const name = getCat(id).name;
              return (
                <button
                  key={id}
                  ref={(node) => {
                    picks.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={here}
                  aria-label={`${name}, ${n} in the deck`}
                  title={name}
                  tabIndex={here ? 0 : -1}
                  onClick={() => jump(index)}
                  className={`relative grid h-11 place-items-center border-2 ${here ? "piece border-ink bg-lime lift" : "liftable border-transparent hover:bg-white"}`}
                >
                  <PixelSprite catId={id} size={32} decorative />
                  {n > 1 ? (
                    <span
                      aria-hidden
                      className="border-ink text-pixel absolute -top-1.5 -right-0.5 border bg-white px-0.5 text-[11px] leading-3 tabular-nums"
                    >
                      ×{n}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
