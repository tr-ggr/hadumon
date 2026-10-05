"use client";

import {
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

import { PixelIcon } from "~/components/PixelIcon";
import { lean, settle } from "~/components/run/fx/lean";
import { INK } from "~/components/run/pieces";
import { playSound } from "~/components/run/sfx/engine";
import { COIN_COLOR } from "~/components/sprites/palettes";
import { TableButton } from "~/components/ui";
import type { Pack } from "~/server/game/packs";

import { coins } from "./copy";
import { packArt, slotOf, turned } from "./packs";
import { PackSpace, PackWrapper } from "./PackWrapper";

/** How far a finger has to travel sideways for the row to turn. */
const SWIPE = 32;

/**
 * How many places each side of the middle are drawn. The row is a ring, so
 * past its two ends the packs come round again: the places past each end are
 * in shadow, and two more than a stage shows are kept off it, so a turn of
 * two still slides every pack it shows in from somewhere.
 */
const REACH = 6;

/**
 * On a stage with room for it the packs stand 20px apart, so all seven are
 * on the shelf whole: 1080px of them. Under that the row keeps the gaps the
 * stylesheet gives it and is cut off at the stage's edges.
 */
const ROOMY = "@min-[1088px]:[--s1:180px]! @min-[1088px]:[--s2:328px]!";

/** Where a place stands: which side of the middle, and how many places out. */
function standing(slot: number): CSSProperties {
  return { "--dir": Math.sign(slot), "--n": Math.abs(slot) } as CSSProperties;
}

/** The id of a pack on the shelf, which is the tab its panel is named by. */
export function packTabId(base: string, packId: string): string {
  return `${base}-pack-${packId}`;
}

/** One pack as the shelf stands it: the pack, its price and what is in it. */
export interface ShelfItem {
  pack: Pack;
  price: number;
  /** How many things come out of it now. */
  holds: number;
  /** Nothing is left in it to find. */
  spent: boolean;
}

/** A pack's name as it is read out, with its price and what state it is in. */
export function packTitle(item: ShelfItem): string {
  const base = `${item.pack.name}, ${coins(item.price)}`;
  return item.spent ? `${base}, nothing left to find` : base;
}

export interface PackShelfProps {
  items: readonly ShelfItem[];
  /** The pack in the middle, which is the one the rail would open. */
  shown: string;
  onShow: (packId: string) => void;
  /** The pack in the middle was pressed: show what is in it. */
  onLook: (packId: string) => void;
  /** What `packTabId` and the panel under the row were given. */
  idBase: string;
  panelId: string;
}

/**
 * The shop's packs as a row on a shelf, with one in the middle. The arrows
 * under it, the arrow keys, a swipe and a press on a pack at the side all
 * turn the row, round its end; a press on the pack in the middle shows what
 * is in it. The packs are tabs, and the panel under the row describes the
 * one shown. Every pack hangs its price on the lip of the shelf under it.
 *
 * The row is drawn as a strip of places and not as one piece to a pack: a
 * place is a spot on an endless row, and the pack in it is the place's
 * number round the ring. A turn moves every place along and none across, so
 * the pack that goes off one end slides out as its copy slides in at the
 * other. The copies past the two ends are pictures in shadow: they are not
 * tabs, take no press and are not read out.
 */
export function PackShelf({
  items,
  shown,
  onShow,
  onLook,
  idBase,
  panelId,
}: PackShelfProps) {
  const count = items.length;
  const index = Math.max(
    0,
    items.findIndex((item) => item.pack.id === shown),
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

  // The pack shown is the caller's to say. Told of one this row did not turn
  // to, it goes there the short way round.
  const here = turned(turn.at, 0, count);
  const at = turn.at + slotOf(index, here, count);
  const was = at === turn.at ? turn.was : turn.at;
  if (at !== turn.at) setTurn({ at, was });

  /** Every way of turning the row comes through here: `by` places along. */
  const show = (by: number, focus = false) => {
    const next = items[turned(index, by, count)];
    if (!next) return;
    if (focus) {
      document.getElementById(packTabId(idBase, next.pack.id))?.focus();
    }
    if (next.pack.id === shown) return;
    playSound("pick");
    setTurn({ at: at + by, was: at });
    onShow(next.pack.id);
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
      aria-label="Packs"
      className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-3 sm:gap-x-3"
    >
      <TableButton
        variant="secondary"
        size="icon"
        aria-label="Previous pack"
        onClick={() => show(-1)}
        className="col-start-2 row-start-2"
      >
        <PixelIcon name="chevron" size={16} ink={INK} />
      </TableButton>

      <ShelfStage
        role="tablist"
        aria-label="Packs"
        data-turned={was === null ? undefined : ""}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipe.current = null;
        }}
        onClickCapture={onClickCapture}
      >
        {Array.from({ length: REACH * 2 + 1 }, (_, i) => {
          const place = at - REACH + i;
          const slot = place - at;
          const item = items[turned(place, 0, count)];
          if (!item) return null;
          const middle = slot === 0;
          // The place a pack's own wrapper stands in; the rest are its copies.
          const own = slotOf(turned(place, 0, count), index, count) === slot;
          return (
            <div
              key={place}
              className={`pack-slot ${ROOMY}`}
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
                <PackWrapper
                  packId={item.pack.id}
                  size={middle ? "centre" : "side"}
                  holds={item.holds}
                  spent={item.spent}
                  role={own ? "tab" : undefined}
                  id={own ? packTabId(idBase, item.pack.id) : undefined}
                  aria-selected={own ? middle : undefined}
                  aria-controls={own ? panelId : undefined}
                  aria-label={packTitle(item)}
                  title={middle ? "See what is in this pack" : undefined}
                  tabIndex={middle ? 0 : -1}
                  onClick={() => (middle ? onLook(item.pack.id) : show(slot))}
                />
                {/* A copy in shadow is a picture of a pack, not one for sale. */}
                {own ? <PriceTag price={item.price} /> : null}
              </div>
            </div>
          );
        })}
      </ShelfStage>

      <div
        aria-hidden
        className="col-start-3 row-start-2 flex justify-center sm:gap-1.5"
      >
        {items.map((item) => {
          const art = packArt(item.pack.id);
          return (
            <span
              key={item.pack.id}
              className={`grid h-7 w-6 place-items-center border-2 sm:w-7 ${item.pack.id === shown ? "piece border-ink bg-white" : "border-transparent"}`}
            >
              <PixelIcon name={art.mark} size={16} fill={art.markFill} />
            </span>
          );
        })}
      </div>

      <TableButton
        variant="secondary"
        size="icon"
        aria-label="Next pack"
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

/**
 * The stage the packs stand on, and the shelf under them: a board seen
 * edge-on, with a price hung on its lip under every pack. The reveal stands
 * the pack it opens on the same stage, so that pack does not move.
 */
export function ShelfStage({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="relative isolate col-span-5 row-start-1 -mx-4 pb-5 sm:mx-0">
      <div className={`pack-stage ${className}`} {...props}>
        {children}
      </div>
      {/* The shelf's edge: chipboard between two ink lines. */}
      <span
        aria-hidden
        className="border-ink bg-chipboard absolute inset-x-0 bottom-[18px] -z-10 block h-3.5 border-y-2"
      />
    </div>
  );
}

/** What a pack costs, on a tag hung on the shelf's lip under it. */
export function PriceTag({ price }: { price: number }) {
  return (
    <span
      aria-hidden
      className="border-ink text-pixel absolute top-full left-1/2 mt-3 flex -translate-x-1/2 items-center gap-1 border-2 bg-white px-1.5 text-xl leading-6 tabular-nums"
    >
      <PixelIcon name="coin" size={16} fill={COIN_COLOR} />
      {price}
    </span>
  );
}

/** The row while the shelf is being fetched: five spaces, nothing in them. */
export function PackShelfSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading the shelf…</span>
      <ShelfStage>
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
      </ShelfStage>
    </div>
  );
}
