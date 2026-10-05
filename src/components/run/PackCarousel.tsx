"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

import { ElementMark } from "~/components/cats/CatCard";
import { PixelIcon } from "~/components/PixelIcon";
import type { Element } from "~/server/game/elements";
import type { Clan } from "~/server/game/clans";

import { ClanPack, PackSpace } from "./ClanPack";
import { lean, settle } from "./fx/lean";
import { packTitle, slotOf, turned } from "./packs";
import { INK, TableButton } from "./pieces";
import { playSound } from "./sfx/engine";

/** How far a finger has to travel sideways for the row to turn. */
const SWIPE = 32;

/**
 * How many places each side of the middle are drawn. The row is a ring, so
 * past its two ends the packs come round again: one place past each end is
 * on the stage, in shadow, and two more are kept off it, so a turn of two
 * still slides every pack it shows in from somewhere.
 */
const REACH = 5;

/** Where a place stands: which side of the middle, and how many places out. */
function standing(slot: number): CSSProperties {
  return { "--dir": Math.sign(slot), "--n": Math.abs(slot) } as CSSProperties;
}

/** The id of a clan's pack, which is the tab its panel is named by. */
export function packTabId(base: string, clanId: Element): string {
  return `${base}-pack-${clanId}`;
}

export interface PackCarouselProps {
  clans: readonly Clan[];
  /** The clan whose pack is in the middle. Being shown is not being chosen. */
  shown: Element;
  /** The clan a run would start with. */
  chosen: Element | null;
  unlocked: readonly string[];
  onShow: (clanId: Element) => void;
  /** The pack in the middle was pressed: show what is in it. */
  onOpen: (clanId: Element) => void;
  /** What `packTabId` and the panel under the row were given. */
  idBase: string;
  panelId: string;
}

/**
 * The clans as a row of packs with one in the middle. The arrows either
 * side, the arrow keys, a swipe and a press on a pack at the side all turn
 * the row, round its end; a press on the pack in the middle opens it. The
 * packs are tabs, and the panel under the row describes the one shown.
 *
 * The row is drawn as a strip of places and not as one piece to a clan: a
 * place is a spot on an endless row, and the clan in it is the place's
 * number round the ring. A turn moves every place along and none across, so
 * the pack that goes off one end slides out as its copy slides in at the
 * other. The copies past the two ends are pictures in shadow: they are not
 * tabs, take no press and are not read out.
 */
export function PackCarousel({
  clans,
  shown,
  chosen,
  unlocked,
  onShow,
  onOpen,
  idBase,
  panelId,
}: PackCarouselProps) {
  const count = clans.length;
  const index = Math.max(
    0,
    clans.findIndex((clan) => clan.id === shown),
  );
  /**
   * The place in the middle, counted along the endless row, and the one that
   * was there before the last turn; nothing has moved until there is one.
   */
  const [turn, setTurn] = useState<{ at: number; was: number | null }>({
    at: index,
    was: null,
  });
  const swipe = useRef<{ x: number; y: number } | null>(null);
  /** A swipe that ends on a pack would press it; that press is not meant. */
  const swiped = useRef(false);

  // The clan shown is the caller's to say. Told of one this row did not turn
  // to, it goes there the short way round.
  const here = turned(turn.at, 0, count);
  const at = turn.at + slotOf(index, here, count);
  const was = at === turn.at ? turn.was : turn.at;
  if (at !== turn.at) setTurn({ at, was });

  /** Every way of turning the row comes through here: `by` places along. */
  const show = (by: number, focus = false) => {
    const next = clans[turned(index, by, count)];
    if (!next) return;
    if (focus) document.getElementById(packTabId(idBase, next.id))?.focus();
    if (next.id === shown) return;
    playSound("pick");
    setTurn({ at: at + by, was: at });
    onShow(next.id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") show(1, true);
    else if (event.key === "ArrowLeft") show(-1, true);
    else if (event.key === "Home") show(slotOf(0, index, count), true);
    else if (event.key === "End") show(slotOf(count - 1, index, count), true);
    else return;
    event.preventDefault();
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swiped.current = false;
    swipe.current =
      event.pointerType === "mouse" && event.button !== 0
        ? null
        : { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const across = event.clientX - start.x;
    const down = event.clientY - start.y;
    if (Math.abs(across) < SWIPE || Math.abs(across) <= Math.abs(down)) return;
    swiped.current = true;
    show(across < 0 ? 1 : -1);
  };
  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!swiped.current) return;
    swiped.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Clans"
      className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-x-3"
    >
      <TableButton
        variant="secondary"
        size="icon"
        aria-label="Previous clan"
        onClick={() => show(-1)}
        className="col-start-2 row-start-2"
      >
        <PixelIcon name="chevron" size={16} ink={INK} />
      </TableButton>

      <div
        role="tablist"
        aria-label="Clans"
        data-turned={was === null ? undefined : ""}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
        onClickCapture={onClickCapture}
        className="pack-stage col-span-5 row-start-1 -mx-3 sm:mx-0"
      >
        {Array.from({ length: REACH * 2 + 1 }, (_, i) => {
          const place = at - REACH + i;
          const slot = place - at;
          const clan = clans[turned(place, 0, count)];
          if (!clan) return null;
          const middle = slot === 0;
          // The place a clan's own pack stands in; the rest are its copies.
          const own = slotOf(turned(place, 0, count), index, count) === slot;
          const locked = !unlocked.includes(clan.id);
          return (
            <div
              key={place}
              className="pack-slot"
              data-slot={slot}
              data-left={place === was && !middle ? "" : undefined}
              data-ghost={own ? undefined : ""}
              aria-hidden={own ? undefined : true}
              inert={!own}
              style={standing(slot)}
              onPointerMove={middle ? lean : undefined}
              onPointerLeave={settle}
            >
              <div className="pack-size">
                <ClanPack
                  clanId={clan.id}
                  size={middle ? "centre" : "side"}
                  chosen={chosen === clan.id}
                  locked={locked}
                  role={own ? "tab" : undefined}
                  id={own ? packTabId(idBase, clan.id) : undefined}
                  aria-selected={own ? middle : undefined}
                  aria-controls={own ? panelId : undefined}
                  aria-label={packTitle(clan.name, {
                    chosen: chosen === clan.id,
                    locked,
                  })}
                  title={middle ? "See the cards in this pack" : undefined}
                  tabIndex={middle ? 0 : -1}
                  onClick={() => (middle ? onOpen(clan.id) : show(slot))}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden
        className="col-start-3 row-start-2 flex justify-center gap-1.5"
      >
        {clans.map((clan) => (
          <span
            key={clan.id}
            className={`grid h-7 w-7 place-items-center border-2 ${clan.id === shown ? "piece border-ink bg-white" : "border-transparent"}`}
          >
            <ElementMark element={clan.id} />
          </span>
        ))}
      </div>

      <TableButton
        variant="secondary"
        size="icon"
        aria-label="Next clan"
        onClick={() => show(1)}
        className="col-start-4 row-start-2"
      >
        <PixelIcon
          name="chevron"
          size={16}
          ink={INK}
          className="-scale-x-100"
        />
      </TableButton>
    </section>
  );
}

/** The row while the clans are being fetched: five spaces, nothing in them. */
export function PackRowSkeleton() {
  return (
    <div role="status" aria-busy="true" className="pack-stage -mx-3 sm:mx-0">
      <span className="sr-only">Loading…</span>
      {[-2, -1, 0, 1, 2].map((slot) => (
        <div
          key={slot}
          className="pack-slot"
          data-slot={slot}
          style={standing(slot)}
        >
          <PackSpace size={slot === 0 ? "centre" : "side"} />
        </div>
      ))}
    </div>
  );
}
